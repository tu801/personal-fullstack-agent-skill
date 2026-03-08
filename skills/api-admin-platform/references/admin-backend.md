# Admin Backend

## Contents

- Module map
- Permissions and audit
- Operational workflows
- Delivery expectations

## Module map

Organize admin surfaces by operational intent:

- Catalog or content management
- Orders, billing, or fulfillment operations
- User support and account recovery
- Settings and feature flag control
- Reporting and exports

Avoid one generic CRUD screen when workflows have different rules or side effects.

## Permissions and audit

- Model RBAC around job functions, not around raw tables.
- Add row-level or tenant scoping when staff access varies by account, region, or brand.
- Log who changed what, when, and why for every sensitive mutation.
- Capture before and after values for fields that matter to support, finance, or compliance.

## Operational workflows

Design admin features with operator ergonomics in mind:

- Bulk actions need dry-run output and partial failure reporting.
- Imports need validation summaries before commit.
- Exports need filters, field whitelists, and retention rules.
- Long-running jobs need queue visibility, retry status, and escalation paths.

## Delivery expectations

Ship admin modules with:

- Policy tests for every privileged action
- Audit event coverage for sensitive writes
- Support-oriented error messages
- Rate limits or extra confirmation for destructive actions
