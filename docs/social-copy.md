# Social Launch Copy

## Twitter/X thread

**Tweet 1 (hook):**
```
You cloned a repo.

Now what?

`npx codeglance` answers in 10 seconds:
• what framework it actually uses (not just "TypeScript")
• the run/build/test commands
• which files to open first
• CI, Docker, test setup

No API keys. No config. Works offline.
```

**Tweet 2 (demo):**
```
On a Next.js + Prisma + tRPC app:

── WHAT IS THIS ──────────────────────
  Next.js 14 with Prisma, tRPC
  Pkg manager pnpm
  ORM / DB    Prisma
  Auth        Auth.js

── HOW TO RUN IT ─────────────────────
  pnpm dev     start Next.js dev server
  pnpm build   build for production
  pnpm test    run test suite

── WHERE TO START ────────────────────
  src/app/page.tsx        main entry
  src/server/routers/     tRPC router
  prisma/schema.prisma    data model

0.2s on 198 files.
```

**Tweet 3 (the LLM angle):**
```
The feature I use most: `--for-ai`

Instead of manually writing "this is a Next.js app with Prisma..." 
every time I open Claude/GPT, I do:

npx codeglance --for-ai | pbcopy

Paste as context. Compact, structured, no code dumped.
```

**Tweet 4 (call to action):**
```
Open source, MIT licensed, easy to extend.

Each ecosystem is one self-contained detector module. 
Adding support for your stack is ~10 lines + a test.

https://github.com/mansoor-mamnoon/codeglance

Would love your ⭐ and feedback.
```

---

## LinkedIn post

```
I built a small CLI that's been saving me 15 minutes every time I land in a new codebase.

The problem: you clone a repo and you have no idea where to start. You end up manually 
cat-ing package.json, reading the README (if it exists), running ls -la, checking git log. 
Piecing it together takes time.

The solution: `npx codeglance`

It gives you a structured, 10-second tour of any repository:
- What framework it actually uses ("Next.js 14 with Prisma" not just "TypeScript")
- The exact commands to run, build, and test it — extracted from real config files
- Which files to open first (heuristic-ranked)
- CI system, Docker, test runner, env files detected
- Git activity summary

My favorite feature is `--for-ai`, which generates a compact context brief you can paste into 
Claude or ChatGPT to orient it about a codebase. No more manually writing "this is a Django app..."

Supports Node.js, Go, Rust, and Python out of the box. Open source (MIT), no API keys, works offline.

https://github.com/mansoor-mamnoon/codeglance

Built for developers who work across multiple repos, join new teams, or evaluate open-source 
dependencies. If that's you, give it a try and let me know what you think.
```

---

## Hacker News post

**Title:** `Show HN: codeglance – the 10-second codebase tour`

**First comment (pin immediately after posting):**

```
Hey HN — I'm the author.

The problem I was trying to solve: every time I land in an unfamiliar codebase, I spend 
10–15 minutes doing the same ritual. `cat package.json`. `ls src/`. `git log --oneline`. 
Maybe there's a good README, maybe there isn't. I'm piecing together: how do I run this, 
what does it actually use, where is the main logic?

codeglance does this in one command. It reads manifest files (not source code), detects 
frameworks by name/version ("Next.js 14 with Prisma and Tailwind CSS", not just "TypeScript"), 
extracts the actual run/build/test commands, and ranks files by heuristic importance.

Three things I'm happy with:

1. The `--for-ai` mode. I use it to paste context at the start of a Claude session. Instead 
of spending tokens on "explain this codebase" or manually writing the context, I run 
codeglance and paste the output. Compact, structured, no source code dumped.

2. The architecture. Each ecosystem is a self-contained detector module (~50 lines). Adding 
Go support took one afternoon. Adding Rust took even less. I designed it so "add support for 
Laravel" is a genuine good-first-issue, not a research project.

3. It's honest about being heuristic. The output says "(ranked by heuristics — not semantic 
analysis)". It doesn't fake intelligence. It reads files and reports what it finds.

Happy to discuss the detection approach, the heuristics, or anything else.
```

---

## Reddit post (r/programming)

**Title:** I built a CLI that gives you a 10-second tour of any codebase

```
You clone a repo and have no idea where to start. I kept doing the same thing every time: 
read the README, cat the package.json, look at the directory structure, run git log. 
Takes 15 minutes.

I built codeglance to do it in one command: `npx codeglance`

What it shows you:
- **What framework it uses** — not just "TypeScript" but "Next.js 14 with Prisma and Tailwind"
- **How to run it** — actual commands extracted from package.json, Makefile, Cargo.toml, go.mod
- **Where to start** — entry points and key files ranked by heuristic importance  
- **What tools** — CI system, Docker, test runner, linting, env files
- **Git activity** — branch, recent commits, contributors

Also has `--for-ai` mode that generates a compact LLM context brief.

Supports Node.js (50+ frameworks), Go, Rust, and Python. Zero config, works offline, MIT licensed.

GitHub: https://github.com/mansoor-mamnoon/codeglance

Feedback welcome, especially from people who work on Go/Rust/Python — the Node.js detection 
is more thorough right now and I want to improve the others.
```
