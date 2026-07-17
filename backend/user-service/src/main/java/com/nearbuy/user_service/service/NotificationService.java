package com.nearbuy.user_service.service;

import com.nearbuy.user_service.model.Notification;
import com.nearbuy.user_service.model.PushToken;
import com.nearbuy.user_service.repository.NotificationRepository;
import com.nearbuy.user_service.repository.PushTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final PushTokenRepository pushTokenRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${expo.push.enabled:false}")
    private boolean pushEnabled;

    public NotificationService(NotificationRepository notificationRepository,
                               PushTokenRepository pushTokenRepository) {
        this.notificationRepository = notificationRepository;
        this.pushTokenRepository = pushTokenRepository;
    }

    public List<Notification> list(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Notification markRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    public PushToken registerToken(Long userId, String token, String platform) {
        if (token == null || !token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken[")) {
            throw new IllegalArgumentException("Invalid Expo push token");
        }
        PushToken stored = pushTokenRepository.findByToken(token).orElseGet(PushToken::new);
        stored.setUserId(userId);
        stored.setToken(token);
        stored.setPlatform(platform == null ? "unknown" : platform);
        stored.setUpdatedAt(LocalDateTime.now());
        return pushTokenRepository.save(stored);
    }

    public Notification create(Long userId, String title, String body, String route) {
        if (userId == null || title == null || title.isBlank() || body == null || body.isBlank()) {
            throw new IllegalArgumentException("User, title, and body are required");
        }
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title.trim());
        notification.setBody(body.trim());
        notification.setRoute(route);
        Notification saved = notificationRepository.save(notification);
        if (pushEnabled) sendPush(saved);
        return saved;
    }

    private void sendPush(Notification notification) {
        for (PushToken pushToken : pushTokenRepository.findByUserId(notification.getUserId())) {
            try {
                restTemplate.postForObject(
                        "https://exp.host/--/api/v2/push/send",
                        Map.of(
                                "to", pushToken.getToken(),
                                "title", notification.getTitle(),
                                "body", notification.getBody(),
                                "data", Map.of("route", notification.getRoute() == null ? "" : notification.getRoute())
                        ),
                        Object.class
                );
            } catch (Exception error) {
                System.out.println("Expo push delivery failed: " + error.getMessage());
            }
        }
    }
}
