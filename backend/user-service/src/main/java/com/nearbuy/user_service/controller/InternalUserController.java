package com.nearbuy.user_service.controller;

import com.nearbuy.user_service.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/internal/users")
public class InternalUserController {
    private final UserRepository userRepository;

    public InternalUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return userRepository.findById(id)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(
                        new InternalUserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhone())))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public record InternalUserResponse(Long id, String fullName, String email, String phone) {}
}
