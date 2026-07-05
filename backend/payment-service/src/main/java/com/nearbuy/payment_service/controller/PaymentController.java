package com.nearbuy.payment_service.controller;

import com.nearbuy.payment_service.dto.CreateOrderRequest;
import com.nearbuy.payment_service.dto.WalletBalanceResponse;
import com.nearbuy.payment_service.model.Order;
import com.nearbuy.payment_service.model.WalletTransaction;
import com.nearbuy.payment_service.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

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
                                            @RequestHeader("X-User-Id") Long sellerId) {
        try {
            Order order = paymentService.completeOrder(id, sellerId);
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
        return ResponseEntity.ok(new WalletBalanceResponse(paymentService.getWalletBalance(userId)));
    }

    @GetMapping("/api/wallet/transactions")
    public ResponseEntity<List<WalletTransaction>> getTransactions(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(paymentService.getWalletTransactions(userId));
    }
}