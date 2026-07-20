# OTP and password-reset email

Nearbuy sends a six-digit code for account verification and password reset. Codes are stored only as password hashes, expire after 10 minutes, allow five attempts, and can be resent after 60 seconds.

## Local testing with Mailpit

The default Docker setup captures messages in Mailpit, so local testing works without an email account or internet connection.

1. Start Nearbuy with `START_EXHIBITION.ps1` or Docker Compose.
2. Register or press **Forgot?** in the app.
3. Open `http://localhost:8025` on the laptop.
4. Open the Nearbuy message and enter its six-digit code.

Mailpit does not deliver to a real inbox.

## Real delivery with Mailjet

Mailjet's HTTPS transactional-email API is the configured hosted option. This is important on Render because Render's free web services block outbound SMTP ports. Mailjet's Free plan currently includes 6,000 sends per month with a limit of 200 per day, which is enough for exhibition OTP tests.

1. Create a free Mailjet account at [mailjet.com](https://www.mailjet.com/).
2. In Mailjet, open **Account Settings > Add a Sender Domain or Address**, add the address shown in `OTP_FROM`, and click the verification link Mailjet sends to it.
3. Open **Account Settings > API Key Management** and copy both the API key and secret key.
4. For local Docker testing, run:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\CONFIGURE_MAILJET.ps1 -Restart
   ```

   Enter the exact verified sender and paste the two hidden Mailjet keys when prompted.

5. Register with a new address you can access, then test **Forgot password** with that address.

For Render, enter the same values in the Blueprint prompts:

```text
OTP_FROM = the exact verified sender address
MAILJET_API_KEY = the Mailjet API key
MAILJET_SECRET_KEY = the Mailjet secret key
```

Do not put either key in `nearbuy-mobile/.env`, `render.yaml`, source code, screenshots, or Git. If delivery fails, inspect Mailjet's transactional message statistics and the user-service logs in Render. Check spam during the first tests; a properly authenticated custom domain improves deliverability.

Official references: [Mailjet Send API v3.1](https://dev.mailjet.com/email/guides/send-api-v31/), [Mailjet Free plan](https://documentation.mailjet.com/hc/en-us/articles/360043048393-What-is-this-200-emails-per-day-limit-on-free-accounts), and [sender verification](https://documentation.mailjet.com/hc/en-us/articles/360042759253-How-to-add-a-sender-address).

## SMTP remains available off Render

`OTP_DELIVERY=email` or `OTP_DELIVERY=smtp` still uses the `MAIL_*` variables for Mailpit, Gmail App Passwords, or another SMTP provider. Do not select SMTP for a free Render service because ports 25, 465, and 587 are blocked there.
