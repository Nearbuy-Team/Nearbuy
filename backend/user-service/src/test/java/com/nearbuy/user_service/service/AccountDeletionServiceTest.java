package com.nearbuy.user_service.service;

import com.nearbuy.user_service.model.User;
import com.nearbuy.user_service.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountDeletionServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private JdbcTemplate jdbcTemplate;

    private AccountDeletionService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new AccountDeletionService(userRepository, jdbcTemplate);
        user = new User();
        user.setPasswordHash(new BCryptPasswordEncoder().encode("correct-password"));
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
    }

    @Test
    void requiresTheCurrentPassword() {
        assertThatThrownBy(() -> service.deleteAccount(7L, "wrong-password"))
                .isInstanceOf(SecurityException.class)
                .hasMessage("Password is incorrect");

        verifyNoInteractions(jdbcTemplate);
        verify(userRepository, never()).delete(any());
    }

    @Test
    void blocksDeletionWhileMoneyIsStillInFlight() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(7L), eq(7L)))
                .thenReturn(1);

        assertThatThrownBy(() -> service.deleteAccount(7L, "correct-password"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Resolve active payments");

        verify(jdbcTemplate, never()).update(anyString(), any(Object[].class));
        verify(userRepository, never()).delete(any());
    }

    @Test
    void removesAccountOwnedDataAndUser() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(7L), eq(7L)))
                .thenReturn(0);

        service.deleteAccount(7L, "correct-password");

        verify(jdbcTemplate, times(9)).update(anyString(), any(Object[].class));
        verify(userRepository).delete(user);
    }
}
