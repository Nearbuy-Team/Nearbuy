package com.nearbuy.user_service.repository;

import com.nearbuy.user_service.model.PushToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PushTokenRepository extends JpaRepository<PushToken, Long> {
    Optional<PushToken> findByToken(String token);
    List<PushToken> findByUserId(Long userId);
}
