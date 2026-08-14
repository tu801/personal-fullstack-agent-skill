# API Design Reference

Read this when designing, reviewing, or versioning APIs (REST, GraphQL,
gRPC, webhooks).

## Protocol selection

| Situation | Choose |
|---|---|
| Public API, broad client compatibility | REST + OpenAPI 3 |
| Frontend-driven, many views over same data (Next.js/Nuxt BFF) | GraphQL or tRPC-style typed REST |
| Service-to-service, low latency, streaming | gRPC |
| Notifying external systems | Webhooks (signed) |

## REST conventions (default)

- Nouns, plural, kebab-case paths: `GET /v1/order-items/{id}`
- Verbs map: POST=create, GET=read, PUT=full replace, PATCH=partial,
  DELETE=remove. Non-CRUD actions: `POST /v1/orders/{id}:cancel`.
- **Pagination is mandatory** on every collection endpoint. Prefer cursor
  (`page_token`/`next_page_token`) over offset — offset breaks under
  concurrent writes and gets slow at depth.
- Filtering: `?filter=` with documented grammar, or explicit query params.
  Never let clients pass raw query fragments.
- Return `201 + Location` on create, `204` on delete, `409` on conflict,
  `422` on semantic validation failure.

## Error model (use everywhere)

```json
{
  "error": {
    "code": "ORDER_ALREADY_CANCELLED",
    "message": "Order ord_123 was cancelled at 2026-08-01T10:00:00Z.",
    "details": [{"field": "order_id", "issue": "invalid_state"}],
    "request_id": "req_abc123"
  }
}
```

Rules: machine-readable `code` (stable, documented enum), human `message`
(safe to show, no internals/stack traces), `request_id` for support
correlation. HTTP status = category; `code` = specific cause.

## Versioning

- URL major version (`/v1/`) for public APIs. Breaking change = new major.
- Breaking: removing/renaming fields, changing types/semantics, tightening
  validation. Non-breaking: adding optional fields, new endpoints, new enum
  values **only if clients are told to tolerate unknown values**.
- Deprecation: `Deprecation` + `Sunset` headers, minimum 6-month window
  for external clients, usage metrics per client before removal.

## Idempotency & concurrency

- All POST endpoints that create resources or move money accept
  `Idempotency-Key`. Store key → response for 24h; replay returns the
  stored response with `Idempotent-Replayed: true`.
- Optimistic concurrency on updates: `ETag` + `If-Match`, return `412` on
  mismatch. In Firestore, use transactions with a `version` field.

## Security requirements per endpoint

For every endpoint, specify in the design table: auth mechanism (Firebase
Auth JWT / IAP / API key / mTLS), authorization rule (who can call, which
resources), rate limit, and input validation schema. An endpoint without
all four specified is not designed yet.

Webhooks out: sign with HMAC-SHA256, include timestamp, document replay
window. Webhooks in: verify signature, enforce timestamp skew < 5 min,
process async (ack fast, work in queue).

## Deliverable format

Produce an endpoint table:

| Method & Path | Purpose | Auth | Request | Response | Errors | Rate limit |
|---|---|---|---|---|---|---|

plus the error-code enum and, for non-trivial APIs, an OpenAPI 3 YAML
skeleton.