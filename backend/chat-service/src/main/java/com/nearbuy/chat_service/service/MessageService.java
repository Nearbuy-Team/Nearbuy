package com.nearbuy.chat_service.service;

import com.nearbuy.chat_service.dto.SendMessageRequest;
import com.nearbuy.chat_service.model.Message;
import com.nearbuy.chat_service.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
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

    @Value("${nearbuy.internal-api-key:}")
    private String internalApiKey;

    @PostConstruct
    void configureInternalAuthentication() {
        if (internalApiKey != null && !internalApiKey.isBlank()) {
            restTemplate.getInterceptors().add((request, body, execution) -> {
                request.getHeaders().set("X-Internal-Api-Key", internalApiKey);
                return execution.execute(request, body);
            });
        }
    }

   public Message sendMessage(SendMessageRequest request, Long senderId) {
        if (request.getListingId() == null || request.getReceiverId() == null
                || request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Listing, recipient and message are required");
        }
        if (senderId.equals(request.getReceiverId())) {
            throw new IllegalArgumentException("You cannot message yourself");
        }
        String content = request.getContent().trim();
        if (content.length() > 2_000) {
            throw new IllegalArgumentException("Messages can contain at most 2,000 characters");
        }

        ListingSnapshot listing;
        try {
            listing = restTemplate.getForObject(
                    listingServiceUrl + "/api/listings/" + request.getListingId(),
                    ListingSnapshot.class
            );
        } catch (Exception error) {
            throw new IllegalArgumentException("Listing could not be loaded");
        }
        if (listing == null || listing.sellerId() == null) {
            throw new IllegalArgumentException("Listing is unavailable");
        }
        boolean buyerStartingChat = request.getReceiverId().equals(listing.sellerId());
        boolean sellerReplying = senderId.equals(listing.sellerId())
                && messageRepository.conversationExists(
                        request.getListingId(), senderId, request.getReceiverId()
                );
        if (!buyerStartingChat && !sellerReplying) {
            throw new SecurityException("Messages must be between a listing seller and an interested buyer");
        }

        Message message = new Message();
        message.setListingId(request.getListingId());
        message.setSenderId(senderId);
        message.setReceiverId(request.getReceiverId());
        message.setContent(content);

        Message saved = messageRepository.save(message);

        try {
            restTemplate.patchForObject(
                    listingServiceUrl + "/api/internal/listings/" + request.getListingId() + "/chat-count",
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

    private final RestTemplate restTemplate = createRestTemplate();

    private static RestTemplate createRestTemplate() {
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
        factory.setConnectTimeout(3_000);
        factory.setConnectionRequestTimeout(3_000);
        factory.setReadTimeout(5_000);
        return new RestTemplate(factory);
    }

    private record NotificationRequest(Long userId, String title, String body, String route) {}
    private record ListingSnapshot(Long id, Long sellerId, String status) {}
}
