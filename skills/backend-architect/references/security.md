# Backend Security Reference

Read this for security reviews, IAM design, secret management, or supply
chain hardening. Apply the relevant sections proactively in every
architecture design — not only when asked about "security".

## Threat-model quick pass (do this first)

For the system in question, answer in one table: asset (what's valuable —
PII, credentials, money, availability) | entry points | who can reach each
entry point | worst realistic outcome | existing control | gap.

## AuthN / AuthZ

- User auth: Firebase Auth / Identity Platform (managed) over hand-rolled.
  Verify ID tokens **server-side on every request**; check `aud`, `iss`,
  expiry; never trust client-asserted roles.
- Service-to-service on Cloud Run: IAM invoker + ID token
  (audience = receiving service URL). Do not use shared static API keys
  between internal services.
- Authorization: centralize in one middleware/layer; deny by default;
  authorize the **resource** (is this user allowed to touch order X), not
  just the endpoint. Missing object-level checks (BOLA/IDOR) is the #1
  real-world API vulnerability.
- Multi-tenant: tenant ID comes from the verified token, never from the
  request body/query. Every DB query is tenant-scoped at the data layer.

## Secrets

- Runtime secrets: Secret Manager, mounted/accessed at runtime with
  per-service SA access to specific secrets (`secretAccessor` on the
  secret, not the project).
- CI/CD: Workload Identity Federation — zero exported SA keys anywhere.
- Repos: Gitleaks in CI (block) + pre-commit hook (fast feedback).
  A leaked secret is rotated immediately, not just deleted from history.
- `.env` files: local dev only, gitignored, with a committed
  `.env.example` containing keys but no values.

## IAM least privilege (GCP)

- One service account per service per environment; no default compute SA
  usage in prod.
- Grant roles on the narrowest resource (secret, bucket, topic), not
  project-wide. `roles/editor`/`owner` on a service SA is always a finding.
- Public Cloud Run (`allUsers` invoker) is acceptable **only** for
  intentionally public endpoints AND the SA behind it must hold minimal
  roles — public entry + broad SA = privilege-escalation path.
- Review cadence: quarterly IAM diff against a Terraform-defined baseline;
  anything not in code is drift to investigate.

## Input handling & OWASP essentials

- Validate at the boundary with schemas (zod/Joi/pydantic); reject, don't
  sanitize-and-continue. Whitelist over blacklist.
- SQL: parameterized queries only. NoSQL: never build Firestore queries
  from unvalidated field names/operators.
- SSRF: any user-supplied URL fetch → allowlist hosts, block metadata IPs
  (169.254.169.254), disable redirects or re-validate after redirect.
- Uploads: validate type by content, generate own filenames, store in GCS
  (never on app filesystem), serve via signed URLs.
- Rate limiting on auth endpoints + expensive endpoints (per-IP and
  per-account). Cloud Armor at the LB for public surfaces.

## Supply chain (npm-heavy stacks)

- Lockfiles committed; CI installs with `npm ci`.
- Dependabot/Renovate on; Trivy scans dependencies + built image in CI.
- Pin GitHub Actions to commit SHAs.
- New-dependency review: check publish recency, maintainer count, install
  scripts (`preinstall`/`postinstall` are the common infostealer vector).
  Consider `--ignore-scripts` in CI where feasible.
- Build provenance: build once, deploy the same immutable image digest
  (not tag) through all environments.

## Security review output format

Report findings as:

| # | Severity | Finding | Location | Impact | Fix | Effort |
|---|---|---|---|---|---|---|

Severity: Critical (exploitable now, high impact) / High / Medium / Low.
Every finding gets a concrete fix (command, code, or Terraform diff), not
"consider improving". Lead with the top 3 in a summary suitable for
non-technical stakeholders.