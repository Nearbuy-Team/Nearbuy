package com.nearbuy.payment_service.controller;

import com.nearbuy.payment_service.dto.CreateOrderRequest;
import com.nearbuy.payment_service.dto.WalletBalanceResponse;
import com.nearbuy.payment_service.dto.WalletAdjustmentRequest;
import com.nearbuy.payment_service.model.Order;
import com.nearbuy.payment_service.model.WalletTransaction;
import com.nearbuy.payment_service.service.PaymentService;
import com.nearbuy.payment_service.service.PaystackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.net.URI;

@RestController
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaystackService paystackService;

    @PostMapping("/api/orders")
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest request,
                                          @RequestHeader("X-User-Id") Long buyerId) {
        try {
            Order order = paymentService.createOrder(request, buyerId);
            return ResponseEntity.status(HttpStatus.CREATED).body(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/api/orders/{id}/pay")
    public ResponseEntity<?> payOrder(@PathVariable Long id,
                                       @RequestHeader("X-User-Id") Long buyerId) {
        try {
            Order order = paymentService.payOrder(id, buyerId);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PostMapping("/api/orders/{id}/complete")
    public ResponseEntity<?> completeOrder(@PathVariable Long id,
                                            @RequestHeader("X-User-Id") Long buyerId) {
        try {
            Order order = paymentService.completeOrder(id, buyerId);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @GetMapping("/api/orders/mine")
    public ResponseEntity<List<Order>> getMyOrders(@RequestHeader("X-User-Id") Long userId) {
        List<Order> purchases = paymentService.getMyPurchases(userId);
        return ResponseEntity.ok(purchases);
    }

    @GetMapping("/api/wallet/balance")
    public ResponseEntity<WalletBalanceResponse> getBalance(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(new WalletBalanceResponse(
                paymentService.getWalletBalance(userId),
                paymentService.isSandboxEnabled()
        ));
    }

    @GetMapping("/api/wallet/transactions")
    public ResponseEntity<List<WalletTransaction>> getTransactions(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(paymentService.getWalletTransactions(userId));
    }

    @PostMapping("/api/orders/{id}/payment/initialize")
    public ResponseEntity<?> initializePayment(@PathVariable Long id,
                                               @RequestHeader("X-User-Id") Long buyerId,
                                               @RequestBody(required = false) InitializePaymentRequest request) {
        try {
            Order.PaymentChannel channel = request == null ? null : request.channel();
            return ResponseEntity.ok(paystackService.initialize(id, buyerId, channel));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PostMapping("/api/orders/{id}/payment/verify")
    public ResponseEntity<?> verifyPayment(@PathVariable Long id,
                                           @RequestHeader("X-User-Id") Long buyerId,
                                           @RequestBody VerifyPaymentRequest request) {
        try {
            return ResponseEntity.ok(paystackService.verify(id, buyerId, request.reference()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PostMapping("/api/payments/paystack/webhook")
    public ResponseEntity<?> paystackWebhook(@RequestBody String payload,
                                             @RequestHeader(value = "x-paystack-signature", required = false) String signature) {
        try {
            paystackService.handleWebhook(payload, signature);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/api/orders/{id}/refund")
    public ResponseEntity<?> refundOrder(@PathVariable Long id,
                                         @RequestHeader("X-User-Id") Long buyerId) {
        try {
            return ResponseEntity.accepted().body(paymentService.requestRefund(id, buyerId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @GetMapping("/api/payments/paystack/callback")
    public ResponseEntity<Void> paystackCallback() {
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, URI.create("nearbuy://payment-complete").toString())
                .build();
    }

    @GetMapping("/api/orders/sales")
    public ResponseEntity<List<Order>> getMySales(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(paymentService.getMySales(userId));
    }

    @PostMapping("/api/wallet/top-up")
    public ResponseEntity<?> topUp(@RequestBody WalletAdjustmentRequest request,
                                    @RequestHeader("X-User-Id") Long userId) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.topUp(userId, request.getAmount()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @PostMapping("/api/wallet/withdraw")
    public ResponseEntity<?> withdraw(@RequestBody WalletAdjustmentRequest request,
                                       @RequestHeader("X-User-Id") Long userId) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.withdraw(userId, request.getAmount()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    public record VerifyPaymentRequest(String reference) {}
    public record InitializePaymentRequest(Order.PaymentChannel channel) {}
}
