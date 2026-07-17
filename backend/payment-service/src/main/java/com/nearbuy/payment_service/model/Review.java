package com.nearbuy.payment_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews", uniqueConstraints = @UniqueConstraint(columnNames = {"order_id", "reviewer_id"}))
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @Column(name = "reviewer_id", nullable = false)
    private Long reviewerId;

    @Column(name = "reviewed_user_id", nullable = false)
    private Long reviewedUserId;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, length = 1000)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public Long getListingId() { return listingId; }
    public void setListingId(Long listingId) { this.listingId = listingId; }
    public Long getReviewerId() { return reviewerId; }
    public void setReviewerId(Long reviewerId) { this.reviewerId = reviewerId; }
    public Long getReviewedUserId() { return reviewedUserId; }
    public void setReviewedUserId(Long reviewedUserId) { this.reviewedUserId = reviewedUserId; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
