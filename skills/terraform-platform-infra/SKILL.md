---
name: terraform-platform-infra
description: Design and implement Terraform infrastructure for application platforms, shared services, networking, state management, and environment promotion. Use when Codex needs IaC module structure, remote state conventions, environment layouts, cloud resource provisioning, or Terraform integration with delivery pipelines.
---

# Terraform Platform Infra

Model infrastructure as reusable modules and environment compositions instead of one-off resource files.

## Workflow

1. Confirm provider, account or subscription boundaries, environments, and the app platform that Terraform must support.
2. Separate shared platform concerns from environment-specific composition and application-specific inputs.
3. Define remote state, locking, provider aliases, and secret handling before writing resources.
4. Build modules with clear input and output contracts, tagging, naming, and lifecycle expectations.
5. Plan bootstrap, import, drift handling, and CI execution for each environment.
6. Document how application repos consume infrastructure outputs such as DNS, networks, storage, queues, and identities.

## Deliverables

- Terraform folder layout for modules, environments, and shared platform primitives.
- State and provider strategy, including workspace or backend conventions.
- Module contracts for networking, compute, data, secrets, and observability.
- Promotion path across dev, staging, and production.
- Safety plan for imports, replacements, and breaking changes.

## References

- Load [references/module-layout.md](references/module-layout.md) for module boundaries, state patterns, and naming rules.
- Load [references/environment-topology.md](references/environment-topology.md) for environment promotion, bootstrap sequencing, and CI integration.

## Guardrails

- Keep reusable modules generic and keep environment opinions in composition layers.
- Expose only the outputs that consumers truly need.
- Treat state layout as architecture, not plumbing.
- Prefer immutable rollout patterns over in-place mutation when the platform allows it.
