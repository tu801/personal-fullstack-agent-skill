# Deployment Topologies

## Contents

- Trigger model
- Environment promotion
- Secrets and identity
- Rollback

## Trigger model

- `pull_request`: run validation, previews, and cheap feedback.
- `push` to protected branches: build releasable artifacts.
- `tag` or `workflow_dispatch`: cut releases or promote artifacts.
- `schedule`: run drift detection, audits, and slower maintenance jobs.

## Environment promotion

- Promote the same artifact across environments whenever possible.
- Use GitHub environments for approvals, environment-scoped secrets, and deployment history.
- Serialize production deploys with concurrency groups.
- Keep preview environments disposable and tied to branch or pull request lifecycle.

## Secrets and identity

- Prefer OIDC with cloud IAM roles over long-lived deploy keys.
- Separate build-time credentials from deploy-time credentials.
- Keep secret names stable across repos when using reusable workflows.

## Rollback

- Record artifact identifiers and infra revision identifiers on every deploy.
- Keep rollback as a first-class workflow path, not a manual note in a wiki.
- Add post-deploy health checks that fail loudly enough to stop bad promotions.
