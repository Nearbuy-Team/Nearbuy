# Nearbuy Mobile

Expo/React Native frontend for the Nearbuy marketplace. Backend source lives on the repository's `backend` branch; this `frontend` branch contains only the mobile application.

## Prerequisites

- Node.js 20 or 22 LTS
- Expo Go on a physical phone, or an Android/iOS simulator
- A running Nearbuy API gateway from the `backend` branch

## Install on Windows PowerShell

PowerShell can block the `npm.ps1` and `npx.ps1` wrappers. Use the Windows command wrappers instead:

```powershell
Set-Location nearbuy-mobile
npm.cmd install
npx.cmd expo start --clear
```

Alternatively, enable locally created scripts for your Windows user, reopen PowerShell, and use the shorter commands:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

You do not need to change the machine-wide execution policy.

## Connect to the backend

Create the frontend environment file:

```powershell
Copy-Item nearbuy-mobile\.env.example nearbuy-mobile\.env
```

Set `EXPO_PUBLIC_API_URL` for the device you are using:

| Client | Value |
|---|---|
| Physical phone on the same Wi-Fi | `http://YOUR_COMPUTER_IPV4:8080` |
| Android emulator | `http://10.0.2.2:8080` |
| iOS simulator or web | `http://localhost:8080` |

Use `ipconfig` to find the computer's IPv4 address. A physical phone cannot use `localhost` to reach your computer. Allow Expo/Node and TCP port `8080` through the Windows private-network firewall if prompted.

## Test with Expo Go

Start the backend from a separate backend-branch checkout, then run:

```powershell
Set-Location nearbuy-mobile
npm.cmd install
npx.cmd expo start --clear
```

Scan the QR code with Expo Go. Auth, listings, photos, chat, sandbox checkout, wallet, the notification inbox, payment methods, and reviews work in Expo Go.

The development OTP inbox is provided by the backend at `http://localhost:8025`.

## Remote push development build

Remote Android push notifications require an Expo development build rather than Expo Go:

```powershell
Set-Location nearbuy-mobile
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest init
npx.cmd eas-cli@latest build --profile development --platform android
```

Install that build on the phone, then start Metro with:

```powershell
npx.cmd expo start --dev-client --clear
```

## Checks

```powershell
Set-Location nearbuy-mobile
npx.cmd tsc --noEmit
npx.cmd expo-doctor
```

See [nearbuy-mobile/README.md](nearbuy-mobile/README.md) for the UI specification and screen structure.
