# harwise v0.2 — Spec

## Goal

A CLI that ingests one or more HAR files, lets you generate:

* **Insomnia collection** (JSON) with requests and environments
* **Functional tests** (Node runner) with assertions (status/body/headers/schema), variable extraction and chaining
* **HTML report** for perf + functional results, suitable for CI artifacts
* **Curl suite** (optional)
* **Compare** two HARs for regressions (duration/size/status)

## Non-goals

* Not a full-blown recorder. We rely on exported HARs (Chrome DevTools).
* No GUI; HTML report is static.

---

## Commands (CLI)

```
harwise stats <run.har>                    # quick summary (stdout)
harwise compare <baseline.har> <new.har>   # perf+status diff, outputs Markdown/HTML
harwise gen insomnia <run.har> --out out.json --env staging.env.json
harwise gen curl <run.har> > suite.sh
harwise gen tests <run.har> --out tests/ --config hw.config.json
harwise test --env .env --report out/report.html
```

**Global flags**

* `--include "<regex>"` / `--exclude "<regex>"` — URL filters
* `--time-regress <pct=10>` — fail threshold for latency regression
* `--size-regress <pct=15>`
* `--mask-headers "authorization,cookie"` — redact in outputs
* `--base-url <https://api.example.com>` — normalize origin
* `--tag "<label>"` — tag set in reports

**Exit codes**

* `0` success
* `1` functional failures (assertions)
* `2` regressions (perf/size/status changes)
* `3` invalid input/config

---

## Data model

Normalize each HAR entry into `ApiSample`:

* `method`, `url` (canonicalized: sorted query, no fragment, origin normalized if `--base-url` given)
* `status`, `time` (ms), `size` (response body), `mime`
* `req.headers[]`, `res.headers[]`
* `req.body` (text), `res.body` (text; omit from artifacts if >1MB unless `--keep-bodies`)
* `_resourceType` (if present)
* `key = METHOD + canonURL` (used for diffing)

**API-like heuristic**: keep XHR/Fetch OR MIME matches `(json|xml|text|javascript)` OR URL includes `api|/v\d+/|graphql|/rest/`.

---

## Generation: Insomnia Collection

### Output

One JSON file compatible with Insomnia import (v4 export shape).

### Structure

* **Resources**

  * `environment`: “Base” + optional “Staging” created from `--env` or `.env` (dotenv)
  * `request_group`: “harwise import”
  * `request` per API sample
* **Variables**

  * `{{ base_url }}` in environments
  * Replace origin in URLs with `{{ base_url }}` if `--base-url` present
* **Auth**

  * If header `Authorization: Bearer <token>` is detected, replace with `{{ auth_token }}` and set in environment.
* **Body**

  * For JSON, keep as raw JSON; for urlencoded, reconstruct key/value; otherwise raw.

> Minimal example (trimmed):

```json
{
  "_type": "export",
  "__export_format": 4,
  "resources": [
    { "_id": "env_base", "_type": "environment", "name": "Base", "data": { "base_url": "https://api.example.com", "auth_token": "" } },
    { "_id": "fld_root", "_type": "request_group", "name": "harwise import" },
    { "_id": "req_1", "_type": "request",
      "parentId": "fld_root",
      "name": "GET /v1/users",
      "method": "GET",
      "url": "{{ base_url }}/v1/users?limit=10",
      "headers": [{ "name": "Authorization", "value": "Bearer {{ auth_token }}" }],
      "body": { "mimeType": "application/json" }
    }
  ]
}
```

---

## Generation: Functional Tests

### Runner

* Node + TypeScript (ESM), uses:

  * `undici` (fetch) or `axios`
  * `ajv` for JSON Schema
  * `jsonpath-plus` for JSONPath assertions
  * `yargs` for CLI args

### Test file layout

* One file per endpoint under `tests/<method>_<pathHash>.spec.ts`
* A **suite manifest** `tests/.harwise.manifest.json` with ordered steps (to allow chaining)

### Assertions (auto + configurable)

* **Auto**:

  * `status in [200..399]` (from sample)
  * `content-type` contains sample MIME
  * Optional **timing** upper bound = `sample_time * 1.25` (overridable)
* **Heuristics**:

  * If response is JSON object with `id`, assert it exists and type
  * If sample path contains `/login|/token|/auth`, capture token from JSONPath `$.token || $.access_token` into `ctx.auth_token`
* **Config-driven** (`hw.config.json`):

```json
{
  "assertions": {
    "global": {
      "statusRange": [200, 399],
      "maxTimePctOverSample": 25
    },
    "byUrl": [
      { "match": "/v1/users$", "jsonpath": [
        { "path": "$.data[*].id", "exists": true },
        { "path": "$.data", "minLength": 1 }
      ]}
    ]
  },
  "extract": [
    { "match": "/login$", "from": "$.access_token", "to": "auth_token" },
    { "match": "/v1/users/(\\d+)", "from": "$.id", "to": "last_user_id" }
  ],
  "substitute": [
    { "match": "/v1/users/\\d+", "pattern": "(\\d+)", "var": "last_user_id" }
  ],
  "maskHeaders": ["authorization", "cookie"],
  "baseUrl": "https://api.example.com"
}
```

### Chaining

* Extracted variables stored in runtime `ctx` and environment file `.harwise.env.json`
* Subsequent requests can use `${env.last_user_id}` in path or body

### Schema validation (optional)

