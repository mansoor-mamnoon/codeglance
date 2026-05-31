# Changelog

All notable changes to this project will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

## [0.1.0] — 2026-05-31

### Added

- **Framework detection** for Node.js (50+ packages), Go, Rust, Python — detects
  "Next.js 14 with Prisma and Tailwind CSS", not just "TypeScript"
- **Script extraction** from `package.json`, `Makefile`, `Cargo.toml`, `go.mod`,
  `pyproject.toml` — shows real run/build/test commands
- **Entry point detection** — finds the files you open first in any ecosystem
- **"Start here" file ranking** — heuristic ranking of source files by importance
- **Tool detection** — CI system, Docker, test runner, linting, env files
- **Language stats** — line counts by language with visual bars
- **Git integration** — branch, last commit, recent activity
- **Three output modes**:
  - Terminal (default): beautiful chalk-based output
  - `--markdown`: saves a `codebase-tour.md`
  - `--for-ai`: compact LLM context brief
  - `--json`: structured output for CI/automation
- **Zero-config CLI** — `npx codeglance` works instantly
- 56 unit tests across all detector modules
- GitHub Actions CI on Node.js 18, 20, 22
