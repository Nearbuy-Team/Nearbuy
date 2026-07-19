package com.nearbuy.payment_service.service;

import com.nearbuy.payment_service.model.Order;
import com.nearbuy.payment_service.model.WalletTransaction;
import com.nearbuy.payment_service.repository.OrderRepository;
import com.nearbuy.payment_service.repository.PaymentMethodRepository;
import com.nearbuy.payment_service.repository.WalletTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {
    @Mock private OrderRepository orderRepository;
    @Mock private WalletTransactionRepository walletTransactionRepository;
    @Mock private PaymentMethodRepository paymentMethodRepository;
    @Mock private PaystackTransferService paystackTransferService;
    @Mock private PaystackRefundService paystackRefundService;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                orderRepository,
                walletTransactionRepository,
                paymentMethodRepository,
                paystackTransferService,
                paystackRefundService
        );
    }

    @Test
    void payoutSuccessIsRecordedOnlyOnce() {
        Order order = payoutOrder();
        when(orderRepository.findByPayoutReferenceForUpdate("nearbuy-payout-10-test"))
                .thenReturn(Optional.of(order));
        when(walletTransactionRepository.existsByOrderIdAndUserIdAndType(
                10L, 22L, WalletTransaction.TransactionType.ESCROW_RELEASE
        )).thenReturn(false);

        paymentService.recordPayoutEvent("nearbuy-payout-10-test", "transfer.success", 12500, "GHS");
        paymentService.recordPayoutEvent("nearbuy-payout-10-test", "transfer.success", 12500, "GHS");

        ArgumentCaptor<WalletTransaction> transaction = ArgumentCaptor.forClass(WalletTransaction.class);
        verify(walletTransactionRepository, times(1)).save(transaction.capture());
        assertThat(transaction.getValue().getType()).isEqualTo(WalletTransaction.TransactionType.ESCROW_RELEASE);
        assertThat(transaction.getValue().getAmount()).isEqualByComparingTo("125.00");
        assertThat(order.getPayoutStatus()).isEqualTo(Order.PayoutStatus.SUCCESS);
    }

    @Test
    void payoutWebhookMustMatchOrderAmountAndCurrency() {
        Order order = payoutOrder();
        when(orderRepository.findByPayoutReferenceForUpdate("nearbuy-payout-10-test"))
                .thenReturn(Optional.of(order));

        assertThatThrownBy(() -> paymentService.recordPayoutEvent(
                "nearbuy-payout-10-test", "transfer.success", 12499, "GHS"
        )).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> paymentService.recordPayoutEvent(
                "nearbuy-payout-10-test", "transfer.success", 12500, "NGN"
        )).isInstanceOf(IllegalStateException.class);

        verify(walletTransactionRepository, never()).save(any());
    }

    @Test
    void liveModeCannotMintSandboxWalletFunds() {
        ReflectionTestUtils.setField(paymentService, "sandboxEnabled", false);

        assertThatThrownBy(() -> paymentService.topUp(1L, new BigDecimal("50.00")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("unavailable in live mode");
        verify(walletTransactionRepository, never()).save(any());
    }

    @Test
    void sandboxRefundIsExplicitAndFinal() {
        Order order = new Order();
        ReflectionTestUtils.setField(order, "id", 11L);
        order.setBuyerId(5L);
        order.setSellerId(6L);
        order.setAmount(new BigDecimal("42.00"));
        order.setStatus(Order.OrderStatus.PAID);
        order.setPaymentProvider("SANDBOX");
        ReflectionTestUtils.setField(paymentService, "sandboxEnabled", true);
        when(orderRepository.findByIdForUpdate(11L)).thenReturn(Optional.of(order));
        when(walletTransactionRepository.existsByOrderIdAndUserIdAndType(
                11L, 5L, WalletTransaction.TransactionType.REFUND
        )).thenReturn(false);

        Order refunded = paymentService.requestRefund(11L, 5L);

        assertThat(refunded.getStatus()).isEqualTo(Order.OrderStatus.REFUNDED);
        assertThat(refunded.getRefundStatus()).isEqualTo(Order.RefundStatus.PROCESSED);
        ArgumentCaptor<WalletTransaction> transaction = ArgumentCaptor.forClass(WalletTransaction.class);
        verify(walletTransactionRepository).save(transaction.capture());
        assertThat(transaction.getValue().getType()).isEqualTo(WalletTransaction.TransactionType.REFUND);
    }

    private Order payoutOrder() {
        Order order = new Order();
        ReflectionTestUtils.setField(order, "id", 10L);
        order.setSellerId(22L);
        order.setItemAmount(new BigDecimal("125.00"));
        order.setPayoutStatus(Order.PayoutStatus.PENDING);
        order.setPayoutReference("nearbuy-payout-10-test");
        return order;
    }
}
