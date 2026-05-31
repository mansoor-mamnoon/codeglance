# Strategy Memo v2: codeglance

## The Repositioned Core Promise

**"Open a repo. Run one command. Know where to start."**

The previous framing — "neofetch for codebases" — was a useful analogy but the wrong north star.
Neofetch shows system facts nobody acts on. codeglance must show facts developers immediately act on.

The real pain it solves: **onboarding friction**.

You clone a repo. You have no idea:
- How to run it
- What commands exist
- What framework/tools it actually uses (not just "TypeScript")
- Where the main logic lives
- Which files to read first
- What the CI pipeline does
- Whether there's Docker, what the test strategy is

You can piece this together in 10–15 minutes by reading README, package.json, exploring dirs, running git log. Or you run one command.

That is the product.

---

## Revised Positioning

**Name:** codeglance  
**Tagline:** The 10-second codebase tour.  
**One-liner:** Open a repo. Run one command. Know where to start.  
**Target user:** Developer who just cloned an unfamiliar repo, or is evaluating a dependency, or returning to a project after months away.

**What it is not:**
- A line counter (tokei/scc do that)
- A codebase packer for AI (repomix does that)
- A static analysis tool
- A dependency vulnerability scanner

**What it is:**
A heuristic, zero-config codebase orientation tool that answers: "What is this, how do I run it, where do I start?"

---

## Top 5 Reasons Someone Stars This

1. **"I ran it on a repo I just cloned and it instantly told me the commands, framework, and where to start."**  
   That moment of "this would have saved me 20 minutes" = immediate star.

2. **"The output is beautiful and I want to show people."**  
   Screenshot culture. Like neofetch, starship prompt, btop — beautiful terminal tools get shared.
   
3. **"The `--for-ai` flag is exactly the context brief I've been building manually."**  
   Every developer using Claude/Copilot/Cursor is manually writing "this is a Next.js app with Prisma..." to set context. codeglance automates that.

4. **"It detected Next.js + Prisma + Tailwind from my repo, not just TypeScript."**  
   Framework-level intelligence vs. language-level is a meaningful differentiator that makes people say "how did it know?"

5. **"I added `codeglance --markdown > CODEBASE_TOUR.md` to our onboarding."**  
   Teams will adopt this as a living onboarding doc generator. Every team member becomes a forker.

---

## Top 5 Reasons Someone Forks This

