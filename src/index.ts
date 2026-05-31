import { Command } from 'commander';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { analyze } from './analyzer.js';
import { renderTerminal } from './renderers/terminal.js';
import { renderMarkdown } from './renderers/markdown.js';
import { renderForAi } from './renderers/forai.js';

const pkg = { version: '0.1.0', name: 'codeglance' };

const program = new Command();

program
  .name(pkg.name)
  .description('The 10-second codebase tour. Open a repo. Run one command. Know where to start.')
  .version(pkg.version, '-v, --version')
  .argument('[path]', 'path to analyze (defaults to current directory)', '.')
  .option('--json', 'output structured JSON')
  .option('--markdown', 'output Markdown suitable for docs/codebase-tour.md')
  .option('--for-ai', 'generate a compact LLM context brief')
  .option('--output <file>', 'write output to a file instead of stdout')
  .option('--no-git', 'skip git analysis (faster on large repos)')
  .addHelpText('after', `
Examples:
  npx codeglance                    analyze current directory
  npx codeglance ~/projects/myapp   analyze a specific path
  npx codeglance --markdown         print Markdown report
  npx codeglance --for-ai           generate LLM context brief
  npx codeglance --json             machine-readable output
  npx codeglance --markdown --output docs/codebase-tour.md

What codeglance shows you:
  • Framework/tool stack (Next.js, FastAPI, Gin, Axum — not just "TypeScript")
  • Run/build/test commands extracted from config files
  • Entry points and key files to read first
  • CI, Docker, linting, env file detection
  • Language breakdown
  • Git activity summary

Why not tokei/scc/repomix?
  tokei/scc count lines. repomix packs for AI. codeglance tells you what a repo IS.
`);

program.action(async (inputPath: string, options: {
  json?: boolean;
  markdown?: boolean;
  forAi?: boolean;
  output?: string;
  git?: boolean;
}) => {
  const resolvedPath = path.resolve(inputPath);

  // Validate path
  try {
    const { stat } = await import('node:fs/promises');
    const info = await stat(resolvedPath);
    if (!info.isDirectory()) {
      process.stderr.write(`Error: "${resolvedPath}" is not a directory.\n`);
      process.exit(1);
    }
  } catch {
    process.stderr.write(`Error: "${resolvedPath}" does not exist.\n`);
    process.exit(1);
  }

  try {
    const result = await analyze(resolvedPath, { skipGit: options.git === false });

    let output: string;

    if (options.json) {
      // Produce clean, automation-friendly JSON (no chalk codes)
      output = JSON.stringify(result, null, 2) + '\n';
    } else if (options.markdown) {
      output = renderMarkdown(result);
    } else if (options.forAi) {
      output = renderForAi(result);
    } else {
      output = renderTerminal(result);
    }

    if (options.output) {
      await writeFile(options.output, output, 'utf8');
      // Friendly confirmation (goes to stderr so it doesn't pollute piped output)
      process.stderr.write(`✓ Saved to ${options.output}\n`);
    } else {
      process.stdout.write(output);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`codeglance: ${message}\n`);
    process.exit(1);
  }
});

program.parse();
