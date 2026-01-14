# Security Hardening and Secret Rotation

## Why
`.env.local` was committed previously, so any secrets stored there must be treated as compromised. Rotate them immediately and prevent future exposure.

## Secrets to Rotate
- Database credentials (`DATABASE_URL`, `SQLITE_FILE` if copied to prod)
- Session secrets / tokens used for auth
- Third-party API keys (e.g., `STORMGLASS_API_KEY`, `RESEND_API_KEY`, email/SMS providers)
- OAuth/OpenID client secrets
- Object storage credentials or signed URL keys

## Rotation Checklist
1) **Identify** every secret present in `.env.local` and any copies in CI or deployment environments.  
2) **Generate new values** in each provider dashboard (DB, email, APIs, OAuth).  
3) **Update configs**:
   - Local: write new values to `.env.local` (never commit).
   - Server/CI: update secret manager or env vars.  
4) **Deploy/restart services** to pick up new secrets.  
5) **Invalidate old secrets** (revoke old tokens/keys, rotate DB passwords, delete old OAuth credentials).  
6) **Verify**:
   - Login/session flows succeed with new secrets.
   - Third-party API calls succeed (weather/tides/email/etc.).
   - Database connectivity is stable.  
7) **Audit**: ensure `.env.local` is ignored (`.gitignore`) and no secrets are left in git history or logs.

## Ongoing Practices
- Never trust user-supplied identifiers for auth; use session-derived user context.
- Keep secrets only in environment variables or a secret manager.
- Review logs for failed auth attempts after rotation.
- Enable MFA and least-privilege access on provider accounts.
