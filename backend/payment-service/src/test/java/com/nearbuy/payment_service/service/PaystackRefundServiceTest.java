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

class PaystackRefundServiceTest {
    private PaystackRefundService service;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        service = new PaystackRefundService();
        ReflectionTestUtils.setField(service, "secretKey", "sk_test_example");
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        server = MockRestServiceServer.bindTo(restTemplate).build();
    }

    @Test
    void uncertainRefundPostIsReconciledAgainstTheOriginalTransaction() {
        server.expect(once(), requestTo("https://api.paystack.co/refund"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());
        server.expect(once(), requestTo("https://api.paystack.co/transaction/verify/NB-payment-11"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {"status":true,"data":{"id":777,"reference":"NB-payment-11",
                        "amount":4200,"currency":"GHS"}}
                        """, MediaType.APPLICATION_JSON));
        server.expect(once(), requestTo(
                        "https://api.paystack.co/refund?transaction=777&currency=GHS&perPage=50"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {"status":true,"data":[{"id":999,"amount":4200,"currency":"GHS",
                        "status":"pending","customer_note":"Nearbuy order NB-11 refund"}]}
                        """, MediaType.APPLICATION_JSON));

        PaystackRefundService.RefundInitialization refund = service.initiateFullRefund(refundOrder());

        assertThat(refund.refundId()).isEqualTo(999L);
        assertThat(refund.status()).isEqualTo("pending");
        server.verify();
    }

    private Order refundOrder() {
        Order order = new Order();
        ReflectionTestUtils.setField(order, "id", 11L);
        order.setAmount(new BigDecimal("42.00"));
        order.setPaymentProvider("PAYSTACK");
        order.setPaymentReference("NB-payment-11");
        return order;
    }
}
