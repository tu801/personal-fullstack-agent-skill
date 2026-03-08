# Bootstrap Playbook

## Contents

- Repository shape
- Team boundaries
- Stack selection
- First-week follow-up

## Repository shape

Use a stable top-level shape:

- `services/` for backend services and APIs
- `apps/` for customer-facing or internal frontend apps
- `packages/` for shared contracts, configs, or SDKs
- `infra/` for Terraform and deployment support
- `.github/` for workflow automation

## Team boundaries

- Give each service or app a clear owner and deployment path.
- Keep shared contracts small and versioned through code review rather than tribal knowledge.
- Avoid cross-stack shared runtime code unless the payoff is obvious.

## Stack selection

- PHP works well for convention-driven CRUD and operational admin surfaces.
- Python fits data-heavy services, automation, and typed APIs with FastAPI.
- TypeScript fits event-heavy services and teams sharing contracts with web apps.
- Next.js fits React-based SSR or hybrid apps.
- Nuxt fits Vue-based SSR or content-oriented apps.

## First-week follow-up

After scaffolding:

- Add real lint, test, and build commands.
- Connect the repo to CI and deployment environments.
- Replace starter endpoints and pages with domain-specific code.
- Decide shared package ownership before teams start copying code between projects.
