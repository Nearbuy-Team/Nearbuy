package com.nearbuy.user_service.controller;

import com.nearbuy.user_service.repository.UserRepository;
import com.nearbuy.user_service.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/internal/users")
public class InternalUserController {
    private final UserRepository userRepository;
    private final AuthService authService;

    public InternalUserController(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return userRepository.findById(id)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(
                        new InternalUserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhone())))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/trust-score")
    public ResponseEntity<?> adjustTrustScore(@PathVariable Long id, @RequestBody Integer delta) {
        try {
            return ResponseEntity.ok(authService.adjustTrustScore(id, delta));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.notFound().build();
        }
    }

    public record InternalUserResponse(Long id, String fullName, String email, String phone) {}
}
