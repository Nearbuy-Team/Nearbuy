package com.nearbuy.payment_service.service;

import com.nearbuy.payment_service.dto.CreateOrderRequest;
import com.nearbuy.payment_service.model.Order;
import com.nearbuy.payment_service.model.WalletTransaction;
import com.nearbuy.payment_service.repository.OrderRepository;
import com.nearbuy.payment_service.repository.WalletTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class PaymentService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @Value("${listing-service.url}")
    private String listingServiceUrl;

    @Value("${user-service.url}")
    private String userServiceUrl;

    @Value("${paystack.secret-key:}")
    private String paystackSecretKey;

    private final RestTemplate restTemplate = new RestTemplate(
            new org.springframework.http.client.HttpComponentsClientHttpRequestFactory()
    );

    @Transactional
    public Order createOrder(CreateOrderRequest request, Long buyerId) {
        if (request.getListingId() == null) {
            throw new IllegalArgumentException("Listing is required");
        }

        ListingSnapshot listing;
        try {
            listing = restTemplate.getForObject(
                    listingServiceUrl + "/api/listings/" + request.getListingId(),
                    ListingSnapshot.class
            );
        } catch (Exception e) {
            throw new IllegalArgumentException("Listing could not be loaded");
        }
        if (listing == null || listing.getSellerId() == null || listing.getPrice() == null) {
            throw new IllegalArgumentException("Listing is incomplete");
        }
        if (!"ACTIVE".equals(listing.getStatus())) {
            throw new IllegalStateException("Listing is not available");
        }
        if (buyerId.equals(listing.getSellerId())) {
            throw new IllegalArgumentException("You cannot order your own listing");
        }

        BigDecimal itemAmount = listing.getPrice().setScale(2, RoundingMode.HALF_UP);
        BigDecimal serviceFee = itemAmount.multiply(new BigDecimal("0.015"))
                .max(new BigDecimal("2.00"))
                .setScale(2, RoundingMode.HALF_UP);

        Order order = new Order();
        order.setListingId(request.getListingId());
        order.setBuyerId(buyerId);
        order.setSellerId(listing.getSellerId());
        order.setItemAmount(itemAmount);
        order.setServiceFee(serviceFee);
        order.setAmount(itemAmount.add(serviceFee));

        Order saved = orderRepository.save(order);
        notifyUser(saved.getSellerId(), "New order", "You received order NB-" + saved.getId(), "/orders");
        return saved;
    }

    @Transactional
    public Order payOrder(Long orderId, Long buyerId) {
        if (paystackSecretKey != null && paystackSecretKey.startsWith("sk_")) {
            throw new IllegalStateException("Sandbox payment is disabled while Paystack is configured");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getBuyerId().equals(buyerId)) {
            throw new SecurityException("You do not own this order");
        }

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new IllegalStateException("Order is not in a payable state");
        }

        order.setPaymentProvider("SANDBOX");
        return captureVerifiedPayment(order);
    }

    @Transactional
    public Order captureVerifiedPayment(Order order) {
        if (order.getStatus() == Order.OrderStatus.PAID || order.getStatus() == Order.OrderStatus.COMPLETED) {
            return order;
        }
        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new IllegalStateException("Order is not in a payable state");
        }
        order.setStatus(Order.OrderStatus.PAID);
        orderRepository.save(order);

        WalletTransaction funding = new WalletTransaction();
        funding.setUserId(order.getBuyerId());
        funding.setOrderId(order.getId());
        funding.setType(WalletTransaction.TransactionType.CREDIT);
        funding.setAmount(order.getAmount());
        funding.setDescription("External payment for order #" + order.getId());
        walletTransactionRepository.save(funding);

        WalletTransaction hold = new WalletTransaction();
        hold.setUserId(order.getBuyerId());
        hold.setOrderId(order.getId());
        hold.setType(WalletTransaction.TransactionType.ESCROW_HOLD);
        hold.setAmount(order.getAmount());
        hold.setDescription("Escrow hold for order #" + order.getId());
        walletTransactionRepository.save(hold);

        notifyUser(order.getSellerId(), "Payment secured", "Order NB-" + order.getId() + " is now held in escrow", "/orders");

        return order;
    }

    @Transactional
    public Order completeOrder(Long orderId, Long buyerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getBuyerId().equals(buyerId)) {
            throw new SecurityException("Only the buyer can confirm this order");
        }

        if (order.getStatus() != Order.OrderStatus.PAID) {
            throw new IllegalStateException("Order must be paid before it can be completed");
        }

        order.setStatus(Order.OrderStatus.COMPLETED);
        orderRepository.save(order);

        try {
            restTemplate.patchForObject(
                    userServiceUrl + "/api/users/" + order.getSellerId() + "/trust-score",
                    5,
                    Object.class
            );
        } catch (Exception e) {
            System.out.println("Failed to update trust score: " + e.getMessage());
        }

        WalletTransaction release = new WalletTransaction();
        release.setUserId(order.getSellerId());
        release.setOrderId(order.getId());
        release.setType(WalletTransaction.TransactionType.ESCROW_RELEASE);
        release.setAmount(order.getItemAmount() != null ? order.getItemAmount() : order.getAmount());
        release.setDescription("Escrow release for order #" + order.getId());
        walletTransactionRepository.save(release);

        notifyUser(order.getSellerId(), "Escrow released", "Funds for order NB-" + order.getId() + " were released", "/orders");

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

    @Transactional
    public WalletTransaction topUp(Long userId, BigDecimal amount) {
        BigDecimal validAmount = validateAmount(amount);
        WalletTransaction transaction = new WalletTransaction();
        transaction.setUserId(userId);
        transaction.setType(WalletTransaction.TransactionType.CREDIT);
        transaction.setAmount(validAmount);
        transaction.setDescription("Sandbox Mobile Money top-up");
        return walletTransactionRepository.save(transaction);
    }

    @Transactional
    public WalletTransaction withdraw(Long userId, BigDecimal amount) {
        BigDecimal validAmount = validateAmount(amount);
        if (getWalletBalance(userId).compareTo(validAmount) < 0) {
            throw new IllegalStateException("Insufficient wallet balance");
        }
        WalletTransaction transaction = new WalletTransaction();
        transaction.setUserId(userId);
        transaction.setType(WalletTransaction.TransactionType.DEBIT);
        transaction.setAmount(validAmount);
        transaction.setDescription("Sandbox Mobile Money withdrawal");
        return walletTransactionRepository.save(transaction);
    }

    private BigDecimal validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private void notifyUser(Long userId, String title, String body, String route) {
        try {
            restTemplate.postForObject(
                    userServiceUrl + "/api/internal/notifications",
                    new NotificationRequest(userId, title, body, route),
                    Object.class
            );
        } catch (Exception error) {
            System.out.println("Failed to create payment notification: " + error.getMessage());
        }
    }

    private record NotificationRequest(Long userId, String title, String body, String route) {}

    public static class ListingSnapshot {
        private Long sellerId;
        private BigDecimal price;
        private String status;

        public Long getSellerId() {
            return sellerId;
        }

        public void setSellerId(Long sellerId) {
            this.sellerId = sellerId;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}
