---
name: polyglot-stack-bootstrap
description: Bootstrap multi-team repositories and starter code layouts for PHP, Python, and TypeScript backends plus Next.js and Nuxt frontends. Use when Codex needs to initialize a new codebase, standardize folder conventions, or scaffold services and apps for polyglot teams.
---

# Polyglot Stack Bootstrap

Initialize shared repository structure first, then scaffold only the stacks the team actually needs.

## Workflow

1. Choose the backend and frontend stacks required for the program or team topology.
2. Run `scripts/init_stack.py` to generate the base mono-repo structure, stack manifests, and starter services or apps.
3. Adjust names, package managers, and CI hooks after scaffolding instead of writing the tree by hand.
4. Use the generated layout as the delivery baseline for APIs, frontend apps, shared contracts, and Terraform modules.
5. Load the references when refining conventions, naming, or ownership boundaries.

## Script

Run:

```bash
python scripts/init_stack.py --root <target-dir> --backend php python typescript --frontend nextjs nuxt
```

Use `--force` only when intentionally overwriting existing files inside the target directory.

## References

- Load [references/bootstrap-playbook.md](references/bootstrap-playbook.md) for repo-shape decisions, team boundaries, and handoff expectations.
- Load [references/template-map.md](references/template-map.md) for the exact templates that back the scaffolding script.

## Assets

- `assets/templates/root/` contains shared root-level files and folders.
- `assets/templates/backend/` contains backend service templates for PHP, Python, and TypeScript.
- `assets/templates/frontend/` contains frontend app templates for Next.js and Nuxt.

## Guardrails

- Scaffold the minimum viable set of stacks and keep naming predictable.
- Preserve clear separation between `services`, `apps`, `packages`, and `infra`.
- Keep generated starter code intentionally thin so teams can extend it without fighting a giant template.
