# Schema And Migrations

## Contents

- Data modeling
- Migration sequencing
- Index review
- Naming rules

## Data modeling

- Start from access patterns, then map entities and relationships.
- Prefer explicit foreign keys, ownership columns, and status enums over ambiguous free-form fields.
- Separate immutable event history from mutable current-state tables when audits matter.
- Decide soft-delete versus hard-delete based on compliance, analytics, and restore needs.

## Migration sequencing

Use safe rollout order:

1. Add new structures in a backward-compatible way.
2. Deploy application code that can read and write both paths when necessary.
3. Backfill historical data with checkpoints and observability.
4. Switch reads or writes to the new path.
5. Remove legacy columns or tables only after stability is confirmed.

Avoid schema and app changes that force a single irreversible deployment window.

## Index review

- Index by real filters, joins, and sort orders, not by every column.
- Revisit unique constraints during imports, upserts, and tenant partitioning.
- Consider composite index order carefully; the left-most columns must match the hottest access path.
- Review write amplification before adding many overlapping indexes.

## Naming rules

- Use singular or plural table naming consistently across the estate.
- Name foreign keys and indexes predictably so generated migrations stay readable.
- Keep timestamps explicit: `created_at`, `updated_at`, `deleted_at`, or domain-specific event times.
