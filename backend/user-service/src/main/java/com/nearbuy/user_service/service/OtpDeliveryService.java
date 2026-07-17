package com.nearbuy.user_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.ObjectProvider;

@Service
public class OtpDeliveryService {
    private final JavaMailSender mailSender;

    @Value("${nearbuy.otp.delivery:console}")
    private String deliveryMode;

    @Value("${nearbuy.otp.from:no-reply@nearbuy.local}")
    private String fromAddress;

    public OtpDeliveryService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    public void deliver(String email, String code, String purpose) {
        if (!"email".equalsIgnoreCase(deliveryMode)) {
            System.out.println(purpose + " OTP for " + email + ": " + code);
            return;
        }
        if (mailSender == null) {
            throw new IllegalStateException("Email OTP delivery is enabled but SMTP is not configured");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(email);
        message.setSubject("Your Nearbuy verification code");
        message.setText("Your Nearbuy " + purpose.toLowerCase() + " code is " + code
                + ". It expires in 10 minutes. Never share this code.");
        mailSender.send(message);
    }
}
