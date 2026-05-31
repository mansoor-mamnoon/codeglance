import path from 'node:path';
import type { ScannedFile } from '../scanner.js';

// Extension → display language name.
// Deliberately excludes pure config/data formats (JSON, YAML, TOML) from
// the "code" total — they're tracked but reported separately.
const EXT: Record<string, string> = {
  // JavaScript ecosystem
  '.js': 'JavaScript', '.jsx': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
  '.ts': 'TypeScript', '.tsx': 'TypeScript', '.mts': 'TypeScript', '.cts': 'TypeScript',
  // Python
  '.py': 'Python', '.pyw': 'Python', '.pyx': 'Cython',
  // Go
  '.go': 'Go',
  // Rust
  '.rs': 'Rust',
  // JVM
  '.java': 'Java', '.kt': 'Kotlin', '.kts': 'Kotlin',
  '.scala': 'Scala', '.groovy': 'Groovy', '.clj': 'Clojure', '.cljs': 'ClojureScript',
  // C family
  '.c': 'C', '.h': 'C', '.cpp': 'C++', '.cxx': 'C++', '.cc': 'C++',
  '.hpp': 'C++', '.hxx': 'C++', '.hh': 'C++',
  // C#  / F#
  '.cs': 'C#', '.fs': 'F#', '.fsx': 'F#',
  // PHP / Ruby / Swift
  '.php': 'PHP', '.rb': 'Ruby', '.rake': 'Ruby', '.swift': 'Swift',
  // Shell
  '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell', '.fish': 'Fish', '.ps1': 'PowerShell',
  // Web
  '.html': 'HTML', '.htm': 'HTML',
  '.css': 'CSS', '.scss': 'SCSS', '.sass': 'Sass', '.less': 'Less',
  '.vue': 'Vue', '.svelte': 'Svelte', '.astro': 'Astro',
  // Query / schema
  '.sql': 'SQL', '.graphql': 'GraphQL', '.gql': 'GraphQL', '.proto': 'Protobuf',
  // Infrastructure
  '.tf': 'Terraform', '.tfvars': 'Terraform',
  // Markup / config (tracked, not counted in code total)
  '.md': 'Markdown', '.mdx': 'Markdown', '.rst': 'reStructuredText',
  '.yml': 'YAML', '.yaml': 'YAML', '.toml': 'TOML', '.json': 'JSON', '.xml': 'XML',
  // More languages
  '.dart': 'Dart', '.ex': 'Elixir', '.exs': 'Elixir',
  '.hs': 'Haskell', '.lhs': 'Haskell', '.lua': 'Lua', '.r': 'R', '.R': 'R',
  '.jl': 'Julia', '.zig': 'Zig', '.nim': 'Nim', '.ml': 'OCaml', '.mli': 'OCaml',
  '.elm': 'Elm', '.erl': 'Erlang', '.hrl': 'Erlang', '.cr': 'Crystal', '.v': 'V',
};

const FILENAME: Record<string, string> = {
  'dockerfile': 'Dockerfile', 'makefile': 'Makefile', 'gnumakefile': 'Makefile',
  'justfile': 'Just', 'vagrantfile': 'Ruby', 'rakefile': 'Ruby',
  'gemfile': 'Ruby', 'podfile': 'Ruby',
};

// These are config/markup — shown but separated visually from code stats
export const CONFIG_LANGUAGES = new Set([
  'Markdown', 'reStructuredText', 'YAML', 'TOML', 'JSON', 'XML',
]);

// Rough chalk color names per language for the renderer
export const LANGUAGE_COLOR: Record<string, string> = {
  'JavaScript': 'yellow',  'TypeScript': 'blueBright', 'Python': 'blue',
  'Go': 'cyan',            'Rust': 'red',              'Java': 'yellow',
  'Kotlin': 'magenta',     'C': 'white',               'C++': 'magentaBright',
  'C#': 'green',           'PHP': 'blue',              'Ruby': 'red',
  'Swift': 'yellow',       'Shell': 'green',           'HTML': 'red',
  'CSS': 'blue',           'SCSS': 'magenta',          'Vue': 'green',
  'Svelte': 'red',         'Astro': 'magenta',         'SQL': 'cyan',
  'GraphQL': 'magenta',    'Dart': 'cyan',             'Elixir': 'magenta',
  'Haskell': 'magenta',    'Lua': 'blue',              'Zig': 'yellow',
  'Elm': 'blue',           'Terraform': 'magenta',     'Dockerfile': 'cyan',
  'Makefile': 'white',
};

export function detectLanguage(filePath: string): string | null {
  const basename = path.basename(filePath).toLowerCase();
  if (FILENAME[basename]) return FILENAME[basename];

  const ext = path.extname(filePath).toLowerCase();
  return ext ? (EXT[ext] ?? null) : null;
}

export interface LanguageStat {
  name: string;
  files: number;
  lines: number;
  percentage: number;
}

export function computeLanguageStats(files: ScannedFile[]): LanguageStat[] {
  const map = new Map<string, { files: number; lines: number }>();

  for (const f of files) {
    if (!f.language || f.lines === null) continue;
    const existing = map.get(f.language) ?? { files: 0, lines: 0 };
    map.set(f.language, { files: existing.files + 1, lines: existing.lines + f.lines });
  }

  const total = Array.from(map.values()).reduce((s, v) => s + v.lines, 0);
  return Array.from(map.entries())
    .map(([name, { files, lines }]) => ({
      name,
      files,
      lines,
      percentage: total > 0 ? Math.round((lines / total) * 100) : 0,
    }))
    .sort((a, b) => b.lines - a.lines);
}
