# Gitmoji Commit MCP

A Model Context Protocol (MCP) server for creating, validating, and formatting Git commits following the emoji-enhanced conventional commit standard.

## Overview

This MCP server provides AI assistants with tools to help developers create well-formatted, meaningful commit messages with emojis. It implements a comprehensive commit convention that combines the clarity of conventional commits with the visual appeal of emojis.

## Features

- **Automated Commit Formatting**: Generate properly formatted commit messages with correct emojis
- **Type Suggestions**: Analyze staged changes and suggest appropriate commit types
- **Message Validation**: Validate commit messages against convention rules
- **Git Integration**: Seamlessly create commits directly from the tools
- **TypeScript**: Fully typed implementation for reliability
- **16 Commit Types**: Support for primary and extended commit types

## Installation

### Global Installation

```bash
npm install -g gitmoji-commit-mcp
```

### Local Development

```bash
git clone <repository-url>
cd gitmoji-commit-mcp
npm install
npm run build
```

## MCP Server Configuration

Add this server to your MCP client configuration:

### Claude Desktop

Edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "git-emoji-commit": {
      "command": "npx",
      "args": ["-y", "gitmoji-commit-mcp"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "git-emoji-commit": {
      "command": "gitmoji-commit-mcp"
    }
  }
}
```

### VSCode with Continue Extension

If you're using the [Continue](https://continue.dev/) extension for VSCode, add to your Continue configuration:

**Location**: `~/.continue/config.json` (macOS/Linux) or `%USERPROFILE%\.continue\config.json` (Windows)

```json
{
  "mcpServers": {
    "git-emoji-commit": {
      "command": "npx",
      "args": ["-y", "gitmoji-commit-mcp"],
      "disabled": false
    }
  }
}
```

### OpenAI / Other MCP Clients

For any MCP-compatible client that supports the Model Context Protocol:

```json
{
  "servers": {
    "git-emoji-commit": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "gitmoji-commit-mcp"]
    }
  }
}
```

**Note**: Configuration file location and format may vary by client. Refer to your specific MCP client's documentation.

## Available Tools

### 1. `git_format_message`

Format a commit message according to the convention.

**Parameters:**
- `type` (required): Commit type (feat, fix, docs, etc.)
- `title` (required): Brief description in imperative mood
- `scope` (optional): Context like #123, auth, api
- `description` (optional): Detailed explanation
- `breaking` (optional): Whether this is a breaking change

**Example:**
```json
{
  "type": "feat",
  "scope": "auth",
  "title": "add OAuth2 authentication",
  "description": "Implemented OAuth2 flow with Google and GitHub providers.",
  "breaking": false
}
```

**Output:**
```
✨ feat(auth): add OAuth2 authentication

Implemented OAuth2 flow with Google and GitHub providers.
```

### 2. `git_validate_message`

Validate a commit message against the convention.

**Parameters:**
- `message` (required): The commit message to validate

**Example:**
```json
{
  "message": "✨ feat(auth): add OAuth2 authentication"
}
```

**Output:**
```
✅ Commit message is valid!
```

### 3. `git_suggest_type`

Analyze staged changes and suggest an appropriate commit type.

**Parameters:** None (analyzes git staged changes)

**Output:**
```
Suggested commit type: ✨ feat

Confidence: high
Reason: Significant additions (245 lines added vs 12 deleted) suggest new feature

Type description: A new feature
```

### 4. `git_commit`

Create a git commit following the convention.

**Parameters:** Same as `git_format_message`

**Output:**
```
✅ Commit created successfully!

Commit hash: abc123def456

Message:
✨ feat(auth): add OAuth2 authentication

Implemented OAuth2 flow with Google and GitHub providers.
```

## Commit Types

### Primary Types

| Type | Emoji | Description |
|------|-------|-------------|
| `feat` | ✨ | A new feature |
| `fix` | 🐛 | A bug fix |
| `docs` | 📝 | Documentation only changes |
| `style` | 🎨 | Code formatting (no logic change) |
| `refactor` | ♻️ | Code restructuring (no feature/fix) |
| `perf` | ⚡ | Performance improvements |
| `test` | 🧪 | Adding or updating tests |
| `build` | 📦 | Build system/dependencies |
| `ci` | 👷 | CI/CD configuration |
| `chore` | 🔧 | Maintenance tasks |
| `revert` | ⏪ | Revert previous commit |

### Extended Types

| Type | Emoji | Description |
|------|-------|-------------|
| `security` | 🔒 | Security fixes |
| `deprecate` | ⚠️ | Deprecation warnings |
| `breaking` | 💥 | Breaking changes |
| `i18n` | 🌐 | Internationalization |
| `a11y` | ♿ | Accessibility improvements |
| `deps` | ⬆️ | Dependency updates |

## Commit Message Format

```
<emoji> <type>(<scope>): <title>

