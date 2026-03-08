# Data Operations

## Contents

- Backfills
- Dual-write cutovers
- Observability
- Recovery

## Backfills

- Break large jobs into deterministic batches.
- Track progress externally so work can resume safely after interruption.
- Emit counts for scanned, changed, skipped, and failed rows.
- Protect production with throttling and off-peak scheduling when lock pressure is possible.

## Dual-write cutovers

Use dual-write only when compatibility requires it. When using it:

- Define the source of truth for each phase.
- Add reconciliation checks between old and new stores.
- Keep the dual-write window as short as practical.
- Remove temporary compatibility code after stabilization.

## Observability

Monitor:

- Query latency and lock duration
- Replication lag
- Connection pool saturation
- Vacuum or compaction health
- Storage growth and index bloat

Tie these checks to the exact deployment window for the migration.

## Recovery

- Prepare rollback SQL or reverse migrations when feasible.
- Keep point-in-time restore expectations explicit for irreversible changes.
- Document manual repair steps for partially applied backfills.
- Pause application features rather than continuing on corrupt or divergent data.
