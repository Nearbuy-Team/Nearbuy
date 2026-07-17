package com.nearbuy.chat_service.repository;

import com.nearbuy.chat_service.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("""
            select m from Message m
            where m.listingId = :listingId
              and ((m.senderId = :userId and m.receiverId = :otherUserId)
                or (m.senderId = :otherUserId and m.receiverId = :userId))
            order by m.createdAt asc
            """)
    List<Message> findConversation(
            @Param("listingId") Long listingId,
            @Param("userId") Long userId,
            @Param("otherUserId") Long otherUserId
    );

    List<Message> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(Long senderId, Long receiverId);
}
