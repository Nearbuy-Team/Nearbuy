# Nearbuy backend handoff

The backend contains five Spring Boot services behind one API gateway:

| Service | Internal port | Responsibility |
|---|---:|---|
| `api-gateway` | 8080 | Public routing, JWT validation, auth rate limiting, trusted user header |
| `user-service` | 8081 | Accounts, hashed passwords/OTPs, OTP email, profiles, notifications |
| `listing-service` | 8082 | Listings and validated photo storage |
| `chat-service` | 8083 | Listing-scoped buyer/seller messages |
| `payment-service` | 8084 | Orders, Paystack collection, full refunds, seller payouts, ledger, reviews |

Only Caddy is internet-facing in `docker-compose.production.yml`. PostgreSQL and ports 8080–8084 remain on an internal Docker network. Exposing an individual service publicly would allow callers to bypass the gateway's trusted `X-User-Id` boundary and is not supported.

Use these guides:

- [Repository README](../README.md): local Docker, mock data, Expo Go, and checks.
- [Production setup](../PRODUCTION_SETUP.md): Paystack test/live setup, online HTTPS deployment, APK/iOS builds, backups, and launch gates.
- [.env.example](.env.example): local environment values.
- [.env.production.example](.env.production.example): required server environment values.

Important behavior:

- Local mode defaults to the sandbox ledger when `PAYSTACK_SECRET_KEY` is empty and `PAYMENTS_SANDBOX_ENABLED=true`.
- Production Compose forces `PAYMENTS_SANDBOX_ENABLED=false` and `PAYSTACK_TRANSFERS_ENABLED=true`.
- The Paystack secret key belongs only in the backend server environment—never Git, Expo, or any `EXPO_PUBLIC_` variable.
- The Paystack webhook endpoint is public but verifies its HMAC-SHA512 signature before processing collections, refunds, or transfers.
- Payment, refund, and payout handlers validate references, GHS amounts, and currencies and use database locks/idempotent ledger records.
- Seller payout methods saved before transfers are configured do not have a Paystack recipient code and must be re-added.

The included production stack is deployable, but public real-money operation still requires Paystack activation, SMTP, a domain/VPS, monitoring, backups, support procedures, legal review, and independent security testing.
