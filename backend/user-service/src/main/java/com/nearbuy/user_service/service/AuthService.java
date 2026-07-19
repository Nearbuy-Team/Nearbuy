package com.nearbuy.user_service.service;

import com.nearbuy.user_service.dto.LoginRequest;
import com.nearbuy.user_service.dto.RegisterRequest;
import com.nearbuy.user_service.model.User;
import com.nearbuy.user_service.repository.UserRepository;
import com.nearbuy.user_service.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.security.SecureRandom;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private OtpDeliveryService otpDeliveryService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public User register(RegisterRequest request) {
        String email = requireText(request.getEmail(), "Email").toLowerCase();
        String phone = requireText(request.getPhone(), "Phone");
        String fullName = requireText(request.getFullName(), "Full name");
        String password = requireText(request.getPassword(), "Password");

        if (password.length() < 10) {
            throw new IllegalArgumentException("Password must be at least 10 characters");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email is already registered");
        }
        if (userRepository.existsByPhone(phone)) {
            throw new IllegalArgumentException("Phone number is already registered");
        }

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode(password));

        String otp = generateOtp();
        setOtp(user, otp);

        User savedUser = userRepository.save(user);

        otpDeliveryService.deliver(savedUser.getEmail(), otp, "Registration");

        return savedUser;
    }

    private String generateOtp() {
        int otp = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(otp);
    }

    public User verifyOtp(String email, String otpCode) {
        User user = userRepository.findByEmailIgnoreCase(requireText(email, "Email"))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        verifyOtpValue(user, otpCode);

        user.setIdVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        user.setOtpAttempts(0);

        return userRepository.save(user);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmailIgnoreCase(requireText(email, "Email"))
                .orElse(null);
        if (user == null) return;
        enforceOtpCooldown(user);

        String otp = generateOtp();
        setOtp(user, otp);

        userRepository.save(user);

        otpDeliveryService.deliver(user.getEmail(), otp, "Password reset");
    }

    public void resetPassword(String email, String otpCode, String newPassword) {
        User user = userRepository.findByEmailIgnoreCase(requireText(email, "Email"))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (requireText(newPassword, "New password").length() < 10) {
            throw new IllegalArgumentException("Password must be at least 10 characters");
        }

        verifyOtpValue(user, otpCode);

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        user.setOtpAttempts(0);

        userRepository.save(user);
    }

    public User adjustTrustScore(Long userId, int delta) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        int newScore = user.getTrustScore() + delta;
        user.setTrustScore(Math.max(0, Math.min(newScore, 100)));

        return userRepository.save(user);
    }

    public String login(LoginRequest request) {
        String identifier = requireText(request.getEmail(), "Email or phone");
        String password = requireText(request.getPassword(), "Password");
        User user = userRepository.findByEmailIgnoreCase(identifier)
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (!Boolean.TRUE.equals(user.getIdVerified())) {
            throw new IllegalArgumentException("Verify your account before logging in");
        }

        return jwtUtil.generateToken(user.getEmail(), user.getId());
    }

    @Transactional
    public void resendVerificationOtp(String email) {
        User user = userRepository.findByEmailIgnoreCase(requireText(email, "Email"))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (Boolean.TRUE.equals(user.getIdVerified())) {
            throw new IllegalArgumentException("Account is already verified");
        }
        enforceOtpCooldown(user);

        String otp = generateOtp();
        setOtp(user, otp);
        userRepository.save(user);
        otpDeliveryService.deliver(user.getEmail(), otp, "Verification");
    }

    private String requireText(String value, String field) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value.trim();
    }

    private void setOtp(User user, String otp) {
        user.setOtpCode(passwordEncoder.encode(otp));
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        user.setOtpAttempts(0);
        user.setOtpLastSentAt(LocalDateTime.now());
    }

    private void verifyOtpValue(User user, String otpCode) {
        String submitted = requireText(otpCode, "OTP");
        if (user.getOtpCode() == null || user.getOtpExpiry() == null) {
            throw new IllegalArgumentException("Request a new OTP");
        }
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            user.setOtpCode(null);
            user.setOtpExpiry(null);
            userRepository.save(user);
            throw new IllegalArgumentException("OTP has expired");
        }
        if (!passwordEncoder.matches(submitted, user.getOtpCode())) {
            int attempts = (user.getOtpAttempts() == null ? 0 : user.getOtpAttempts()) + 1;
            user.setOtpAttempts(attempts);
            if (attempts >= 5) {
                user.setOtpCode(null);
                user.setOtpExpiry(null);
            }
            userRepository.save(user);
            throw new IllegalArgumentException(
                    attempts >= 5 ? "Too many attempts. Request a new OTP" : "Invalid OTP"
            );
        }
    }

    private void enforceOtpCooldown(User user) {
        if (user.getOtpLastSentAt() != null
                && user.getOtpLastSentAt().plusSeconds(60).isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Wait one minute before requesting another OTP");
        }
    }
}
