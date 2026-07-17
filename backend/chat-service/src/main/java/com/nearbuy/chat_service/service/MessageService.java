package com.nearbuy.chat_service.service;

import com.nearbuy.chat_service.dto.SendMessageRequest;
import com.nearbuy.chat_service.model.Message;
import com.nearbuy.chat_service.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Value("${listing-service.url}")
    private String listingServiceUrl;

    @Value("${user-service.url}")
    private String userServiceUrl;

   public Message sendMessage(SendMessageRequest request, Long senderId) {
        if (request.getListingId() == null || request.getReceiverId() == null
                || request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Listing, recipient and message are required");
        }
        if (senderId.equals(request.getReceiverId())) {
            throw new IllegalArgumentException("You cannot message yourself");
        }

        Message message = new Message();
        message.setListingId(request.getListingId());
        message.setSenderId(senderId);
        message.setReceiverId(request.getReceiverId());
        message.setContent(request.getContent().trim());

        Message saved = messageRepository.save(message);

        try {
            restTemplate.patchForObject(
                    listingServiceUrl + "/api/listings/" + request.getListingId() + "/chat-count",
                    null,
                    Object.class
            );
        } catch (Exception e) {
            System.out.println("Failed to update chat count: " + e.getMessage());
        }

        try {
            restTemplate.postForObject(
                    userServiceUrl + "/api/internal/notifications",
                    new NotificationRequest(
                            request.getReceiverId(),
                            "New Nearbuy message",
                            request.getContent().trim().length() > 120
                                    ? request.getContent().trim().substring(0, 120) + "…"
                                    : request.getContent().trim(),
                            "/chat/" + senderId + "?listingId=" + request.getListingId()
                    ),
                    Object.class
            );
        } catch (Exception e) {
            System.out.println("Failed to create message notification: " + e.getMessage());
        }

        return saved;
    }

    public List<Message> getConversation(Long listingId, Long userId, Long otherUserId) {
        return messageRepository.findConversation(listingId, userId, otherUserId);
    }

    public List<Message> getMyChats(Long userId) {
        return messageRepository.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId);
    }

    private final RestTemplate restTemplate = new RestTemplate(
            new org.springframework.http.client.HttpComponentsClientHttpRequestFactory()
    );

    private record NotificationRequest(Long userId, String title, String body, String route) {}
}
