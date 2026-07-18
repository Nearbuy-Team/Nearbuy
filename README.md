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
| `backend/payment-service/` | Orders, sandbox payments, escrow, wallet, payment methods, and reviews |
| `backend/docker-compose.yml` | PostgreSQL, Mailpit, and all backend services |

## Prerequisites

- Docker Desktop
- Node.js 20 or 22 LTS
- Expo Go on a physical phone, or an Android/iOS simulator

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
npx.cmd expo start --lan
```

Scan the QR code with Expo Go. If the QR cannot connect, use a private hotspot and enter `exp://YOUR_COMPUTER_IPV4:8081` manually in Expo Go.

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
