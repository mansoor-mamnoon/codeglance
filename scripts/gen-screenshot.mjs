#!/usr/bin/env node
/**
 * Generates docs/demo.svg — a terminal screenshot of codeglance output.
 * Run: node scripts/gen-screenshot.mjs
 *
 * Uses no external dependencies. Produces a static SVG that renders
 * correctly in GitHub READMEs.
 */

import { execSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Catppuccin Mocha palette
// ---------------------------------------------------------------------------
const THEME = {
  bg: '#1e1e2e',
  chrome: '#181825',
  border: '#313244',
  text: '#cdd6f4',
  dim: '#6c7086',
  black: '#1e1e2e',
  red: '#f38ba8',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  blue: '#89b4fa',
  magenta: '#cba6f7',
  cyan: '#89dceb',
  white: '#cdd6f4',
  brightBlack: '#585b70',
  brightCyan: '#89dceb',
  brightGreen: '#a6e3a1',
  brightBlue: '#89b4fa',
  brightMagenta: '#cba6f7',
  brightYellow: '#f9e2af',
  brightRed: '#f38ba8',
  brightWhite: '#cdd6f4',
};

// ANSI code → hex color
const ANSI_COLOR = {
  30: THEME.black,      31: THEME.red,       32: THEME.green,
  33: THEME.yellow,     34: THEME.blue,       35: THEME.magenta,
  36: THEME.cyan,       37: THEME.white,
  90: THEME.brightBlack, 91: THEME.brightRed, 92: THEME.brightGreen,
  93: THEME.brightYellow, 94: THEME.brightBlue, 95: THEME.brightMagenta,
  96: THEME.brightCyan,  97: THEME.brightWhite,
};

// ---------------------------------------------------------------------------
// ANSI parser
// ---------------------------------------------------------------------------

function parseAnsi(input) {
  const lines = [];
  let currentLine = [];
  let color = null;
  let bold = false;
  let dim = false;
  let i = 0;

  function flush(text) {
    if (!text) return;
    const last = currentLine[currentLine.length - 1];
    if (last && last.color === color && last.bold === bold && last.dim === dim) {
      last.text += text;
    } else {
      currentLine.push({ text, color, bold, dim });
    }
  }

  while (i < input.length) {
    const ch = input[i];

    if (ch === '\n') {
      lines.push(currentLine);
      currentLine = [];
      i++;
      continue;
    }

    // ESC sequence
    if (ch === '\x1b' && input[i + 1] === '[') {
      i += 2;
      let seq = '';
      while (i < input.length && input[i] !== 'm') {
        seq += input[i++];
      }
      i++; // skip 'm'

      for (const part of seq.split(';')) {
        const code = parseInt(part || '0', 10);
        if (code === 0) { color = null; bold = false; dim = false; }
        else if (code === 1) bold = true;
        else if (code === 2) dim = true;
        else if (code === 22) { bold = false; dim = false; }
        else if (code === 39) color = null;
        else if (ANSI_COLOR[code]) color = ANSI_COLOR[code];
      }
      continue;
    }

    // Regular character — consume until escape or newline
    let text = '';
    while (i < input.length && input[i] !== '\x1b' && input[i] !== '\n') {
      text += input[i++];
    }
    flush(text);
  }

  if (currentLine.length > 0) lines.push(currentLine);
  return lines;
}

// ---------------------------------------------------------------------------
// SVG builder
// ---------------------------------------------------------------------------

function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSvg(lines, opts = {}) {
  const {
    maxLines = 35,
    width = 820,
    fontSize = 13,
    lineHeight = 19,
    paddingX = 18,
    paddingTop = 52,
    paddingBottom = 18,
    font = "'Menlo', 'Monaco', 'Cascadia Mono', 'Consolas', monospace",
  } = opts;

  const visible = lines.slice(0, maxLines);
  const contentHeight = visible.length * lineHeight;
  const height = paddingTop + contentHeight + paddingBottom;

  const textLines = visible.map((spans, idx) => {
    const y = paddingTop + idx * lineHeight + (lineHeight - 3);
    const tspans = spans.map((s) => {
      let c = s.dim ? THEME.dim : (s.color ?? THEME.text);
      // Boost dim slightly for readability
      if (s.dim) c = THEME.dim;
      const fw = s.bold ? 'bold' : 'normal';
      return `<tspan fill="${c}" font-weight="${fw}">${esc(s.text)}</tspan>`;
    }).join('');

    return `<text x="${paddingX}" y="${y}" xml:space="preserve" font-family="${font}" font-size="${fontSize}">${tspans}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <clipPath id="terminal-clip">
      <rect width="${width}" height="${height}" rx="10"/>
    </clipPath>
  </defs>

  <!-- Terminal window -->
  <rect width="${width}" height="${height}" rx="10" fill="${THEME.bg}" clip-path="url(#terminal-clip)"/>

  <!-- Chrome bar -->
  <rect width="${width}" height="34" fill="${THEME.chrome}"/>
  <line x1="0" y1="34" x2="${width}" y2="34" stroke="${THEME.border}" stroke-width="1"/>

  <!-- Window controls -->
  <circle cx="18" cy="17" r="5.5" fill="#f38ba8"/>
  <circle cx="36" cy="17" r="5.5" fill="#f9e2af"/>
  <circle cx="54" cy="17" r="5.5" fill="#a6e3a1"/>

  <!-- Title -->
  <text x="${width / 2}" y="22" text-anchor="middle" fill="${THEME.dim}" font-family="${font}" font-size="12">codeglance — terminal</text>

  <!-- Content -->
  <g clip-path="url(#terminal-clip)">
    ${textLines.join('\n    ')}
  </g>

  <!-- Bottom border -->
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="none" stroke="${THEME.border}" stroke-width="1"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const fixtureDir = join(ROOT, 'tests', 'fixtures', 'node-project');
if (!existsSync(fixtureDir)) {
  process.stderr.write('Error: tests/fixtures/node-project not found. Run from repo root.\n');
  process.exit(1);
}

const distIndex = join(ROOT, 'dist', 'index.js');
if (!existsSync(distIndex)) {
  process.stderr.write('Error: dist/index.js not found. Run npm run build first.\n');
  process.exit(1);
}

let rawOutput;
try {
  rawOutput = execSync(`node "${distIndex}" "${fixtureDir}"`, {
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '1', TERM: 'xterm-256color' },
  });
} catch (err) {
  process.stderr.write(`Failed to run codeglance: ${err.message}\n`);
  process.exit(1);
}

// Replace all occurrences of the fixture name and full path
rawOutput = rawOutput.replace(new RegExp(fixtureDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '~/projects/my-saas-app');
rawOutput = rawOutput.replace(/node-project/g, 'my-saas-app');

const parsed = parseAnsi(rawOutput);
// Show first 28 lines to keep the SVG compact (above-the-fold sized)
const svg = buildSvg(parsed, { maxLines: 28 });

const outPath = join(ROOT, 'docs', 'demo.svg');
writeFileSync(outPath, svg, 'utf8');
process.stdout.write(`✓ Generated ${outPath}\n`);
process.stdout.write(`  ${parsed.length} lines captured, showing first ${Math.min(parsed.length, 28)}\n`);
