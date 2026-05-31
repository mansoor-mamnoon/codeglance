import path from 'node:path';
import { scanDirectory, type ScannedFile } from './scanner.js';
import { detectLanguage, computeLanguageStats, type LanguageStat } from './detectors/languages.js';
import { detectFrameworks, type FrameworkReport } from './detectors/frameworks.js';
import { detectScripts, type ScriptsReport } from './detectors/scripts.js';
import { detectEntryPoints, type EntryPoint } from './detectors/entrypoints.js';
import { detectTools, type ToolsReport } from './detectors/tools.js';
import { detectGit, type GitReport } from './detectors/git.js';
import { rankStartHereFiles, type StartHereFile } from './detectors/starthere.js';

export interface AnalysisResult {
  /** Absolute path to the analyzed directory */
  rootDir: string;
  /** Directory basename */
  name: string;
  /** How long the scan took in milliseconds */
  durationMs: number;
  /** True if the file count hit the scanner cap */
  filesCapped: boolean;
  totalFiles: number;
  totalLines: number;

  frameworks: FrameworkReport;
  scripts: ScriptsReport;
  entryPoints: EntryPoint[];
  startHere: StartHereFile[];
  languages: LanguageStat[];
  tools: ToolsReport;
  git: GitReport;
}

export async function analyze(inputPath: string): Promise<AnalysisResult> {
  const rootDir = path.resolve(inputPath);
  const name = path.basename(rootDir);
  const start = Date.now();

  // Step 1: Detect frameworks first (fast — just reads manifest files)
  // We need ecosystem to inform the script and entrypoint detectors.
  const frameworks = await detectFrameworks(rootDir);
  const ecosystem = frameworks.ecosystem;

  // Step 2: Scan all files and run remaining detectors in parallel.
  const [{ files, capped }, scripts, entryPoints, tools, git] = await Promise.all([
    scanDirectory(rootDir, detectLanguage),
    detectScripts(rootDir, ecosystem),
    detectEntryPoints(rootDir, ecosystem),
    detectTools(rootDir, ecosystem),
    detectGit(rootDir),
  ]);

  // Step 3: Derive stats from the scanned file list (pure computation, fast)
  const languages = computeLanguageStats(files);
  const startHere = rankStartHereFiles(files);
  const totalFiles = files.length;
  const totalLines = files.reduce((s, f) => s + (f.lines ?? 0), 0);

  return {
    rootDir,
    name,
    durationMs: Date.now() - start,
    filesCapped: capped,
    totalFiles,
    totalLines,
    frameworks,
    scripts,
    entryPoints,
    startHere,
    languages,
    tools,
    git,
  };
}

// Re-export types so consumers can import from one place
export type { LanguageStat, FrameworkReport, ScriptsReport, EntryPoint, ToolsReport, GitReport, StartHereFile, ScannedFile };
