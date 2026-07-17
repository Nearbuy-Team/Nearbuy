package com.nearbuy.payment_service.controller;

import com.nearbuy.payment_service.service.CustomerDataService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class CustomerDataController {
    private final CustomerDataService customerDataService;

    public CustomerDataController(CustomerDataService customerDataService) {
        this.customerDataService = customerDataService;
    }

    @GetMapping("/api/payment-methods")
    public ResponseEntity<?> paymentMethods(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(customerDataService.paymentMethods(userId));
    }

    @PostMapping("/api/payment-methods/mobile-money")
    public ResponseEntity<?> addMobileMoney(@RequestHeader("X-User-Id") Long userId,
                                            @RequestBody MobileMoneyRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(customerDataService.addMobileMoney(userId, request.provider(), request.phone()));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.badRequest().body(error.getMessage());
        }
    }

    @PatchMapping("/api/payment-methods/{id}/default")
    public ResponseEntity<?> setDefault(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        try {
            return ResponseEntity.ok(customerDataService.setDefault(userId, id));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error.getMessage());
        }
    }

    @DeleteMapping("/api/payment-methods/{id}")
    public ResponseEntity<?> delete(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        try {
            customerDataService.deletePaymentMethod(userId, id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException error) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error.getMessage());
        }
    }

    @GetMapping("/api/reviews/mine")
    public ResponseEntity<?> myReviews(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(customerDataService.reviewsForUser(userId));
    }

    @GetMapping("/api/reviews/user/{userId}")
    public ResponseEntity<?> userReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(customerDataService.reviewsForUser(userId));
    }

    @PostMapping("/api/reviews")
    public ResponseEntity<?> createReview(@RequestHeader("X-User-Id") Long userId,
                                          @RequestBody ReviewRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(customerDataService.createReview(userId, request.orderId(), request.rating(), request.comment()));
        } catch (IllegalArgumentException error) {
            return ResponseEntity.badRequest().body(error.getMessage());
        } catch (SecurityException error) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error.getMessage());
        } catch (IllegalStateException error) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error.getMessage());
        }
    }

    public record MobileMoneyRequest(String provider, String phone) {}
    public record ReviewRequest(Long orderId, int rating, String comment) {}
}
