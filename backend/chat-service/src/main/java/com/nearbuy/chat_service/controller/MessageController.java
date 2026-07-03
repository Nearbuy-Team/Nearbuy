package com.nearbuy.chat_service.controller;

import com.nearbuy.chat_service.dto.SendMessageRequest;
import com.nearbuy.chat_service.model.Message;
import com.nearbuy.chat_service.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody SendMessageRequest request,
                                          @RequestHeader("X-User-Id") Long senderId) {
        try {
            Message message = messageService.sendMessage(request, senderId);
            return ResponseEntity.status(HttpStatus.CREATED).body(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{listingId}")
    public ResponseEntity<List<Message>> getConversation(@PathVariable Long listingId) {
        return ResponseEntity.ok(messageService.getConversation(listingId));
    }

    @GetMapping
    public ResponseEntity<List<Message>> getMyChats(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(messageService.getMyChats(userId));
    }
}