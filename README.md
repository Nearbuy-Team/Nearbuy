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

## Seed local test data

After Docker Desktop is running, populate a repeatable development dataset from the repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File backend\scripts\seed-test-data.ps1 -SkipBuild
```

Omit `-SkipBuild` when service source code changed and the images need rebuilding. The script resets data belonging to the three `@nearbuy.test` accounts only; other local accounts are left untouched.

| Account | Email | Password | Useful data |
|---|---|---|---|
| Buyer | `buyer@nearbuy.test` | `Nearbuy123!` | Wallet funds, pending purchase, escrow-held purchase, completed purchases |
| Seller | `seller@nearbuy.test` | `Nearbuy123!` | Active listings, an escrow-held sale, released funds, review |
| Rental seller | `rentals@nearbuy.test` | `Nearbuy123!` | Rental listing and completed sale |

With Paystack left blank in `backend/.env`, log in as the buyer and use the normal app actions to test:

1. Pay order `NB-92001` to create a sandbox funding transaction and escrow hold.
2. Complete order `NB-92002` to release its item amount to the seller.
3. Review completed order `NB-92003`.

Re-run the seed command whenever you want to restore this baseline.

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
