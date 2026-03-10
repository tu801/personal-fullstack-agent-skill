# Script Patterns

## Table of Contents

1. Decision Matrix
2. Bash Automation Template
3. Makefile Task Pattern
4. Node.js CLI Pattern
5. CI Integration Checklist

## Decision Matrix

- Use shell or Bash when chaining existing commands and tools is enough.
- Use Makefile when the team needs a consistent command surface like `make test`, `make deploy`, `make migrate`.
- Use Node.js CLI when complex arguments, structured config, JSON transforms, or API calls are required.

## Bash Automation Template

```bash
#!/usr/bin/env bash
set -euo pipefail

DRY_RUN="${DRY_RUN:-0}"
ENVIRONMENT="${ENVIRONMENT:-dev}"

log() { printf '[%s] %s\n' "$(date +'%Y-%m-%dT%H:%M:%S%z')" "$*"; }
run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    log "DRY_RUN: $*"
  else
    "$@"
  fi
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

main() {
  require_cmd jq
  require_cmd curl

  log "Running preflight checks for env=$ENVIRONMENT"
  run echo "Execute workflow steps here"
}

main "$@"
```

## Makefile Task Pattern

```makefile
SHELL := /usr/bin/env bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

ENV ?= dev
DRY_RUN ?= 0

.PHONY: help setup lint test deploy migrate

help:
	@echo "Targets: setup lint test deploy migrate"

setup:
	@./scripts/setup.sh

lint:
	@./scripts/lint.sh

test:
	@./scripts/test.sh

migrate:
	@ENV=$(ENV) DRY_RUN=$(DRY_RUN) ./scripts/migrate.sh

deploy:
	@ENV=$(ENV) DRY_RUN=$(DRY_RUN) ./scripts/deploy.sh
```

## Node.js CLI Pattern

```js
#!/usr/bin/env node
import process from "node:process";

function parseArgs(argv) {
  const args = { env: "dev", dryRun: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--env") args.env = argv[i + 1];
    if (argv[i] === "--dry-run") args.dryRun = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  console.log(JSON.stringify({ level: "info", msg: "start", args }));

  if (args.dryRun) {
    console.log(JSON.stringify({ level: "info", msg: "dry-run mode" }));
    return;
  }

  // Implement real workflow here
  console.log(JSON.stringify({ level: "info", msg: "done", env: args.env }));
}

main().catch((error) => {
  console.error(JSON.stringify({ level: "error", msg: error.message }));
  process.exit(1);
});
```

## CI Integration Checklist

- Ensure scripts run non-interactively in CI.
- Standardize exit codes and error message format.
- Add retries only for flaky external dependencies.
- Keep secrets in environment variables or secret managers, never in scripts.
- Expose a dry-run mode for validation stages.
