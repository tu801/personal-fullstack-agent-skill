# System Design Reference

Read this when designing a new system, reviewing an architecture, or
decomposing a monolith.

## Design sequence

1. **Clarify load profile.** Estimate: DAU → requests/day → average RPS →
   peak RPS (usually 3–10x average). Read:write ratio. Payload sizes.
   Data growth per month.
2. **Choose the consistency model per data type.** Strong consistency only
   where money, inventory, or auth is involved. Everything else is a
   candidate for eventual consistency (cheaper, faster, more available).
3. **Sketch the synchronous path first** (user-facing request → response),
   then move everything that doesn't need to block the user onto async
   paths (Pub/Sub, Cloud Tasks).
4. **Define the unit of deployment.** Default: one Cloud Run service per
   bounded context. Split only when teams, scaling profiles, or release
   cadences genuinely diverge.
5. **Design the failure story per dependency**: timeout value, retry policy
   (max attempts, backoff, jitter), fallback behavior, circuit-breaking
   threshold, and what the user sees when it's down.

## Monolith vs microservices decision

Choose **modular monolith** when: team < ~8 engineers, domain boundaries
still shifting, latency budget is tight (in-process calls are free), or
operational maturity (tracing, on-call, CI/CD per service) is not yet in
place.

Choose **microservices** when: independent scaling is measurably needed
(one component needs 50 instances, another needs 2), teams need independent
release cadence, or a component has a distinct security/compliance boundary
(e.g., PII processing isolated for audit).

Migration path: modular monolith with enforced module boundaries → extract
the highest-churn or highest-scale module first → strangler-fig the rest.

## Async patterns (GCP)

| Need | Use | Notes |
|---|---|---|
| Fan-out events, decoupling | Pub/Sub | At-least-once → consumers MUST be idempotent |
| Scheduled/delayed single task | Cloud Tasks | Per-task dedup key, rate limiting built in |
| Cron | Cloud Scheduler → Pub/Sub or HTTP | |
| Long-running jobs | Cloud Run Jobs | Not request-scoped; no 60-min limit issues |
| Ordered event log / replay | Pub/Sub with ordering keys, or BigQuery sink | Ordering keys limit throughput per key |

Idempotency recipe: client generates `Idempotency-Key` (UUID) → server
stores key + result in Firestore/Redis with TTL → duplicate request returns
stored result. For Pub/Sub consumers, use `messageId` or a business key.

## Capacity planning quick math

- Cloud Run: concurrency (default 80) × instances = simultaneous requests.
  RPS ≈ concurrency × instances / avg_latency_seconds.
- Firestore: 1 write/sec sustained per document; 10K writes/sec per
  database (soft). Hot document = redesign (sharded counters).
- Pub/Sub: effectively unlimited throughput; watch subscriber ack deadline
  vs processing time.
- Always answer: "what is the first bottleneck at 10x current load?"

## Review checklist for existing architectures

- Trace one write and one read end-to-end; count network hops.
- Find the largest blast radius: which single failure takes down the most?
- Check every queue for: dead-letter config, max delivery attempts,
  poison-message handling.
- Check every cache for: invalidation trigger, stampede protection
  (locking or early refresh), and behavior on cold start.
- Verify graceful shutdown (SIGTERM handling) on Cloud Run — in-flight
  requests and message acks during deploys.