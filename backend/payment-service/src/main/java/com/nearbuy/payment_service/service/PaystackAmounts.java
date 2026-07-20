package com.nearbuy.payment_service.service;

import java.math.BigDecimal;

final class PaystackAmounts {
    private PaystackAmounts() {}

    static long toMinorUnits(BigDecimal amount) {
        if (amount == null) throw new IllegalArgumentException("Payment amount is unavailable");
        return amount.movePointRight(2).longValueExact();
    }
}
