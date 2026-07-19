# OTP and password-reset email

Nearbuy sends a six-digit email code for account verification and password reset. Codes are stored only as password hashes, expire after 10 minutes, allow five attempts, and can be resent after 60 seconds.

## Local and exhibition testing

The default Docker setup sends mail to Mailpit, so it works without an external email account or internet connection.

1. Start Nearbuy with `START_EXHIBITION.ps1` or Docker Compose.
2. Register or press **Forgot?** in the mobile app.
3. Open `http://localhost:8025` on the laptop.
4. Open the Nearbuy message and enter its six-digit code in the app.

Mailpit is a local test inbox. It does not deliver messages to Gmail, Outlook, or another real inbox.

## Quick real-inbox testing with Gmail

For a small exhibition test, a Gmail account can send the messages without buying a domain. Turn on 2-Step Verification for that Google account, create a 16-character App Password, and use the App Password rather than the normal account password:

```dotenv
OTP_DELIVERY=email
OTP_FROM=youraccount@gmail.com
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=youraccount@gmail.com
MAIL_PASSWORD=your_16_character_app_password
MAIL_SMTP_AUTH=true
MAIL_STARTTLS=true
MAIL_STARTTLS_REQUIRED=true
```

Use a dedicated project Gmail account rather than a personal account. This option is suitable for a small demonstration, not public production or bulk mail. Google documents App Password requirements in [Sign in with app passwords](https://support.google.com/accounts/answer/185833).

## Real inbox delivery with Resend

Resend provides SMTP delivery and a free transactional-email tier. Verify a domain in Resend and create an API key, then change these values in the ignored `backend/.env` file:

```dotenv
OTP_DELIVERY=email
OTP_FROM=no-reply@your-verified-domain.com
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=re_your_private_api_key
MAIL_SMTP_AUTH=true
MAIL_STARTTLS=true
MAIL_STARTTLS_REQUIRED=true
```

Never put the API key in the mobile `.env`, source code, screenshots, or Git. Recreate the user service after changing SMTP settings:

```powershell
Set-Location backend
docker compose --env-file .env up -d --force-recreate user-service
docker compose --env-file .env restart api-gateway
Set-Location ..
```

Create a new account using an email address you can access. The verification message should arrive in that inbox. Test **Forgot?** as well before relying on it publicly.

Official references: [Resend SMTP settings](https://resend.com/docs/send-with-smtp) and [Resend pricing](https://resend.com/docs/knowledge-base/what-is-resend-pricing).