<description>
```

### Rules

**Title:**
- Use imperative mood: "add feature" not "added feature"
- Don't capitalize first letter
- No period at the end
- Maximum 50 characters

**Description:**
- Separate from title with blank line
- Wrap at 72 characters
- Explain WHAT and WHY, not HOW

## Usage Examples

### With AI Assistant

```
User: "I added a new login feature with OAuth"

AI: Let me analyze your changes and create a commit.
[calls git_suggest_type]
This looks like a new feature. I'll create a commit for you.
[calls git_commit with type='feat', scope='auth', title='add OAuth login']

✅ Created commit: feat(auth): add OAuth login
```

### Manual Tool Use

1. **Stage your changes:**
```bash
git add src/auth/*
```

2. **Ask AI to suggest type:**
```
"What type of commit should this be?"
```

3. **Create the commit:**
```
"Create a commit with type feat, scope auth, and title 'add OAuth2 authentication'"
```

## Development

### Project Structure

```
gitmoji-commit-mcp/
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── types.ts          # Type definitions and commit types
│   ├── utils.ts          # Formatting and validation
│   └── git.ts            # Git operations
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Testing Locally

1. Build the project:
```bash
npm run build
```

2. Link globally:
```bash
npm link
```

3. Test the server:
```bash
gitmoji-commit-mcp
```

The server communicates via stdio and expects MCP protocol messages.

## Integration

### With Claude Desktop

Once configured, Claude can automatically use these tools when you ask questions like:

- "Create a commit for my changes"
- "What type of commit should this be?"
- "Validate my commit message"
- "Format a commit for adding authentication"

### With VSCode (Continue Extension)

The [Continue](https://continue.dev/) extension brings AI assistance directly into VSCode with MCP support. After configuration, you can:

- Ask Continue to analyze your staged changes and suggest commit types
- Request formatted commit messages directly in the editor
- Validate commit messages before committing
- Use natural language to create commits: "Commit these changes as a bug fix"

**Usage**: Press `Cmd+L` (macOS) or `Ctrl+L` (Windows/Linux) to open Continue, then interact with the MCP tools.

### With Other MCP Clients

Any MCP-compatible client can use this server:

- **Zed Editor**: Configure in MCP settings for AI-assisted commits
- **Custom MCP Clients**: Use the stdio transport protocol
- **API Integrations**: Connect via the Model Context Protocol specification

Add it to your client's server configuration with the appropriate command and args. The server uses stdio transport and follows the standard MCP protocol.

## Validation Rules

The validator checks for:

- **Required Format**: `<emoji> <type>(<scope>): <title>`
- **Valid Types**: Must be one of the defined commit types
- **Emoji Match**: Emoji must match the commit type
- **Title Length**: Recommended max 50 characters
- **Title Case**: Should start with lowercase
- **Title Period**: Should not end with period
- **Imperative Mood**: Basic check for common mistakes
- **Description Format**: Blank line after title, 72 char lines

## Type Suggestion Algorithm

The `git_suggest_type` tool analyzes:

1. **File Types**: Documentation, tests, configs, CI files
2. **File Patterns**: Build files, dependencies, source code
3. **Change Ratio**: Additions vs deletions
4. **Change Volume**: Total lines changed

Returns suggestion with confidence level (high/medium/low).

## Error Handling

All tools provide clear error messages:

- No staged changes for commit
- Invalid commit type
- Malformed commit message
- Git operation failures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT

## Support

For issues, questions, or contributions, please visit the GitHub repository.

## Changelog

### 1.0.0 (2025-02-06)

- Initial release
- Four MCP tools: format, validate, suggest, commit
- Support for 16 commit types
- TypeScript implementation
- Git integration with simple-git
- Comprehensive validation and formatting

## Related

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Anthropic Claude](https://www.anthropic.com/claude)

---

**Made with ❤️ for better Git commits**
