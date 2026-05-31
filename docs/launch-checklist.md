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

- [ ] Package name `codeglance` is available: `npm info codeglance` → not found
- [ ] `npm pack` produces a clean tarball (check with `tar -tvf codeglance-0.1.0.tgz`)
- [ ] `npx codeglance` works on a fresh machine with no prior install
- [ ] Version in package.json matches CHANGELOG
- [ ] `files` field in package.json includes only `dist/`, `README.md`, `LICENSE`

## Install test (do this on a clean machine or in a temp directory)

```bash
cd /tmp
git clone https://github.com/your-username/codeglance test-install
cd test-install
npx codeglance .
```

Expected: framework detection output, no errors.

```bash
# Also test on a real popular repo:
git clone https://github.com/vercel/next.js /tmp/nextjs-test
npx codeglance /tmp/nextjs-test
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
- [ ] Topics added: `cli`, `developer-tools`, `codebase`, `typescript`, `nodejs`, `open-source`
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
