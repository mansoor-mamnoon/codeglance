# Contributing to codeglance

Thanks for wanting to contribute. codeglance is designed to be extensible, and adding a new
ecosystem or framework detector is one of the best ways to contribute.

## Setup

```bash
git clone https://github.com/mansoor-mamnoon/codeglance
cd codeglance
npm install
npm run dev -- .     # run on current directory
npm test             # run test suite
npm run build        # build for production
```

## Project structure

```
src/
├── detectors/           ← one file per concern
│   ├── frameworks.ts    ← THE key module: framework/library detection
│   ├── scripts.ts       ← run/build/test command extraction
│   ├── entrypoints.ts   ← main file / entry point detection
│   ├── starthere.ts     ← "files to read first" heuristic
│   ├── tools.ts         ← CI, Docker, linting, env file detection
│   ├── languages.ts     ← file extension → language stats
│   └── git.ts           ← branch, recency, contributors
├── scanner.ts           ← file walker (respects .gitignore)
├── analyzer.ts          ← orchestrator: runs all detectors in parallel
├── renderers/
│   ├── terminal.ts      ← chalk-based terminal output
│   ├── markdown.ts      ← --markdown flag output
│   └── forai.ts         ← --for-ai context brief
└── index.ts             ← CLI entry (commander)
```

## Adding a framework detector

**This is the most impactful contribution.** Each framework entry is ~3 lines of code.

### 1. Add the framework definition

Open `src/detectors/frameworks.ts` and find the array for the relevant ecosystem:

```typescript
// For Node.js packages:
const NODE_FRAMEWORKS: FrameworkDef[] = [
  // ... existing entries ...

  // Add your entry:
  { name: 'My Framework', category: 'web_framework', keys: ['my-framework-npm-package'] },
];

// For Go modules:
const GO_FRAMEWORKS: FrameworkDef[] = [
  { name: 'My Framework', category: 'web_framework', keys: ['github.com/org/my-framework'] },
];
```

**Categories:**

| Category | When to use |
|----------|------------|
| `web_framework` | HTTP servers and web app frameworks |
| `ui_library` | UI component libraries (React, Tailwind, etc.) |
| `orm` | Database ORM / query builders |
| `auth` | Authentication libraries |
| `api` | API-layer libraries (tRPC, GraphQL, gRPC) |
| `testing` | Test runners and assertion libraries |
| `build_tool` | Bundlers, transpilers, build systems |
| `linting` | Linters and formatters |
| `database` | Database drivers / clients |
| `cli` | CLI framework libraries |
| `ai_ml` | AI / ML libraries |
| `runtime` | Runtime environments (Electron, Tauri) |
| `other` | Everything else |

### 2. Add a test fixture

Create a minimal manifest in `tests/fixtures/`:

```bash
tests/fixtures/my-project/
  package.json     # minimum: { "dependencies": { "my-framework": "^1.0.0" } }
  # OR go.mod, Cargo.toml, pyproject.toml
```

### 3. Add a test

Open `tests/core/frameworks.test.ts` and add a `describe` block:

```typescript
describe('detectFrameworks — My Framework', () => {
  const dir = path.join(FIXTURES, 'my-project');

  it('detects My Framework', async () => {
    const result = await detectFrameworks(dir);
    const names = result.all.map((f) => f.name);
    expect(names).toContain('My Framework');
  });
});
```

### 4. Test against a real repo

```bash
npm run build
node dist/index.js /path/to/real-my-framework-project
```

Make sure the output looks correct and the framework appears in the right section.

### 5. Submit a PR

Use the PR template. Include the output of running codeglance on a real project of that type.

---

## Adding a new ecosystem (beyond Node/Go/Rust/Python)

For a new ecosystem (e.g., PHP with Composer, Java with Maven/Gradle), you'll need to:

1. Add a parser function in `src/detectors/frameworks.ts` (follow the pattern of `fromPackageJson`, `fromGoMod`, etc.)
2. Add the ecosystem to the detection chain in `detectFrameworks()`
3. Add script extraction in `src/detectors/scripts.ts`
4. Add entry point patterns in `src/detectors/entrypoints.ts`
5. Add fixtures and tests

This is more involved but makes codeglance useful to an entirely new community of developers.

---

## Code style

- TypeScript strict mode
- No `any` types
- Minimal dependencies (don't add a new dep without discussion)
- Pure functions where possible (easier to test)
- Functions that touch the filesystem take `rootDir: string` as first argument
- `async/await` throughout — no callbacks

Run `npm run lint` and `npm run typecheck` before submitting.

---

## Commit messages

Use the conventional format:

```
feat: add Django REST Framework detector
fix: correct test:watch kind classification
test: add fixtures for Ruby/Gemfile
docs: improve contributing guide
```

---

## What makes a good PR

- Focused: one concern per PR
- Tested: fixtures + tests for new detectors
- Verified: output tested on a real repository of that type
- Clean: no dead code, no unrelated changes
- Honest: if detection is heuristic, it should be as reliable as possible

---

## Questions?

Open a discussion or an issue. The maintainers are friendly.
