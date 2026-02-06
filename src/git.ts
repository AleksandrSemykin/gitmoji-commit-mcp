import { simpleGit, SimpleGit } from 'simple-git';
import { CommitType, DiffStats, SuggestionResult, COMMIT_TYPES } from './types.js';

/**
 * Get a simple-git instance for the current working directory
 */
export function getGit(): SimpleGit {
  return simpleGit();
}

/**
 * Get statistics about staged changes
 */
export async function getStagedDiff(): Promise<DiffStats> {
  const git = getGit();

  try {
    const diffOutput = await git.raw(['diff', '--staged', '--numstat']);
    const status = await git.status();

    let additions = 0;
    let deletions = 0;
    const files: string[] = [];

    // Parse numstat output
    const lines = diffOutput.split('\n').filter((line: string) => line.trim().length > 0);
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 3) {
        const added = parseInt(parts[0]) || 0;
        const deleted = parseInt(parts[1]) || 0;
        const file = parts[2];

        additions += added;
        deletions += deleted;
        files.push(file);
      }
    }

    // Also include files from status
    const stagedFiles = [
      ...status.staged,
      ...status.created,
      ...status.modified.filter(f => status.staged.includes(f)),
    ];

    // Merge and deduplicate files
    const allFiles = Array.from(new Set([...files, ...stagedFiles]));

    return {
      additions,
      deletions,
      files: allFiles,
    };
  } catch (error) {
    throw new Error(`Failed to get staged diff: ${error}`);
  }
}

/**
 * Suggest a commit type based on staged changes
 */
export async function suggestCommitType(): Promise<SuggestionResult> {
  const stats = await getStagedDiff();

  if (stats.files.length === 0) {
    throw new Error('No staged changes found');
  }

  // Analyze files to suggest commit type
  const { files, additions, deletions } = stats;

  // Check for documentation changes
  const docFiles = files.filter(f =>
    f.match(/\.(md|txt|rst|adoc)$/i) ||
    f.includes('README') ||
    f.includes('docs/')
  );

  if (docFiles.length > 0 && docFiles.length === files.length) {
    return {
      type: 'docs',
      emoji: COMMIT_TYPES.docs.emoji,
      reason: 'All changes are to documentation files',
      confidence: 'high',
    };
  }

  // Check for test changes
  const testFiles = files.filter(f =>
    f.match(/\.(test|spec)\.(ts|js|tsx|jsx)$/i) ||
    f.includes('__tests__/') ||
    f.includes('test/') ||
    f.includes('tests/')
  );

  if (testFiles.length > 0 && testFiles.length === files.length) {
    return {
      type: 'test',
      emoji: COMMIT_TYPES.test.emoji,
      reason: 'All changes are to test files',
      confidence: 'high',
    };
  }

  // Check for CI/CD changes
  const ciFiles = files.filter(f =>
    f.match(/\.(yml|yaml)$/i) &&
    (f.includes('.github/') || f.includes('.gitlab/') || f.includes('jenkins') || f.includes('circle'))
  );

  if (ciFiles.length > 0 && ciFiles.length === files.length) {
    return {
      type: 'ci',
      emoji: COMMIT_TYPES.ci.emoji,
      reason: 'All changes are to CI/CD configuration files',
      confidence: 'high',
    };
  }

  // Check for build/dependency changes
  const buildFiles = files.filter(f =>
    f.match(/^(package\.json|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Gemfile\.lock|requirements\.txt|pom\.xml|build\.gradle|Cargo\.toml|go\.mod|go\.sum)$/i)
  );

  if (buildFiles.length > 0) {
    if (buildFiles.some(f => f.match(/lock|package\.json/i))) {
      return {
        type: 'deps',
        emoji: COMMIT_TYPES.deps.emoji,
        reason: 'Changes to dependency files detected',
        confidence: 'high',
      };
    }
    return {
      type: 'build',
      emoji: COMMIT_TYPES.build.emoji,
      reason: 'Changes to build configuration detected',
      confidence: 'high',
    };
  }

  // Check for config changes
  const configFiles = files.filter(f =>
    f.match(/\.(config|conf|cfg|ini|env|rc)(\.(ts|js|json|yaml|yml))?$/i) ||
    f.startsWith('.')
  );

  if (configFiles.length > 0 && configFiles.length === files.length) {
    return {
      type: 'chore',
      emoji: COMMIT_TYPES.chore.emoji,
      reason: 'All changes are to configuration files',
      confidence: 'high',
    };
  }

  // Analyze code changes
  const ratio = deletions > 0 ? additions / deletions : additions > 0 ? 10 : 0;

  // More additions than deletions suggests new feature
  if (ratio > 2 && additions > 50) {
    return {
      type: 'feat',
      emoji: COMMIT_TYPES.feat.emoji,
      reason: `Significant additions (${additions} lines added vs ${deletions} deleted) suggest new feature`,
      confidence: 'medium',
    };
  }

  // Balanced changes suggest refactoring
  if (ratio > 0.7 && ratio < 1.3 && (additions + deletions) > 100) {
    return {
      type: 'refactor',
      emoji: COMMIT_TYPES.refactor.emoji,
      reason: `Balanced changes (${additions} added, ${deletions} deleted) suggest refactoring`,
      confidence: 'medium',
    };
  }

  // Small changes might be fixes
  if ((additions + deletions) < 50) {
    return {
      type: 'fix',
      emoji: COMMIT_TYPES.fix.emoji,
      reason: 'Small changes suggest bug fix',
      confidence: 'low',
    };
  }

  // Default to feat for other cases
  return {
    type: 'feat',
    emoji: COMMIT_TYPES.feat.emoji,
    reason: 'Unable to determine specific type, defaulting to feature',
    confidence: 'low',
  };
}

/**
 * Create a commit with the given message
 */
export async function createCommit(message: string): Promise<string> {
  const git = getGit();

  try {
    const result = await git.commit(message);
    return result.commit;
  } catch (error) {
    throw new Error(`Failed to create commit: ${error}`);
  }
}

/**
 * Check if there are staged changes
 */
export async function hasStagedChanges(): Promise<boolean> {
  const git = getGit();

  try {
    const status = await git.status();
    return status.staged.length > 0 || status.created.length > 0;
  } catch (error) {
    throw new Error(`Failed to check git status: ${error}`);
  }
}