* **Infer** a draft-07 schema from the sample JSON via a simple “json-to-schema” utility (keep types/required from sample)
* Or **use OpenAPI** if provided: `--openapi openapi.yaml` → validate with `openapi-schema-validator` for the matched route

### Deterministic replay

* Headers to strip by default: `date`, `etag`, `cf-*`, `x-*` (configurable)
* Retry policy: `exponential backoff, max 2` for 429/503 unless disabled

### Example generated test (trimmed)

```ts
import { strict as assert } from 'node:assert';
import { fetch } from 'undici';
import { JSONPath } from 'jsonpath-plus';
import { loadEnv } from '../runner/env.js';

const env = await loadEnv();
const base = env.base_url;

export default async function test(ctx) {
  const url = `${base}/v1/users?limit=10`;
  const res = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${env.auth_token}` } });
  assert.ok(res.status >= 200 && res.status < 400, `Unexpected status ${res.status}`);
  const body = await res.json();
  const ids = JSONPath({ path: '$.data[*].id', json: body });
  assert.ok(ids.length > 0, 'No user ids');
  ctx.set('last_user_id', body.data[0].id);
}
```

### Test runner command

```
harwise test --env .env --report out/report.html
```

* Discovers `tests/*.spec.(ts|js)`, runs in order from manifest
* Collects:

  * pass/fail
  * duration
  * assertion messages
  * extracted variables snapshot
* Produces JSON results + HTML report

---

## HTML Report

### Input

A single JSON blob from the runner:

```json
{
  "meta": { "tag": "build-572", "when": "2025-09-18T12:34:56Z" },
  "summary": { "total": 24, "passed": 22, "failed": 2, "p50": 180, "p95": 640 },
  "cases": [
    { "name": "GET /v1/users", "status": "pass", "time": 172, "assertions": 3 },
    { "name": "POST /v1/login", "status": "fail", "time": 420, "error": "token missing" }
  ],
  "perfDiff": [ /* optional compare results */ ]
}
```

### Layout

* Header: build tag, date, environment
* Summary tiles: total/passed/failed, p50/p95 latency
* Table of tests (sortable): name, status, time, assertions, error (if any)
* Optional **Compare view** when `compare` was run: table of endpoints with `status_old→new`, `time_old→new`, `Δ%`, badges (⚠️ regressions)

### Implementation

* Single `report.html` with embedded JSON + inline CSS + tiny JS
* No external CDNs (CI-safe)
* Minimal sparkline (inline SVG) for latency distribution

---

## Compare (baseline vs new)

Rules:

* Match by `key`
* Flag regression when:

  * `status` changed, or
  * `time_new > time_old * (1 + time-regress/100)`, or
  * `size_new > size_old * (1 + size-regress/100)`

Output:

* Markdown (stdout or `--out report.md`)
* Optionally embed into HTML report (`--report out/report.html --with-compare`)

Exit code `2` if any regression.

---

## Curl generation (optional)

```
harwise gen curl run.har > suite.sh
```

* Masks headers per config
* Writes `set -euo pipefail` prelude if `--strict` set
* Emits comment with original sample time/size

---

## Config precedence

1. CLI flags
2. `hw.config.json` in CWD
3. `.env` for environment values
4. Values inferred from HAR (e.g., base URL)

---

## File tree (suggested)

```
/harwise
  /src
    index.ts          # CLI wiring
    har.ts            # HAR read + normalize
    match.ts          # include/exclude + keying
    insomnia.ts       # export generator
    tests-gen.ts      # generate tests + manifest
    runner/           # tiny test runner
      index.ts
      env.ts
      assert.ts
      report.ts
    compare.ts
    report-html.ts    # HTML builder (inline assets)
    util.ts
  /templates
    report.html.tpl   # HTML with placeholders
  package.json
  tsconfig.json
  hw.config.schema.json
```

---

## GitHub Actions (CI) — example

`.github/workflows/harwise.yml`

```yaml
name: harwise
on:
  push: { branches: [ main ] }
  workflow_dispatch: {}

jobs:
  harwise:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run build
      # artifacts: HAR files uploaded by your e2e job or attached to the repo
      - run: node dist/index.js gen tests ./artifacts/run.har --out tests/ --config hw.config.json --base-url ${{ vars.BASE_URL }}
      - run: node dist/index.js test --env .env --report out/report.html
      - run: node dist/index.js compare ./artifacts/baseline.har ./artifacts/run.har --time-regress 10 --size-regress 15 --out out/compare.md
      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: harwise-report
          path: out/
```

---

## Nice heuristics (quick wins)

* **Auth propagation**: if any request has `Authorization: Bearer <token>`, auto-extract into env for all.
* **ID capture**: if response JSON contains `id` and subsequent path includes `/resource/{id}`, auto-bind.
* **Content-type default**: when missing but body looks JSON, set `application/json`.
* **Rate limiting**: if `429`, backoff and retry with jitter (2 attempts).

---

## Security & privacy

* Mask `authorization`, `cookie`, `set-cookie`, `x-api-key` by default in artifacts and report
* Respect `--keep-bodies` off by default for large bodies (>1MB)
* Redact body snippets in HTML (first 200 chars, masked)

---

## Implementation notes 

* Start with `har.ts`, `tests-gen.ts`, `runner/index.ts`, `report-html.ts`, and `compare.ts`.
* Keep pure functions; wire through `index.ts` with `commander`.
* Write a tiny fixture suite: `fixtures/a.har`, `fixtures/b.har` to validate compare + report generation.
* Add `hw.config.schema.json` and validate user config with `ajv`.