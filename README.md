<div align="center">

# codeglance

**The 10-second codebase tour.**

*Open a repo. Run one command. Know where to start.*

[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue)](https://www.npmjs.com/package/codeglance)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js ≥18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

</div>

---

```
npx codeglance
```

No install. No config. No API keys.

---

<div align="center">
<img src="docs/demo.svg" alt="codeglance terminal output showing Next.js project analysis" width="820"/>
</div>

---

## When should I use this?

- **Joining a new codebase** — Skip the 15-minute ritual of reading README, exploring directories, and parsing package.json manually
- **Evaluating a dependency** — Understand what a library actually uses before you adopt it
- **Returning to an old project** — Re-orient yourself after months away
- **Before asking Claude or Cursor** — Run `codeglance --for-ai` to generate a structured context brief instead of dumping the entire codebase
- **Onboarding your team** — `codeglance --markdown > docs/codebase-tour.md` creates a living onboarding document

---

## What it shows you

| Question | What you get |
|----------|-------------|
| **What is this?** | "Next.js 14 with Prisma, tRPC" — not just "TypeScript" |
| **How do I run it?** | Real commands extracted from `package.json`, `Makefile`, `Cargo.toml`, `go.mod` |
| **Where do I start?** | Entry points and key files ranked by heuristic importance |
| **What tools does it use?** | CI system, test runner, Docker, linting, env files |
| **How do I brief an LLM?** | `--for-ai` generates a compact, structured context brief |

---

## Real examples

The following output comes from running codeglance on three projects on this machine.

### Electron + TypeScript app (edge-deployer)

```
  codeglance  edge-deployer · Node.js

── WHAT IS THIS ──────────────────────────────────────────────────────
  React 19
  Pkg manager npm
  Frameworks  Electron 36
  Testing      Jest 29
  Build        Webpack 5  ·  TypeScript 5

── HOW TO RUN IT ─────────────────────────────────────────────────────
  npm run dev      start development server
  npm run build    build for production
  npm run test     run test suite

── WHERE TO START ────────────────────────────────────────────────────
  src/index.tsx                       main entry
  electron/main.ts                    Electron main process
  src/lib/securityScanner.ts          lib module
  src/cloudDeployers/awsDeployer.ts   AWS deployer

── TOOLS DETECTED ────────────────────────────────────────────────────
  Testing      Jest  (src/__tests__/)
  CI/CD        GitHub Actions (2 workflows)

── CODEBASE ──────────────────────────────────────────────────────────
  TypeScript    57 files   8.4k lines  73%
  JavaScript     9 files     725 lines   6%
  104 files  ·  12k lines  ·  8 languages  ·  0.05s
```

### Python FastAPI service (openlake)

```
  codeglance  openlake · Python

── WHAT IS THIS ──────────────────────────────────────────────────────
  FastAPI
  Runtime     Python >=3.11

── HOW TO RUN IT ─────────────────────────────────────────────────────
  pytest         run test suite
  ruff check .   lint with Ruff

── WHERE TO START ────────────────────────────────────────────────────
  docker-compose.yml   compose services
  src/main.py          module entry
  ui/app/page.tsx      frontend route

── TOOLS DETECTED ────────────────────────────────────────────────────
  Testing      Pytest  (tests/)
  Container    docker-compose
  Linting      Ruff  ·  mypy
  Env files    .env.example
```

### Python + C++ hybrid (limit-order-book)

```
  codeglance  limit-order-book · Python

── WHAT IS THIS ──────────────────────────────────────────────────────
  aiohttp with Pandas
  Runtime     Python >=3.9
  Frameworks  Click  ·  Typer

── WHERE TO START ────────────────────────────────────────────────────
  app.py               app entry
  cpp/src/bench.cpp    C++ benchmark core
  cpp/src/book_core.cpp  order book engine

── CODEBASE ──────────────────────────────────────────────────────────
  C++       29 files   17k lines  65%
  Python    38 files    7.2k lines  27%
  136 files  ·  26k lines  ·  0.09s
```

---

## The `--for-ai` mode

Run `codeglance --for-ai` to get a compact, structured context brief you can paste into Claude, GPT, or Gemini. About 400 tokens. No source code dumped.

```markdown
# Codebase Context: my-saas-app

## Stack
Next.js 14 with Prisma, tRPC
Runtime: Node.js >=18
Package manager: pnpm

## Commands
- **dev:** `pnpm dev`
- **build:** `pnpm build`
- **test:** `pnpm test`
- **lint:** `pnpm lint`

## Key Files
- `next.config.ts` — Next.js config
- `prisma/schema.prisma` — Prisma data model
- `src/server/routers/app.ts` — tRPC router
- `src/lib/db.ts` — database client

## Libraries
Prisma, Auth.js, tRPC, Vitest, Playwright

## Testing
Uses Vitest, Playwright. Tests in `tests/`.

## Infrastructure
GitHub Actions (1 workflows)  ·  docker-compose
```

```bash
codeglance --for-ai | pbcopy   # macOS — paste into Claude/GPT
codeglance --for-ai | xclip    # Linux
```

---

## Install

```bash
npx codeglance                   # zero install
npm install -g codeglance        # install globally
```

---

## Usage

```bash
codeglance [path]                        # analyze current dir or a path
codeglance --for-ai                      # compact LLM context brief
codeglance --markdown                    # Markdown report
codeglance --json                        # machine-readable output
codeglance --output docs/tour.md         # save to file
codeglance --no-git                      # skip git analysis
```

### Generate a living onboarding doc

```bash
codeglance --markdown --output docs/codebase-tour.md
```

Check it in. Regenerate whenever the architecture changes.
[See an example →](docs/codebase-tour.md)

---

## Supported ecosystems

| Ecosystem | Manifest | What's detected |
|-----------|----------|-----------------|
| **Node.js** | `package.json` | Next.js, React, Vue, Angular, Svelte, Express, NestJS, Fastify, Prisma, Drizzle, tRPC, GraphQL, Vitest, Jest, Playwright, ESLint, Tailwind — 50+ packages |
| **Python** | `pyproject.toml`, `requirements.txt` | FastAPI, Django, Flask, SQLAlchemy, Pydantic, Pytest, Ruff, Black, PyTorch, LangChain, OpenAI SDK |
| **Go** | `go.mod` | Gin, Echo, Fiber, Chi, GORM, Cobra, gRPC, Zap |
| **Rust** | `Cargo.toml` | Axum, Actix-web, Rocket, Tokio, SQLx, Clap, Serde, Tracing |
| **C/C++** | `CMakeLists.txt` | GoogleTest, Catch2, Boost, Qt, OpenCV — CMake version, C++ standard |
| **Ruby** | `Gemfile` | Rails, Sinatra, RSpec *(basic)* |

Missing your ecosystem? [Adding a detector takes ~10 minutes →](#contributing)

---

## Why not tokei / scc / repomix?

Use the right tool for the job:

- **tokei / scc** — fast, accurate line-of-code counts. Use these when you want LOC data.
- **repomix / code2prompt** — pack your source code *for* LLM consumption. Use these when you need to feed a full codebase to an LLM.
- **codeglance** — understand a repo before you work with it. Use this when you need orientation.

| | codeglance | tokei/scc | repomix |
|---|:---:|:---:|:---:|
| Framework detection | ✓ | ✗ | ✗ |
| Run/build/test commands | ✓ | ✗ | ✗ |
| Entry points | ✓ | ✗ | ✗ |
| "Files to read first" | ✓ | ✗ | ✗ |
| CI / Docker / tooling | ✓ | ✗ | ✗ |
| Language stats | ✓ | ✓ | ✗ |
| LLM context brief | ✓ | ✗ | ✓ (source dump) |
| Zero config | ✓ | ✓ | ✓ |

---

## Limitations

codeglance is transparent about what it is:

- **Heuristic, not semantic.** It reads manifest files and file structure. It does not parse or understand source code.
- **Framework detection depends on manifests.** Projects without a standard package file produce shallow output.
- **"Start here" ranking is approximate.** Based on file depth, naming patterns, and size — not import graph analysis.
- **Large repos are capped.** Repos over 25,000 files are analyzed up to that cap (shown in output).
- **Java support is limited.** `pom.xml` / `build.gradle` presence is detected; framework names are not yet extracted.
- **Monorepos get a single summary.** Per-package analysis is on the [roadmap](ROADMAP.md).

The output always says "heuristic" where it applies. It does not claim to replace static analysis tools.

---

## Contributing

Each ecosystem is a self-contained detector module. **Adding a framework detector is ~3 lines:**

```typescript
// src/detectors/frameworks.ts — add to the relevant array:
const NODE_FRAMEWORKS: FrameworkDef[] = [
  // ...
  { name: 'My Framework', category: 'web_framework', keys: ['my-framework-package'] },
];
```

Add a fixture + test, run `npm test`, submit a PR. See [CONTRIBUTING.md](CONTRIBUTING.md).

**Good first issues:**
- Add Laravel / Symfony detector
- Add Phoenix / Elixir detector
- Add Spring Boot / Quarkus improvements
- Add pnpm workspace monorepo detection
- Improve `--for-ai` Python command inference
- Add Bun lockfile detection

---

## Roadmap

**v0.2** — Java/Kotlin, monorepo support, `--since` diff mode  
**v0.3** — GitHub Action, Homebrew tap  
**Future** — VS Code extension, `--watch` mode, plugin system

Full roadmap: [ROADMAP.md](ROADMAP.md)

---

## License

MIT — see [LICENSE](LICENSE).
