import { CommitParams, CommitType, COMMIT_TYPES, ValidationResult } from './types.js';

/**
 * Format a commit message according to the convention
 */
export function formatCommitMessage(params: CommitParams): string {
  const { type, scope, title, description, breaking } = params;

  if (!COMMIT_TYPES[type]) {
    throw new Error(`Invalid commit type: ${type}`);
  }

  const emoji = COMMIT_TYPES[type].emoji;
  const scopeStr = scope ? `(${scope})` : '';
  const breakingPrefix = breaking ? '!' : '';

  let message = `${emoji} ${type}${scopeStr}${breakingPrefix}: ${title}`;

  if (description) {
    message += '\n\n' + description;
  }

  if (breaking && description && !description.includes('BREAKING CHANGE:')) {
    message += '\n\nBREAKING CHANGE: ';
  }

  return message;
}

/**
 * Validate a commit message
 */
export function validateCommitMessage(message: string): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check if message is empty
  if (!message || message.trim().length === 0) {
    issues.push('Commit message cannot be empty');
    return { valid: false, issues, warnings };
  }

  const lines = message.split('\n');
  const firstLine = lines[0];

  // Extract emoji, type, scope, and title from first line
  const emojiRegex = /^([^\s]+)\s+/;
  const emojiMatch = firstLine.match(emojiRegex);

  if (!emojiMatch) {
    issues.push('Commit message must start with an emoji');
    return { valid: false, issues, warnings };
  }

  const emoji = emojiMatch[1];
  const restOfLine = firstLine.substring(emoji.length + 1);

  // Check type and scope
  const typeRegex = /^([a-z]+)(\([^)]+\))?(!)?:\s+(.+)$/;
  const typeMatch = restOfLine.match(typeRegex);

  if (!typeMatch) {
    issues.push('Invalid commit format. Expected: <emoji> <type>(<scope>): <title>');
    return { valid: false, issues, warnings };
  }

  const [, type, scope, breaking, title] = typeMatch;

  // Validate type
  if (!COMMIT_TYPES[type as CommitType]) {
    issues.push(`Invalid commit type: ${type}`);
  } else {
    // Check emoji matches type
    const expectedEmoji = COMMIT_TYPES[type as CommitType].emoji;
    if (emoji !== expectedEmoji) {
      issues.push(`Emoji ${emoji} doesn't match type ${type}. Expected ${expectedEmoji}`);
    }
  }

  // Validate title
  if (title.length === 0) {
    issues.push('Title cannot be empty');
  }

  if (title.length > 50) {
    warnings.push(`Title is ${title.length} characters (recommended max: 50)`);
  }

  // Check if title starts with uppercase (should be lowercase)
  if (title[0] && title[0] === title[0].toUpperCase() && title[0] !== title[0].toLowerCase()) {
    warnings.push('Title should start with lowercase letter');
  }

  // Check if title ends with period
  if (title.endsWith('.')) {
    warnings.push('Title should not end with a period');
  }

  // Check imperative mood (basic check for common mistakes)
  const nonImperativePrefixes = ['added', 'adds', 'fixed', 'fixes', 'updated', 'updates'];
  const titleLower = title.toLowerCase();
  for (const prefix of nonImperativePrefixes) {
    if (titleLower.startsWith(prefix)) {
      warnings.push(`Use imperative mood: "${prefix}" should be "${prefix.replace(/s?ed$/, '').replace(/es$/, '').replace(/s$/, '')}"`);
      break;
    }
  }

  // Check description format
  if (lines.length > 1) {
    if (lines[1] !== '') {
      warnings.push('Second line should be blank (separate title from description)');
    }

    // Check line length in description
    for (let i = 2; i < lines.length; i++) {
      if (lines[i].length > 72) {
        warnings.push(`Line ${i + 1} is ${lines[i].length} characters (recommended max: 72)`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Parse a commit message into its components
 */
export function parseCommitMessage(message: string): Partial<CommitParams> | null {
  const lines = message.split('\n');
  const firstLine = lines[0];

  const emojiRegex = /^([^\s]+)\s+/;
  const emojiMatch = firstLine.match(emojiRegex);

  if (!emojiMatch) {
    return null;
  }

  const restOfLine = firstLine.substring(emojiMatch[0].length);
  const typeRegex = /^([a-z]+)(\([^)]+\))?(!)?:\s+(.+)$/;
  const typeMatch = restOfLine.match(typeRegex);

  if (!typeMatch) {
    return null;
  }

  const [, type, scopeRaw, breaking, title] = typeMatch;
  const scope = scopeRaw ? scopeRaw.slice(1, -1) : undefined;

  const description = lines.length > 2 ? lines.slice(2).join('\n').trim() : undefined;

  return {
    type: type as CommitType,
    scope,
    title,
    description,
    breaking: breaking === '!',
  };
}

/**
 * Wrap text to specified width
 */
export function wrapText(text: string, width: number = 72): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine.length > 0 ? ' ' : '') + word;
    } else {
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}
