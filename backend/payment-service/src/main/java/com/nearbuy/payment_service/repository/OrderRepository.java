package com.nearbuy.payment_service.repository;

import com.nearbuy.payment_service.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByBuyerId(Long buyerId);

    List<Order> findBySellerId(Long sellerId);

    Optional<Order> findByPaymentReference(String paymentReference);
}
