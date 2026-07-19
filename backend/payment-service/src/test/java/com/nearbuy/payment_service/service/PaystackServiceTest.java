package com.nearbuy.payment_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nearbuy.payment_service.model.Order;
import com.nearbuy.payment_service.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@ExtendWith(MockitoExtension.class)
class PaystackServiceTest {
    @Mock private OrderRepository orderRepository;
    @Mock private PaymentService paymentService;

    private PaystackService service;
    private MockRestServiceServer server;
    private Order order;

    @BeforeEach
    void setUp() {
        service = new PaystackService(orderRepository, paymentService, new ObjectMapper());
        ReflectionTestUtils.setField(service, "secretKey", "sk_test_example");
        ReflectionTestUtils.setField(service, "userServiceUrl", "http://user-service");
        ReflectionTestUtils.setField(service, "sandboxEnabled", true);
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        server = MockRestServiceServer.bindTo(restTemplate).build();

        order = new Order();
        ReflectionTestUtils.setField(order, "id", 20L);
        order.setBuyerId(3L);
        order.setAmount(new BigDecimal("100.00"));
        when(orderRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(order));
        server.expect(once(), requestTo("http://user-service/api/internal/users/3"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {"id":3,"fullName":"Demo Buyer","email":"buyer@nearbuy.test","phone":"0200000001"}
                        """, MediaType.APPLICATION_JSON));
    }

    @Test
    void testModeMapsReservedDemoEmailForPaystack() {
        server.expect(once(), requestTo("https://api.paystack.co/transaction/initialize"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.email").value("customer@email.com"))
                .andRespond(withSuccess("""
                        {"status":true,"data":{"authorization_url":"https://checkout.paystack.com/test",
                        "reference":"NB-20-test"}}
                        """, MediaType.APPLICATION_JSON));

        PaystackService.PaymentInitialization result = service.initialize(20L, 3L);

        assertThat(result.provider()).isEqualTo("PAYSTACK");
        assertThat(result.reference()).isEqualTo("NB-20-test");
        server.verify();
    }

    @Test
    void providerFailureFallsBackOnlyInSandboxMode() {
        server.expect(once(), requestTo("https://api.paystack.co/transaction/initialize"))
                .andRespond(withServerError());

        PaystackService.PaymentInitialization result = service.initialize(20L, 3L);

        assertThat(result.provider()).isEqualTo("SANDBOX");
        assertThat(order.getPaymentProvider()).isEqualTo("SANDBOX");
        verify(orderRepository).save(order);
        server.verify();
    }

    @Test
    void providerFailureDoesNotFallBackWhenSandboxIsDisabled() {
        ReflectionTestUtils.setField(service, "sandboxEnabled", false);
        server.expect(once(), requestTo("https://api.paystack.co/transaction/initialize"))
                .andRespond(withServerError());

        assertThatThrownBy(() -> service.initialize(20L, 3L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Paystack checkout is temporarily unavailable");

        assertThat(order.getPaymentProvider()).isNull();
        server.verify();
    }
}
