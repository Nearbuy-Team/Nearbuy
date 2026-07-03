package com.nearbuy.chat_service.repository;

import com.nearbuy.chat_service.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByListingIdOrderByCreatedAtAsc(Long listingId);

    List<Message> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(Long senderId, Long receiverId);
}