---
name: database-delivery
description: Plan and execute relational or document-database changes including schema design, migrations, indexes, backfills, seeds, and rollback plans. Use when Codex needs to evolve persistence models, review query patterns, prepare production-safe database changes, or align application code with database delivery.
---

# Database Delivery

Design schema changes as production rollouts, not as isolated SQL edits.

## Workflow

1. Start from the business behavior and query patterns, then derive storage needs.
2. Define entities, relationships, lifecycle states, ownership, and deletion rules.
3. Plan the migration sequence: additive change, dual-write or backfill if needed, cutover, cleanup, and rollback.
4. Validate indexes, constraints, partitioning, and retention rules against expected traffic.
5. Coordinate application rollout with feature flags, compatibility windows, and observability.
6. Produce the operational runbook before shipping any destructive or high-cardinality change.

## Deliverables

- Data model proposal with naming conventions and ownership boundaries.
- Migration plan with safe order of operations and rollback strategy.
- Backfill or repair strategy for historical data.
- Query and index review tied to API or admin use cases.
- Monitoring checklist for latency, locks, dead tuples, replication lag, and storage growth.

## References

- Load [references/schema-and-migrations.md](references/schema-and-migrations.md) for modeling rules, migration patterns, and index reviews.
- Load [references/data-operations.md](references/data-operations.md) for backfills, dual-write cutovers, observability, and incident recovery.

## Guardrails

- Prefer additive migrations first and postpone destructive cleanup until the new path is stable.
- Treat data repair scripts and backfills as first-class delivery artifacts.
- Never couple app deployment to an irreversible migration without a compatibility window.
- Capture data ownership and retention decisions explicitly when introducing new tables or collections.
