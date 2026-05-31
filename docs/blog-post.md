# Blog Post Draft: codeglance — the 10-second codebase tour

**Working title:** "The 10-second codebase tour: why I built codeglance"

---

Every developer has done this. You clone a repository for the first time. It could be a new job, a dependency you're evaluating, an open-source project you want to contribute to, or just a repo you starred six months ago and finally came back to.

You open the terminal. And then you start your ritual.

```bash
cat README.md       # if it exists
cat package.json    # or go.mod, Cargo.toml, requirements.txt
ls -la
ls src/
git log --oneline -10
```

You're piecing together the same questions every time:

- What framework does this actually use?
- How do I run it in development?
- What's the test command?
- Where does the main logic live?
- Is there Docker? CI? What CI?

It takes 10–15 minutes. For every unfamiliar repo.

I built [codeglance](https://github.com/mansoor-mamnoon/codeglance) to answer these questions in one command.

## What codeglance does

`npx codeglance` gives you a structured, 10-second tour of any repository:

```
── WHAT IS THIS ──────────────────────────────────────────────────────
  Next.js 14 with Prisma, tRPC
  Runtime     Node.js >=18
  Pkg manager pnpm

── HOW TO RUN IT ─────────────────────────────────────────────────────
  pnpm dev     start Next.js dev server
  pnpm build   build for production
  pnpm test    run Vitest test suite
  pnpm lint    lint codebase

── WHERE TO START ────────────────────────────────────────────────────
  src/app/page.tsx         main entry
  src/server/routers/      tRPC router
  prisma/schema.prisma     data model

── TOOLS DETECTED ────────────────────────────────────────────────────
  Testing      Vitest  ·  Playwright (tests/)
  CI/CD        GitHub Actions (4 workflows)
  Container    Docker  ·  docker-compose
```

That's "Next.js 14 with Prisma" — not just "TypeScript". Those are the real `pnpm` commands from the `package.json` scripts. Those are the actual entry points detected by checking which files exist.

## How it works

codeglance reads **manifest files** — it never reads source code. It reads `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `Makefile`, and a handful of config files. Everything is local, offline, and fast (typically under half a second).

**Framework detection** is a lookup: each known package name maps to a framework name and a category. `next` → "Next.js". `github.com/gin-gonic/gin` → "Gin". `axum` in `Cargo.toml` → "Axum". Simple, but the output is meaningfully more useful than listing language percentages.

**Command extraction** reads the `scripts` field from `package.json`, `PHONY` targets from `Makefile`, the standard `cargo` commands for Rust projects, and `go run`/`go test` for Go projects.

**Entry point detection** checks for the presence of canonical files: `src/index.ts`, `main.go`, `cmd/*/main.go`, `src/main.rs`, `manage.py`, etc.

**"Start here" ranking** uses heuristics: files closer to the root score higher, files with canonical names (index, server, router, schema, types) score higher, test files and generated files are excluded.

## The `--for-ai` flag

The feature I use most isn't the terminal output — it's `--for-ai`.

Every time I open a new Claude or ChatGPT session to work on an unfamiliar codebase, I need to give the LLM context. I used to write this manually: "This is a Next.js 14 application with the App Router. It uses Prisma for the database and tRPC for the API layer. The main entry point is..."

`codeglance --for-ai` generates this brief automatically. It's compact (fits in ~400 tokens), structured (markdown headers LLMs handle well), and honest about being heuristic.

```bash
codeglance --for-ai | pbcopy   # macOS: paste into Claude
```

## The architecture

I wanted codeglance to be genuinely forkable and extensible. Each ecosystem is a self-contained block of code:

```typescript
const NODE_FRAMEWORKS: FrameworkDef[] = [
  { name: 'Next.js',    category: 'web_framework', keys: ['next'] },
  { name: 'Express',    category: 'web_framework', keys: ['express'] },
  // ... 40+ more
];
```

Adding support for a new framework is 3 lines of code and a test. Adding support for an entirely new ecosystem (PHP + Composer, for example) is a self-contained function that reads one manifest file.

The contribution path is intentional: "good first issue: add a detector for X" is a real thing you can do in an afternoon. Each contribution makes codeglance useful to an entirely new community.

## Why not X?

**tokei / scc** are great at counting lines. They answer "how much code is there." They don't answer "what is this" or "how do I run it."

**repomix** packs your codebase into a file for AI consumption. That's a different problem: once you know what a codebase is, repomix helps you feed it to an LLM. codeglance helps you understand it first.

**code2prompt** is similar to repomix. Same distinction applies.

## Get it

```bash
npx codeglance
```

Zero install. Works on any repo. The source is at [github.com/mansoor-mamnoon/codeglance](https://github.com/mansoor-mamnoon/codeglance).

If you work across many repos, onboard new developers, or use AI coding assistants, I think you'll find it useful. And if your favorite ecosystem isn't well-supported yet, opening a PR is genuinely easy — the CONTRIBUTING guide walks through exactly what to add.

---

*codeglance is MIT licensed and open to contributions.*
