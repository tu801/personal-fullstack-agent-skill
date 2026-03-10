---
name: backend-devops-automation
description: Design and implement backend and DevOps automation scripts using shell, Bash, Makefile, and Node.js CLI tools. Use when Codex needs to automate build, deploy, migration, release, environment setup, operational checks, or repetitive engineering workflows with script-first approaches.
---

# Backend DevOps Automation

Automate repeatable backend and platform workflows with scripts that are safe, idempotent, and easy to run in CI.

## Workflow

1. Define the target workflow, trigger point, runtime environment, and required inputs or secrets.
2. Choose the automation surface:
   - Shell or Bash for fast OS-level orchestration.
   - Makefile for discoverable task entrypoints and dependency chaining.
   - Node.js CLI for richer argument parsing, JSON processing, and cross-platform behavior.
3. Design for idempotency, non-interactive execution, and deterministic exit codes.
4. Add guardrails: strict modes, preflight checks, dry-run mode, and explicit confirmations for risky operations.
5. Emit actionable logs and machine-readable outputs for CI or downstream steps.
6. Document command examples and integrate tasks into repository-level workflows.

## Deliverables

- Script or CLI structure aligned to the repository.
- Input contract (flags, env vars, config files) and output contract (logs, artifacts, exit codes).
- Safety controls (preflight validation, rollback or retry strategy, destructive action protection).
- CI-friendly execution pattern and local developer entrypoint.

## References

- Load [references/script-patterns.md](references/script-patterns.md) for practical templates and implementation patterns for Bash, Makefile, and Node.js CLI tools.

## Guardrails

- Prefer composable small commands over one giant script.
- Fail fast with clear error messages and non-zero exits.
- Avoid hidden side effects; make destructive operations opt-in.
- Keep scripts portable and explicit about required tools and versions.
