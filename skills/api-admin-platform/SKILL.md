---
name: api-admin-platform
description: Design and implement APIs, service layers, admin backends, RBAC, audit trails, async jobs, and operational endpoints. Use when Codex needs to create or refactor backend services, define request and response contracts, plan internal admin tooling, or deliver PHP, Python, or TypeScript backend features.
---

# Api Admin Platform

Build contract-first backend systems that support both product APIs and internal admin operations.

## Workflow

1. Identify the domain, actor roles, and operational tasks that the backend must support.
2. Freeze the contract first: resources, actions, validation errors, pagination, filtering, sorting, and idempotency rules.
3. Map the service boundary: synchronous commands, async jobs, webhooks, and data ownership.
4. Design the admin backend separately from the public API: permissions, bulk actions, import and export flows, auditability, and support tooling.
5. Implement the stack-specific structure and keep request DTOs, domain rules, and persistence concerns separated.
6. Deliver tests for permissions, validation, contract compatibility, and operational happy paths.

## Deliverables

- Resource or endpoint inventory with owners and consumers.
- Auth and authorization model, including service-to-service access.
- Admin module map for dashboards, CRUD, workflows, and audit surfaces.
- Error model and API conventions that stay consistent across services.
- Test plan for controllers, services, policies, background jobs, and integration paths.

## Stack Selection

- Load [references/backend-api.md](references/backend-api.md) for contract-first API patterns, per-stack layouts, and endpoint review checklists.
- Load [references/admin-backend.md](references/admin-backend.md) for admin module design, RBAC, audit logging, bulk operations, and operational UX expectations.

## Guardrails

- Prefer explicit resource naming and predictable URL or RPC shapes over clever abstractions.
- Keep admin-specific workflows behind separate modules or bounded contexts instead of leaking them into public endpoints.
- Model long-running work as jobs with retry, visibility, and operator feedback.
- Add observability and audit events at the same time as mutating endpoints.
