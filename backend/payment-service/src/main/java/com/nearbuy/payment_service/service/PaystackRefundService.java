package com.nearbuy.payment_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.nearbuy.payment_service.model.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class PaystackRefundService {
    private static final Logger log = LoggerFactory.getLogger(PaystackRefundService.class);
    private static final String PAYSTACK_API = "https://api.paystack.co";

    private final RestTemplate restTemplate;

    @Value("${paystack.secret-key:}")
    private String secretKey;

    public PaystackRefundService() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(10_000);
        requestFactory.setReadTimeout(20_000);
        this.restTemplate = new RestTemplate(requestFactory);
    }

    public RefundInitialization initiateFullRefund(Order order) {
        if (!isConfigured() || !"PAYSTACK".equals(order.getPaymentProvider())) {
            throw new IllegalStateException("Paystack refund is unavailable");
        }
        if (order.getPaymentReference() == null || order.getPaymentReference().isBlank()) {
            throw new IllegalStateException("The original payment reference is unavailable");
        }

        Map<String, Object> body = Map.of(
                "transaction", order.getPaymentReference(),
                "amount", PaystackAmounts.toMinorUnits(order.getAmount()),
                "currency", "GHS",
                "customer_note", refundNote(order),
                "merchant_note", "Buyer requested refund before seller payout"
        );
        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    PAYSTACK_API + "/refund",
                    HttpMethod.POST,
                    new HttpEntity<>(body, paystackHeaders()),
                    JsonNode.class
            );
            return validatedRefund(response.getBody(), order, false);
        } catch (Exception error) {
            log.info("Reconciling uncertain Paystack refund response for order {}", order.getId());
            try {
                return reconcileExistingFullRefund(order);
            } catch (Exception reconciliationError) {
                log.warn("Paystack refund could not be confirmed for order {}", order.getId(), reconciliationError);
                throw new IllegalStateException("Refund could not be confirmed. Please try again later");
            }
        }
    }

    private RefundInitialization reconcileExistingFullRefund(Order order) {
        ResponseEntity<JsonNode> transactionResponse = restTemplate.exchange(
                PAYSTACK_API + "/transaction/verify/" + order.getPaymentReference(),
                HttpMethod.GET,
                new HttpEntity<>(paystackHeaders()),
                JsonNode.class
        );
        JsonNode transactionBody = transactionResponse.getBody();
        JsonNode transaction = transactionBody == null ? null : transactionBody.path("data");
        if (transactionBody == null || !transactionBody.path("status").asBoolean(false)
                || transaction == null || !transaction.path("id").isNumber()
                || !order.getPaymentReference().equals(transaction.path("reference").asText())
                || transaction.path("amount").asLong(-1) != PaystackAmounts.toMinorUnits(order.getAmount())
                || !"GHS".equals(transaction.path("currency").asText())) {
            throw new IllegalStateException("Original Paystack transaction does not match the order");
        }

        long transactionId = transaction.path("id").asLong();
        ResponseEntity<JsonNode> refundsResponse = restTemplate.exchange(
                PAYSTACK_API + "/refund?transaction=" + transactionId + "&currency=GHS&perPage=50",
                HttpMethod.GET,
                new HttpEntity<>(paystackHeaders()),
                JsonNode.class
        );
        JsonNode refundsBody = refundsResponse.getBody();
        if (refundsBody == null || !refundsBody.path("status").asBoolean(false)
                || !refundsBody.path("data").isArray()) {
            throw new IllegalStateException("Paystack refunds could not be reconciled");
        }
        for (JsonNode refund : refundsBody.path("data")) {
            try {
                return validatedRefund(refund, order, true);
            } catch (IllegalStateException ignored) {
                // Continue until the refund created for this Nearbuy order is found.
            }
        }
        throw new IllegalStateException("No matching Paystack refund exists yet");
    }

    private RefundInitialization validatedRefund(JsonNode responseOrData,
                                                  Order order,
                                                  boolean directData) {
        JsonNode data = directData
                ? responseOrData
                : responseOrData == null ? null : responseOrData.path("data");
        if ((!directData && (responseOrData == null || !responseOrData.path("status").asBoolean(false)))
                || data == null || !data.path("id").isNumber()
                || data.path("amount").asLong(-1) != PaystackAmounts.toMinorUnits(order.getAmount())
                || !"GHS".equals(data.path("currency").asText())) {
            throw new IllegalStateException("Paystack refund details do not match the order");
        }
        if (directData && !refundNote(order).equals(data.path("customer_note").asText())) {
            throw new IllegalStateException("Paystack refund note does not match the order");
        }
        return new RefundInitialization(data.path("id").asLong(), data.path("status").asText("pending"));
    }

    private String refundNote(Order order) {
        return "Nearbuy order NB-" + order.getId() + " refund";
    }

    private boolean isConfigured() {
        return secretKey != null && (secretKey.startsWith("sk_test_") || secretKey.startsWith("sk_live_"));
    }

    private HttpHeaders paystackHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(secretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    public record RefundInitialization(Long refundId, String status) {}
}
