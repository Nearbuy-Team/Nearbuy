package com.nearbuy.payment_service.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_methods")
public class PaymentMethod {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MethodType type;

    @Column(nullable = false, length = 40)
    private String provider;

    @Column(name = "last_four", nullable = false, length = 4)
    private String lastFour;

    @Column(name = "is_default", nullable = false)
    private boolean defaultMethod;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum MethodType { MOBILE_MONEY, CARD }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public MethodType getType() { return type; }
    public void setType(MethodType type) { this.type = type; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getLastFour() { return lastFour; }
    public void setLastFour(String lastFour) { this.lastFour = lastFour; }
    public boolean isDefaultMethod() { return defaultMethod; }
    public void setDefaultMethod(boolean defaultMethod) { this.defaultMethod = defaultMethod; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
