# Security Policy

## What codeglance does with your code

codeglance is a **local, offline tool**. It reads files on your filesystem and produces output to your terminal (or a local file). It does not:

- Send code, file contents, or file paths to any external server
- Connect to the internet
- Require authentication
- Store or cache any data
- Execute any code from the repos it analyzes

The only network activity is `npm install` or `npx` fetching the package itself from npm.

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✓ |

## Reporting a vulnerability

If you discover a security vulnerability, please report it privately rather than opening a public issue.

**Email:** (add security contact email here)

Please include:
- A description of the issue
- Steps to reproduce
- The potential impact
- Any suggested fix

You'll receive a response within 72 hours. If the issue is confirmed, a fix will be released promptly and you'll be credited in the changelog.

## Threat model

codeglance reads files you point it at. The main risks:

1. **Symlink attacks** — codeglance skips symlinks during directory traversal.
2. **Malformed manifest files** — JSON/TOML parsing is done inside try/catch blocks; malformed files are skipped gracefully.
3. **Extremely large files** — Files over 1MB are skipped to prevent memory exhaustion.
4. **Extremely deep directory trees** — The scanner caps at 25,000 files.

If you find a way to cause codeglance to read files outside the target directory, execute code, or exhaust system resources, please report it.
