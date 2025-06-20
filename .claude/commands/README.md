# MCP Best Practices Custom Commands

These custom slash commands help you follow MCP (Model Context Protocol) best practices when developing your Spotify Remote MCP server.

## Available Commands

### `/mcp-setup`
Initialize your MCP server with best practices configuration.
- Sets up Pino logger with file-based logging
- Creates proper directory structure
- Configures environment variables
- Sets up TypeScript with strict mode
- Creates .env template with MCP-specific variables

**Usage:**
```bash
claude /mcp-setup
```

### `/mcp-validate`
Validate your project against MCP best practices.
- Checks environment configuration
- Validates logger implementation (no stdio output)
- Verifies package.json setup
- Checks TypeScript configuration
- Validates error handling patterns
- Ensures file size limits
- Runs compilation and linting

**Usage:**
```bash
claude /mcp-validate
```

### `/mcp-info`
Display server information and diagnostics.
- Shows version and configuration status
- Lists available MCP tools
- Checks dependencies
- Provides quick start guide
- Detects common issues

**Usage:**
```bash
claude /mcp-info
```

### `/mcp-test`
Run comprehensive tests with MCP validation.
- Type checking
- Linting
- Code formatting
- Unit tests with coverage
- MCP-specific checks (no stdio, proper error handling)
- Integration tests

**Usage:**
```bash
claude /mcp-test
```

### `/mcp-dev`
Development workflow helper for MCP best practices.

**Subcommands:**
- `tool <name>` - Create a new MCP tool with tests
- `check` - Check development environment readiness
- `dev` - Run development server with debug logging
- `watch` - Run tests in watch mode (TDD)
- `coverage` - Generate test coverage report

**Usage:**
```bash
claude /mcp-dev tool search_albums
claude /mcp-dev check
claude /mcp-dev watch
```

### `/mcp-release`
Prepare for release following MCP best practices.
- Git and version control checks
- Code quality validation
- Security audit
- Documentation verification
- Package size validation
- Build process checks

**Usage:**
```bash
claude /mcp-release
```

## MCP Best Practices Summary

These commands enforce the following MCP best practices:

1. **No stdio Output**: MCP servers must not output to stdout/stderr
2. **File-based Logging**: Use Pino logger writing to files
3. **Environment Variables**: Proper configuration with sensible defaults
4. **Error Handling**: Use Result types instead of throwing exceptions
5. **TypeScript**: Strict mode enabled
6. **Testing**: Comprehensive test coverage with Vitest
7. **File Size**: Keep files under 500 lines
8. **Version Management**: Dynamic version reading from package.json
9. **Tool Descriptions**: Clear, helpful descriptions for all tools
10. **Info Command**: Diagnostic command for troubleshooting

## Quick Start

1. Initialize your project:
   ```bash
   claude /mcp-setup
   ```

2. Validate setup:
   ```bash
   claude /mcp-validate
   ```

3. Create a new tool:
   ```bash
   claude /mcp-dev tool my_tool_name
   ```

4. Run tests in watch mode:
   ```bash
   claude /mcp-dev watch
   ```

5. Check release readiness:
   ```bash
   claude /mcp-release
   ```

## Environment Variables

The commands use these MCP-specific environment variables:

- `SPOTIFY_MCP_LOG_FILE`: Path to log file (with automatic fallback)
- `SPOTIFY_MCP_LOG_LEVEL`: Log level (fatal, error, warn, info, debug, trace)
- `SPOTIFY_MCP_CONSOLE_LOGGING`: Enable console output for development only

## Notes

- Always run `/mcp-validate` before committing changes
- Use `/mcp-dev watch` for TDD development workflow
- Run `/mcp-release` before publishing to npm
- Check `/mcp-info` for current server status and configuration