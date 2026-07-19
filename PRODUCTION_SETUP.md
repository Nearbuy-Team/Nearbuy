# Nearbuy production setup

This guide covers the real Paystack test/live flow, an online Docker deployment, and installable Expo builds.

## What is implemented

- Buyer checkout is initialized only by the backend. The Paystack secret key never enters the mobile app.
- Payments are accepted only after Paystack verification of the reference, GHS amount, and success status.
- Signed `charge.success` webhooks provide a second confirmation path.
- A seller's Ghana Mobile Money account is registered as a Paystack transfer recipient. Only its provider, last four digits, and Paystack recipient code are stored; the full number is not stored by Nearbuy.
- Buyer confirmation starts an asynchronous Paystack transfer for the listing price. The service fee stays with the platform.
- Signed transfer webhooks mark payouts as successful, failed, or reversed without duplicating ledger entries.
- Before seller payout, a buyer can request a full Paystack refund. Refund webhooks track pending, processing, needs-attention, processed, and failed states.
- Demo top-up and withdrawal endpoints are disabled when `PAYMENTS_SANDBOX_ENABLED=false`.

Nearbuy currently implements a protected-payment and delayed-payout workflow. Do not market it as legally regulated "escrow" until a Ghanaian lawyer and Paystack have approved that wording and operating model.

## Understand Docker

Docker is not an online backend. Docker packages PostgreSQL and the five backend services into containers. They become online only when the production Compose stack runs on an internet-connected server with a domain pointing to it. Caddy is included to obtain and renew HTTPS certificates automatically.

## Accounts and infrastructure you must obtain

1. A Ghana Paystack business account. Complete business activation before using live keys.
2. A Linux VPS or cloud VM with a public IPv4 address. Use at least 2 vCPU, 4 GB RAM, and 30 GB storage if the server will build all Java images itself.
3. A domain or subdomain such as `api.example.com`.
4. An SMTP account for real OTP email delivery.
5. An Expo account for EAS cloud builds.
6. Apple Developer membership for physical-device iOS distribution or TestFlight.
7. Google Play Console registration only when publishing the Android App Bundle to Google Play; it is not needed for a shareable preview APK.

## 1. Configure Paystack test mode

In Paystack Dashboard, open **Settings > API Keys & Webhooks**.

1. Copy the `sk_test_...` secret key. Keep it only in the backend `.env.production` file.
2. Set the webhook URL to:

   ```text
   https://api.example.com/api/payments/paystack/webhook
   ```

3. Ensure Transfers is available for the Ghana business. For automated payouts, complete Paystack's process for disabling transfer OTP; otherwise a transfer can remain in the OTP state.
4. Keep the account in test mode until collection, refund, and payout webhooks all pass.

The backend accepts Ghana Mobile Money and cards through Paystack Checkout. It uses `MTN`, `ATL`, and `VOD` recipient codes for MTN, AT, and Telecel payouts.

## 2. Put the backend on a server

First point the DNS `A` record for `api.example.com` to the VPS public IPv4 address. Open inbound TCP ports 22, 80, and 443, plus UDP 443 for HTTP/3. Do not expose PostgreSQL port 5432.

Install Git and Docker Engine using the official instructions for the server's Linux distribution. Then clone this repository and configure it:

```bash
git clone YOUR_REPOSITORY_URL nearbuy
cd nearbuy/backend
cp .env.production.example .env.production
nano .env.production
```

Set every placeholder in `.env.production`. Important values are:

```dotenv
API_DOMAIN=api.example.com
POSTGRES_PASSWORD=a-long-random-password
JWT_SECRET=at-least-64-random-characters
PAYSTACK_SECRET_KEY=sk_test_your_real_test_key
PAYSTACK_CALLBACK_URL=https://api.example.com/api/payments/paystack/callback
OTP_FROM=no-reply@example.com
MAIL_HOST=smtp.example.com
MAIL_USERNAME=your-smtp-user
MAIL_PASSWORD=your-smtp-password
```

Generate a JWT secret locally in PowerShell if needed:

```powershell
$bytes = New-Object byte[] 64
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Start production:

```bash
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build
docker compose -f docker-compose.production.yml --env-file .env.production ps
docker compose -f docker-compose.production.yml --env-file .env.production logs --tail=100
```

Expected result: PostgreSQL is healthy, the five application services are healthy, and Caddy is running on ports 80/443. A request without a token should be rejected:

```bash
curl -i https://api.example.com/api/listings
```

Expected HTTP status: `401 Unauthorized`.

The production Compose file deliberately:

- exposes only Caddy;
- keeps PostgreSQL and services on an internal network;
- runs Java containers as the `nearbuy` non-root user;
- makes container root filesystems read-only;
- disables sandbox money endpoints;
- enables Paystack transfers;
- persists PostgreSQL, listing photos, and Caddy certificates in named volumes.

## 3. Test the complete Paystack flow

Use two separate Nearbuy accounts.

1. Sign in as the seller.
2. Open **Payouts > Manage payout method** and add a Ghana Mobile Money number. In Paystack test mode, `0551234987` with MTN is an official test number.
3. Confirm the app says the payout account is verified. Methods saved before Paystack transfers were enabled must be removed and re-added.
4. Create an active listing as the seller.
5. Sign in as the buyer and buy that listing.
6. In Paystack Checkout, use test Mobile Money number `0551234987` on MTN, or an official Paystack test card.
7. Return to Nearbuy. The order must show **Payment secured** only after verification/webhook confirmation.
8. Test the refund path once: choose **Request refund** before confirming receipt and watch it move through the Paystack refund state.
9. On a fresh paid order, choose **Confirm received**. The seller should see payout `pending`, then `success` after Paystack's transfer webhook.
10. In Paystack Dashboard, confirm the matching transaction, refund/transfer, amount, currency, and webhook delivery.

Useful server checks:

```bash
docker compose -f docker-compose.production.yml --env-file .env.production logs -f payment-service
docker compose -f docker-compose.production.yml --env-file .env.production logs -f caddy api-gateway
```

Never test a `sk_live_` key with money you cannot afford to move. Test transfers and live transfers behave differently: live transfers are asynchronous and require available Paystack balance.

## 4. Switch Paystack live only after test sign-off

1. Complete Paystack business activation and confirm Mobile Money collections and Transfers are enabled.
2. Put the `sk_live_...` key in the server's `.env.production`.
3. Configure the live webhook URL in Paystack Dashboard.
4. Ensure the Paystack balance can cover seller payouts and refunds.
5. Restart only the affected services:

   ```bash
   docker compose -f docker-compose.production.yml --env-file .env.production up -d payment-service api-gateway caddy
   ```

6. Run one small real purchase, one refund, and one seller payout with consenting accounts. Reconcile all three against Paystack Dashboard before accepting public users.

## 5. Run locally with Expo Go

Use Node.js 20 or 22 LTS. Node 26 is not the supported runtime for this Expo SDK and caused package installation to stall on the current machine.

```powershell
Set-Location nearbuy-mobile
node --version
npm.cmd ci
```

For a physical phone on the same private Wi-Fi, set `nearbuy-mobile/.env` to the computer's LAN address:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.20:8080
```

Start the local backend and Expo:

```powershell
Set-Location backend
docker compose up -d --build
Set-Location ..\nearbuy-mobile
npx.cmd expo start --lan --clear
```

Scan with Expo Go. The phone and computer must be on the same network, Windows Firewall must allow Node/Expo and port 8080, and the API URL must use the computer's current IPv4 address—not `localhost`.

For a production-like Expo test, set `EXPO_PUBLIC_API_URL=https://api.example.com` and restart Expo.

## 6. Build a downloadable Android APK

From `nearbuy-mobile` with Node 20/22:

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest init
npx.cmd eas-cli@latest env:create --name EXPO_PUBLIC_API_URL --value https://api.example.com --environment preview --visibility plaintext
npx.cmd eas-cli@latest build --platform android --profile preview
```

The `preview` profile builds an installable APK and EAS returns a shareable installation page. The recipient may need to allow installation from the browser used to open that page.

For Google Play, build an App Bundle instead:

```powershell
npx.cmd eas-cli@latest env:create --name EXPO_PUBLIC_API_URL --value https://api.example.com --environment production --visibility plaintext
npx.cmd eas-cli@latest build --platform android --profile production
```

The production profile creates an `.aab`, which is uploaded to Google Play and is not directly installed like an APK.

## 7. Build for iPhone/iPad

iOS does not use APK files and does not allow a universal direct-download build.

For a physical-device preview, Apple requires paid Developer membership and registered device IDs:

```powershell
npx.cmd eas-cli@latest device:create
npx.cmd eas-cli@latest build --platform ios --profile preview
```

Only registered devices can install that ad hoc build. For public testing, use TestFlight:

```powershell
npx.cmd eas-cli@latest build --platform ios --profile production
npx.cmd eas-cli@latest submit --platform ios
```

For an iOS Simulator build on a Mac, use the `ios-simulator` profile. Simulator builds do not install on physical iPhones.

## 8. Backups and operations

Create automatic off-server PostgreSQL backups before live use. A manual database dump is:

```bash
docker compose -f docker-compose.production.yml --env-file .env.production exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > nearbuy-$(date +%F-%H%M).sql
```

Also back up the `nearbuy_uploads` volume, monitor free disk space, review Paystack webhook failures daily, and test restoration. Keep at least one backup outside the VPS.

## Live-launch gates that code alone cannot complete

- Ghanaian legal review for marketplace terms, privacy, refunds, disputes, data retention, and the use of "escrow" language.
- Paystack approval/activation and confirmation that the business model is permitted.
- A support process for `refund.needs-attention`, failed/reversed payouts, disputes, chargebacks, account takeovers, and lost devices.
- Automated uptime/error monitoring and alerts.
- Scheduled database/photo backups with a tested restore.
- Independent penetration testing and remediation.
- Apple/Google privacy declarations, screenshots, store review, and release approval.

No application can honestly be guaranteed bug-free or unexploitable. Do not accept public live money until these gates and the small-value live reconciliation test are complete.
