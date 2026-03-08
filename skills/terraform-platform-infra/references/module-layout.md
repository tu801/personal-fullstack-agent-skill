# Module Layout

## Contents

- Layering
- State strategy
- Naming
- Module contract checklist

## Layering

Split Terraform into:

- Foundation modules for network, identity, shared storage, or observability
- Platform modules for app runtime primitives such as clusters, registries, queues, and secrets
- Environment composition that wires module instances with concrete settings

Avoid placing raw provider resources directly in every environment folder unless the estate is intentionally tiny.

## State strategy

- Use remote state with locking for every shared environment.
- Keep state boundaries aligned to change cadence and blast radius.
- Separate long-lived shared infrastructure from fast-moving application stacks when ownership differs.
- Plan imports and moved blocks before large refactors.

## Naming

- Apply predictable names and tags for environment, service, team, and compliance ownership.
- Keep module names aligned to capability, not cloud product trivia.
- Standardize output names for downstream consumers such as CI or app repos.

## Module contract checklist

- Inputs are typed, validated, and documented by naming.
- Outputs expose only stable integration points.
- Providers are explicit when aliasing regions or accounts.
- Lifecycle meta-arguments are justified, not cargo-culted.
