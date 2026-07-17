package com.nearbuy.payment_service.service;

import com.nearbuy.payment_service.model.Order;
import com.nearbuy.payment_service.model.PaymentMethod;
import com.nearbuy.payment_service.model.Review;
import com.nearbuy.payment_service.repository.OrderRepository;
import com.nearbuy.payment_service.repository.PaymentMethodRepository;
import com.nearbuy.payment_service.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerDataService {
    private final PaymentMethodRepository paymentMethodRepository;
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;

    public CustomerDataService(PaymentMethodRepository paymentMethodRepository,
                               ReviewRepository reviewRepository,
                               OrderRepository orderRepository) {
        this.paymentMethodRepository = paymentMethodRepository;
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
    }

    public List<PaymentMethod> paymentMethods(Long userId) {
        return paymentMethodRepository.findByUserIdOrderByDefaultMethodDescCreatedAtDesc(userId);
    }

    @Transactional
    public PaymentMethod addMobileMoney(Long userId, String provider, String phone) {
        String digits = phone == null ? "" : phone.replaceAll("\\D", "");
        if (digits.length() < 8) throw new IllegalArgumentException("Enter a valid Mobile Money number");
        String normalizedProvider = provider == null ? "" : provider.trim().toUpperCase();
        if (!List.of("MTN", "AT", "TELECEL").contains(normalizedProvider)) {
            throw new IllegalArgumentException("Choose MTN, AT, or Telecel");
        }
        boolean first = !paymentMethodRepository.existsByUserId(userId);
        PaymentMethod method = new PaymentMethod();
        method.setUserId(userId);
        method.setType(PaymentMethod.MethodType.MOBILE_MONEY);
        method.setProvider(normalizedProvider);
        method.setLastFour(digits.substring(digits.length() - 4));
        method.setDefaultMethod(first);
        return paymentMethodRepository.save(method);
    }

    @Transactional
    public PaymentMethod setDefault(Long userId, Long methodId) {
        PaymentMethod selected = paymentMethodRepository.findByIdAndUserId(methodId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Payment method not found"));
        for (PaymentMethod method : paymentMethodRepository.findByUserIdOrderByDefaultMethodDescCreatedAtDesc(userId)) {
            method.setDefaultMethod(method.getId().equals(selected.getId()));
        }
        return selected;
    }

    @Transactional
    public void deletePaymentMethod(Long userId, Long methodId) {
        PaymentMethod method = paymentMethodRepository.findByIdAndUserId(methodId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Payment method not found"));
        boolean wasDefault = method.isDefaultMethod();
        paymentMethodRepository.delete(method);
        if (wasDefault) {
            paymentMethodRepository.findByUserIdOrderByDefaultMethodDescCreatedAtDesc(userId).stream()
                    .findFirst().ifPresent(next -> {
                        next.setDefaultMethod(true);
                        paymentMethodRepository.save(next);
                    });
        }
    }

    public List<Review> reviewsForUser(Long userId) {
        return reviewRepository.findByReviewedUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Review createReview(Long reviewerId, Long orderId, int rating, String comment) {
        if (rating < 1 || rating > 5) throw new IllegalArgumentException("Rating must be between 1 and 5");
        if (comment == null || comment.trim().length() < 3) {
            throw new IllegalArgumentException("Write a short review");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (!order.getBuyerId().equals(reviewerId)) {
            throw new SecurityException("Only the buyer can review this order");
        }
        if (order.getStatus() != Order.OrderStatus.COMPLETED) {
            throw new IllegalStateException("Complete the order before reviewing it");
        }
        if (reviewRepository.existsByOrderIdAndReviewerId(orderId, reviewerId)) {
            throw new IllegalStateException("You already reviewed this order");
        }
        Review review = new Review();
        review.setOrderId(orderId);
        review.setListingId(order.getListingId());
        review.setReviewerId(reviewerId);
        review.setReviewedUserId(order.getSellerId());
        review.setRating(rating);
        review.setComment(comment.trim());
        return reviewRepository.save(review);
    }
}
