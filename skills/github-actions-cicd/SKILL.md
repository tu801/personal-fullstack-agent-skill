---
name: github-actions-cicd
description: Build and maintain GitHub Actions pipelines for lint, test, build, release, deploy, environment promotion, and reusable workflows. Use when Codex needs CI or CD automation, monorepo workflow design, matrix testing, artifact promotion, secrets or OIDC setup, or deployment gates in GitHub repositories.
---

# GitHub Actions CI/CD

Design delivery pipelines that are fast enough for daily use and strict enough for production releases.

## Workflow

1. Identify repository shape, deployment targets, branch model, and the exact events that should trigger automation.
2. Split the pipeline into clear stages: setup, quality gates, build, package, deploy, verify, and notify.
3. Choose cache, artifact, and matrix strategies based on language ecosystems and monorepo boundaries.
4. Use reusable workflows or composite actions for repeated behavior across services.
5. Wire secrets, environments, approvals, and OIDC or cloud identity before touching deployment jobs.
6. Add concurrency, failure reporting, and rollback or redeploy paths so the pipeline behaves predictably under pressure.

## Deliverables

- Event matrix covering pull request, push, tag, schedule, manual, and promotion triggers.
- Workflow layout showing reusable units versus repo-specific jobs.
- Secret and environment mapping for build-time and deploy-time credentials.
- Deployment strategy for preview, staging, and production paths.
- Fast-fail quality checks with artifacts that support debugging.

## References

- Load [references/workflow-patterns.md](references/workflow-patterns.md) for job design, caching, matrix builds, and stack-specific CI patterns.
- Load [references/deployment-topologies.md](references/deployment-topologies.md) for release strategies, environment promotion, approvals, and rollback-friendly deployments.

## Guardrails

- Keep build and deploy steps separate so artifacts can be promoted without recompilation.
- Favor OIDC and short-lived credentials over long-lived secrets.
- Use concurrency groups for deployment workflows to prevent overlapping releases.
- Keep local developer commands and CI commands aligned to avoid "works locally" drift.
