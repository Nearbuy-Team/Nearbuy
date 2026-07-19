package com.nearbuy.user_service.service;

import com.nearbuy.user_service.dto.LoginRequest;
import com.nearbuy.user_service.dto.RegisterRequest;
import com.nearbuy.user_service.model.User;
import com.nearbuy.user_service.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@SpringBootTest
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private OtpDeliveryService otpDeliveryService;

    @AfterEach
    void cleanDatabase() {
        userRepository.deleteAll();
    }

    @Test
    void registrationDeliversSixDigitCodeThatVerifiesTheAccount() {
        RegisterRequest request = registration("register@example.com", "+233240000101");
        User created = authService.register(request);

        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        verify(otpDeliveryService).deliver(eq(request.getEmail()), code.capture(), eq("Registration"));

        assertThat(code.getValue()).matches("\\d{6}");
        assertThat(created.getOtpCode()).isNotEqualTo(code.getValue());
        assertThat(created.getIdVerified()).isFalse();

        User verified = authService.verifyOtp(request.getEmail(), code.getValue());
        assertThat(verified.getIdVerified()).isTrue();
        assertThat(authService.login(login(request.getEmail(), request.getPassword()))).isNotBlank();
    }

    @Test
    void passwordResetUsesASeparateCodeAndChangesThePassword() {
        RegisterRequest request = registration("reset@example.com", "+233240000102");
        User created = authService.register(request);
        ArgumentCaptor<String> registrationCode = ArgumentCaptor.forClass(String.class);
        verify(otpDeliveryService).deliver(eq(request.getEmail()), registrationCode.capture(), eq("Registration"));
        authService.verifyOtp(request.getEmail(), registrationCode.getValue());

        created = userRepository.findByEmailIgnoreCase(request.getEmail()).orElseThrow();
        created.setOtpLastSentAt(LocalDateTime.now().minusMinutes(2));
        userRepository.save(created);
        clearInvocations(otpDeliveryService);

        authService.requestPasswordReset(request.getEmail());
        ArgumentCaptor<String> resetCode = ArgumentCaptor.forClass(String.class);
        verify(otpDeliveryService).deliver(eq(request.getEmail()), resetCode.capture(), eq("Password reset"));

        assertThatThrownBy(() -> authService.verifyOtp(request.getEmail(), resetCode.getValue()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Request a new OTP");

        authService.resetPassword(request.getEmail(), resetCode.getValue(), "NewStrongPass123!");
        assertThatThrownBy(() -> authService.login(login(request.getEmail(), request.getPassword())))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(authService.login(login(request.getEmail(), "NewStrongPass123!"))).isNotBlank();
    }

    @Test
    void unknownResetEmailDoesNotRevealWhetherAnAccountExists() {
        authService.requestPasswordReset("missing@example.com");
        verifyNoInteractions(otpDeliveryService);
    }

    private RegisterRequest registration(String email, String phone) {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test User");
        request.setEmail(email);
        request.setPhone(phone);
        request.setPassword("StrongPass123!");
        return request;
    }

    private LoginRequest login(String email, String password) {
        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }
}
