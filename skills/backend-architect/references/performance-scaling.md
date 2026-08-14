# Performance & Scaling Reference

Read this for latency problems, throughput problems, load handling, or
"service X is slow" investigations.

## Diagnosis method (always before optimizing)

1. **Define the target.** "Slow" → a number: current p99 vs target p99 at
   what RPS. No target = no done condition.
2. **Locate the time.** Break the request into segments with tracing or
   timestamped logs: edge → app queue/cold start → handler → each DB
   query → each external call → serialization. Optimize the largest
   segment only.
3. **Rank hypotheses by likelihood, verify cheapest-first.** Typical
   ranking for Cloud Run + DB stacks:
   - N+1 queries or unindexed query (check query logs / EXPLAIN)
   - Cold starts (check instance startup logs vs latency spikes)
   - Connection pool exhaustion (check pool wait time, DB connections)
   - Missing cache on read-heavy hot path
   - Sequential external calls that could be parallel
   - Payload bloat (returning 500 fields, no pagination)
   - CPU throttling (concurrency too high for workload)
4. Fix one thing, re-measure under the same load, repeat.

## Latency budget pattern

Give every user-facing endpoint a budget and allocate it:
`p99 300ms = edge 20 + app 30 + DB 100 + external 100 + buffer 50`.
Set per-dependency timeouts from the budget (timeout ≈ its allocation),
so one slow dependency can't consume the whole budget.

## Scaling playbook (in order — each step is cheaper than the next)

1. **Fix queries + add indexes** (10–100x wins live here)
2. **Cache reads** (Redis/edge/CDN) with explicit invalidation
3. **Go async**: move non-blocking work off the request path to Pub/Sub /
   Cloud Tasks
4. **Tune Cloud Run**: concurrency to match workload, min-instances for
   cold starts, right-size CPU/memory
5. **Read replicas** for read-heavy relational load
6. **Partition/shard** data (last resort; permanent complexity)

Jumping to step 5–6 while step 1 is undone is the most common scaling
mistake — always check in order.

## Load testing

- Test at expected peak and 2–3x peak, with realistic data volume
  (empty-DB tests lie) and realistic traffic mix.
- Tools: k6 (scriptable, CI-friendly). Measure p50/p95/p99 + error rate,
  not averages — averages hide the problem.
- Watch during the test: DB CPU + connections, Cloud Run instance count +
  CPU, queue depths. The first graph to saturate is your bottleneck.
- Soak test (steady load, 1h+) catches leaks and connection creep that
  spike tests miss.

## Node.js specifics (Next.js/Nuxt SSR backends)

- Event-loop blocking is the silent killer: JSON.parse/stringify of large
  payloads, sync crypto, big array operations. Monitor event-loop lag;
  offload CPU work to worker threads or a separate service.
- `Promise.all` independent I/O; sequential awaits in a loop = accidental
  serial latency.
- SSR: cache rendered HTML at the edge (`s-maxage`,
  `stale-while-revalidate`) for anonymous traffic; personalize client-side
  or via edge middleware. ISR/route-level caching before reaching for a
  bigger origin.
- Memory: watch RSS growth per instance; module-scope caches without
  bounds are the usual leak. Set container memory with ~30% headroom over
  steady state.