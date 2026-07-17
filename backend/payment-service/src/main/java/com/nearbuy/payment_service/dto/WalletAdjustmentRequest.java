package com.nearbuy.payment_service.dto;

import java.math.BigDecimal;

public class WalletAdjustmentRequest {
    private BigDecimal amount;

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
