package com.nearbuy.user_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

@Service
public class OtpDeliveryService {
    private final JavaMailSender mailSender;
    private final RestClient restClient;

    @Value("${nearbuy.otp.delivery:console}")
    private String deliveryMode;

    @Value("${nearbuy.otp.from:no-reply@nearbuy.local}")
    private String fromAddress;

    @Value("${nearbuy.otp.from-name:Nearbuy}")
    private String fromName;

    @Value("${nearbuy.otp.brevo-api-key:}")
    private String brevoApiKey;

    @Value("${nearbuy.otp.brevo-api-url:https://api.brevo.com/v3/smtp/email}")
    private String brevoApiUrl;

    public OtpDeliveryService(ObjectProvider<JavaMailSender> mailSenderProvider,
                              RestClient.Builder restClientBuilder) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.restClient = restClientBuilder.build();
    }

    public void deliver(String email, String code, String purpose) {
        if ("brevo".equalsIgnoreCase(deliveryMode)) {
            deliverWithBrevo(email, code, purpose);
        } else if ("email".equalsIgnoreCase(deliveryMode)
                || "smtp".equalsIgnoreCase(deliveryMode)) {
            deliverWithSmtp(email, code, purpose);
        } else {
            System.out.println(purpose + " OTP for " + email + ": " + code);
        }
    }

    private void deliverWithSmtp(String email, String code, String purpose) {
        if (mailSender == null) {
            throw new IllegalStateException("Email OTP delivery is enabled but SMTP is not configured");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(email);
        message.setSubject("Password reset".equalsIgnoreCase(purpose)
                ? "Reset your Nearbuy password"
                : "Verify your Nearbuy email");
        message.setText("Your Nearbuy " + purpose.toLowerCase() + " code is " + code
                + ". It expires in 10 minutes. Never share this code."
                + System.lineSeparator() + System.lineSeparator()
                + "If you did not request this code, you can ignore this email.");
        try {
            mailSender.send(message);
        } catch (MailException error) {
            throw new IllegalStateException("The verification email could not be sent. Please try again.", error);
        }
    }

    private void deliverWithBrevo(String email, String code, String purpose) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            throw new IllegalStateException("Brevo OTP delivery is enabled but BREVO_API_KEY is not configured");
        }
        String subject = subject(purpose);
        String content = messageText(code, purpose);
        Map<String, Object> requestBody = Map.of(
                "sender", Map.of("name", fromName, "email", fromAddress),
                "to", List.of(Map.of("email", email)),
                "subject", subject,
                "textContent", content,
                "tags", List.of("nearbuy-otp")
        );
        try {
            restClient.post()
                    .uri(brevoApiUrl)
                    .header("accept", "application/json")
                    .header("api-key", brevoApiKey)
                    .header("content-type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException error) {
            throw new IllegalStateException("The verification email could not be sent. Please try again.", error);
        }
    }

    private String subject(String purpose) {
        return "Password reset".equalsIgnoreCase(purpose)
                ? "Reset your Nearbuy password"
                : "Verify your Nearbuy email";
    }

    private String messageText(String code, String purpose) {
        return "Your Nearbuy " + purpose.toLowerCase() + " code is " + code
                + ". It expires in 10 minutes. Never share this code."
                + System.lineSeparator() + System.lineSeparator()
                + "If you did not request this code, you can ignore this email.";
    }
}
