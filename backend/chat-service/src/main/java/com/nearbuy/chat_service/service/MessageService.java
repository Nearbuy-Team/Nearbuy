package com.nearbuy.chat_service.service;

import com.nearbuy.chat_service.dto.SendMessageRequest;
import com.nearbuy.chat_service.model.Message;
import com.nearbuy.chat_service.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

        return messageRepository.save(message);
    }

    public List<Message> getConversation(Long listingId) {
        return messageRepository.findByListingIdOrderByCreatedAtAsc(listingId);
    }

    public List<Message> getMyChats(Long userId) {
        return messageRepository.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId);
    }
}