1. **Add a detector for their ecosystem** (clearly documented, plugin-style architecture)
2. **Customize `--for-ai` output** for their company's LLM workflow
3. **Build the GitHub Action** that posts codeglance output on PRs (this is a roadmap item they'll want now)
4. **Add a new renderer** (web dashboard, SVG diagram, etc.)
5. **Integrate with their internal tooling** (team onboarding docs, Confluence, Notion)

---

## Top 5 Reasons This Could Fail

1. **Output is obvious and adds no value** — if codeglance just shows `cat package.json` in a prettier format, developers will say "I can do this myself." Mitigation: framework detection must go deeper than raw dep names. "Next.js 14 App Router" not "next:^14.0.0".

2. **"Start here" ranking is wrong and damages trust** — if codeglance recommends the wrong files, it's worse than nothing. Mitigation: use transparent, simple heuristics (root proximity + name patterns). Do not claim semantic understanding.

3. **Too slow on large repos** — if scanning linux (70k files) takes 30 seconds, the promise is broken. Mitigation: cap analysis at 10k files, show a note for larger repos, optimize the scanner.

4. **Confused with repomix** — repomix has ~10k stars in the same general space. Mitigation: comparison table in README, clear differentiation: repomix = pack for AI, codeglance = understand repo.

5. **Looks like AI slop** — generic output that applies to every repo equally. Mitigation: every section must contain repo-specific facts extracted from actual files. The framework names, script commands, detected tools are all real.

---

## How the Implementation Avoids Being Generic

The differentiating modules:

**`frameworks.ts`** — Framework/tool detection. Not just "TypeScript" but "Next.js 14 with App Router, Prisma ORM, Tailwind CSS, Vitest." Reads `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml` and maps specific dependency names to framework names + versions. This is the most valuable module.

**`scripts.ts`** — Command extraction. Reads `package.json` scripts, `Makefile` targets, `Cargo.toml` aliases, `pyproject.toml` task runner configs, and outputs: "to build: `npm run build`; to test: `npm test`." Not stats — executable instructions.

**`starthere.ts`** — File importance heuristic. Ranks source files by: root proximity, canonical name patterns (main, app, server, router, schema, types), size in the "readable range" (30–500 lines). Honest about being heuristic, not semantic.

**`--for-ai` mode** — Generates a compact, structured markdown brief designed to be pasted into an LLM context. Contains: what the project is, key commands, entry points, architecture notes, files to read first. This is directly useful, not decorative.

---

## Exact MVP Feature Set

### Tier 1: Ship in v0.1.0 (non-negotiable)

1. **Framework + tool detection** — reads manifest files, detects framework names with versions, CI, test runner, container setup, linting
2. **Script extraction** — actual run/build/test commands from manifest files
3. **Entry point detection** — the files you open first
4. **"Start here" file ranking** — top 5–8 files by heuristic importance
5. **Language stats** — brief section, not the headliner
6. **Beautiful terminal output** — screenshot-worthy, readable at a glance
7. **`--json` output** — structured, automation-friendly
8. **`--markdown` output** — saves a `codebase-tour.md`
9. **`--for-ai` mode** — compact LLM context brief
10. **Zero-config `npx codeglance`** — works instantly

### Tier 2: v0.2.0 (roadmap, not faked)

- `--since` / diff mode (what changed since main)
- Import graph for smarter "start here" ranking
- GitHub Action that posts codeglance summary on PRs
- Badge generator (`![codeglance](badge)`)

### Tier 3: Future vision (aspirational)

- VS Code extension (sidebar panel)
- Web/SVG architecture export
- Complexity/risk heatmap
- Plugin system for custom detectors

---

## Architecture: Clean Detector Separation

```
src/
├── detectors/               ← each file = one ecosystem/concern
│   ├── frameworks.ts        ← THE key module: Next.js, FastAPI, Gin, etc.
│   ├── scripts.ts           ← run/build/test command extraction
│   ├── entrypoints.ts       ← canonical entry file detection
│   ├── starthere.ts         ← file importance ranking
│   ├── languages.ts         ← file extension → language stats
│   ├── tools.ts             ← CI, Docker, test runner, linting, etc.
│   └── git.ts               ← branch, recency, contributor count
├── scanner.ts               ← file walker (respects .gitignore)
├── analyzer.ts              ← orchestrator: runs all detectors in parallel
├── renderers/
│   ├── terminal.ts          ← chalk-based beautiful output
│   ├── markdown.ts          ← --markdown flag
│   └── forai.ts             ← --for-ai flag
└── index.ts                 ← CLI entry (commander)
```

Why this structure wins for forks: each detector is a self-contained module. Adding a new ecosystem = add one file, register in analyzer.ts. No giant files, no hidden coupling.

---

## Exact README Above-the-Fold Section

```markdown
<h1 align="center">
  codeglance
</h1>

<p align="center">
  The 10-second codebase tour.<br>
  <em>Open a repo. Run one command. Know where to start.</em>
</p>

[terminal screenshot]

<p align="center">
  <code>npx codeglance</code>
</p>

---

You cloned a repo. codeglance answers the questions you'd otherwise spend 15 minutes on:

- **What is this?** Next.js 14 / FastAPI / Gin / Axum — not just "TypeScript"
- **How do I run it?** Actual commands extracted from package.json, Makefile, Cargo.toml
- **Where do I start?** Entry points and key files ranked by importance
- **What tools does it use?** CI, test runner, Docker, linting, formatting
- **How do I brief an LLM?** `--for-ai` generates a compact context brief

No API keys. No config. Works on any repo.

## Quick start

npx codeglance                    # analyze current directory
npx codeglance ./path/to/repo     # analyze a specific path
npx codeglance --markdown         # save as codebase-tour.md
npx codeglance --for-ai           # generate LLM context brief
npx codeglance --json             # structured output for CI/scripts
```

---

## Why Not tokei / scc / repomix / code2prompt?

| | codeglance | tokei/scc | repomix | code2prompt |
|---|:---:|:---:|:---:|:---:|
| Framework detection | ✓ | ✗ | ✗ | ✗ |
| Run/build/test commands | ✓ | ✗ | ✗ | ✗ |
| Entry points | ✓ | ✗ | ✗ | ✗ |
| "Files to read first" | ✓ | ✗ | ✗ | ✗ |
| Tool detection (CI, Docker) | ✓ | ✗ | ✗ | ✗ |
| Language stats | ✓ | ✓ | ✗ | ✗ |
| LLM context brief | ✓ | ✗ | sort-of | sort-of |
| Zero config | ✓ | ✓ | ✓ | ✗ |

tokei/scc answer "how much code is there." codeglance answers "what is this and how do I work with it."
repomix packs your codebase for AI consumption. codeglance helps you understand it first.

---

## Star/Fork Potential Assessment (revised)

| Factor | Score | Notes |
|--------|-------|-------|
| Pain severity | 9/10 | Onboarding to new codebases is a daily developer pain |
| Market gap | 9/10 | Nothing does framework detection + commands + start-here |
| Demo quality | 9/10 | Framework names + commands = immediately impressive output |
| Virality | 8/10 | `--for-ai` is shareable; teams adopt `--markdown` for onboarding |
| Achievable quality | 8/10 | All features are heuristic file-reads, no ML required |
| **Overall** | **8.6/10** | High confidence |

Realistic first-month estimate with HN + Reddit launch: 1,000–3,000 ⭐
