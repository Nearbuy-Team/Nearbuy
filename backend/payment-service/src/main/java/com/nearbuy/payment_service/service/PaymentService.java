package com.nearbuy.payment_service.service;

import com.nearbuy.payment_service.dto.CreateOrderRequest;
import com.nearbuy.payment_service.model.Order;
import com.nearbuy.payment_service.model.PaymentMethod;
import com.nearbuy.payment_service.model.WalletTransaction;
import com.nearbuy.payment_service.repository.OrderRepository;
import com.nearbuy.payment_service.repository.PaymentMethodRepository;
import com.nearbuy.payment_service.repository.WalletTransactionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class PaymentService {

    private final OrderRepository orderRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final PaystackTransferService paystackTransferService;
    private final PaystackRefundService paystackRefundService;

    @Value("${listing-service.url}")
    private String listingServiceUrl;

    @Value("${user-service.url}")
    private String userServiceUrl;

    @Value("${payments.sandbox-enabled:true}")
    private boolean sandboxEnabled;

    private final RestTemplate restTemplate = createRestTemplate();

    public PaymentService(OrderRepository orderRepository,
                          WalletTransactionRepository walletTransactionRepository,
                          PaymentMethodRepository paymentMethodRepository,
                          PaystackTransferService paystackTransferService,
                          PaystackRefundService paystackRefundService) {
        this.orderRepository = orderRepository;
        this.walletTransactionRepository = walletTransactionRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.paystackTransferService = paystackTransferService;
        this.paystackRefundService = paystackRefundService;
    }

    private static RestTemplate createRestTemplate() {
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
        factory.setConnectTimeout(3_000);
        factory.setReadTimeout(5_000);
        return new RestTemplate(factory);
    }

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
        if (!sandboxEnabled) {
            throw new IllegalStateException("Sandbox payments are disabled");
        }
        if (paystackTransferService.isConfigured()) {
            throw new IllegalStateException("Sandbox payment is disabled while Paystack is configured");
        }
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getBuyerId().equals(buyerId)) {
            throw new SecurityException("You do not own this order");
        }

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new IllegalStateException("Order is not in a payable state");
        }

        order.setPaymentProvider("SANDBOX");
        return capturePayment(order);
    }

    @Transactional
    public Order captureVerifiedPayment(Long orderId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        return capturePayment(order);
    }

    private Order capturePayment(Order order) {
        if (order.getStatus() == Order.OrderStatus.PAID
                || order.getStatus() == Order.OrderStatus.REFUND_PENDING
                || order.getStatus() == Order.OrderStatus.REFUNDED
                || order.getStatus() == Order.OrderStatus.COMPLETED) {
            return order;
        }
        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new IllegalStateException("Order is not in a payable state");
        }
        order.setStatus(Order.OrderStatus.PAID);
        orderRepository.save(order);

        createTransactionOnce(
                order.getBuyerId(), order.getId(), WalletTransaction.TransactionType.CREDIT,
                order.getAmount(), "Payment collected for order #" + order.getId()
        );
        createTransactionOnce(
                order.getBuyerId(), order.getId(), WalletTransaction.TransactionType.ESCROW_HOLD,
                order.getAmount(), "Protected payment for order #" + order.getId()
        );

        notifyUser(order.getSellerId(), "Payment secured", "Order NB-" + order.getId() + " has been paid", "/orders");

        return order;
    }

    @Transactional
    public Order completeOrder(Long orderId, Long buyerId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getBuyerId().equals(buyerId)) {
            throw new SecurityException("Only the buyer can confirm this order");
        }

        if (order.getStatus() != Order.OrderStatus.PAID) {
            throw new IllegalStateException("Order must be paid before it can be completed");
        }

        if (paystackTransferService.liveCollectionWithoutPayout(order)) {
            throw new IllegalStateException("Seller payouts must be enabled before completing live orders");
        }

        boolean automatedPayout = paystackTransferService.automatedPayoutRequired(order);
        if (automatedPayout) {
            PaymentMethod payoutMethod = paymentMethodRepository
                    .findFirstByUserIdAndDefaultMethodTrueOrderByCreatedAtDesc(order.getSellerId())
                    .orElseThrow(() -> new IllegalStateException(
                            "Seller must add a default Mobile Money payout method"
                    ));
            PaystackTransferService.TransferInitialization payout = paystackTransferService
                    .initiateSellerPayout(order, payoutMethod.getPaystackRecipientCode());
            order.setPayoutStatus(Order.PayoutStatus.PENDING);
            order.setPayoutReference(payout.reference());
            order.setPayoutTransferCode(payout.transferCode());
        }

        order.setStatus(Order.OrderStatus.COMPLETED);
        orderRepository.save(order);

        try {
            restTemplate.patchForObject(
                    userServiceUrl + "/api/internal/users/" + order.getSellerId() + "/trust-score",
                    5,
                    Object.class
            );
        } catch (Exception e) {
            System.out.println("Failed to update trust score: " + e.getMessage());
        }

        if (automatedPayout) {
            notifyUser(
                    order.getSellerId(),
                    "Payout started",
                    "The Mobile Money payout for order NB-" + order.getId() + " is processing",
                    "/orders"
            );
        } else {
            createTransactionOnce(
                    order.getSellerId(), order.getId(), WalletTransaction.TransactionType.ESCROW_RELEASE,
                    order.getItemAmount(), "Sandbox seller credit for order #" + order.getId()
            );
            notifyUser(
                    order.getSellerId(),
                    "Order completed",
                    "Sandbox funds for order NB-" + order.getId() + " were released",
                    "/orders"
            );
        }

        return order;
    }

    @Transactional
    public Order requestRefund(Long orderId, Long buyerId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (!order.getBuyerId().equals(buyerId)) {
            throw new SecurityException("Only the buyer can request this refund");
        }
        if (order.getStatus() != Order.OrderStatus.PAID) {
            throw new IllegalStateException("Only a secured payment can be refunded before completion");
        }

        if ("SANDBOX".equals(order.getPaymentProvider()) && sandboxEnabled) {
            order.setStatus(Order.OrderStatus.REFUNDED);
            order.setRefundStatus(Order.RefundStatus.PROCESSED);
            recordRefundTransaction(order);
        } else {
            PaystackRefundService.RefundInitialization refund = paystackRefundService
                    .initiateFullRefund(order);
            order.setPaystackRefundId(refund.refundId());
            order.setRefundStatus(refundStatus(refund.status()));
            order.setStatus(Order.OrderStatus.REFUND_PENDING);
        }
        orderRepository.save(order);
        notifyUser(
                order.getSellerId(), "Refund requested",
                "The buyer requested a refund for order NB-" + order.getId(), "/orders"
        );
        return order;
    }

    @Transactional
    public void recordRefundEvent(String paymentReference, String eventName, long amount, String currency) {
        if (paymentReference == null || paymentReference.isBlank()) {
            throw new IllegalArgumentException("Refund payment reference is missing");
        }
        Order order = orderRepository.findByPaymentReferenceForUpdate(paymentReference)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (amount != PaystackAmounts.toMinorUnits(order.getAmount()) || !"GHS".equals(currency)) {
            throw new IllegalStateException("Refund details do not match the order");
        }

        switch (eventName) {
            case "refund.pending" -> {
                order.setStatus(Order.OrderStatus.REFUND_PENDING);
                order.setRefundStatus(Order.RefundStatus.PENDING);
            }
            case "refund.processing" -> {
                order.setStatus(Order.OrderStatus.REFUND_PENDING);
                order.setRefundStatus(Order.RefundStatus.PROCESSING);
            }
            case "refund.needs-attention" -> {
                order.setStatus(Order.OrderStatus.REFUND_PENDING);
                order.setRefundStatus(Order.RefundStatus.NEEDS_ATTENTION);
                notifyUser(
                        order.getBuyerId(), "Refund needs attention",
                        "Paystack needs more details for order NB-" + order.getId() + ". Contact Nearbuy support",
                        "/orders"
                );
            }
            case "refund.processed" -> {
                if (order.getRefundStatus() == Order.RefundStatus.PROCESSED) return;
                order.setStatus(Order.OrderStatus.REFUNDED);
                order.setRefundStatus(Order.RefundStatus.PROCESSED);
                recordRefundTransaction(order);
                notifyUser(
                        order.getBuyerId(), "Refund processed",
                        "Paystack processed the refund for order NB-" + order.getId(), "/orders"
                );
            }
            case "refund.failed" -> {
                order.setStatus(order.getPayoutStatus() == Order.PayoutStatus.NOT_STARTED
                        ? Order.OrderStatus.PAID
                        : Order.OrderStatus.COMPLETED);
                order.setRefundStatus(Order.RefundStatus.FAILED);
                notifyUser(
                        order.getBuyerId(), "Refund failed",
                        "The refund for order NB-" + order.getId() + " failed. Contact Nearbuy support",
                        "/orders"
                );
            }
            default -> throw new IllegalArgumentException("Unsupported refund event");
        }
        orderRepository.save(order);
    }

    @Transactional
    public void recordPayoutEvent(String reference, String eventName, long amount, String currency) {
        if (reference == null || reference.isBlank()) throw new IllegalArgumentException("Payout reference is missing");
        Order order = orderRepository.findByPayoutReferenceForUpdate(reference)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (amount != PaystackAmounts.toMinorUnits(order.getItemAmount()) || !"GHS".equals(currency)) {
            throw new IllegalStateException("Payout details do not match the order");
        }

        switch (eventName) {
            case "transfer.success" -> {
                if (order.getPayoutStatus() == Order.PayoutStatus.SUCCESS) return;
                order.setPayoutStatus(Order.PayoutStatus.SUCCESS);
                createTransactionOnce(
                        order.getSellerId(), order.getId(), WalletTransaction.TransactionType.ESCROW_RELEASE,
                        order.getItemAmount(), "Mobile Money payout for order #" + order.getId()
                );
                notifyUser(
                        order.getSellerId(), "Payout sent",
                        "The payout for order NB-" + order.getId() + " was sent to Mobile Money", "/orders"
                );
            }
            case "transfer.failed" -> {
                if (order.getPayoutStatus() == Order.PayoutStatus.SUCCESS) return;
                order.setPayoutStatus(Order.PayoutStatus.FAILED);
                notifyUser(
                        order.getSellerId(), "Payout needs attention",
                        "The payout for order NB-" + order.getId() + " failed. Contact Nearbuy support", "/orders"
                );
            }
            case "transfer.reversed" -> {
                boolean wasSuccessful = order.getPayoutStatus() == Order.PayoutStatus.SUCCESS;
                order.setPayoutStatus(Order.PayoutStatus.REVERSED);
                if (wasSuccessful) {
                    createTransactionOnce(
                            order.getSellerId(), order.getId(), WalletTransaction.TransactionType.DEBIT,
                            order.getItemAmount(), "Reversed payout for order #" + order.getId()
                    );
                }
                notifyUser(
                        order.getSellerId(), "Payout reversed",
                        "The payout for order NB-" + order.getId() + " was reversed. Contact Nearbuy support", "/orders"
                );
            }
            default -> throw new IllegalArgumentException("Unsupported payout event");
        }
        orderRepository.save(order);
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
                case REFUND -> { /* External refund history does not change the internal balance. */ }
            }
        }
        return balance;
    }

    public List<WalletTransaction> getWalletTransactions(Long userId) {
        return walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public WalletTransaction topUp(Long userId, BigDecimal amount) {
        requireSandboxWallet();
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
        requireSandboxWallet();
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

    public boolean isSandboxEnabled() {
        return sandboxEnabled;
    }

    private void requireSandboxWallet() {
        if (!sandboxEnabled) {
            throw new IllegalStateException("Wallet top-ups and withdrawals are unavailable in live mode");
        }
    }

    private void createTransactionOnce(Long userId,
                                       Long orderId,
                                       WalletTransaction.TransactionType type,
                                       BigDecimal amount,
                                       String description) {
        if (walletTransactionRepository.existsByOrderIdAndUserIdAndType(orderId, userId, type)) return;
        WalletTransaction transaction = new WalletTransaction();
        transaction.setUserId(userId);
        transaction.setOrderId(orderId);
        transaction.setType(type);
        transaction.setAmount(amount);
        transaction.setDescription(description);
        walletTransactionRepository.save(transaction);
    }

    private void recordRefundTransaction(Order order) {
        createTransactionOnce(
                order.getBuyerId(), order.getId(), WalletTransaction.TransactionType.REFUND,
                order.getAmount(), "Refund for order #" + order.getId()
        );
    }

    private Order.RefundStatus refundStatus(String status) {
        return switch (status == null ? "" : status.toLowerCase()) {
            case "processed" -> Order.RefundStatus.PROCESSED;
            case "processing" -> Order.RefundStatus.PROCESSING;
            case "needs-attention" -> Order.RefundStatus.NEEDS_ATTENTION;
            case "failed" -> Order.RefundStatus.FAILED;
            default -> Order.RefundStatus.PENDING;
        };
    }

    private void notifyUser(Long userId, String title, String body, String route) {
        if (userServiceUrl == null || userServiceUrl.isBlank()) return;
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
