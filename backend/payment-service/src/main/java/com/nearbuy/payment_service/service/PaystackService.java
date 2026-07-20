package com.nearbuy.payment_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nearbuy.payment_service.model.Order;
import com.nearbuy.payment_service.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class PaystackService {
    private static final Logger log = LoggerFactory.getLogger(PaystackService.class);
    private static final String PAYSTACK_API = "https://api.paystack.co";

    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${paystack.secret-key:}")
    private String secretKey;

    @Value("${user-service.url}")
    private String userServiceUrl;

    @Value("${payments.sandbox-enabled:true}")
    private boolean sandboxEnabled;

    @Value("${paystack.callback-url:}")
    private String callbackUrl;

    public PaystackService(OrderRepository orderRepository, PaymentService paymentService, ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.paymentService = paymentService;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(10_000);
        requestFactory.setReadTimeout(20_000);
        this.restTemplate = new RestTemplate(requestFactory);
    }

    @Transactional
    public PaymentInitialization initialize(Long orderId, Long buyerId, Order.PaymentChannel selectedChannel) {
        Order order = ownedPendingOrder(orderId, buyerId);
        if (!isConfigured()) {
            if (sandboxEnabled) {
                order.setPaymentChannel(selectedChannel);
                orderRepository.save(order);
                return new PaymentInitialization("SANDBOX", null, null, selectedChannel);
            }
            throw new IllegalStateException("Online payments are not configured");
        }
        if (order.getPaymentReference() != null && order.getPaymentAuthorizationUrl() != null) {
            if (selectedChannel != null && order.getPaymentChannel() != null
                    && selectedChannel != order.getPaymentChannel()) {
                throw new IllegalStateException("Payment method cannot be changed after checkout starts");
            }
            return new PaymentInitialization(
                    "PAYSTACK",
                    order.getPaymentAuthorizationUrl(),
                    order.getPaymentReference(),
                    order.getPaymentChannel()
            );
        }

        InternalUser user;
        try {
            user = restTemplate.getForObject(userServiceUrl + "/api/internal/users/" + buyerId, InternalUser.class);
        } catch (Exception error) {
            throw new IllegalStateException("Could not load buyer details");
        }
        if (user == null || user.email() == null) throw new IllegalStateException("Buyer email is unavailable");

        String reference = "NB-" + order.getId() + "-" + UUID.randomUUID().toString().substring(0, 8);
        HttpHeaders headers = paystackHeaders();
        Map<String, Object> body = new HashMap<>();
        body.put("email", checkoutEmail(user.email()));
        body.put("amount", PaystackAmounts.toMinorUnits(order.getAmount()));
        body.put("currency", "GHS");
        body.put("reference", reference);
        body.put("channels", selectedChannel == null
                ? List.of("mobile_money", "card")
                : List.of(selectedChannel.paystackValue()));
        body.put("metadata", Map.of("order_id", order.getId(), "buyer_id", buyerId));
        if (callbackUrl != null && !callbackUrl.isBlank()) body.put("callback_url", callbackUrl.trim());
        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    PAYSTACK_API + "/transaction/initialize",
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
            order.setPaymentAuthorizationUrl(authorizationUrl);
            order.setPaymentChannel(selectedChannel);
            orderRepository.save(order);
            return new PaymentInitialization("PAYSTACK", authorizationUrl, returnedReference, selectedChannel);
        } catch (IllegalStateException error) {
            throw error;
        } catch (Exception error) {
            log.warn("Paystack payment initialization failed for order {}", orderId, error);
            if (sandboxEnabled) {
                order.setPaymentProvider("SANDBOX");
                order.setPaymentReference(null);
                order.setPaymentAuthorizationUrl(null);
                order.setPaymentChannel(selectedChannel);
                orderRepository.save(order);
                return new PaymentInitialization("SANDBOX", null, null, selectedChannel);
            }
            throw new IllegalStateException("Paystack checkout is temporarily unavailable");
        }
    }

    public Order verify(Long orderId, Long buyerId, String reference) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (!order.getBuyerId().equals(buyerId)) throw new SecurityException("You do not own this order");
        if (!isConfigured() || reference == null || !reference.equals(order.getPaymentReference())) {
            throw new IllegalArgumentException("Invalid payment reference");
        }
        if (order.getStatus() == Order.OrderStatus.PAID
                || order.getStatus() == Order.OrderStatus.REFUND_PENDING
                || order.getStatus() == Order.OrderStatus.REFUNDED
                || order.getStatus() == Order.OrderStatus.COMPLETED) return order;
        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    PAYSTACK_API + "/transaction/verify/" + reference,
                    HttpMethod.GET,
                    new HttpEntity<>(paystackHeaders()),
                    JsonNode.class
            );
            JsonNode data = response.getBody() == null ? null : response.getBody().path("data");
            validateSuccessfulPayment(order, data, reference);
            return paymentService.captureVerifiedPayment(order.getId());
        } catch (IllegalStateException error) {
            throw error;
        } catch (Exception error) {
            log.info("Paystack verification is not complete for order {}", orderId);
            throw new IllegalStateException("Payment is not confirmed yet");
        }
    }

    public void handleWebhook(String payload, String signature) {
        if (!isConfigured() || !validSignature(payload, signature)) throw new SecurityException("Invalid Paystack signature");
        try {
            JsonNode event = objectMapper.readTree(payload);
            String eventName = event.path("event").asText();
            JsonNode data = event.path("data");
            if ("charge.success".equals(eventName)) {
                String reference = data.path("reference").asText();
                Order order = orderRepository.findByPaymentReference(reference)
                        .orElseThrow(() -> new IllegalArgumentException("Order not found"));
                validateSuccessfulPayment(order, data, reference);
                paymentService.captureVerifiedPayment(order.getId());
                return;
            }
            if (List.of("transfer.success", "transfer.failed", "transfer.reversed").contains(eventName)) {
                paymentService.recordPayoutEvent(
                        data.path("reference").asText(),
                        eventName,
                        data.path("amount").asLong(-1),
                        data.path("currency").asText()
                );
                return;
            }
            if (List.of(
                    "refund.pending",
                    "refund.processing",
                    "refund.needs-attention",
                    "refund.processed",
                    "refund.failed"
            ).contains(eventName)) {
                paymentService.recordRefundEvent(
                        data.path("transaction_reference").asText(),
                        eventName,
                        data.path("amount").asLong(-1),
                        data.path("currency").asText()
                );
            }
        } catch (SecurityException | IllegalArgumentException | IllegalStateException error) {
            throw error;
        } catch (Exception error) {
            log.warn("Invalid Paystack webhook payload", error);
            throw new IllegalArgumentException("Invalid Paystack payload");
        }
    }

    private Order ownedPendingOrder(Long orderId, Long buyerId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
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
        if (order.getPaymentChannel() != null
                && !order.getPaymentChannel().paystackValue().equals(data.path("channel").asText())) {
            throw new IllegalStateException("Payment channel mismatch");
        }
        if (data.path("amount").asLong(-1) != PaystackAmounts.toMinorUnits(order.getAmount())) {
            throw new IllegalStateException("Payment amount mismatch");
        }
    }

    private boolean isConfigured() {
        return secretKey != null && (secretKey.startsWith("sk_test_") || secretKey.startsWith("sk_live_"));
    }

    private String checkoutEmail(String email) {
        if (secretKey != null && secretKey.startsWith("sk_test_")
                && email != null && email.toLowerCase(Locale.ROOT).endsWith(".test")) {
            return "customer@email.com";
        }
        return email;
    }
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

    public record PaymentInitialization(String provider,
                                        String authorizationUrl,
                                        String reference,
                                        Order.PaymentChannel channel) {}
    private record InternalUser(Long id, String fullName, String email, String phone) {}
}
