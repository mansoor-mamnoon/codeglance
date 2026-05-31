# Launch Plan

## Pre-launch checklist

### Repository
- [ ] README has a real terminal screenshot (not placeholder text)
- [ ] `npx codeglance` works on a clean machine with no prior install
- [ ] Run codeglance against 3–5 popular repos and screenshot the output
- [ ] Published to npm (`npm publish`)
- [ ] GitHub Actions CI is green on main
- [ ] All 56+ tests pass
- [ ] Version is 0.1.0 in package.json and CHANGELOG

### Demo screenshots to prepare
Run codeglance on these repos and screenshot the terminal output:

```bash
git clone https://github.com/vercel/next.js /tmp/nextjs && node dist/index.js /tmp/nextjs
git clone https://github.com/fastapi/fastapi /tmp/fastapi && node dist/index.js /tmp/fastapi
git clone https://github.com/tokio-rs/axum /tmp/axum && node dist/index.js /tmp/axum
git clone https://github.com/gin-gonic/gin /tmp/gin && node dist/index.js /tmp/gin
```

Save as `docs/screenshots/` and reference in README.

### GIF recording checklist
1. Use [VHS](https://github.com/charmbracelet/vhs) or [asciinema](https://asciinema.org/)
2. Record: `npx codeglance` on a well-known repo (next.js or fastapi)
3. Keep the GIF under 3MB
4. Upload to repo as `docs/demo.gif`
5. Add to README above-the-fold

---

## Launch sequence

### Day 0 (prep, 2 hours before)
- [ ] Push final code to GitHub (public)
- [ ] `npm publish`
- [ ] Post a short personal note on X/Twitter teasing the launch ("launching something tomorrow")

### Launch day (Tuesday–Thursday, 8–10am US Eastern)

**Step 1: Hacker News (highest leverage)**

Post as: `Show HN: codeglance – the 10-second codebase tour`

Write this as the first comment (pin it immediately):

> I built codeglance after spending too much time in the first hours of a new codebase. I kept doing the same thing: `cat package.json`, `ls src/`, `git log --oneline -10`, `cat README.md`, trying to piece together "how do I actually run this thing?"
>
> codeglance answers in one command: what framework this is (not just the language), the actual commands to run/build/test it, which files to open first, and what CI/Docker/tooling is set up. No API keys. No config. Works offline.
>
> The `--for-ai` flag was the thing that made me ship it — I use it to set context for Claude/GPT without dumping hundreds of files.
>
> Happy to answer questions about the framework detection approach or the heuristics.

**Step 2: Reddit (same day, after HN post)**

- r/programming: "I built a CLI that gives you a 10-second tour of any codebase"
- r/javascript: "codeglance – run this in any JS/TS repo to understand it instantly"
- r/golang: "codeglance – detects Gin/Echo/GORM/Cobra and shows you how to run a Go project"
- r/rust: "codeglance – detects Axum/Tokio/Clap and shows run/build/test commands"
- r/Python: "codeglance – detects FastAPI/Django/Flask and shows how to run Python projects"

**Step 3: Twitter/X (same day)**

See `social-copy.md` for the exact thread.

**Step 4: LinkedIn (same day)**

See `social-copy.md` for the post.

**Step 5: Dev communities**

- Dev.to article: post blog post (see `blog-post.md`)
- Discord: post in developer tooling / open-source channels
- Slack: relevant JavaScript/Go/Rust/Python communities

---

## First week goals

- 200 GitHub stars (realistic minimum)
- 500 npm installs
- At least one community (Go, Rust, Python, or JS) picks it up organically
- One contributor submits a new detector

## One month goals

- 1,000 GitHub stars
- Featured in one newsletter (JavaScript Weekly, Go Weekly, Rust Weekly, Python Weekly)
- 5+ contributors
- Multiple ecosystem improvements merged

---

## Long-term growth mechanics

**Evergreen discovery:**
- "codebase analysis cli" searches on GitHub and npm
- Added to `awesome-cli-apps` and similar curated lists
- Mentioned in developer tooling blog posts

**Fork/contribution magnet:**
- "good first issue: add X detector" issues
- Clear CONTRIBUTING.md with step-by-step guide
- Each PR is a new ecosystem = new community discovers codeglance

**Word of mouth:**
- Teams add `codeglance --markdown` to their onboarding scripts
- Every `codebase-tour.md` checked into repos links back to codeglance
- The `--for-ai` use case shared among AI-assisted development communities
