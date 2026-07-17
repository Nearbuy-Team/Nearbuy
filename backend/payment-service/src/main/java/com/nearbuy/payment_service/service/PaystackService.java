package com.nearbuy.payment_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nearbuy.payment_service.model.Order;
import com.nearbuy.payment_service.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PaystackService {
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${paystack.secret-key:}")
    private String secretKey;

    @Value("${user-service.url}")
    private String userServiceUrl;

    public PaystackService(OrderRepository orderRepository, PaymentService paymentService, ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.paymentService = paymentService;
        this.objectMapper = objectMapper;
    }

    public PaymentInitialization initialize(Long orderId, Long buyerId) {
        Order order = ownedPendingOrder(orderId, buyerId);
        if (!isConfigured()) return new PaymentInitialization("SANDBOX", null, null);

        InternalUser user;
        try {
            user = restTemplate.getForObject(userServiceUrl + "/api/internal/users/" + buyerId, InternalUser.class);
        } catch (Exception error) {
            throw new IllegalStateException("Could not load buyer details");
        }
        if (user == null || user.email() == null) throw new IllegalStateException("Buyer email is unavailable");

        String reference = "NB-" + order.getId() + "-" + UUID.randomUUID().toString().substring(0, 8);
        HttpHeaders headers = paystackHeaders();
        Map<String, Object> body = Map.of(
                "email", user.email(),
                "amount", toMinorUnits(order.getAmount()),
                "currency", "GHS",
                "reference", reference,
                "channels", List.of("mobile_money", "card"),
                "metadata", Map.of("order_id", order.getId(), "buyer_id", buyerId)
        );
        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    "https://api.paystack.co/transaction/initialize",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    JsonNode.class
            );
            JsonNode data = response.getBody() == null ? null : response.getBody().path("data");
            String authorizationUrl = data == null ? null : data.path("authorization_url").asText(null);
            String returnedReference = data == null ? null : data.path("reference").asText(reference);
            if (authorizationUrl == null) throw new IllegalStateException("Paystack did not return a checkout URL");
            order.setPaymentProvider("PAYSTACK");
            order.setPaymentReference(returnedReference);
            orderRepository.save(order);
            return new PaymentInitialization("PAYSTACK", authorizationUrl, returnedReference);
        } catch (IllegalStateException error) {
            throw error;
        } catch (Exception error) {
            throw new IllegalStateException("Paystack initialization failed: " + error.getMessage());
        }
    }

    public Order verify(Long orderId, Long buyerId, String reference) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (!order.getBuyerId().equals(buyerId)) throw new SecurityException("You do not own this order");
        if (order.getStatus() == Order.OrderStatus.PAID || order.getStatus() == Order.OrderStatus.COMPLETED) return order;
        if (!isConfigured() || reference == null || !reference.equals(order.getPaymentReference())) {
            throw new IllegalArgumentException("Invalid payment reference");
        }
        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    "https://api.paystack.co/transaction/verify/" + reference,
                    HttpMethod.GET,
                    new HttpEntity<>(paystackHeaders()),
                    JsonNode.class
            );
            JsonNode data = response.getBody() == null ? null : response.getBody().path("data");
            validateSuccessfulPayment(order, data, reference);
            return paymentService.captureVerifiedPayment(order);
        } catch (IllegalStateException error) {
            throw error;
        } catch (Exception error) {
            throw new IllegalStateException("Payment is not confirmed yet");
        }
    }

    public void handleWebhook(String payload, String signature) {
        if (!isConfigured() || !validSignature(payload, signature)) throw new SecurityException("Invalid Paystack signature");
        try {
            JsonNode event = objectMapper.readTree(payload);
            if (!"charge.success".equals(event.path("event").asText())) return;
            JsonNode data = event.path("data");
            String reference = data.path("reference").asText();
            Order order = orderRepository.findByPaymentReference(reference)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found"));
            validateSuccessfulPayment(order, data, reference);
            paymentService.captureVerifiedPayment(order);
        } catch (SecurityException | IllegalArgumentException | IllegalStateException error) {
            throw error;
        } catch (Exception error) {
            throw new IllegalArgumentException("Invalid Paystack payload");
        }
    }

    private Order ownedPendingOrder(Long orderId, Long buyerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (!order.getBuyerId().equals(buyerId)) throw new SecurityException("You do not own this order");
        if (order.getStatus() != Order.OrderStatus.PENDING) throw new IllegalStateException("Order is not payable");
        return order;
    }

    private void validateSuccessfulPayment(Order order, JsonNode data, String reference) {
        if (data == null || !"success".equals(data.path("status").asText())) {
            throw new IllegalStateException("Payment is not confirmed yet");
        }
        if (!reference.equals(data.path("reference").asText())) throw new IllegalStateException("Payment reference mismatch");
        if (!"GHS".equals(data.path("currency").asText())) throw new IllegalStateException("Payment currency mismatch");
        if (data.path("amount").asLong(-1) != toMinorUnits(order.getAmount())) {
            throw new IllegalStateException("Payment amount mismatch");
        }
    }

    private long toMinorUnits(BigDecimal amount) { return amount.movePointRight(2).longValueExact(); }
    private boolean isConfigured() { return secretKey != null && secretKey.startsWith("sk_"); }
    private HttpHeaders paystackHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(secretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
    private boolean validSignature(String payload, String signature) {
        if (signature == null) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            String expected = HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
            return MessageDigest.isEqual(expected.getBytes(StandardCharsets.US_ASCII), signature.getBytes(StandardCharsets.US_ASCII));
        } catch (Exception error) {
            return false;
        }
    }

    public record PaymentInitialization(String provider, String authorizationUrl, String reference) {}
    private record InternalUser(Long id, String fullName, String email, String phone) {}
}
