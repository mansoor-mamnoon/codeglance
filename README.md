<div align="center">

# codeglance

**The 10-second codebase tour.**

*Open a repo. Run one command. Know where to start.*

[![npm version](https://img.shields.io/npm/v/codeglance.svg)](https://www.npmjs.com/package/codeglance)
[![CI](https://github.com/username/codeglance/actions/workflows/ci.yml/badge.svg)](https://github.com/username/codeglance/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js ≥18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

</div>

---

```
npx codeglance
```

---

## What it does

You cloned a repo. `codeglance` answers the questions you'd otherwise spend 15 minutes on:

| Question | How it's answered |
|----------|-------------------|
| **What is this?** | Framework + library detection: "Next.js 14 with Prisma and Tailwind CSS" — not just "TypeScript" |
| **How do I run it?** | Real commands extracted from `package.json`, `Makefile`, `Cargo.toml`, `go.mod`, `pyproject.toml` |
| **Where do I start?** | Entry points + key files ranked by heuristic importance |
| **What tools does it use?** | CI system, test runner, Docker, linting, env files |
| **How do I brief an LLM?** | `--for-ai` generates a compact, structured context brief |

No API keys. No config file. No setup. Works on any repo.

---

## Example output

<!-- Replace with a real terminal screenshot -->

```
  codeglance  my-saas-app · Node.js
  /home/user/projects/my-saas-app

── WHAT IS THIS ──────────────────────────────────────────────────────
  Next.js 14 with Prisma, tRPC
  Runtime     Node.js >=18
  Pkg manager pnpm
  ORM / DB    Prisma
  Auth        Auth.js
  API layer   tRPC
  Testing      Vitest  ·  Playwright
  Linting      ESLint  ·  Prettier

── HOW TO RUN IT ─────────────────────────────────────────────────────
  pnpm dev              start Next.js dev server
  pnpm build            build for production
  pnpm test             run test suite
  pnpm lint             lint codebase

── WHERE TO START ────────────────────────────────────────────────────
  src/app/page.tsx              main entry
  src/server/routers/app.ts     tRPC router
  src/lib/db.ts                 database client
  prisma/schema.prisma          Prisma data model
  src/env.mjs                   environment schema

── TOOLS DETECTED ────────────────────────────────────────────────────
  Testing      Vitest  ·  Playwright  (tests/)
  CI/CD        GitHub Actions (4 workflows)
  Container    Docker  ·  docker-compose
  Linting      ESLint  ·  Prettier
  Env files    .env  ·  .env.example

── CODEBASE ──────────────────────────────────────────────────────────
  TypeScript    142 files   18k lines   ████████████████████  88%
  JavaScript      8 files    1.1k lines ███░░░░░░░░░░░░░░░░░░   6%
  ────────────────────────────────────────────────────────────────────
  YAML            3 files     440 lines
  Markdown        4 files     220 lines

── GIT ───────────────────────────────────────────────────────────────
  Branch  main  ·  first commit 2 years ago
  Last commit  3 days ago  alice: "feat: add OAuth providers"  a1b2c3d
  Activity    28 commits  ·  4 contributors  (last 30 days)

──────────────────────────────────────────────────────────────────────
  Analyzed 198 files in 0.2s

  codeglance --markdown  save this as codebase-tour.md
  codeglance --for-ai    generate a compact LLM context brief
  codeglance --json      machine-readable output
```

---

## Install

**No install needed:**
```bash
npx codeglance
npx codeglance ./path/to/repo
```

**Or install globally:**
```bash
npm install -g codeglance
```

---

## Usage

```bash
codeglance [path]               # analyze current directory or given path
codeglance --markdown           # print Markdown report
codeglance --for-ai             # LLM context brief
codeglance --json               # machine-readable output
codeglance --output tour.md     # save to file
codeglance --no-git             # skip git analysis
codeglance --help               # all options
```

### Save as living onboarding doc

```bash
codeglance --markdown --output docs/codebase-tour.md
```

Check it into your repo. Regenerate whenever the architecture changes.

### Brief an LLM in seconds

Instead of manually writing "this is a Next.js app with Prisma…" every time you open a new chat:

```bash
codeglance --for-ai | pbcopy   # macOS
codeglance --for-ai | xclip    # Linux
```

Paste it as your opening context. No code dumped. No token waste.

### Use in CI

```bash
# In a GitHub Actions workflow:
- run: npx codeglance --json > codeglance-report.json
```

---

## Supported ecosystems

| Ecosystem | Manifest | Frameworks detected |
|-----------|----------|---------------------|
| Node.js | `package.json` | Next.js, Express, Fastify, NestJS, React, Vue, Angular, Svelte, Astro, and 40+ more |
| Go | `go.mod` | Gin, Echo, Fiber, Chi, GORM, Cobra, gRPC, and more |
| Rust | `Cargo.toml` | Axum, Actix-web, Rocket, Tokio, SQLx, Clap, and more |
| Python | `pyproject.toml`, `requirements.txt` | FastAPI, Django, Flask, SQLAlchemy, Pytest, Ruff, and more |
| Java | `pom.xml`, `build.gradle` | Spring Boot, Quarkus *(basic)* |
| Ruby | `Gemfile` | Rails, Sinatra, RSpec *(basic)* |

Missing your ecosystem? [Add a detector →](#contributing)

---

## Why not tokei / scc / repomix?

| | codeglance | tokei | scc | repomix | code2prompt |
|---|:---:|:---:|:---:|:---:|:---:|
| Framework detection | ✓ | ✗ | ✗ | ✗ | ✗ |
| Run/build/test commands | ✓ | ✗ | ✗ | ✗ | ✗ |
| Entry points | ✓ | ✗ | ✗ | ✗ | ✗ |
| "Files to read first" | ✓ | ✗ | ✗ | ✗ | ✗ |
| CI / Docker / linting detection | ✓ | ✗ | ✗ | ✗ | ✗ |
| Language stats | ✓ | ✓ | ✓ | ✗ | ✗ |
| LLM context brief | ✓ | ✗ | ✗ | sort-of | sort-of |
| Zero config | ✓ | ✓ | ✓ | ✓ | ✗ |
| No API key required | ✓ | ✓ | ✓ | ✓ | ✓ |

**tokei / scc** answer "how much code is there." **repomix** packs your codebase *for* AI consumption. **codeglance** helps you *understand* a repo before you write a line.

---

## Contributing

codeglance is designed to be extended. Each ecosystem is a self-contained detector module.

**Adding a new framework detector is a great first PR.** Here's all it takes:

```typescript
// src/detectors/frameworks.ts  — add to the appropriate ecosystem array:

const MY_ECOSYSTEM_FRAMEWORKS: FrameworkDef[] = [
  { name: 'My Framework', category: 'web_framework', keys: ['my-framework-package'] },
];
```

Then add a fixture and a test:

```bash
tests/fixtures/my-project/
  package.json        # or go.mod, Cargo.toml, etc.
  src/main.ts         # minimal source file

tests/core/frameworks.test.ts   # add a describe block
```

Run `npm test` to confirm it works.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. Open issues labeled
[**good first issue**](https://github.com/username/codeglance/issues?q=label%3A%22good+first+issue%22)
are waiting for you.

---

## Roadmap

**v0.2**
- [ ] `--since` / `--diff` mode: "what changed since main branch"
- [ ] Import graph analysis for smarter "start here" ranking
- [ ] Java/Kotlin: Spring Boot, Gradle script extraction
- [ ] PHP/Ruby ecosystem improvements

**v0.3**
- [ ] GitHub Action: post codeglance summary as PR comment
- [ ] Badge generator: `![codeglance](https://...)`
- [ ] `--watch` mode: re-analyze when files change

**Future**
- [ ] VS Code extension (sidebar panel)
- [ ] Web / SVG architecture export
- [ ] Plugin system for custom detectors

Have an idea? [Open an issue →](https://github.com/username/codeglance/issues)

---

## How it works

codeglance reads **manifest files** (not source code) to detect frameworks and commands. It never sends your code anywhere. Analysis is local and fast.

- `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml` → framework and library names
- `package.json scripts`, `Makefile`, `Cargo.toml`, `go.mod` → run/build/test commands
- File existence checks → entry points, CI config, Docker, test directories
- Heuristic file scoring (depth, filename patterns, size) → "start here" ranking
- `simple-git` (local git binary) → branch, commits, contributors

Everything is heuristic. codeglance does not parse or understand your code. It tells you what it can infer from structure and manifests — and says so clearly.

---

## License

MIT — see [LICENSE](LICENSE).
