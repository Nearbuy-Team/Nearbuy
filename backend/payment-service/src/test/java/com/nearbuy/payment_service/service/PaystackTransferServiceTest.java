package com.nearbuy.payment_service.service;

import com.nearbuy.payment_service.model.Order;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class PaystackTransferServiceTest {
    private PaystackTransferService service;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        service = new PaystackTransferService();
        ReflectionTestUtils.setField(service, "secretKey", "sk_test_example");
        ReflectionTestUtils.setField(service, "transfersEnabled", true);
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        server = MockRestServiceServer.bindTo(restTemplate).build();
    }

    @Test
    void payoutUsesStablePerOrderReference() {
        server.expect(once(), requestTo("https://api.paystack.co/transfer"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("""
                        {"status":true,"data":{"amount":12500,"currency":"GHS",
                        "reference":"nearbuy-payout-order-10","status":"pending",
                        "transfer_code":"TRF_example"}}
                        """, MediaType.APPLICATION_JSON));

        PaystackTransferService.TransferInitialization result = service.initiateSellerPayout(
                payoutOrder(), "RCP_seller"
        );

        assertThat(result.reference()).isEqualTo("nearbuy-payout-order-10");
        server.verify();
    }

    @Test
    void uncertainPostIsReconciledByReferenceAndRecipient() {
        server.expect(once(), requestTo("https://api.paystack.co/transfer"))
                .andRespond(withServerError());
        server.expect(once(), requestTo("https://api.paystack.co/transfer/verify/nearbuy-payout-order-10"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {"status":true,"data":{"amount":12500,"currency":"GHS",
                        "reference":"nearbuy-payout-order-10","status":"pending",
                        "transfer_code":"TRF_existing",
                        "recipient":{"recipient_code":"RCP_seller"}}}
                        """, MediaType.APPLICATION_JSON));

        PaystackTransferService.TransferInitialization result = service.initiateSellerPayout(
                payoutOrder(), "RCP_seller"
        );

        assertThat(result.transferCode()).isEqualTo("TRF_existing");
        server.verify();
    }

    private Order payoutOrder() {
        Order order = new Order();
        ReflectionTestUtils.setField(order, "id", 10L);
        order.setItemAmount(new BigDecimal("125.00"));
        order.setPaymentProvider("PAYSTACK");
        return order;
    }
}
