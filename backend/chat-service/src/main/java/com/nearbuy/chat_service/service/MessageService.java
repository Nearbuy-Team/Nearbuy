package com.nearbuy.chat_service.service;

import com.nearbuy.chat_service.dto.SendMessageRequest;
import com.nearbuy.chat_service.model.Message;
import com.nearbuy.chat_service.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

   public Message sendMessage(SendMessageRequest request, Long senderId) {
        Message message = new Message();
        message.setListingId(request.getListingId());
        message.setSenderId(senderId);
        message.setReceiverId(request.getReceiverId());
        message.setContent(request.getContent());

        Message saved = messageRepository.save(message);

        try {
            restTemplate.patchForObject(
                    "http://localhost:8082/api/listings/" + request.getListingId() + "/chat-count",
                    null,
                    Object.class
            );
        } catch (Exception e) {
            System.out.println("Failed to update chat count: " + e.getMessage());
        }

        return saved;
    }

    public List<Message> getConversation(Long listingId) {
        return messageRepository.findByListingIdOrderByCreatedAtAsc(listingId);
    }

    public List<Message> getMyChats(Long userId) {
        return messageRepository.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId);
    }

    private final RestTemplate restTemplate = new RestTemplate(
            new org.springframework.http.client.HttpComponentsClientHttpRequestFactory()
    );
}