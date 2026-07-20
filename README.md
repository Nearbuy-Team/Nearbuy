# Nearbuy

Nearbuy is a local marketplace for buying goods, hiring services, and renting items. This repository contains the Expo/React Native mobile app and the Spring Boot backend.

## Project structure

| Path | Purpose |
|---|---|
| `nearbuy-mobile/` | Expo/React Native mobile application |
| `backend/api-gateway/` | Public API entry point and JWT validation |
| `backend/user-service/` | Accounts, OTP, profiles, trust scores, and notifications |
| `backend/listing-service/` | Listings, search, and local test image storage |
| `backend/chat-service/` | Buyer and seller messaging |
| `backend/payment-service/` | Orders, Paystack collection/refunds/payouts, protected-payment ledger, payout methods, and reviews |
| `backend/docker-compose.yml` | PostgreSQL, Mailpit, and all backend services |
| `backend/docker-compose.production.yml` | HTTPS production stack for an internet-connected server |

## Prerequisites

- Docker Desktop
- Node.js 20 or 22 LTS
- Expo Go on a physical phone, or an Android/iOS simulator

## Exhibition day: one-command setup

Before leaving home, open Docker Desktop once while internet is available so its engine and the Nearbuy images are ready. At the exhibition:

1. Connect the laptop and iPhone to the same private Wi-Fi or iPhone hotspot. Turn off VPNs and allow **Local Network** access for Expo Go in iPhone Settings.
2. Open Docker Desktop and wait until it says the engine is running.
3. Open PowerShell in this repository and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\START_EXHIBITION.ps1
```

The launcher detects the laptop's current IP address, updates the mobile API URL, starts the local backend/database, resets the safe demo accounts, verifies the user, listing, and payment services, and opens Expo with a fresh QR code. It uses the built-in payment sandbox by default, so the demo does not depend on mobile data or move real money. Keep PowerShell open and keep the laptop awake while demonstrating the app. Scan the QR using the iPhone Camera or Expo Go.

For the protected-payment demo, sign in as `buyer@nearbuy.test`, open any listing, continue to checkout, and pay. This creates a paid order and one protected-payment hold. Then open **Profile → My orders & bookings**: **Confirm received** releases the item amount to the seller, while **Request refund** returns the full payment to the buyer. Use two purchases to show both outcomes, or run the launcher again to reset the demo. The seeded order `NB-92002` is already paid if you want to jump straight to release or refund.

If you have stable internet and specifically want Paystack's test checkout, keep the `sk_test_...` secret in `backend/.env` and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\START_EXHIBITION.ps1 -UsePaystack
```

The exhibition launcher refuses live Paystack keys. Do not use real customer money in a demonstration.

To send registration and password-reset codes to real inboxes, first verify a sender and create an API key in Brevo. Then run this once; the API key prompt is hidden:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\CONFIGURE_BREVO.ps1 -Restart
```

For an installable Android exhibition build, run `BUILD_ANDROID_APK.ps1`. It detects the current laptop LAN address, stores it in the EAS preview environment, and creates an APK. Rebuild if the laptop's LAN address changes. To make the APK work on any internet connection, deploy `render.yaml` and rebuild with `-ApiUrl https://YOUR-API.onrender.com`.

When finished, press `Ctrl+C`, open PowerShell in the repository root, and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\STOP_EXHIBITION.ps1
```

This stops Expo and every Nearbuy container without deleting the PostgreSQL or uploaded-image volumes.

## First-time configuration

Create local environment files. These files are ignored by Git.

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item nearbuy-mobile\.env.example nearbuy-mobile\.env
```

Replace `POSTGRES_PASSWORD` and `JWT_SECRET` in `backend/.env` with local values. Keep `PAYSTACK_SECRET_KEY` empty to use the built-in sandbox payment ledger.

Set `EXPO_PUBLIC_API_URL` in `nearbuy-mobile/.env` for the device being used:

| Client | API URL |
|---|---|
| Physical phone on the same private Wi-Fi | `http://YOUR_COMPUTER_IPV4:8080` |
| Android emulator | `http://10.0.2.2:8080` |
| iOS simulator or web | `http://localhost:8080` |

Use `ipconfig` to find the computer's Wi-Fi IPv4 address. Restart Expo whenever this value changes.

## Start the backend

```powershell
Set-Location backend
docker compose up -d --build
docker compose ps
Set-Location ..
```

The API gateway is available at `http://localhost:8080`. Development OTP emails are visible in Mailpit at `http://localhost:8025`.

## Seed exhibition test data

From the repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File backend\scripts\seed-test-data.ps1 -SkipBuild
```

The command resets only the three `@nearbuy.test` accounts and leaves other local accounts untouched.

| Account | Email | Password |
|---|---|---|
| Buyer | `buyer@nearbuy.test` | `Nearbuy123!` |
| Seller | `seller@nearbuy.test` | `Nearbuy123!` |
| Rental seller | `rentals@nearbuy.test` | `Nearbuy123!` |

Use the buyer account to pay order `NB-92001`, complete `NB-92002`, and review `NB-92003`. Re-run the seed command to restore the starting state.

## Start the mobile app

Open another PowerShell window:

```powershell
Set-Location nearbuy-mobile
npm.cmd install
npx.cmd expo start --lan --go
```

Scan the QR code with the iPhone Camera or Expo Go. The explicit `--go` flag prevents Expo from selecting development-build mode when `expo-dev-client` is installed. If the QR cannot connect, confirm that Expo Go has Local Network permission and reconnect both devices to the same private hotspot; an iPhone does not need manual URL entry when the QR is correct.

## Stop the backend

From `backend/`:

```powershell
docker compose down
```

This preserves PostgreSQL and uploaded-image volumes. Do not add `-v` unless the local database should be deleted.

## Checks

Frontend:

```powershell
Set-Location nearbuy-mobile
npx.cmd tsc --noEmit
npx.cmd expo-doctor
```

Backend:

```powershell
backend\user-service\mvnw.cmd test
backend\listing-service\mvnw.cmd test
backend\chat-service\mvnw.cmd test
backend\payment-service\mvnw.cmd test
backend\api-gateway\mvnw.cmd test
```

Additional service details are available in [backend/HANDOFF.md](backend/HANDOFF.md) and [nearbuy-mobile/README.md](nearbuy-mobile/README.md).

OTP verification and password reset work through email. The local stack captures messages in Mailpit; follow [EMAIL_SETUP.md](EMAIL_SETUP.md) to deliver them to real inboxes through Brevo's HTTPS API.

## Real payments, deployment, APK, and iOS

Use [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for the Render exhibition deployment, complete Paystack test/live checklist, online Docker deployment, Expo Go testing, Android APK/App Bundle builds, iOS ad hoc/TestFlight builds, backups, and live-launch gates.
