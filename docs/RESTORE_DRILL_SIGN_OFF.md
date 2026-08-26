# Restore drill sign-off

**Environment:** ______________________  
**Drill date:** ______________________  
**Operator:** ______________________  
**Dump used:** ______________________  
**Target staging host / DB:** ______________________  

## Steps completed

| Step | Pass / Fail | Notes |
|------|-------------|-------|
| Latest `backup:database` artifact located | | |
| Staging DB created / wiped | | |
| MySQL dump imported | | |
| `storage/app` (or S3) restored as needed | | |
| `APP_KEY` matches encryption key from source | | |
| `php artisan config:clear` + `/health/ready` OK | | |
| Login + student list + one library asset verified | | |

## Timing

- Restore start: __________  
- Restore end: __________  
- Measured RTO (minutes): __________  

## Decision

- [ ] **Pass** — restore drill meets agreed RTO  
- [ ] **Fail** — remediation required before production PII  

**Sign-off:** ______________________  **Date:** __________
