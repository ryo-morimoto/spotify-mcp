# Claude Commands Reference

Custom commands for efficient development workflows with Claude Code.

## Available Commands

### Development Commands

#### `/commit` - Smart Git Commits
Create well-formatted git commits following repository conventions.
- Analyzes all changes (staged and unstaged)
- Generates descriptive commit messages
- Follows repository commit style
- Adds Claude Code attribution

```bash
claude /commit
```

#### `/tag` - Semantic Version Management
Manage git tags with semantic versioning.
- **Subcommands:**
  - `list` - Show all tags with descriptions
  - `create <version>` - Create annotated tag
  - `push` - Push tags to remote
  - `delete <tag>` - Remove local/remote tag

```bash
claude /tag list
claude /tag create v1.2.0
claude /tag push
```

#### `/release` - Automated Release Process
Complete release workflow with validation.
- Runs comprehensive tests
- Updates version in package.json
- Creates git tag
- Generates changelog
- Pushes to remote

```bash
claude /release patch
claude /release minor
claude /release major
```

#### `/update-docs` - Documentation Generation
Generate LLM-optimized documentation with file references.
- Creates comprehensive docs in `docs/`
- Includes architecture, build, testing guides
- Generates file catalog
- Updates README with links

```bash
claude /update-docs
```

#### `/sync-doc` - Cross-Project Documentation
Synchronize documentation across related projects.
- Detects documentation files
- Compares with reference project
- Updates with consistent format
- Preserves project-specific content

```bash
claude /sync-doc ../reference-project
```

### MCP-Specific Commands

#### `/mcp-setup` - Initialize MCP Server
Set up MCP server with best practices.
- Configures Pino logger
- Creates directory structure
- Sets up environment variables
- Configures TypeScript strict mode

```bash
claude /mcp-setup
```

#### `/mcp-validate` - Validate MCP Compliance
Check project against MCP best practices.
- No stdio output validation
- Logger implementation check
- Package.json verification
- Error handling patterns
- File size limits

```bash
claude /mcp-validate
```

#### `/mcp-info` - Server Diagnostics
Display server information and status.
- Version and configuration
- Available MCP tools
- Dependency checks
- Common issue detection

```bash
claude /mcp-info
```

#### `/mcp-test` - Comprehensive Testing
Run tests with MCP validation.
- Type checking
- Linting and formatting
- Unit tests with coverage
- MCP-specific checks
- Integration tests

```bash
claude /mcp-test
```

#### `/mcp-dev` - Development Tools
MCP development workflow helpers.
- **Subcommands:**
  - `tool <name>` - Create new MCP tool
  - `check` - Environment readiness
  - `dev` - Run with debug logging
  - `watch` - TDD watch mode
  - `coverage` - Coverage report

```bash
claude /mcp-dev tool search_albums
claude /mcp-dev watch
```

#### `/mcp-release` - Release Preparation
Prepare MCP server for release.
- Git status validation
- Code quality checks
- Security audit
- Documentation verification
- Package size validation

```bash
claude /mcp-release
```

### Utility Commands

#### `/tsr-dce` - Dead Code Elimination
Find and remove unused TypeScript exports.
- Analyzes export usage
- Identifies dead code
- Safe removal options
- Preserves entry points

```bash
claude /tsr-dce analyze
claude /tsr-dce remove --dry-run
```

#### `/orchstrator` - Multi-Agent Orchestration
Coordinate complex multi-step tasks.
- Task decomposition
- Parallel execution
- Progress tracking
- Result aggregation

```bash
claude /orchstrator "Refactor authentication system"
```

## Best Practices

### Git Workflow
1. Make changes
2. Run `/commit` for smart commits
3. Use `/tag` for version management
4. Run `/release` for full release

### MCP Development
1. Initialize with `/mcp-setup`
2. Validate with `/mcp-validate`
3. Develop with `/mcp-dev watch`
4. Release with `/mcp-release`

### Documentation
1. Generate with `/update-docs`
2. Sync with `/sync-doc`
3. Keep docs in `docs/` directory
4. Reference specific files

## Environment Variables

### MCP-Specific
- `SPOTIFY_MCP_LOG_FILE` - Log file path
- `SPOTIFY_MCP_LOG_LEVEL` - Log level
- `SPOTIFY_MCP_CONSOLE_LOGGING` - Dev console output

### General
- `GITHUB_TOKEN` - For release automation
- `NPM_TOKEN` - For package publishing

## Quick Reference

```bash
# Daily Development
claude /mcp-dev watch        # TDD mode
claude /commit               # Smart commits
claude /mcp-validate         # Pre-commit check

# Release Process
claude /mcp-test            # Full test suite
claude /release minor       # Version bump
claude /tag push           # Push tags

# Documentation
claude /update-docs        # Generate docs
claude /mcp-info          # Check status
```

## Notes

- Commands follow repository conventions
- All paths use absolute references
- Documentation is LLM-optimized
- Tests required for all changes