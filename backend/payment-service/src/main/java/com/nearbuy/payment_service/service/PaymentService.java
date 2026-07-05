package com.nearbuy.payment_service.service;

import com.nearbuy.payment_service.dto.CreateOrderRequest;
import com.nearbuy.payment_service.model.Order;
import com.nearbuy.payment_service.model.WalletTransaction;
import com.nearbuy.payment_service.repository.OrderRepository;
import com.nearbuy.payment_service.repository.WalletTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PaymentService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    public Order createOrder(CreateOrderRequest request, Long buyerId) {
        Order order = new Order();
        order.setListingId(request.getListingId());
        order.setBuyerId(buyerId);
        order.setSellerId(request.getSellerId());
        order.setAmount(request.getAmount());

        return orderRepository.save(order);
    }

    public Order payOrder(Long orderId, Long buyerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getBuyerId().equals(buyerId)) {
            throw new SecurityException("You do not own this order");
        }

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new IllegalStateException("Order is not in a payable state");
        }

        order.setStatus(Order.OrderStatus.PAID);
        orderRepository.save(order);

        WalletTransaction hold = new WalletTransaction();
        hold.setUserId(buyerId);
        hold.setOrderId(order.getId());
        hold.setType(WalletTransaction.TransactionType.ESCROW_HOLD);
        hold.setAmount(order.getAmount());
        hold.setDescription("Escrow hold for order #" + order.getId());
        walletTransactionRepository.save(hold);

        return order;
    }

    public Order completeOrder(Long orderId, Long sellerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getSellerId().equals(sellerId)) {
            throw new SecurityException("You are not the seller for this order");
        }

        if (order.getStatus() != Order.OrderStatus.PAID) {
            throw new IllegalStateException("Order must be paid before it can be completed");
        }

        order.setStatus(Order.OrderStatus.COMPLETED);
        orderRepository.save(order);

        WalletTransaction release = new WalletTransaction();
        release.setUserId(sellerId);
        release.setOrderId(order.getId());
        release.setType(WalletTransaction.TransactionType.ESCROW_RELEASE);
        release.setAmount(order.getAmount());
        release.setDescription("Escrow release for order #" + order.getId());
        walletTransactionRepository.save(release);

        return order;
    }

    public List<Order> getMyPurchases(Long buyerId) {
        return orderRepository.findByBuyerId(buyerId);
    }

    public List<Order> getMySales(Long sellerId) {
        return orderRepository.findBySellerId(sellerId);
    }

    public BigDecimal getWalletBalance(Long userId) {
        List<WalletTransaction> transactions = walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);

        BigDecimal balance = BigDecimal.ZERO;
        for (WalletTransaction t : transactions) {
            switch (t.getType()) {
                case CREDIT, ESCROW_RELEASE -> balance = balance.add(t.getAmount());
                case DEBIT, ESCROW_HOLD -> balance = balance.subtract(t.getAmount());
            }
        }
        return balance;
    }

    public List<WalletTransaction> getWalletTransactions(Long userId) {
        return walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}