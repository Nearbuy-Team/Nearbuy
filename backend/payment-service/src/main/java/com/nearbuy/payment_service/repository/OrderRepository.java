package com.nearbuy.payment_service.repository;

import com.nearbuy.payment_service.model.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByBuyerId(Long buyerId);

    List<Order> findBySellerId(Long sellerId);

    Optional<Order> findByPaymentReference(String paymentReference);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.paymentReference = :reference")
    Optional<Order> findByPaymentReferenceForUpdate(@Param("reference") String reference);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.payoutReference = :reference")
    Optional<Order> findByPayoutReferenceForUpdate(@Param("reference") String reference);
}
