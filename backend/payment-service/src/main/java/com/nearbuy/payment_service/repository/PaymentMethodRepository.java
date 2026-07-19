package com.nearbuy.payment_service.repository;

import com.nearbuy.payment_service.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
    List<PaymentMethod> findByUserIdOrderByDefaultMethodDescCreatedAtDesc(Long userId);
    Optional<PaymentMethod> findByIdAndUserId(Long id, Long userId);
    Optional<PaymentMethod> findFirstByUserIdAndDefaultMethodTrueOrderByCreatedAtDesc(Long userId);
    boolean existsByUserId(Long userId);
}
