package com.nearbuy.user_service.service;

import com.nearbuy.user_service.model.User;
import com.nearbuy.user_service.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountDeletionService {
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AccountDeletionService(UserRepository userRepository, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void deleteAccount(Long userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (password == null || password.isBlank()
                || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new SecurityException("Password is incorrect");
        }

        Integer protectedOrders = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM orders
                WHERE (buyer_id = ? OR seller_id = ?)
                  AND (
                    status IN ('PAID', 'REFUND_PENDING')
                    OR payout_status = 'PENDING'
                    OR (status = 'PENDING' AND payment_reference IS NOT NULL)
                  )
                """, Integer.class, userId, userId);
        if (protectedOrders != null && protectedOrders > 0) {
            throw new IllegalStateException(
                    "Resolve active payments, refunds, or payouts before deleting your account"
            );
        }

        // Services share the same Postgres database but intentionally do not use
        // cross-service foreign keys, so account-owned rows are removed explicitly.
        jdbcTemplate.update(
                "DELETE FROM reviews WHERE reviewer_id = ? OR reviewed_user_id = ? "
                        + "OR order_id IN (SELECT id FROM orders WHERE buyer_id = ? OR seller_id = ?) "
                        + "OR listing_id IN (SELECT id FROM listings WHERE seller_id = ?)",
                userId, userId, userId, userId, userId
        );
        jdbcTemplate.update(
                "DELETE FROM wallet_transactions WHERE user_id = ? "
                        + "OR order_id IN (SELECT id FROM orders WHERE buyer_id = ? OR seller_id = ?)",
                userId, userId, userId
        );
        jdbcTemplate.update("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?", userId, userId);
        jdbcTemplate.update("DELETE FROM listing_images WHERE listing_id IN "
                + "(SELECT id FROM listings WHERE seller_id = ?)", userId);
        jdbcTemplate.update("DELETE FROM notifications WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM push_tokens WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM payment_methods WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM orders WHERE buyer_id = ? OR seller_id = ?", userId, userId);
        jdbcTemplate.update("DELETE FROM listings WHERE seller_id = ?", userId);
        userRepository.delete(user);
    }
}
