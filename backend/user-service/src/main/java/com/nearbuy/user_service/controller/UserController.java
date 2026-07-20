package com.nearbuy.user_service.controller;

import com.nearbuy.user_service.model.User;
import com.nearbuy.user_service.dto.PublicUserResponse;
import com.nearbuy.user_service.repository.UserRepository;
import com.nearbuy.user_service.security.JwtUtil;
import com.nearbuy.user_service.service.AccountDeletionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final AccountDeletionService accountDeletionService;

    public UserController(UserRepository userRepository,
                          JwtUtil jwtUtil,
                          AccountDeletionService accountDeletionService) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.accountDeletionService = accountDeletionService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");

            if (!jwtUtil.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
            }

            Long userId = jwtUtil.extractUserId(token);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            return ResponseEntity.ok(user);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
        }
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> deleteCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) DeleteAccountRequest request) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
            }
            String token = authHeader.substring("Bearer ".length());
            if (!jwtUtil.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
            }
            accountDeletionService.deleteAccount(
                    jwtUtil.extractUserId(token), request == null ? null : request.password());
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPublicUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(new PublicUserResponse(user)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
    }

    public record DeleteAccountRequest(String password) {}
}
