# Nearbuy

Nearbuy is an Expo/React Native marketplace backed by four Spring Boot data services behind one Spring Cloud API gateway.

## What is connected

- Registration, six-digit OTP verification, login, persisted JWT sessions, logout, and password reset
- Current-user profiles and public seller summaries
- Live listing feed, search/filtering, listing detail, create, pause/activate, and delete
- Buyer/seller chat scoped to a listing and the authenticated participants
- Server-priced checkout, escrow ledger, purchase/sales history, and buyer confirmation
- Wallet balance, transaction history, sandbox top-up, and sandbox withdrawal
- Up to eight real listing photos, persisted in a Docker volume for local testing
- Persisted notification inbox, saved Mobile Money methods, and verified-order reviews
- Local OTP email delivery through Mailpit
- Optional Paystack test checkout with server-side verification and signed webhooks
- Optional Expo push-token registration for development builds
- Configurable gateway, database, JWT, and service-to-service URLs

The mobile app calls only the API gateway. The four data services are private inside Docker Compose.

## Prerequisites

- Docker Desktop with Docker Compose
- Node.js 20 or 22 LTS
- Expo Go on a phone, or an Android/iOS simulator, if you are not using the web build

Java and PostgreSQL do not need to be installed separately when Docker is used.

## 1. Start the backend

From the repository root in PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend/.env` and replace `POSTGRES_PASSWORD` and `JWT_SECRET`. Keep the JWT secret at least 32 characters long. Then run:

```powershell
Set-Location backend
docker compose up --build
```

Wait until the gateway is listening on port `8080`. Leave this terminal open.

The local stack sends OTP emails to Mailpit. Open the inbox in your browser:

`http://localhost:8025`

Set `OTP_DELIVERY=console` in `backend/.env` if you prefer reading codes from `docker compose logs -f user-service`.

## 2. Configure the mobile app

For a physical phone, find the computer's IPv4 address:

```powershell
ipconfig
```

Then create the Expo environment file:

```powershell
Copy-Item nearbuy-mobile\.env.example nearbuy-mobile\.env
```

Set `EXPO_PUBLIC_API_URL` as follows:

| Client | Value |
|---|---|
| Physical phone on the same Wi-Fi | `http://YOUR_COMPUTER_IP:8080` |
| Android emulator | `http://10.0.2.2:8080` |
| iOS simulator or web | `http://localhost:8080` |

On Windows, allow Node/Expo and TCP port `8080` through the private-network firewall when prompted. A phone cannot use `localhost` to reach the computer.

## 3. Start Expo

In a new terminal:

```powershell
Set-Location nearbuy-mobile
npm install
npx expo start --clear
```

Press `w` for web, `a` for Android, or scan the Expo Go QR code. If `.env` changes, stop Expo and restart it with `--clear`.

### What works in Expo Go

Auth, Mailpit OTP, listings, photo picking/upload, chat, checkout, wallet, notifications inbox, reviews, and saved payment methods all work in Expo Go. The phone and computer must be on the same Wi-Fi, and `EXPO_PUBLIC_API_URL` must use the computer's IPv4 address rather than `localhost`.

Remote push notifications do not work in Expo Go on Android with Expo SDK 54. Use the development-build steps below only when you are ready to test remote push.

## 4. First end-to-end test

1. Create an account in the app.
2. Open `http://localhost:8025`, copy the six-digit OTP from the email, and verify it.
3. Create a listing, choose one or more photos, and confirm it appears under **My listings** and on the matching Shop/Services/Rent feed.
4. Log out and create a second account; checkout deliberately prevents buying your own listing.
5. From the second account, open the first user's listing, send a message, and place an order.
6. Open **Orders & bookings** and use **Confirm received** to release escrow.
7. Log back into the seller account and check **Sales** and the wallet activity.
8. Check **Notifications**, then complete the order and leave a review from the buyer account.
9. Open **Payment methods**, add the Paystack MTN test number `0551234987`, and set it as default.

## 5. Optional Paystack test mode

Without a Paystack key, checkout automatically uses Nearbuy's local sandbox ledger. To test Paystack without moving real money:

1. Create a Paystack account and copy your **test secret key**. Never put the secret key in the Expo `.env` file.
2. Set this in `backend/.env`:

```dotenv
PAYSTACK_SECRET_KEY=sk_test_your_key_here
```

3. Rebuild the payment service:

```powershell
Set-Location backend
docker compose up -d --build payment-service api-gateway
```

4. Checkout in the app. Nearbuy opens Paystack's hosted test page and verifies the reference, currency, amount, and final status on the backend. For Ghana Mobile Money testing, Paystack documents `0551234987` on MTN with no PIN or OTP.

For webhook testing, expose an HTTPS staging gateway and configure this Paystack webhook URL:

`https://YOUR_GATEWAY/api/payments/paystack/webhook`

Local checkout still verifies directly after the hosted browser closes, so a public webhook is not required for the first test.

## 6. Optional remote push with an Expo development build

The project already contains `expo-notifications`, `expo-device`, `expo-dev-client`, and an EAS development profile. Under your own Expo account, run:

```powershell
Set-Location nearbuy-mobile
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest init
npx.cmd eas-cli@latest build --profile development --platform android
```

Install the resulting Android development build on the phone. Then start Metro for that build:

```powershell
npx.cmd expo start --dev-client --clear
```

After EAS adds the project ID, the app requests notification permission and registers its Expo push token with the backend. Set `EXPO_PUSH_ENABLED=true` in `backend/.env` and restart `user-service` to let backend notifications also send through Expo. If EAS asks for Android push credentials, follow its FCM V1 credential prompt.

## Useful commands

```powershell
# Backend tests (run in each service, or use the Maven wrappers directly)
backend\user-service\mvnw.cmd test
backend\listing-service\mvnw.cmd test
backend\chat-service\mvnw.cmd test
backend\payment-service\mvnw.cmd test
backend\api-gateway\mvnw.cmd test

# Frontend type check
Set-Location nearbuy-mobile
npx tsc --noEmit

# Stop the backend but keep database data
Set-Location backend
docker compose down

# Stop and erase the local Nearbuy database (destructive)
docker compose down -v
```

## Before production

Without `PAYSTACK_SECRET_KEY`, wallet and external-payment entries remain a sandbox ledger and do not move real money. The new upload volume and Mailpit are development infrastructure. Real deployment still requires:

- a Mobile Money/payment provider and webhook verification;
- a transactional SMS/email provider for OTP delivery;
- S3-compatible object storage for listing photos instead of the local Docker volume;
- production push credentials and delivery receipt handling;
- HTTPS gateway hosting, managed PostgreSQL, rotated secrets, rate limiting, monitoring, and private service networking.

Do not expose ports `8081` through `8084` publicly. Only the gateway should be internet-facing.
