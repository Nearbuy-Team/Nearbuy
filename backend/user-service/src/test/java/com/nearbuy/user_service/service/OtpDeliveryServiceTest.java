package com.nearbuy.user_service.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

class OtpDeliveryServiceTest {

    @Test
    void sendsOtpThroughBrevoHttpsApi() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        OtpDeliveryService service = service(builder);
        ReflectionTestUtils.setField(service, "deliveryMode", "brevo");
        ReflectionTestUtils.setField(service, "fromAddress", "verified@example.com");
        ReflectionTestUtils.setField(service, "fromName", "Nearbuy");
        ReflectionTestUtils.setField(service, "brevoApiKey", "test-brevo-key");
        ReflectionTestUtils.setField(service, "brevoApiUrl", "https://api.brevo.test/v3/smtp/email");

        server.expect(once(), requestTo("https://api.brevo.test/v3/smtp/email"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("api-key", "test-brevo-key"))
                .andExpect(content().json("""
                        {
                          "sender":{"name":"Nearbuy","email":"verified@example.com"},
                          "to":[{"email":"person@example.com"}],
                          "subject":"Verify your Nearbuy email",
                          "tags":["nearbuy-otp"]
                        }
                        """))
                .andExpect(jsonPath("$.textContent").value(
                        "Your Nearbuy registration code is 123456. It expires in 10 minutes. Never share this code."
                                + System.lineSeparator() + System.lineSeparator()
                                + "If you did not request this code, you can ignore this email."
                ))
                .andRespond(withStatus(HttpStatus.CREATED)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"messageId\":\"test-id\"}"));

        service.deliver("person@example.com", "123456", "Registration");

        server.verify();
    }

    @Test
    void refusesBrevoModeWithoutAnApiKey() {
        OtpDeliveryService service = service(RestClient.builder());
        ReflectionTestUtils.setField(service, "deliveryMode", "brevo");
        ReflectionTestUtils.setField(service, "brevoApiKey", "");

        assertThatThrownBy(() -> service.deliver("person@example.com", "123456", "Registration"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("BREVO_API_KEY");
    }

    @SuppressWarnings("unchecked")
    private OtpDeliveryService service(RestClient.Builder builder) {
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);
        return new OtpDeliveryService(provider, builder);
    }
}
