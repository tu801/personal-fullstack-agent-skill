# Backend API

## Contents

- Contract-first design
- Platform choices
- Service layout
- Endpoint checklist

## Contract-first design

Define the external contract before picking framework details.

- Name resources after business concepts, not database tables.
- Keep pagination, filtering, sorting, and error envelopes consistent across endpoints.
- Specify idempotency behavior for create, retry, webhook, and payment-like flows.
- Reserve async patterns for slow or failure-prone operations and expose job status when needed.

## Platform choices

- PHP: prefer Laravel or Symfony when the team wants strong convention, queues, and mature admin tooling.
- Python: prefer FastAPI for typed APIs and async-heavy services; prefer Django when admin CRUD and ORM speed matter.
- TypeScript: prefer NestJS for module-heavy teams and strong DI boundaries; prefer lightweight Express or Fastify only when a thinner surface is deliberate.

## Service layout

Use a similar separation regardless of language:

- `transport` or `http`: controllers, routers, request validation, serialization.
- `application`: use cases, commands, query handlers, orchestration.
- `domain`: entities, policies, invariants, state transitions.
- `infrastructure`: repositories, queues, external providers, persistence adapters.

Keep DTOs and validation close to the transport layer. Keep business rules out of controllers.

## Endpoint checklist

- Define authentication mode and required roles.
- Validate request shapes, defaults, and enum drift.
- Document success and failure responses.
- Decide whether the endpoint is sync, async, or fire-and-forget.
- Add tracing, metrics, and structured logs for mutations.
- Add contract or integration tests that protect the public shape.
