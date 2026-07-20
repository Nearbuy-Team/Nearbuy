# OTP and password-reset email

Nearbuy sends a six-digit code for account verification and password reset. Codes are stored only as password hashes, expire after 10 minutes, allow five attempts, and can be resent after 60 seconds.

## Local testing with Mailpit

The default Docker setup captures messages in Mailpit, so local testing works without an email account or internet connection.

1. Start Nearbuy with `START_EXHIBITION.ps1` or Docker Compose.
2. Register or press **Forgot?** in the app.
3. Open `http://localhost:8025` on the laptop.
4. Open the Nearbuy message and enter its six-digit code.

Mailpit does not deliver to a real inbox.

## Real delivery with Brevo

Brevo's HTTPS transactional-email API is the configured hosted option. This is important on Render because Render's free web services block outbound SMTP ports. Brevo's Free plan currently includes 300 email sends per day, which is enough for exhibition OTP tests.

1. Create a free Brevo account at [brevo.com](https://www.brevo.com/).
2. In Brevo, open **Settings > Senders, Domains & Dedicated IPs > Senders** and add a sender address. Complete the verification email.
3. Open **Settings > SMTP & API > API Keys**, create an API key, and copy it once.
4. For local Docker testing, run:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\CONFIGURE_BREVO.ps1 -Restart
   ```

   Enter the exact verified sender and paste the hidden `xkeysib-...` API key when prompted.

5. Register with a new address you can access, then test **Forgot password** with that address.

For Render, enter the same values in the Blueprint prompts:

```text
OTP_FROM = the exact verified sender address
BREVO_API_KEY = the private xkeysib-... API key
```

Do not put the API key in `nearbuy-mobile/.env`, `render.yaml`, source code, screenshots, or Git. If delivery fails, inspect **Transactional > Logs** in Brevo and the user-service logs in Render. Check spam during the first tests; a properly authenticated custom domain improves deliverability but is not required for a short exhibition test.

Official references: [Brevo transactional email API](https://developers.brevo.com/docs/send-a-transactional-email), [Brevo Free plan](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan), and [sender/domain authentication](https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders).

## SMTP remains available off Render

`OTP_DELIVERY=email` or `OTP_DELIVERY=smtp` still uses the `MAIL_*` variables for Mailpit, Gmail App Passwords, or another SMTP provider. Do not select SMTP for a free Render service because ports 25, 465, and 587 are blocked there.
