#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { CommitParams, CommitType, COMMIT_TYPES } from './types.js';
import { formatCommitMessage, validateCommitMessage } from './utils.js';
import { createCommit, hasStagedChanges, suggestCommitType } from './git.js';
import type { GitOperationOptions } from './git.js';

/**
 * MCP Server for Gitmoji Commit Convention
 */
class GitmojiCommitServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'gitmoji-commit-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const requestMeta = this.getRequestMeta(request.params);

      try {
        switch (name) {
          case 'git_format_message':
            return await this.handleFormatMessage(args);
          case 'git_validate_message':
            return await this.handleValidateMessage(args);
          case 'git_suggest_type':
            return await this.handleSuggestType(args, requestMeta);
          case 'git_commit':
            return await this.handleCommit(args, requestMeta);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'git_format_message',
        description:
          'Format a commit message according to the git-emoji-commit convention. Takes commit parameters and returns a properly formatted message with emoji.',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'The commit type (feat, fix, docs, etc.)',
              enum: Object.keys(COMMIT_TYPES),
            },
            scope: {
              type: 'string',
              description: 'Optional scope (e.g., #123, auth, api)',
            },
            title: {
              type: 'string',
              description: 'Brief description in imperative mood (50 chars max)',
            },
            description: {
              type: 'string',
              description: 'Optional detailed explanation',
            },
            breaking: {
              type: 'boolean',
              description: 'Whether this is a breaking change',
              default: false,
            },
          },
          required: ['type', 'title'],
        },
      },
      {
        name: 'git_validate_message',
        description:
          'Validate a commit message against the git-emoji-commit convention. Returns validation results with any issues or warnings.',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'The commit message to validate',
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'git_suggest_type',
        description:
          'Analyze staged git changes and suggest an appropriate commit type. Returns suggested type with reasoning.',
        inputSchema: {
          type: 'object',
          properties: {
            repo_path: {
              type: 'string',
              description:
                'Optional path to the git repository. Use when MCP server runs outside your project directory.',
            },
          },
        },
      },
      {
        name: 'git_commit',
        description:
          'Create a git commit following the emoji-commit convention. Validates staged changes exist, formats the message, and creates the commit.',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'The commit type (feat, fix, docs, etc.)',
              enum: Object.keys(COMMIT_TYPES),
            },
            scope: {
              type: 'string',
              description: 'Optional scope (e.g., #123, auth, api)',
            },
            title: {
              type: 'string',
              description: 'Brief description in imperative mood (50 chars max)',
            },
            description: {
              type: 'string',
              description: 'Optional detailed explanation',
            },
            breaking: {
              type: 'boolean',
              description: 'Whether this is a breaking change',
              default: false,
            },
            repo_path: {
              type: 'string',
              description:
                'Optional path to the git repository. Use when MCP server runs outside your project directory.',
            },
          },
          required: ['type', 'title'],
        },
      },
    ];
  }

  private getRequestMeta(params: unknown): unknown {
    if (!params || typeof params !== 'object') {
      return undefined;
    }

    const record = params as Record<string, unknown>;
    return record._meta;
  }

  private getGitOptions(args: unknown, requestMeta: unknown): GitOperationOptions {
    return {
      repoPath: this.extractRepoPath(args),
      requestMeta,
    };
  }

  private extractRepoPath(args: unknown): string | undefined {
    if (!args || typeof args !== 'object') {
      return undefined;
    }

    const record = args as Record<string, unknown>;
    const raw = record.repo_path ?? record.repoPath;

    if (typeof raw !== 'string') {
      return undefined;
    }

    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private async handleFormatMessage(args: any) {
    const params: CommitParams = {
      type: args.type as CommitType,
      scope: args.scope,
      title: args.title,
      description: args.description,
      breaking: args.breaking || false,
    };

    const message = formatCommitMessage(params);

    return {
      content: [
        {
          type: 'text',
          text: `Formatted commit message:\n\n${message}`,
        },
      ],
    };
  }

  private async handleValidateMessage(args: any) {
    const message = args.message as string;

    if (!message) {
      throw new Error('Message is required');
    }

    const result = validateCommitMessage(message);

    let responseText = '';

    if (result.valid) {
      responseText = '✅ Commit message is valid!\n';
    } else {
      responseText = '❌ Commit message has issues:\n\n';
      result.issues.forEach((issue, i) => {
        responseText += `${i + 1}. ${issue}\n`;
      });
    }

    if (result.warnings && result.warnings.length > 0) {
      responseText += '\n⚠️  Warnings:\n';
      result.warnings.forEach((warning, i) => {
        responseText += `${i + 1}. ${warning}\n`;
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
    };
  }

  private async handleSuggestType(args: any, requestMeta: unknown) {
    const suggestion = await suggestCommitType(this.getGitOptions(args, requestMeta));

    const responseText = `Suggested commit type: ${suggestion.emoji} ${suggestion.type}

Confidence: ${suggestion.confidence}
Reason: ${suggestion.reason}

Type description: ${COMMIT_TYPES[suggestion.type].description}`;

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
    };
  }

  private async handleCommit(args: any, requestMeta: unknown) {
    const gitOptions = this.getGitOptions(args, requestMeta);

    // Check for staged changes
    const hasChanges = await hasStagedChanges(gitOptions);
    if (!hasChanges) {
      throw new Error('No staged changes found. Please stage your changes first with git add.');
    }

    // Format the commit message
    const params: CommitParams = {
      type: args.type as CommitType,
      scope: args.scope,
      title: args.title,
      description: args.description,
      breaking: args.breaking || false,
    };

    const message = formatCommitMessage(params);

    // Validate the message
    const validation = validateCommitMessage(message);
    if (!validation.valid) {
      throw new Error(`Invalid commit message:\n${validation.issues.join('\n')}`);
    }

    // Create the commit
    const commitHash = await createCommit(message, gitOptions);

    let responseText = `✅ Commit created successfully!\n\nCommit hash: ${commitHash}\n\nMessage:\n${message}`;

    if (validation.warnings && validation.warnings.length > 0) {
      responseText += '\n\n⚠️  Warnings:\n';
      validation.warnings.forEach((warning, i) => {
        responseText += `${i + 1}. ${warning}\n`;
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Gitmoji Commit MCP Server running on stdio');
  }
}

// Start the server
const server = new GitmojiCommitServer();
server.run().catch((error: unknown) => {
  console.error('Server error:', error);
  process.exit(1);
});
