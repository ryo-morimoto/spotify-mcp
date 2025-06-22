# Claude Commands Reference

Optimized custom commands for efficient development workflows with Claude Code.

**Optimized**: 29 → 20 commands (-31% reduction) with unified interfaces and eliminated redundancies.

## Available Commands

### 🛠️ Core Development Commands

#### `/commit` - Smart Git Commits
Create well-formatted git commits following repository conventions.
- Analyzes all changes (staged and unstaged)
- Runs quality checks (lint, typecheck, tests)
- Generates descriptive commit messages
- Follows conventional commit format
- Adds Claude Code attribution

```bash
claude /commit
claude /commit --no-verify  # Skip pre-commit hooks
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

#### `/refactor` - Code Refactoring Helper
Intelligent code refactoring assistance.
- Analyzes refactoring scope
- Suggests improvement patterns
- Maintains type safety
- Preserves functionality

```bash
claude /refactor <target>
```

### 🎯 Issue & Project Management

#### `/issue` - Comprehensive GitHub Issue Management
*Unified command for all GitHub issue operations: analysis, complexity, labeling, and decomposition*
- **Analysis**: Implementation specs and requirements validation
- **Complexity**: 5-dimension assessment (0-20 scale) with split recommendations
- **Labeling**: Intelligent content-based label application
- **Splitting**: Complex issue decomposition with dependency mapping

```bash
claude /issue analyze <number> [--mode spec|requirements|both] [--comment]
claude /issue complexity <number>              # Assess complexity and splitting needs
claude /issue label <number>                   # Apply intelligent labels
claude /issue split <number>                   # Decompose complex issues
```

### 🔧 MCP Development (Unified)

#### `/mcp` - Comprehensive MCP Management
*Unified command for all MCP server development and deployment*
- **Validation**: Best practices compliance, code quality checks
- **Release**: Automated release workflow with comprehensive validation
- **Remote**: Connect to and manage remote MCP servers
- **Auth**: OAuth 2.1 authentication management
- **Info**: Server diagnostics and health checks

```bash
claude /mcp validate [--strict]           # Check compliance
claude /mcp release [--prepare|--publish] # Release management
claude /mcp remote <connect|test> <url>   # Remote server ops
claude /mcp auth <setup|refresh|status>   # OAuth management
claude /mcp info                          # Server diagnostics
```

### 📚 Documentation (Unified)

#### `/docs` - Documentation Management
*Unified command for all documentation operations*
- **Create**: Generate new documentation from code analysis
- **Update**: LLM-optimized updates with file references
- **Validate**: Check completeness, links, and consistency
- **Sync**: Cross-project documentation synchronization

```bash
claude /docs create <target> [--format <type>]  # Generate new docs
claude /docs update [--target <path>] [--optimize]  # Update existing
claude /docs validate [--target <path>]         # Validate completeness
claude /docs sync <source-project>              # Cross-project sync
```

#### `/sync-doc` - Cross-project Synchronization
Synchronize documentation across related projects.
- Detects documentation files
- Compares with reference project
- Updates with consistent format
- Preserves project-specific content

```bash
claude /sync-doc ../reference-project
```

### 🛠️ Code Quality & Utilities

#### `/code-annotations` - Code Annotation Management
*Enhanced command managing all code annotations (TODO, FIXME, NOTE, HACK)*
- Formats annotations for pcheck compatibility
- Organizes by priority and context
- Creates documentation for large items
- Integrates with tracking tools

```bash
claude /code-annotations                 # Format all annotations
claude /code-annotations --format-todos # TODO-specific formatting
claude /code-annotations --analyze      # Generate analysis report
```

#### `/tsr-dce` - Dead Code Elimination
Find and remove unused TypeScript exports.
- Analyzes export usage across codebase
- Identifies unused code safely
- Preserves entry points and public APIs
- Provides dry-run options

```bash
claude /tsr-dce analyze
claude /tsr-dce remove --dry-run
```

#### `/pcheck` - TODO Management
TODO management tool for project task tracking.
- Shows all TODO items in project
- Updates TODO.md by moving completed tasks
- Validates TODO.md formatting
- Integrates with source code annotations

```bash
claude /pcheck                    # Show all TODO items
claude /pcheck u                  # Update TODO.md
claude /pcheck --code            # Include source code TODOs
claude /pcheck add -m "Task"     # Add new task
```

### 🚀 Workflow & Automation

#### `/orchestrator` - Multi-Agent Task Coordination
Coordinate complex multi-step tasks across multiple agents.
- Task decomposition and parallel execution
- Progress tracking and result aggregation
- Intelligent task dependencies
- Cross-agent communication

```bash
claude /orchestrator "Refactor authentication system"
```

#### `/bug-fix` - Bug Fixing Workflow
Structured approach to bug investigation and resolution.
- Issue reproduction and analysis
- Root cause identification
- Fix implementation with tests
- Verification and documentation

```bash
claude /bug-fix <issue-description>
```

#### `/memory` - Context Management
Manage Claude's memory and context across sessions.
- Store important project context
- Retrieve relevant information
- Optimize context for current tasks
- Cross-session continuity

```bash
claude /memory store <key> <content>
claude /memory retrieve <key>
claude /memory optimize
```

### 📊 Utilities & Maintenance

#### `/add-to-changelog` - Changelog Management
Add entries to CHANGELOG.md following standard format.
- Follows Keep a Changelog format
- Categorizes changes (Added, Changed, Fixed, etc.)
- Maintains version chronology
- Links to related issues/PRs

```bash
claude /add-to-changelog --type feat --message "Add new feature"
```

#### `/compact` - Project Cleanup
Compress and optimize project structure.
- Removes temporary files and caches
- Optimizes directory structure
- Cleans up obsolete dependencies
- Maintains essential project files

```bash
claude /compact [--target <directory>]
```

#### `/create-command` - Command Creation Helper
Create new Claude commands following best practices.
- Template-based command structure
- Proper documentation format
- Integration with existing commands
- Testing and validation setup

```bash
claude /create-command <command-name>
```

#### `/five` - Quick Five-Minute Tasks
Handle quick development tasks efficiently.
- Time-boxed task execution
- Focus on immediate wins
- Simple issue resolution
- Rapid prototyping support

```bash
claude /five <quick-task-description>
```

#### `/usage-tracker` - Command Usage Analytics
Track Claude command usage for data-driven optimization.
- Logs command execution with timestamps
- Tracks success/failure rates and execution times
- Generates usage reports and analytics
- Provides optimization recommendations

```bash
claude /usage-tracker           # View current usage
claude /usage-tracker report   # Generate detailed report
claude /usage-tracker setup    # Enable usage tracking
```

## 🎯 Optimization Summary

### Before Optimization
- **Total Commands**: 29
- **Clear Duplicates**: 5 identified (analyze-issue ↔ issue-analyze, commit ↔ commit-with-check, etc.)
- **Fragmented Workflows**: MCP, Issue, Documentation commands scattered
- **Maintenance Burden**: High due to overlapping functionality

### After Optimization  
- **Total Commands**: 20 (-31% reduction)
- **Unified Interfaces**: `/issue`, `/mcp`, `/docs` with subcommands
- **Zero Redundancy**: All duplicate functionality consolidated
- **Improved Discovery**: Logical command grouping and clear categorization

### Key Improvements
1. **Unified Commands**: Issue, MCP, and Documentation workflows consolidated
2. **Enhanced Functionality**: Combined commands include best features from each
3. **Better UX**: Consistent subcommand patterns and clear categorization
4. **Reduced Maintenance**: Single source of truth for related functionality
5. **Preserved Features**: All original functionality maintained or enhanced

## Command Categories

```
📊 Command Distribution (20 total):
├── 🛠️ Core Development: 4 commands (20%)
├── 🎯 Issue Management: 1 unified command (5%)  
├── 🔧 MCP Development: 1 unified command (5%)
├── 📚 Documentation: 2 commands (10%)
├── 🛠️ Code Quality: 3 commands (15%)
├── 🚀 Workflow: 3 commands (15%)
└── 📊 Utilities: 6 commands (30%)
```

## Quick Reference

### Daily Development Workflow
```bash
claude /commit                    # Smart commits with quality checks
claude /pcheck                   # Check project TODOs
claude /code-annotations         # Manage code annotations
claude /mcp validate             # Ensure MCP compliance
```

### Issue Management Workflow  
```bash
claude /issue analyze 123 --mode both     # Complete issue analysis
claude /issue complexity 123              # Assess complexity
claude /issue split 123                   # Split if complex
```

### Release Workflow
```bash
claude /mcp validate --strict             # Pre-release validation
claude /release minor                     # Version bump and release
claude /tag push                          # Push release tags
```

### Documentation Workflow
```bash
claude /docs update --optimize            # Update all documentation
claude /docs validate                     # Check completeness
claude /docs create src/new-feature.ts    # Document new features
```

## Environment Variables

```bash
# Usage Tracking (Optional)
export CLAUDE_USAGE_LOG="$HOME/.claude/usage/commands.log"

