# GCP Infrastructure & CI/CD Reference

Read this for Cloud Run, Firebase Hosting, Terraform, GitHub Actions,
cost optimization, or deployment architecture.

## Cloud Run configuration checklist

- **Concurrency**: default 80; lower (10–20) for CPU-heavy or memory-heavy
  requests; 1 only for non-thread-safe workloads.
- **min-instances**: ≥1 for latency-sensitive prod services (kills cold
  starts, costs ~always-on instance); 0 for dev/staging.
- **CPU allocation**: "CPU only during request" (default, cheaper) unless
  doing background work after response → "CPU always allocated".
- **Timeouts**: request timeout ≤ 60s for user-facing; long work goes to
  Cloud Run Jobs or Cloud Tasks.
- **Health**: startup probe for slow-boot apps; handle SIGTERM — stop
  accepting work, finish in-flight, exit within 10s.
- **Ingress**: `internal-and-cloud-load-balancing` for services behind LB
  or Firebase Hosting; never leave internal services on `all`.
- **Invoker IAM**: specific service accounts, not `allUsers`, unless the
  endpoint is genuinely public. Public + broad SA permissions = the classic
  Wiz High finding.
- **Egress**: static IP needs Serverless VPC connector + Cloud NAT.

## Firebase Hosting → Cloud Run pattern

- Hosting rewrites (`"rewrites": [{"source": "**", "run": {...}}]`) proxy
  through Fastly edge. Remember: edge can serve/serve-fail independently of
  origin — always test with `curl` direct-to-origin AND through the edge,
  and compare with Googlebot UA when SEO matters.
- `robots.txt`, `sitemap.xml`: serve as static Hosting files, not through
  the Cloud Run rewrite, so an origin outage can't break crawl eligibility
  (a 5xx robots.txt can suspend crawling for extended periods).
- Cache: set `Cache-Control` explicitly per route; edge caches
  `public, max-age` aggressively. For SSR pages use
  `s-maxage` + `stale-while-revalidate`.
- Deploys are atomic per release; keep previous releases for instant
  rollback (`firebase hosting:rollback` / console).

## Terraform discipline

- State in GCS backend with versioning + state locking; one state per
  environment; never share state across prod/non-prod.
- Structure: `modules/` (reusable) + `environments/{dev,stg,prod}` (thin
  composition + tfvars). No copy-pasted resources between envs.
- `terraform plan` in CI on every PR, posted as PR comment; apply only
  from CI on main, never from laptops.
- Static analysis in the pipeline: Checkov or Trivy (config scanning) as a
  required check; treat new High findings as merge blockers.
- Import existing click-ops resources rather than living hybrid; drift
  detection via scheduled `plan`.

## GitHub Actions CI/CD (EMU-compatible)

- **Auth to GCP: Workload Identity Federation only.** No exported SA keys.
  Pattern: `google-github-actions/auth@v2` with
  `workload_identity_provider` + `service_account`. Scope the WIF pool
  attribute condition to the exact org/repo
  (`assertion.repository == 'org/repo'`) — do not trust the whole GitHub
  OIDC issuer.
- Per-environment service accounts with least privilege: deploy SA can
  deploy, not admin the project.
- Pipeline security layers (run all four): Gitleaks (secrets), Trivy
  (dependencies + container image), Semgrep (SAST), Checkov (IaC).
  Fail the build on new Critical/High.
- Pin third-party actions to full commit SHA, not tags (supply-chain
  protection). Enable Dependabot for actions + npm.
- Deployment order: build → scan → deploy to staging → smoke tests →
  manual approval gate (environment protection rules) → prod →
  post-deploy verification. Keep a documented rollback command per service.

## Cost optimization method

1. Enable billing export to BigQuery; label every resource with
   `service`, `env`, `team` — labels are the unit of cost attribution.
2. Per-service isolation queries: group billing export by labels +
   `service.description`; cross-check with Monitoring metrics (e.g.,
   Cloud Run billable instance time) when labels are missing.
3. Biggest usual wins: Cloud Run min-instances audit, Cloud Logging
   exclusion filters + retention (logging is a silent budget eater),
   Firestore read amplification (unpaginated lists), idle Cloud SQL
   instances in non-prod (schedule stop/start), egress via CDN caching.
4. Present estimates as a table: service | assumption | monthly at
   expected load | monthly at 10x.

## Observability baseline

- Structured JSON logs with `severity`, `trace`, request ID; correlate
  logs↔traces via `logging.googleapis.com/trace` field.
- Golden signals per service: latency (p50/p95/p99), traffic, error rate,
  saturation (instance count vs max, CPU/mem).
- Alert on symptoms users feel (error rate, p99), not causes (CPU) —
  causes go on dashboards.
- Uptime checks from outside GCP against the public edge (catches
  edge-vs-origin discrepancies that internal checks miss).
- PII in logs: define fields never to log, enforce with a logging wrapper,
  set retention per bucket, and have a deletion procedure (logs are
  immutable — plan buckets so deletion by time/scope is possible).