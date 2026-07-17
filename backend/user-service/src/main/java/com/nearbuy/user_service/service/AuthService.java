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

        if (password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
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
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));

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

        if (user.getOtpCode() == null || !user.getOtpCode().equals(otpCode)) {
            throw new IllegalArgumentException("Invalid OTP");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP has expired");
        }

        user.setIdVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);

        return userRepository.save(user);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmailIgnoreCase(requireText(email, "Email"))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));

        userRepository.save(user);

        otpDeliveryService.deliver(user.getEmail(), otp, "Password reset");
    }

    public void resetPassword(String email, String otpCode, String newPassword) {
        User user = userRepository.findByEmailIgnoreCase(requireText(email, "Email"))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (requireText(newPassword, "New password").length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }

        if (user.getOtpCode() == null || !user.getOtpCode().equals(otpCode)) {
            throw new IllegalArgumentException("Invalid OTP");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP has expired");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setOtpCode(null);
        user.setOtpExpiry(null);

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

        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        otpDeliveryService.deliver(user.getEmail(), otp, "Verification");
    }

    private String requireText(String value, String field) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value.trim();
    }
}
