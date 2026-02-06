/**
 * Commit types following the conventional commit standard with emojis
 */

export type CommitType =
  // Primary types
  | 'feat'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'build'
  | 'ci'
  | 'chore'
  | 'revert'
  // Extended types
  | 'security'
  | 'deprecate'
  | 'breaking'
  | 'i18n'
  | 'a11y'
  | 'deps';

/**
 * Information about a commit type
 */
export interface CommitTypeInfo {
  emoji: string;
  title: string;
  description: string;
}

/**
 * Mapping of commit types to their emoji and metadata
 */
export const COMMIT_TYPES: Record<CommitType, CommitTypeInfo> = {
  // Primary types
  feat: {
    emoji: '✨',
    title: 'Features',
    description: 'A new feature',
  },
  fix: {
    emoji: '🐛',
    title: 'Bug Fixes',
    description: 'A bug fix',
  },
  docs: {
    emoji: '📝',
    title: 'Documentation',
    description: 'Documentation only changes',
  },
  style: {
    emoji: '🎨',
    title: 'Styles',
    description: 'Changes that do not affect code meaning (whitespace, formatting, missing semi-colons, etc.)',
  },
  refactor: {
    emoji: '♻️',
    title: 'Code Refactoring',
    description: 'A code change that neither fixes a bug nor adds a feature',
  },
  perf: {
    emoji: '⚡',
    title: 'Performance Improvements',
    description: 'A code change that improves performance',
  },
  test: {
    emoji: '🧪',
    title: 'Tests',
    description: 'Adding missing tests or correcting existing tests',
  },
  build: {
    emoji: '📦',
    title: 'Builds',
    description: 'Changes that affect the build system or external dependencies (npm, maven, gradle, etc.)',
  },
  ci: {
    emoji: '👷',
    title: 'Continuous Integration',
    description: 'Changes to CI configuration files and scripts (GitHub Actions, GitLab CI, Jenkins, etc.)',
  },
  chore: {
    emoji: '🔧',
    title: 'Chores',
    description: "Other changes that don't modify src or test files (maintenance tasks, config updates, etc.)",
  },
  revert: {
    emoji: '⏪',
    title: 'Reverts',
    description: 'Reverts a previous commit',
  },
  // Extended types
  security: {
    emoji: '🔒',
    title: 'Security Fixes',
    description: 'Security vulnerability fixes or improvements',
  },
  deprecate: {
    emoji: '⚠️',
    title: 'Deprecations',
    description: 'Mark features/APIs as deprecated',
  },
  breaking: {
    emoji: '💥',
    title: 'Breaking Changes',
    description: 'Changes that break backward compatibility',
  },
  i18n: {
    emoji: '🌐',
    title: 'Internationalization',
    description: 'Translations and localization changes',
  },
  a11y: {
    emoji: '♿',
    title: 'Accessibility',
    description: 'Accessibility improvements',
  },
  deps: {
    emoji: '⬆️',
    title: 'Dependencies',
    description: 'Dependency updates (when not using automated tools)',
  },
};

/**
 * Parameters for creating a commit
 */
export interface CommitParams {
  type: CommitType;
  scope?: string;
  title: string;
  description?: string;
  breaking?: boolean;
}

/**
 * Result of commit type suggestion
 */
export interface SuggestionResult {
  type: CommitType;
  emoji: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Result of commit message validation
 */
export interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings?: string[];
}

/**
 * Git diff statistics
 */
export interface DiffStats {
  additions: number;
  deletions: number;
  files: string[];
}
