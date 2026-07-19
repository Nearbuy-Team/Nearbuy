package com.nearbuy.payment_service.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "item_amount", precision = 10, scale = 2)
    private BigDecimal itemAmount;

    @Column(name = "service_fee", precision = 10, scale = 2)
    private BigDecimal serviceFee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "payment_provider", length = 30)
    private String paymentProvider;

    @Column(name = "payment_reference", unique = true, length = 100)
    private String paymentReference;

    @JsonIgnore
    @Column(name = "payment_authorization_url", length = 500)
    private String paymentAuthorizationUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "payout_status", length = 30)
    private PayoutStatus payoutStatus = PayoutStatus.NOT_STARTED;

    @JsonIgnore
    @Column(name = "payout_reference", unique = true, length = 100)
    private String payoutReference;

    @JsonIgnore
    @Column(name = "payout_transfer_code", length = 100)
    private String payoutTransferCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_status", length = 30)
    private RefundStatus refundStatus = RefundStatus.NOT_REQUESTED;

    @JsonIgnore
    @Column(name = "paystack_refund_id")
    private Long paystackRefundId;

    // --- Enum ---

    public enum OrderStatus {
        PENDING, PAID, REFUND_PENDING, REFUNDED, COMPLETED, CANCELLED
    }

    public enum PayoutStatus {
        NOT_STARTED, PENDING, SUCCESS, FAILED, REVERSED
    }

    public enum RefundStatus {
        NOT_REQUESTED, PENDING, PROCESSING, NEEDS_ATTENTION, PROCESSED, FAILED
    }

    // --- Getters and Setters ---

    public Long getId() {
        return id;
    }

    public Long getListingId() {
        return listingId;
    }

    public void setListingId(Long listingId) {
        this.listingId = listingId;
    }

    public Long getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Long buyerId) {
        this.buyerId = buyerId;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public void setSellerId(Long sellerId) {
        this.sellerId = sellerId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getItemAmount() {
        return itemAmount;
    }

    public void setItemAmount(BigDecimal itemAmount) {
        this.itemAmount = itemAmount;
    }

    public BigDecimal getServiceFee() {
        return serviceFee;
    }

    public void setServiceFee(BigDecimal serviceFee) {
        this.serviceFee = serviceFee;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getPaymentProvider() { return paymentProvider; }
    public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
    public String getPaymentAuthorizationUrl() { return paymentAuthorizationUrl; }
    public void setPaymentAuthorizationUrl(String paymentAuthorizationUrl) { this.paymentAuthorizationUrl = paymentAuthorizationUrl; }
    public PayoutStatus getPayoutStatus() { return payoutStatus == null ? PayoutStatus.NOT_STARTED : payoutStatus; }
    public void setPayoutStatus(PayoutStatus payoutStatus) { this.payoutStatus = payoutStatus; }
    public String getPayoutReference() { return payoutReference; }
    public void setPayoutReference(String payoutReference) { this.payoutReference = payoutReference; }
    public String getPayoutTransferCode() { return payoutTransferCode; }
    public void setPayoutTransferCode(String payoutTransferCode) { this.payoutTransferCode = payoutTransferCode; }
    public RefundStatus getRefundStatus() { return refundStatus == null ? RefundStatus.NOT_REQUESTED : refundStatus; }
    public void setRefundStatus(RefundStatus refundStatus) { this.refundStatus = refundStatus; }
    public Long getPaystackRefundId() { return paystackRefundId; }
    public void setPaystackRefundId(Long paystackRefundId) { this.paystackRefundId = paystackRefundId; }
}
