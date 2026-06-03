import chalk from 'chalk';
import type { AnalysisResult } from '../analyzer.js';
import { CONFIG_LANGUAGES, LANGUAGE_COLOR } from '../detectors/languages.js';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const SECTION_WIDTH = 70;
const BAR_WIDTH = 18;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function rule(label: string): string {
  const pad = label ? ` ${label} ` : '';
  const remaining = Math.max(0, SECTION_WIDTH - pad.length);
  const left = 2;
  const right = Math.max(0, remaining - left);
  return chalk.dim('─'.repeat(left) + pad.toUpperCase() + '─'.repeat(right));
}

function bar(pct: number): string {
  const filled = Math.round((pct / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  return chalk.cyan('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
}

function col(str: string, width: number, align: 'left' | 'right' = 'left'): string {
  const s = str.slice(0, width);
  return align === 'left' ? s.padEnd(width) : s.padStart(width);
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

function formatAge(days: number): string {
  if (days < 1)   return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30)  return `${days} days ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  const y = Math.round(days / 365);
  return `${y} year${y > 1 ? 's' : ''} ago`;
}

function langColor(name: string, text: string): string {
  const color = LANGUAGE_COLOR[name] as keyof typeof chalk;
  try {
    return (chalk[color] as (s: string) => string)(text);
  } catch {
    return text;
  }
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function renderHeader(result: AnalysisResult): string {
  const { name, frameworks } = result;
  const eco = frameworks.ecosystem !== 'Unknown' ? chalk.dim(` · ${frameworks.ecosystem}`) : '';
  return [
    '',
    `  ${chalk.bold.white('codeglance')}  ${chalk.bold.cyan(name)}${eco}`,
    `  ${chalk.dim(result.rootDir)}`,
  ].join('\n');
}

function renderFrameworks(result: AnalysisResult): string {
  const { frameworks, scripts } = result;
  if (frameworks.all.length === 0) return '';

  const lines: string[] = [rule('what is this')];

  // Summary line
  lines.push(`  ${chalk.white(frameworks.summary)}`);
  if (frameworks.runtime) {
    lines.push(`  ${chalk.dim('Runtime')}     ${frameworks.runtime}`);
  }
  if (scripts.packageManager) {
    lines.push(`  ${chalk.dim('Pkg manager')} ${scripts.packageManager}`);
  }

  // Primary frameworks with versions (skip TypeScript and CLI frameworks already in summary)
  const summaryNames = new Set(
    frameworks.summary.split(/[\s,·]+/).map((s) => s.toLowerCase()),
  );
  const primary = frameworks.primary.filter(
    (f) => f.name !== 'TypeScript' && !summaryNames.has(f.name.toLowerCase()),
  );
  if (primary.length > 0) {
    const tags = primary.map((f) =>
      chalk.cyan(f.name) + (f.version ? chalk.dim(` ${f.version}`) : ''),
    );
    lines.push(`  ${chalk.dim('Frameworks')}  ${tags.join(chalk.dim('  ·  '))}`);
  }

  // Secondary: group by category (skip ecosystem-label entries already in the summary)
  const byCategory = new Map<string, string[]>();
  for (const f of frameworks.secondary) {
    if (summaryNames.has(f.name.toLowerCase())) continue;
    const list = byCategory.get(f.category) ?? [];
    list.push(f.name + (f.version ? ` ${f.version}` : ''));
    byCategory.set(f.category, list);
  }
  const CATEGORY_LABELS: Record<string, string> = {
    orm: 'ORM / DB',
    testing: 'Testing',
    build_tool: 'Build',
    linting: 'Linting',
    auth: 'Auth',
    api: 'API layer',
    ai_ml: 'AI / ML',
    cli: 'CLI',
    database: 'Database',
    other: 'Other',
  };
  for (const [cat, names] of byCategory) {
    const label = CATEGORY_LABELS[cat] ?? cat;
    lines.push(`  ${chalk.dim(col(label, 12))} ${names.join('  ·  ')}`);
  }

  return lines.join('\n');
}

function renderScripts(result: AnalysisResult): string {
  const { commands } = result.scripts;
  if (commands.length === 0) return '';

  const lines: string[] = [rule('how to run it')];
  const maxCmd = Math.min(36, Math.max(...commands.map((c) => c.command.length)));

  for (const cmd of commands) {
    const coloredCmd = chalk.bold.green(col(cmd.command, maxCmd + 2));
    const desc = chalk.dim(cmd.description);
    lines.push(`  ${coloredCmd} ${desc}`);
  }

  return lines.join('\n');
}

function renderEntryPoints(result: AnalysisResult): string {
  const { entryPoints, startHere } = result;

  // Show entry points first, then "start here" files (deduplicated)
  const shown = new Set<string>();
  const allItems: Array<{ path: string; desc: string; isEntry: boolean }> = [];

  for (const ep of entryPoints) {
    allItems.push({ path: ep.relativePath, desc: ep.description, isEntry: true });
    shown.add(ep.relativePath);
  }
  for (const sh of startHere) {
    if (!shown.has(sh.relativePath)) {
      allItems.push({ path: sh.relativePath, desc: sh.reason, isEntry: false });
      shown.add(sh.relativePath);
    }
  }

  if (allItems.length === 0) return '';

  const lines: string[] = [rule('where to start')];
  const maxPath = Math.min(46, Math.max(...allItems.map((i) => i.path.length)));

  for (const item of allItems.slice(0, 8)) {
    const pathStr = item.isEntry
      ? chalk.bold.white(col(item.path, maxPath + 2))
      : chalk.white(col(item.path, maxPath + 2));
    const desc = chalk.dim(item.desc);
    lines.push(`  ${pathStr} ${desc}`);
  }

  if (result.startHere.length > 0) {
    lines.push(`  ${chalk.dim('(ranked by heuristics — not semantic analysis)')}`);
  }

  return lines.join('\n');
}

function renderTools(result: AnalysisResult): string {
  const { tools, frameworks } = result;

  const rows: Array<[string, string]> = [];

  // Testing
  const testFrameworks = frameworks.all
    .filter((f) => f.category === 'testing')
    .map((f) => f.name);
  const testStr = testFrameworks.length > 0 ? testFrameworks.join('  ·  ') : null;
  if (testStr || tools.hasTests) {
    rows.push(['Testing', [testStr, tools.testDirHint ? chalk.dim(`(${tools.testDirHint})`) : null].filter(Boolean).join('  ')]);
  }

  // CI
  if (tools.ci) {
    const wfStr = tools.ciWorkflowCount > 0 ? chalk.dim(` (${tools.ciWorkflowCount} workflows)`) : '';
    rows.push(['CI/CD', tools.ci + wfStr]);
  }

  // Container
  if (tools.container.length > 0) {
    rows.push(['Container', tools.container.join('  ·  ')]);
  }

  // Linting
  if (tools.linting.length > 0) {
    rows.push(['Linting', tools.linting.join('  ·  ')]);
  }

  // Env files
  if (tools.hasEnvFile) {
    rows.push(['Env files', tools.envFiles.join('  ')]);
  }

  if (rows.length === 0) return '';

  const lines: string[] = [rule('tools detected')];
  for (const [label, value] of rows) {
    lines.push(`  ${chalk.dim(col(label, 12))} ${value}`);
  }
  return lines.join('\n');
}

function renderLanguages(result: AnalysisResult): string {
  const { languages, totalLines, totalFiles } = result;
  if (languages.length === 0) return '';

  // Filter to languages with at least 1% share to avoid tiny fixture/generated files cluttering output
  const codeLangs = languages.filter((l) => !CONFIG_LANGUAGES.has(l.name) && l.percentage >= 1);
  const configLangs = languages.filter((l) => CONFIG_LANGUAGES.has(l.name));

  const lines: string[] = [rule('codebase')];

  const topCode = codeLangs.slice(0, 6);
  const topConfig = configLangs.slice(0, 3);

  const allToShow = [...topCode, ...(topConfig.length > 0 ? topConfig : [])];

  if (allToShow.length > 0) {
    // Column widths
    const maxName = Math.max(...allToShow.map((l) => l.name.length), 4);

    for (const lang of topCode) {
      const name = langColor(lang.name, col(lang.name, maxName + 1));
      const files = chalk.dim(col(formatNum(lang.files), 6, 'right'));
      const lines_ = col(formatNum(lang.lines), 7, 'right');
      const b = bar(lang.percentage);
      const pct = chalk.dim(`${lang.percentage}%`.padStart(4));
      lines.push(`  ${name} ${files} ${chalk.white(lines_)} lines  ${b} ${pct}`);
    }

    if (topConfig.length > 0) {
      lines.push(`  ${chalk.dim('─'.repeat(SECTION_WIDTH - 2))}`);
      for (const lang of topConfig) {
        const name = chalk.dim(col(lang.name, maxName + 1));
        const files = chalk.dim(col(formatNum(lang.files), 6, 'right'));
        const lines_ = chalk.dim(col(formatNum(lang.lines), 7, 'right'));
        lines.push(`  ${name} ${files} ${lines_} lines`);
      }
    }
  }

  const summary = [
    chalk.dim(`${formatNum(totalFiles)} files`),
    chalk.dim(`${formatNum(totalLines)} lines`),
    chalk.dim(`${languages.length} languages`),
    result.filesCapped ? chalk.yellow('  (scan capped — see --help)') : '',
  ].filter(Boolean).join(chalk.dim('  ·  '));

  lines.push(`  ${summary}`);

  return lines.join('\n');
}

function renderGit(result: AnalysisResult): string {
  const { git } = result;
  if (!git.isRepo) return '';

  const lines: string[] = [rule('git')];

  const branch = git.branch ? chalk.cyan(git.branch) : chalk.dim('(detached)');
  let branchLine = `  ${chalk.dim('Branch')}  ${branch}`;
  if (git.repoAgeDays !== null) {
    branchLine += chalk.dim(`  ·  first commit ${formatAge(git.repoAgeDays)}`);
  }
  lines.push(branchLine);

  if (git.lastCommit) {
    const { hash, shortMessage, author, daysAgo: d } = git.lastCommit;
    const when = chalk.dim(formatAge(d));
    const by = chalk.dim(author);
    const msg = chalk.dim(`"${shortMessage.slice(0, 55)}${shortMessage.length > 55 ? '…' : ''}"`);
    lines.push(`  ${chalk.dim('Last commit')}  ${when}  ${by}: ${msg}  ${chalk.dim(hash)}`);
  }

  if (git.recentCommits > 0) {
    const activity = [
      chalk.white(String(git.recentCommits)) + chalk.dim(' commits'),
      chalk.white(String(git.recentContributors)) + chalk.dim(' contributors'),
      chalk.dim('(last 30 days)'),
    ].join(chalk.dim('  '));
    lines.push(`  ${chalk.dim('Activity')}    ${activity}`);
  }

  return lines.join('\n');
}

function renderHealth(result: AnalysisResult): string {
  const { tools } = result;

  // Each entry: [found, label, hint-when-found, label-when-missing]
  const checks: Array<[boolean, string, string, string]> = [
    [tools.hasTests,      'Tests',       tools.testDirHint ?? 'test directory found', 'no test directory found'],
    [tools.ci !== null,   'CI/CD',       tools.ci ?? '',                               'no CI config found'],
    [tools.hasReadme,     'README',      'README.md present',                          'no README.md'],
    [tools.hasLicense,    'License',     'LICENSE present',                            'no LICENSE file'],
    [tools.hasChangelog,  'Changelog',   'CHANGELOG.md present',                       'no CHANGELOG.md'],
    [tools.hasContributing, 'Contributing', 'CONTRIBUTING.md present',                 'no CONTRIBUTING.md'],
  ].filter(([, label]) => label) as Array<[boolean, string, string, string]>;

  // Only show health section if something is missing
  const missing = checks.filter(([ok]) => !ok);
  if (missing.length === 0) return '';

  const lines: string[] = [rule('health')];
  for (const [ok, label, hintOk, hintMissing] of checks) {
    const icon = ok ? chalk.green('✓') : chalk.yellow('○');
    const labelStr = col(label, 14);
    const hintStr = ok ? chalk.dim(hintOk) : chalk.dim(hintMissing);
    lines.push(`  ${icon}  ${labelStr} ${hintStr}`);
  }
  return lines.join('\n');
}

function renderFooter(result: AnalysisResult): string {
  const ms = result.durationMs;
  const timeStr = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  const lines: string[] = [
    '',
    chalk.dim('─'.repeat(SECTION_WIDTH)),
    `  ${chalk.dim(`Analyzed ${formatNum(result.totalFiles)} files in ${timeStr}`)}`,
    '',
    `  ${chalk.dim('codeglance --markdown')}  save this as ${chalk.dim('codebase-tour.md')}`,
    `  ${chalk.dim('codeglance --for-ai')}    generate a compact LLM context brief`,
    `  ${chalk.dim('codeglance --json')}      machine-readable output`,
    '',
  ];
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export function renderTerminal(result: AnalysisResult): string {
  const sections = [
    renderHeader(result),
    renderFrameworks(result),
    renderScripts(result),
    renderEntryPoints(result),
    renderTools(result),
    renderLanguages(result),
    renderGit(result),
    renderHealth(result),
    renderFooter(result),
  ].filter(Boolean);

  return sections.join('\n\n') + '\n';
}
