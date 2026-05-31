# Pre-Launch Checklist

Work through this before posting to HN, Reddit, or any community.

---

## Repository hygiene

- [ ] `npm test` passes (70 tests, 5 test files)
- [ ] `npm run typecheck` passes (strict TypeScript, no errors)
- [ ] `npm run build` produces `dist/index.js`
- [ ] `npm run lint` passes (no ESLint warnings)
- [ ] Zero placeholder content in README (`grep -r "username" README.md`)
- [ ] All badges link to real pages OR are removed
- [ ] README claims are verified by running the tool (see "Claim verification" below)
- [ ] `docs/codebase-tour.md` is generated and committed (`node dist/index.js . --markdown > docs/codebase-tour.md`)
- [ ] CHANGELOG.md reflects the v0.1.0 release
- [ ] LICENSE file is present

## npm package

- [ ] Package name `codeglance` is available: `npm info codeglance` → should 404
- [ ] `npm pack` produces a clean tarball: `npm pack && tar -tvf codeglance-0.1.0.tgz`
- [ ] Tarball only contains `dist/`, `README.md`, `LICENSE` (no source, no node_modules)
- [ ] Version in package.json matches CHANGELOG
- [ ] `files` field in package.json: `["dist", "README.md", "LICENSE"]`
- [ ] `npm publish --dry-run` to verify what would be published

## Install verification (run every step)

```bash
# 1. Pack and install locally
npm pack
npm install -g ./codeglance-0.1.0.tgz

# 2. Verify the global install
codeglance --help
codeglance --version

# 3. Run on current directory
codeglance .

# 4. Run all output modes
codeglance --for-ai
codeglance --markdown --output /tmp/tour.md && cat /tmp/tour.md
codeglance --json | python3 -m json.tool | head -20
codeglance --no-git .

# 5. Uninstall and test npx
npm uninstall -g codeglance
npx codeglance@latest .
```

Each step must work without errors.

## Test on well-known repos (after npm publish)

```bash
git clone --depth 1 https://github.com/charmbracelet/glow /tmp/glow-test
npx codeglance /tmp/glow-test
# Expected: "CLI tool (Go) using Cobra", Cobra detected, golangci-lint

git clone --depth 1 https://github.com/tiangolo/full-stack-fastapi-template /tmp/fapi-test
npx codeglance /tmp/fapi-test
# Expected: TypeScript + Python mixed repo, 14 workflows detected
```

## README claim verification

Run each of these and confirm the output matches the README examples:

```bash
node dist/index.js tests/fixtures/node-project  # should show Next.js 14 + pnpm
node dist/index.js tests/fixtures/python-project # should show FastAPI
node dist/index.js tests/fixtures/go-project    # should show Gin
node dist/index.js tests/fixtures/rust-project  # should show Axum
node dist/index.js tests/fixtures/cpp-project   # should show CMake + GoogleTest
```

## Terminal screenshot / GIF

- [ ] Record a GIF of `npx codeglance` running on a well-known repo (e.g., Next.js or FastAPI)
- [ ] GIF is < 3MB
- [ ] GIF is uploaded to the repo as `docs/demo.gif`
- [ ] README references the GIF above the fold
- [ ] Screenshot looks good in both light and dark terminal themes

**Tool to record GIF:** [VHS](https://github.com/charmbracelet/vhs) (recommended) or [asciinema](https://asciinema.org/) + [agg](https://github.com/asciinema/agg)

```bash
# VHS script example (save as demo.tape):
Output docs/demo.gif
Set FontSize 14
Set Width 1000
Set Height 600
Type "npx codeglance ~/projects/my-saas-app" Enter
Sleep 3s
```

## GitHub repo setup

- [ ] Repository is public
- [ ] Description set: "The 10-second codebase tour. Understand any repo in one command."
- [ ] Topics added: `cli`, `developer-tools`, `codebase-analysis`, `repo-analyzer`, `onboarding`, `llm`, `typescript`, `static-analysis`, `terminal`, `productivity`
- [ ] Homepage URL set to npm package page (once published)
- [ ] GitHub Actions CI badge URL updated in README to reflect real repo
- [ ] Issue templates are live (verify by opening a new issue)
- [ ] `good first issue` label is created

## Launch materials

- [ ] HN post draft ready (`docs/launch-plan.md`)
- [ ] Reddit posts prepared for: r/programming, r/javascript, r/golang, r/rust, r/Python
- [ ] Twitter/X thread draft ready (`docs/social-copy.md`)
- [ ] Blog post draft ready (`docs/blog-post.md`)
- [ ] Day and time selected: Tuesday–Thursday, 8–10am US Eastern for HN

## Post-launch tasks

- [ ] Reply to every HN comment within first 6 hours
- [ ] Monitor GitHub issues and respond within 24 hours
- [ ] Pin a "good first issue" within the first week
- [ ] Submit to: awesome-cli-apps, awesome-nodejs, JavaScript Weekly, Go Weekly, Rust Weekly
- [ ] Write a short Dev.to article linking to the repo

---

## Final sanity check: 30-second developer test

Ask yourself: if I landed on this repo GitHub page right now, would I star it?

- Does the headline tell me what it does in < 5 seconds? ✓
- Is there something that looks like real output? ✓ (examples section)
- Can I try it immediately? ✓ (`npx codeglance`)
- Does it look like it was built by someone who cares? ✓ (clean code, tests, docs)
- Is there something I'd tell a colleague about? ✓ (`--for-ai` mode, framework detection)

If any answer is "no" — fix it before posting.
