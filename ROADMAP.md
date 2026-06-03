# Roadmap

This roadmap is honest about what exists vs. what is planned. Pull requests are welcome.

---

## v0.1.0 (released) ✓

- Framework detection (Node.js, Go, Rust, Python, C/C++)
- Script/command extraction from manifest files
- Entry point and "start here" file detection
- CI, Docker, linting, env file detection
- Terminal, Markdown, `--for-ai`, and JSON output
- Zero-config `npx codeglance`

---

## v0.2.0 (released) ✓

- **Java/Maven/Gradle** — Spring Boot, Spring Security, Spring Data JPA, Quarkus, Micronaut, Vert.x, JUnit 5
- **Terraform** — provider detection (AWS, GCP, Azure, Kubernetes…), module and resource counts, standard `terraform` commands
- **Docker-compose env vars** — surfaces required environment variables from `docker-compose.yml`
- **GitHub hyperlinks in `--markdown`** — file paths link to the actual file on github.com
- **Smarter framework deduplication** — multi-word names no longer appear twice in output

---

## v0.3 — Ecosystem breadth

- **Ruby:** Gemfile, Rails detection
- **PHP:** Composer, Laravel, Symfony
- **Kotlin/Android:** `build.gradle.kts`, Android SDK detection
- **Elixir:** Phoenix framework detection
- **Monorepo support:** per-package summaries for Turborepo, Nx, Go workspaces
- **Python dev server inference:** detect `uvicorn`, `gunicorn`, `flask run` from dependencies

---

## v0.4 — Smarter analysis

- **`--since` / `--diff` mode:** "what changed since the main branch" — useful for returning contributors
- **Import graph analysis:** smarter "start here" ranking using actual import relationships
- **Complexity hints:** flag files with unusual size or depth

---

## v0.5 — Distribution + integration

- **GitHub Action:** post codeglance summary as a PR comment
  ```yaml
  - uses: mansoor-mamnoon/codeglance-action@v1
  ```
- **`--watch` mode:** re-analyze on file changes
- **Homebrew tap** for macOS/Linux binary install

---

## Future / high-interest ideas

These are ideas that have been requested or seem valuable. No timeline commitments.

- **VS Code extension:** sidebar panel showing live codeglance summary
- **Plugin system:** custom detectors loaded from project config
- **Team onboarding integration:** generate onboarding docs in Confluence, Notion

---

## What will NOT be added

To keep codeglance focused:

- **AI-generated code summaries** — codeglance reads manifests, not source code. This is by design.
  It keeps the tool fast, offline, and trustworthy.
- **Dependency vulnerability scanning** — Snyk, `npm audit`, `cargo audit` already do this well.
- **Language server / LSP features** — out of scope.
- **Cloud service / subscription model** — codeglance will remain free, local, and open source.

---

Want to influence the roadmap? [Open an issue](https://github.com/mansoor-mamnoon/codeglance/issues) or
vote on existing ones with a 👍.
