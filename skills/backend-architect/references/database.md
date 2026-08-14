# Database Architecture Reference

Read this for schema design, storage selection, query optimization, or
migrations.

## Storage selection (GCP-first)

| Data characteristics | Choose | Why |
|---|---|---|
| Relational, transactions, complex queries | Cloud SQL (Postgres) | Joins, constraints, mature tooling |
| Document, known access patterns, realtime sync to web/mobile | Firestore | Serverless, realtime listeners, Firebase integration |
| Global relational scale (>10K writes/s, multi-region strong consistency) | Spanner | Only at genuine scale — expensive |
| Analytics, event history, billing exports | BigQuery | Columnar, cheap storage, SQL |
| Cache, sessions, rate-limit counters, locks | Memorystore (Redis) | Sub-ms, TTL, atomic ops |
| Files, images, backups | Cloud Storage | Signed URLs for direct client upload/download |

Rule: pick per data type, not one store for everything — but don't exceed
2–3 stores in a system without strong justification.

## Firestore design rules (critical — most common mistakes)

- **Design from queries backward.** List every screen/API and its query
  first; the document model is whatever serves those queries without joins.
- No joins, no aggregation queries (except count/sum/avg aggregations).
  Denormalize: duplicate the fields you need to display; update via
  transaction or Pub/Sub-driven sync. Document the ownership: which write
  is the source of truth.
- Hot-document limit: ~1 sustained write/sec/doc. Counters → sharded
  counters or Redis. Feeds → fan-out on write.
- Collection-group queries need explicit indexes; every composite query
  needs a composite index — commit `firestore.indexes.json` to the repo.
- **Tenant isolation:** never trust client-side filtering. Security Rules
  must enforce `request.auth.uid`/tenant claims on every path, and
  server-side code must scope every query by tenant ID. (Pattern behind
  real incidents: shared collection + missing per-tenant rule.)
- Costs are per-operation: a query returning 500 docs = 500 reads. Paginate
  and cache list views.

## Postgres design rules

- Every table: `id` (UUIDv7 or bigint identity), `created_at`,
  `updated_at`. Soft-delete only with a partial index excluding deleted.
- Index for the query, not the column: composite indexes match left-to-
  right; put equality columns before range columns.
- Diagnose with `EXPLAIN (ANALYZE, BUFFERS)`; look for Seq Scan on large
  tables, mis-estimated rows, nested-loop blowups.
- N+1: detect via query logs (same query, different param, ×N). Fix with
  joins, `IN` batching, or a dataloader layer.
- Connection pooling is mandatory with Cloud Run (each instance opens its
  own pool): use PgBouncer / Cloud SQL connectors, keep per-instance pool
  small (2–5), total = pool × max instances < DB max_connections.
- Locking: keep transactions short; never hold a transaction across an
  external API call; use `SELECT ... FOR UPDATE SKIP LOCKED` for job
  queues.

## Migration discipline

1. Migrations are code-reviewed, versioned files (e.g., `migrations/0042_add_status.sql`).
2. **Expand → migrate → contract**: add nullable column → backfill in
   batches (throttled) → dual-write period → switch reads → drop old.
   Never a breaking change in one deploy.
3. Every migration has a tested rollback, or is explicitly marked
   irreversible with a mitigation plan.
4. Backfills: batch (1–10K rows), sleep between batches, resumable via
   checkpoint, monitored for replication lag.

## Caching strategy

- Default: cache-aside with TTL. Write path invalidates (delete, don't
  update) the key.
- Prevent stampede: per-key lock (`SET key NX PX`) or probabilistic early
  expiration.
- Key naming: `{service}:{entity}:{id}:v{schema_version}` — version bump =
  instant global invalidation.
- Never cache without answering: "what is the maximum acceptable staleness
  for this data?" If the answer is zero, don't cache; fix the query.