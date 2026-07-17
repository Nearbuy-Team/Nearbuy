package com.nearbuy.user_service.controller;

import com.nearbuy.user_service.model.Notification;
import com.nearbuy.user_service.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/api/notifications")
    public List<Notification> list(@RequestHeader("X-User-Id") Long userId) {
        return notificationService.list(userId);
    }

    @PatchMapping("/api/notifications/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id,
                                      @RequestHeader("X-User-Id") Long userId) {
        try {
            return ResponseEntity.ok(notificationService.markRead(id, userId));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/api/notifications/push-token")
    public ResponseEntity<?> registerPushToken(@RequestBody PushTokenRequest request,
                                               @RequestHeader("X-User-Id") Long userId) {
        try {
            return ResponseEntity.ok(notificationService.registerToken(userId, request.token(), request.platform()));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.badRequest().body(error.getMessage());
        }
    }

    @PostMapping("/api/internal/notifications")
    public ResponseEntity<?> createInternal(@RequestBody CreateNotificationRequest request) {
        try {
            return ResponseEntity.ok(notificationService.create(
                    request.userId(), request.title(), request.body(), request.route()));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.badRequest().body(error.getMessage());
        }
    }

    public record PushTokenRequest(String token, String platform) {}
    public record CreateNotificationRequest(Long userId, String title, String body, String route) {}
}
