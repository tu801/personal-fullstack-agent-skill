# Template Map

## Contents

- Root template
- Backend templates
- Frontend templates
- Generated manifest

## Root template

`assets/templates/root/` provides:

- `.editorconfig`
- `.gitignore`
- `.github/workflows/.gitkeep`
- `infra/terraform/modules/.gitkeep`
- `infra/terraform/envs/dev/.gitkeep`
- `infra/terraform/envs/staging/.gitkeep`
- `infra/terraform/envs/prod/.gitkeep`
- `packages/contracts/.gitkeep`
- `packages/config/.gitkeep`

## Backend templates

- `assets/templates/backend/php/`
- `assets/templates/backend/python/`
- `assets/templates/backend/typescript/`

Each template is copied into `services/<name>/` and has `__NAME__` replaced with the service name.

## Frontend templates

- `assets/templates/frontend/nextjs/`
- `assets/templates/frontend/nuxt/`

Each template is copied into `apps/<name>/` and has `__NAME__` replaced with the app name.

## Generated manifest

`scripts/init_stack.py` also writes `stack-manifest.json` so downstream automation can see which services and apps were scaffolded.
