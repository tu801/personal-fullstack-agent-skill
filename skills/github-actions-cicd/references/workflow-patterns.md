# Workflow Patterns

## Contents

- Baseline pipeline
- Stack-specific CI
- Matrix and cache rules
- Reuse

## Baseline pipeline

Keep a standard stage order:

1. Checkout and environment setup
2. Dependency install with cache
3. Lint and static analysis
4. Unit and integration tests
5. Build or package
6. Artifact upload
7. Deploy or publish

Fail fast on code quality but keep enough artifacts for debugging downstream failures.

## Stack-specific CI

- PHP: cache Composer, run coding standards, static analysis, unit tests, and database-aware integration tests.
- Python: cache package installer state, run formatting checks, type checks, tests, and build a wheel or image when shipping services.
- TypeScript: cache package manager data, run typecheck, lint, test, and build. Split frontend and backend jobs when the monorepo is large.

## Matrix and cache rules

- Use matrix builds for runtime or framework versions, not for unrelated deployment targets.
- Scope caches to lockfiles and runtime versions.
- Avoid restoring huge caches when install time is already low.
- Split reusable setup from heavy test matrices when runner minutes matter.

## Reuse

- Prefer reusable workflows for common pipelines across many repos.
- Prefer composite actions for small repeated command bundles.
- Standardize output names so downstream jobs can consume artifacts predictably.
