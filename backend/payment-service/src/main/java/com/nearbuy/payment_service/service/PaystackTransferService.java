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
public class PaystackTransferService {
    private static final Logger log = LoggerFactory.getLogger(PaystackTransferService.class);
    private static final String PAYSTACK_API = "https://api.paystack.co";

    private final RestTemplate restTemplate;

    @Value("${paystack.secret-key:}")
    private String secretKey;

    @Value("${paystack.transfers-enabled:false}")
    private boolean transfersEnabled;

    @Value("${user-service.url}")
    private String userServiceUrl;

    @Value("${nearbuy.internal-api-key:}")
    private String internalApiKey;

    public PaystackTransferService() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(10_000);
        requestFactory.setReadTimeout(20_000);
        this.restTemplate = new RestTemplate(requestFactory);
    }

    public String createMobileMoneyRecipient(Long userId, String provider, String phone) {
        if (!isConfigured() || !transfersEnabled) return null;

        InternalUser user;
        try {
            user = restTemplate.exchange(
                    userServiceUrl + "/api/internal/users/" + userId,
                    HttpMethod.GET,
                    new HttpEntity<>(internalServiceHeaders()),
                    InternalUser.class
            ).getBody();
        } catch (Exception error) {
            log.warn("Could not load payout user {}", userId, error);
            throw new IllegalStateException("Could not load your account details");
        }
        if (user == null || user.fullName() == null || user.fullName().isBlank()) {
            throw new IllegalStateException("Your account name is required for payouts");
        }

        Map<String, Object> body = Map.of(
                "type", "mobile_money",
                "name", user.fullName().trim(),
                "account_number", normalizeGhanaPhone(phone),
                "bank_code", providerCode(provider),
                "currency", "GHS"
        );

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    PAYSTACK_API + "/transferrecipient",
                    HttpMethod.POST,
                    new HttpEntity<>(body, paystackHeaders()),
                    JsonNode.class
            );
            JsonNode responseBody = response.getBody();
            String recipientCode = responseBody == null
                    ? null
                    : responseBody.path("data").path("recipient_code").asText(null);
            if (responseBody == null || !responseBody.path("status").asBoolean(false) || recipientCode == null) {
                throw new IllegalStateException("Paystack could not create this payout recipient");
            }
            return recipientCode;
        } catch (IllegalStateException error) {
            throw error;
        } catch (Exception error) {
            log.warn("Paystack recipient creation failed for user {}", userId, error);
            throw new IllegalStateException("Paystack could not verify this Mobile Money account");
        }
    }

    public TransferInitialization initiateSellerPayout(Order order, String recipientCode) {
        if (!automatedPayoutRequired(order)) {
            throw new IllegalStateException("Automated seller payouts are not enabled");
        }
        if (recipientCode == null || recipientCode.isBlank()) {
            throw new IllegalStateException("Seller must add a verified Mobile Money payout method");
        }

        // A stable reference makes retries safe if Paystack accepted the transfer but the
        // application lost the HTTP response before committing the order update.
        String reference = "nearbuy-payout-order-" + order.getId();
        Map<String, Object> body = Map.of(
                "source", "balance",
                "amount", PaystackAmounts.toMinorUnits(order.getItemAmount()),
                "recipient", recipientCode,
                "reference", reference,
                "reason", "Nearbuy order NB-" + order.getId(),
                "currency", "GHS"
        );

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    PAYSTACK_API + "/transfer",
                    HttpMethod.POST,
                    new HttpEntity<>(body, paystackHeaders()),
                    JsonNode.class
            );
            return validatedTransfer(response.getBody(), order, recipientCode, reference, false);
        } catch (Exception error) {
            log.info("Reconciling uncertain Paystack payout response for order {}", order.getId());
            try {
                ResponseEntity<JsonNode> verification = restTemplate.exchange(
                        PAYSTACK_API + "/transfer/verify/" + reference,
                        HttpMethod.GET,
                        new HttpEntity<>(paystackHeaders()),
                        JsonNode.class
                );
                return validatedTransfer(verification.getBody(), order, recipientCode, reference, true);
            } catch (Exception verificationError) {
                log.warn("Paystack payout could not be confirmed for order {}", order.getId(), verificationError);
                throw new IllegalStateException("Seller payout could not be confirmed. Please try again later");
            }
        }
    }

    private TransferInitialization validatedTransfer(JsonNode responseBody,
                                                      Order order,
                                                      String recipientCode,
                                                      String reference,
                                                      boolean requireRecipientDetails) {
        JsonNode data = responseBody == null ? null : responseBody.path("data");
        String returnedReference = data == null ? null : data.path("reference").asText(null);
        String transferCode = data == null ? null : data.path("transfer_code").asText(null);
        String status = data == null ? null : data.path("status").asText(null);
        if (responseBody == null || !responseBody.path("status").asBoolean(false)
                || !reference.equals(returnedReference)
                || data.path("amount").asLong(-1) != PaystackAmounts.toMinorUnits(order.getItemAmount())
                || !"GHS".equals(data.path("currency").asText())
                || transferCode == null || transferCode.isBlank()
                || status == null || status.isBlank()) {
            throw new IllegalStateException("Paystack payout details do not match the order");
        }
        if (requireRecipientDetails
                && !recipientCode.equals(data.path("recipient").path("recipient_code").asText())) {
            throw new IllegalStateException("Paystack payout recipient does not match the seller");
        }
        return new TransferInitialization(status, transferCode, returnedReference);
    }

    public boolean automatedPayoutRequired(Order order) {
        return transfersEnabled && isConfigured() && "PAYSTACK".equals(order.getPaymentProvider());
    }

    public boolean liveCollectionWithoutPayout(Order order) {
        return isLive() && "PAYSTACK".equals(order.getPaymentProvider()) && !transfersEnabled;
    }

    public boolean payoutsEnabled() {
        return transfersEnabled && isConfigured();
    }

    public boolean isConfigured() {
        return secretKey != null && (secretKey.startsWith("sk_test_") || secretKey.startsWith("sk_live_"));
    }

    private boolean isLive() {
        return secretKey != null && secretKey.startsWith("sk_live_");
    }

    private String normalizeGhanaPhone(String phone) {
        String digits = phone == null ? "" : phone.replaceAll("\\D", "");
        if (digits.length() == 12 && digits.startsWith("233")) digits = "0" + digits.substring(3);
        if (digits.length() != 10 || !digits.startsWith("0")) {
            throw new IllegalArgumentException("Enter a Ghana Mobile Money number such as 0551234987");
        }
        return digits;
    }

    private String providerCode(String provider) {
        return switch (provider == null ? "" : provider.trim().toUpperCase()) {
            case "MTN" -> "MTN";
            case "AT" -> "ATL";
            case "TELECEL" -> "VOD";
            default -> throw new IllegalArgumentException("Choose MTN, AT, or Telecel");
        };
    }

    private HttpHeaders paystackHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(secretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private HttpHeaders internalServiceHeaders() {
        HttpHeaders headers = new HttpHeaders();
        if (internalApiKey != null && !internalApiKey.isBlank()) {
            headers.set("X-Internal-Api-Key", internalApiKey);
        }
        return headers;
    }

    public record TransferInitialization(String status, String transferCode, String reference) {}
    private record InternalUser(Long id, String fullName, String email, String phone) {}
}
