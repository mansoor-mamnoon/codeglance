# Honest Self-Review

This document is a brutally honest assessment of codeglance as of v0.1.0.
Not marketing. Not a changelog. Just an honest account of what works, what doesn't, and what needs to improve.

---

## What is genuinely useful

**Framework detection.** When it works, this is the best thing codeglance does. Running it on a Next.js + Prisma + tRPC project and seeing "Next.js 14 with Prisma, tRPC" instead of "TypeScript" is immediately impressive. The detection is based on manifest files (package.json, go.mod, etc.) and is accurate for the 50+ mapped packages.

**Script extraction.** Showing the real commands from package.json, Makefile, Cargo.toml is consistently useful. Developers immediately know how to run, build, and test the project. This works well across all five ecosystems.

**Entry point detection.** For standard projects, finding `src/app/page.tsx`, `cmd/serve/main.go`, `src/main.rs` and surfacing them as "where to start" is accurate and time-saving.

**Tool detection.** CI system, Docker, test directory, env files — these are checked by file existence and are reliable. The output for a well-structured project is comprehensive.

**`--for-ai` mode.** The compact context brief is genuinely useful for LLM-assisted development. It's better than manually writing "this is a Next.js app with..." and better than dumping 200k tokens of source code.

---

## What is still shallow

**"Start here" file ranking.** The heuristic (file depth + name pattern + size) is reasonable but imprecise. On a large, unfamiliar repo, it often surfaces the right files but sometimes includes obvious config files (next.config.ts) while missing the most important business logic files. This will need import graph analysis in v0.2 to be truly useful.

**The Python ecosystem.** The FastAPI/Django/Flask detection is good. But script extraction for Python falls back to bare `pytest` and `ruff check .` without understanding project-specific task runners (Taskfile, Poe, Makefile integration). The "HOW TO RUN IT" section for Python projects is often less specific than for Node.js or Go projects.

**Monorepos.** codeglance analyzes a directory as a single project. If that directory is a monorepo root (Turborepo, Nx, Go workspaces, Cargo workspace), the output is a summary of the entire monorepo rather than a meaningful per-package analysis. This is a known gap.

**Java/Kotlin/PHP/Ruby.** These ecosystems are listed as "basic" because the detection is shallow. `pom.xml` and `build.gradle` presence is detected but no framework names are extracted. This will read as "Unknown project type" for Java projects.

**Git section in shared repos.** When analyzing a subdirectory of a larger git repo (as the test fixtures are), git shows the parent repo's info. This is technically correct (the directory IS in that git repo) but can be confusing.

---

## Where the heuristics fail

1. **Projects with non-standard manifests** — If a Go project doesn't use Go modules (`go.mod`) or a Node.js project doesn't have `package.json` in the root, detection fails. Monorepos with package.json only in subpackages are detected but the root is marked as "Unknown".

2. **Multi-ecosystem projects** — A repo with both `package.json` (frontend) and `go.mod` (backend) will only detect one ecosystem (whichever is found first). The priority order is: Node.js → Go → Rust → Python → C++.

3. **Large obfuscated or generated codebases** — The "start here" ranking breaks down when a repo has many generated/minified files alongside small source files.

4. **Non-standard test directories** — Tests in `spec/`, `__spec__/`, `__test__/` (singular) may not be detected; the health check only looks for common names.

---

## What competitors do better

- **tokei/scc** — Much more comprehensive language detection (150+ vs ~60 languages). More accurate LOC counting (they exclude comments and blanks; codeglance counts raw lines). Much faster on very large repos.
- **repomix/code2prompt** — Better for when you actually want to feed code to an LLM. codeglance's `--for-ai` is a context brief, not a code dump. For deep code understanding by an LLM, those tools win.
- **GitHub itself** — Shows language breakdown and detected topics. Not installable offline, but the GitHub UI conveys similar info with zero setup.

---

## What must improve before v0.2

1. **Monorepo detection** — At minimum, detect the presence of a monorepo tool (Turborepo, Nx, Cargo workspace, Go workspace) and say so in the output.
2. **Java/Spring Boot** — Java is the third most popular language on GitHub. Not supporting it properly is a significant gap.
3. **Multi-ecosystem projects** — Detect both ecosystems and show a combined view or note the split.
4. **Python run command** — `uvicorn src.main:app --reload` is the canonical FastAPI dev command. codeglance doesn't know this unless the project has a Makefile or taskipy entry. Should infer it when FastAPI is detected.
5. **Import graph for "start here"** — Even a simple regex-based import count would dramatically improve ranking quality.

---

## Why a developer would star this

1. They run it on a repo they just cloned and it immediately gives them "Next.js 14 with Prisma, tRPC" + the real pnpm commands + the exact files to open. That's a "wow" moment.
2. They use `--for-ai` to replace their manual context-writing ritual.
3. Their team adopts `codeglance --markdown > docs/codebase-tour.md` as a living onboarding doc.
4. They fork it to add a detector for their ecosystem (the contribution path is genuinely easy).

---

## Why a developer would NOT star this

1. They run it on their own project and the "what is this" description is generic or wrong.
2. They run it on a Java/monorepo/PHP project and get shallow output.
3. The "start here" ranking surfaces config files over real business logic.
4. They feel like they could get the same info by running `cat package.json && ls src/` in 10 seconds.
5. The terminal output doesn't render well in their terminal (some emoji/unicode edge cases).

---

## Launch-readiness assessment (May 2026)

**Strengths that are real:**
- Framework detection is impressive when it works
- Script extraction is reliably useful
- Zero config, works immediately with npx
- The `--for-ai` mode is genuinely novel
- 70 tests, CI on three Node.js versions, clean TypeScript

**Gaps that need honest acknowledgment:**
- Java support is missing (stated in README)
- Monorepo support is limited (stated in README + Limitations)
- "Start here" ranking is heuristic (stated in output)
- Python dev command inference is weak

**Overall:** Launch-ready for v0.1 with the current limitations clearly stated. The tool is useful for its core audience (developers working with Node.js, Go, Rust, and Python repos) and honest about its boundaries.
