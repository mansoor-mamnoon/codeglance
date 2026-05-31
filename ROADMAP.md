# Roadmap

This roadmap is honest about what exists vs. what is planned. Pull requests are welcome.

---

## v0.1.0 (released) ✓

- Framework detection (Node.js, Go, Rust, Python)
- Script/command extraction from manifest files
- Entry point and "start here" file detection
- CI, Docker, linting, env file detection
- Terminal, Markdown, `--for-ai`, and JSON output
- Zero-config `npx codeglance`

---

## v0.2 — Ecosystem breadth + smarter ranking

- **`--since` / `--diff` mode:** "what changed since the main branch" — useful for returning contributors
- **Import graph analysis:** smarter "start here" ranking using actual import relationships
- **Java/Kotlin:** Spring Boot, Quarkus, Gradle script extraction
- **PHP:** Composer, Laravel, Symfony
- **Ruby:** Gemfile, Rails detection improvements
- **C/C++:** CMake, Meson, make-based project detection
- **Elixir:** Phoenix framework detection
- **Monorepo support:** per-package summaries for Turborepo, Nx, Go workspaces

---

## v0.3 — Distribution + integration

- **GitHub Action:** post codeglance summary as a PR comment
  ```yaml
  - uses: username/codeglance-action@v1
  ```
- **Badge generator:** embeddable codeglance badge for README
- **`--watch` mode:** re-analyze on file changes (useful during onboarding)
- **Homebrew tap** for macOS/Linux binary install
- **Nix flake** for declarative environments

---

## Future / high-interest ideas

These are ideas that have been requested or seem valuable. No timeline commitments.

- **VS Code extension:** sidebar panel showing live codeglance summary
- **Web / SVG export:** architecture diagram from file structure
- **Plugin system:** custom detectors loaded from project config
- **Complexity hints:** identify files with high cyclomatic complexity or unusual size
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

Want to influence the roadmap? [Open an issue](https://github.com/username/codeglance/issues) or
vote on existing ones with a 👍.
