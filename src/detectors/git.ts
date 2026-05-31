import simpleGit from 'simple-git';

export interface GitReport {
  isRepo: boolean;
  branch: string | null;
  lastCommit: {
    hash: string;
    shortMessage: string;
    author: string;
    daysAgo: number;
  } | null;
  recentCommits: number;
  recentContributors: number;
  repoAgeDays: number | null;
}

const THIRTY_DAYS = '30 days ago';

function daysAgo(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / 86_400_000);
}

export async function detectGit(rootDir: string): Promise<GitReport> {
  try {
    const git = simpleGit(rootDir, { timeout: { block: 5000 } });
    const isRepo = await git.checkIsRepo();
    if (!isRepo) return emptyReport();

    const [branchResult, lastLog, recentRaw, firstRaw] = await Promise.all([
      git.branchLocal().catch(() => null),
      git.log({ maxCount: 1 }).catch(() => null),
      git.raw(['log', `--since=${THIRTY_DAYS}`, '--format=%aN']).catch(() => ''),
      git.raw(['log', '--reverse', '--format=%aI', '--max-count=1']).catch(() => ''),
    ]);

    const branch = branchResult?.current ?? null;

    const lastCommit = lastLog?.latest
      ? {
          hash: lastLog.latest.hash.slice(0, 7),
          shortMessage: lastLog.latest.message.slice(0, 72),
          author: lastLog.latest.author_name,
          daysAgo: daysAgo(lastLog.latest.date),
        }
      : null;

    const authorLines = recentRaw.split('\n').filter(Boolean);
    const recentContributors = new Set(authorLines).size;
    const recentCommits = authorLines.length;

    const firstDate = firstRaw.trim();
    const repoAgeDays = firstDate ? daysAgo(firstDate) : null;

    return { isRepo: true, branch, lastCommit, recentCommits, recentContributors, repoAgeDays };
  } catch {
    return emptyReport();
  }
}

function emptyReport(): GitReport {
  return { isRepo: false, branch: null, lastCommit: null, recentCommits: 0, recentContributors: 0, repoAgeDays: null };
}
