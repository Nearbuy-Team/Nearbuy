# Nearbuy Backend — Handoff Notes

**Status:** All 5 services are feature-complete and tested locally. Nothing further needed from the backend side except deployment/integration.

**Branch:** `backend` on `https://github.com/Nearbuy-Team/Nearbuy.git`

---

## The 5 services

| Service | Local Port | Purpose |
|---|---|---|
| `api-gateway` | 8080 | Single entry point. Routes requests to the right service and validates JWTs centrally. **Point the frontend at this, not the individual services.** |
| `user-service` | 8081 | Auth (register, login, OTP, password reset), user profiles, TrustScore |
| `listing-service` | 8082 | Listings CRUD, search, view/chat count tracking |
| `chat-service` | 8083 | Messaging between buyers and sellers |
| `payment-service` | 8084 | Orders, escrow (hold/release), wallet balance and transaction history |

**Important:** in production, the frontend should only ever call the gateway's URL (whatever `api-gateway` gets deployed to). The gateway forwards requests to the other 4 services internally.

---

## How auth works (so routing/proxying makes sense)

1. Client calls `POST /api/auth/register` or `/api/auth/login` through the gateway — these two routes are public, no token needed
2. Login returns a JWT
3. Every other request must include `Authorization: Bearer <token>`
4. The gateway validates the JWT itself, extracts the user's ID from it, and forwards the request to the correct backend service with an `X-User-Id` header
5. The individual services (`listing-service`, `chat-service`, `payment-service`) trust that `X-User-Id` header completely — they assume only the gateway can set it

**This means:** in production, the individual services (8081–8084) should **not** be publicly reachable — only the gateway (8080) should be exposed to the internet. If `listing-service` etc. are made public directly, someone could fake the `X-User-Id` header and impersonate any user. This wasn't hardened further since it wasn't needed for local testing, but it matters for a real deployment.

---

## Environment variables each service needs

Every service currently uses **hardcoded local values** in `src/main/resources/application.properties` (and `application.yml` for the gateway). These need to become environment variables pointing at real infrastructure:

### All 4 data services (user, listing, chat, payment)
```properties
spring.datasource.url=jdbc:postgresql://<REAL_DB_HOST>:<PORT>/<DB_NAME>
spring.datasource.username=<REAL_DB_USER>
spring.datasource.password=<REAL_DB_PASSWORD>
```

### user-service and api-gateway specifically
```properties
jwt.secret=<SAME_SECRET_IN_BOTH_SERVICES>
```
**This must be the identical string in both services** — the gateway validates tokens signed by user-service, so if the secrets don't match, every authenticated request will fail with 401. (This tripped us up once during testing — worth double-checking first if auth mysteriously fails after deployment.)

### payment-service and chat-service
These make direct HTTP calls to `user-service` and `listing-service` respectively (for TrustScore updates and chat-count tracking):
```properties
# Currently hardcoded as:
http://localhost:8081/api/users/{id}/trust-score      (in payment-service)
http://localhost:8082/api/listings/{id}/chat-count    (in chat-service)
```
**These need to be updated to whatever internal URLs the deployed services get** — likely via an environment variable rather than hardcoded, since the actual hostnames will depend on the hosting platform.

### api-gateway routing
`application.yml` currently routes to `http://localhost:808x` for each service — these four URLs need to become the deployed URLs of each service once they're hosted.

---

## Known quirk from local development

Postgres was run locally in Docker for testing, but had to be moved from the default port **5432** to **5433**, because a separate native Postgres installation was already occupying 5432 on the dev machine. This is purely a local dev environment issue — **not relevant to the real deployed database**, but flagging it in case anyone sees `5433` in old config and wonders why.

---

## Testing the deployed backend once it's live

Quick smoke test sequence, in order:
1. `POST {gateway_url}/api/auth/register` — create a user
2. `POST {gateway_url}/api/auth/login` — get a JWT
3. `GET {gateway_url}/api/users/me` with `Authorization: Bearer <token>` — confirms JWT validation works end-to-end through the gateway
4. `POST {gateway_url}/api/listings` with the same token — confirms routing + auth forwarding works for a second service

If step 3 fails with 401 but login (step 2) succeeded, it's almost always the JWT secret mismatch described above.

---

## What's NOT done (intentionally out of scope for backend)

- Deployment itself (this doc)
- Real database provisioning (already handled separately)
- Frontend integration
- Hardening the internal `X-User-Id` trust between services (noted above — fine for now, worth revisiting if this goes to real production)
- Not every controller uses the global exception handler yet — only `user-service`'s register endpoint demonstrates the pattern; the rest use per-endpoint try/catch, which works correctly but isn't as consistent in response shape
