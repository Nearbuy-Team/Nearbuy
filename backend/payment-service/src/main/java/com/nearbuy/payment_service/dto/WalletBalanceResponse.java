package com.nearbuy.payment_service.dto;

import java.math.BigDecimal;

public class WalletBalanceResponse {

    private BigDecimal balance;
    private boolean sandboxMode;

    public WalletBalanceResponse(BigDecimal balance, boolean sandboxMode) {
        this.balance = balance;
        this.sandboxMode = sandboxMode;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public boolean isSandboxMode() {
        return sandboxMode;
    }

    public void setSandboxMode(boolean sandboxMode) {
        this.sandboxMode = sandboxMode;
    }
}
