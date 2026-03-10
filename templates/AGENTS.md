# Role Definition

Context: This is a Terraform infrastructure repository.
Skills: Refer to @shared-devops-skills (if using Extension) or path/to/submodule.

# Custom Instructions

- Use AWS provider version 5.0

## Skills

A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of shared skills available on this machine.

### Available skills

- api-admin-platform: Design and implement APIs, service layers, admin backends, RBAC, audit trails, async jobs, and operational endpoints. Use when building or refactoring backend services or admin tooling. (file: C:/Users/Admin/.codex/skills/api-admin-platform/SKILL.md)
- database-delivery: Plan and execute schema changes, migrations, indexes, backfills, and rollback plans. Use when changing persistence models or preparing production-safe database delivery. (file: C:/Users/Admin/.codex/skills/database-delivery/SKILL.md)
- github-actions-cicd: Build and maintain GitHub Actions pipelines for CI, CD, releases, environment promotion, and reusable workflows. Use when working on `.github/workflows/*` or deployment automation. (file: C:/Users/Admin/.codex/skills/github-actions-cicd/SKILL.md)
- terraform-platform-infra: Design and implement Terraform infrastructure, module layouts, remote state conventions, and environment topologies. Use when working on `infra/terraform`, platform resources, or IaC changes. (file: C:/Users/Admin/.codex/skills/terraform-platform-infra/SKILL.md)
- polyglot-stack-bootstrap: Bootstrap shared repository structures and starter code for PHP, Python, TypeScript, Next.js, and Nuxt teams. Use when initializing a new codebase or standardizing project layout. (file: C:/Users/Admin/.codex/skills/polyglot-stack-bootstrap/SKILL.md)

### How to use skills

- Trigger rules: If the user names a skill with `$skill-name` or the request clearly matches the skill description, use that skill for the turn.
- Progressive disclosure: Read the skill `SKILL.md` first, then load only the specific `references/`, `scripts/`, or `assets/` files needed for the task.
- Reuse: If a skill provides scripts or templates, prefer using them over rewriting the same scaffolding manually.
- Scope: Do not carry a skill across turns unless the user mentions it again or the new task clearly still matches it.

## Project instructions

- Read the repository structure before making changes and follow existing conventions.
- Prefer small, focused changes that match the language and framework already used by the project.
- Run the narrowest useful validation first, then broaden only if needed.
- When changing API, database, CI/CD, or Terraform behavior, explain rollout or migration impact in the final response.

## Project-specific notes

- Add repository-specific coding standards, branch rules, test commands, service ownership, and deployment details here.
- Add more nested `AGENTS.md` files in subdirectories when a part of the repo needs stricter local instructions.
