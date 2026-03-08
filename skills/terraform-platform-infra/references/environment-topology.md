# Environment Topology

## Contents

- Environment shapes
- Bootstrap sequence
- CI integration
- Change safety

## Environment shapes

Pick one of these models deliberately:

- Shared lower environments with isolated production
- Fully isolated per-environment accounts or subscriptions
- Ephemeral review environments layered on top of stable shared infrastructure

Match the model to compliance, cost, and team autonomy requirements.

## Bootstrap sequence

Create bootstrap order explicitly:

1. Remote state backend and locks
2. Base networking and identity
3. Shared platform services
4. Application runtime resources
5. DNS, certificates, and external integration bindings

Do not let application modules bootstrap their own global dependencies implicitly.

## CI integration

- Run formatting, validation, and static checks on pull requests.
- Run `plan` on proposed changes and surface summaries in review.
- Gate `apply` behind environment approvals and protected branches.
- Keep provider credentials short-lived and environment-scoped.

## Change safety

- Use targeted changes sparingly and document why when they are necessary.
- Review replace operations carefully for databases, stateful disks, and public endpoints.
- Pair Terraform changes with application rollout plans when outputs or network paths change.
