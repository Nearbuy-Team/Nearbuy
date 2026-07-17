# Nearbuy Backend

Spring Boot microservices for the Nearbuy marketplace. The API gateway is the only backend endpoint the mobile frontend should call.

## Services

| Service | Internal port | Purpose |
|---|---:|---|
| API gateway | 8080 | JWT validation and request routing |
| User service | 8081 | Accounts, OTP, profiles, notifications |
| Listing service | 8082 | Listings and local test photo storage |
| Chat service | 8083 | Buyer/seller conversations |
| Payment service | 8084 | Orders, escrow, wallet, payment methods, reviews, Paystack |

PostgreSQL and Mailpit are included in Docker Compose. Ports 8081 through 8084 are private inside Compose.

## Start locally

```powershell
Copy-Item backend\.env.example backend\.env
```

Replace `POSTGRES_PASSWORD` and `JWT_SECRET` in `backend/.env`, then run:

```powershell
Set-Location backend
docker compose up -d --build
docker compose ps
```

The API gateway is available at `http://localhost:8080`. Development OTP emails appear at `http://localhost:8025`.

To stop the stack while preserving database and uploaded-photo volumes:

```powershell
docker compose down
```

## Optional Paystack test mode

Leave `PAYSTACK_SECRET_KEY` empty to use the built-in sandbox ledger. To use Paystack test checkout, set a backend-only test secret:

```dotenv
PAYSTACK_SECRET_KEY=sk_test_your_key_here
```

Never place this secret in the Expo application. The backend initializes and verifies transactions and exposes the signed webhook endpoint at `/api/payments/paystack/webhook`.

## Tests

```powershell
backend\user-service\mvnw.cmd test
backend\listing-service\mvnw.cmd test
backend\chat-service\mvnw.cmd test
backend\payment-service\mvnw.cmd test
backend\api-gateway\mvnw.cmd test
```

See [backend/HANDOFF.md](backend/HANDOFF.md) for service architecture and deployment notes.