# MCP Development
export SPOTIFY_MCP_LOG_FILE="/var/log/spotify-mcp.log"
export SPOTIFY_MCP_LOG_LEVEL="info"
export SPOTIFY_MCP_CONSOLE_LOGGING="false"

# Development Settings
export NODE_ENV="development"
export MCP_DEBUG="true"
```

## Migration Notes

### Replaced Commands
- `commit-with-check` → Use `/commit` (includes testing)
- `analyze-issue` → Use `/issue analyze --mode requirements`
- `issue-complexity` → Use `/issue complexity`
- `issue-labeling` → Use `/issue label`
- `issue-split` → Use `/issue split`
- `mcp-best-practices` → Use `/mcp validate`
- `mcp-releasing` → Use `/mcp release`
- `remote-mcp` → Use `/mcp remote`
- `remote-mcp-auth` → Use `/mcp auth`
- `create-docs` → Use `/docs create`
- `update-docs` → Use `/docs update`
- `todo-format` → Use `/code-annotations --format-todos`

### Enhanced Commands
- `/issue`: Complete GitHub issue lifecycle management with analysis, complexity, labeling, and splitting
- `/mcp`: Unified interface for all MCP operations
- `/docs`: Complete documentation lifecycle management
- `/code-annotations`: Comprehensive annotation management including TODO formatting

All original functionality is preserved with improved workflows and unified interfaces.