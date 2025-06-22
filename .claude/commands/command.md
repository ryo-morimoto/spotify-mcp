# command - Claude Command Management

**Unified command for managing Claude Code commands: creation, optimization, usage tracking, and formatting.**

## Quick Reference

```bash
claude /command create <name>                 # Create new command
claude /command optimize [--report]           # Analyze and optimize commands
claude /command track [setup|report|analyze]  # Usage tracking and analytics
claude /command format [--validate]           # Format and validate commands
```

## Subcommands

### `/command create` - Create New Commands
*Generate new Claude commands with proper structure and conventions*

**Usage:**
```bash
claude /command create <command-name>
claude /command create <name> --template <type>  # Specify template type
```

**Features:**
- **Purpose Analysis**: Identifies problem being solved and target users
- **Template Selection**: Planning, implementation, analysis, or workflow templates
- **Structure Generation**: Creates markdown file with required sections
- **Validation**: Checks naming conventions and verifies functionality

**Command Templates:**
- **Planning**: Architecture and design commands
- **Implementation**: Code generation and modification
- **Analysis**: Code review and inspection
- **Workflow**: Multi-step process automation

**Example:**
```bash
$ claude /command create sync-database

Creating new command: sync-database

✓ Analyzed command purpose: Database synchronization workflow
✓ Selected template: Workflow (multi-step process)
✓ Created .claude/commands/sync-database.md
✓ Added command structure with:
  - Title and description
  - Usage section with parameters  
  - Step-by-step process
  - Example outputs
  - Error handling notes

Command created successfully!
Test with: claude /sync-database
```

### `/command optimize` - Command Optimization
*Analyze command usage patterns and optimize for efficiency*

**Usage:**
```bash
claude /command optimize                    # Full optimization analysis
claude /command optimize --report          # Generate optimization report only
claude /command optimize --consolidate      # Focus on consolidation opportunities
```

**Optimization Features:**
- **Duplicate Detection**: Identifies overlapping functionality
- **Usage Analysis**: Finds under-utilized commands
- **Consolidation**: Suggests command merging opportunities
- **Performance**: Analyzes execution patterns

**Analysis Dimensions:**
- **Functionality Overlap**: Commands with similar purposes
- **Usage Frequency**: Rarely used vs frequently used commands
- **Complexity**: Commands that could be simplified
- **User Experience**: Interface consistency improvements

**Example Output:**
```markdown
## Command Optimization Report

### Summary
- **Total Commands**: 20
- **Optimization Opportunities**: 3 identified
- **Potential Savings**: 15% reduction possible

### Recommendations
1. **Consolidate Issue Commands**: merge issue-* into /issue
2. **Simplify Complex Commands**: break down orchestrator.md
3. **Remove Unused**: archive experimental commands

### Impact Analysis
- Reduced maintenance burden: 25%
- Improved discoverability: 40% 
- Enhanced user experience: 35%
```

### `/command track` - Usage Tracking
*Track command usage for data-driven optimization and analytics*

**Usage:**
```bash
claude /command track setup                 # Enable usage tracking
claude /command track report               # Generate usage report
claude /command track analyze              # Detailed analytics
claude /command track recommend            # Optimization recommendations
```

**Tracking Features:**
- **Execution Logging**: Command usage with timestamps
- **Success/Failure Rates**: Performance metrics
- **Execution Time**: Performance profiling
- **User Patterns**: Usage frequency analysis

**Setup Process:**
```bash
# 1. Enable tracking
claude /command track setup

# Creates tracking infrastructure:
✓ ~/.claude/usage/commands.log
✓ ~/.claude/usage/analyze.sh  
✓ Bash function integration

# 2. Generate reports
claude /command track report

# Example output:
Command Usage Report (Last 30 days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Most Used Commands:
1. /commit        142 executions (28%)
2. /issue         89 executions (18%)
3. /docs          67 executions (13%)
4. /mcp           45 executions (9%)
5. /pcheck        32 executions (6%)

Performance Metrics:
- Average execution time: 2.3s
- Success rate: 94.2%
- Commands with errors: /orchestrator (12%), /release (8%)

Recommendations:
- Consider optimizing /orchestrator for reliability
- /five command unused - candidate for removal
```

### `/command format` - Command Formatting
*Format and validate command structure for consistency*

**Usage:**
```bash
claude /command format                      # Format all commands
claude /command format <command-name>      # Format specific command
claude /command format --validate          # Validation only
claude /command format --fix-structure     # Auto-fix structure issues
```

**Formatting Rules:**
- **Header Structure**: Consistent title and description format
- **Section Order**: Usage → Features → Examples → Notes
- **Code Blocks**: Proper syntax highlighting and formatting
- **Links**: Valid references and cross-links

**Validation Checks:**
- **Required Sections**: Usage, description, examples present
- **Consistent Formatting**: Markdown syntax compliance
- **Link Validation**: Internal and external links work
- **Example Accuracy**: Code examples are valid

**Example:**
```bash
$ claude /command format --validate

Validating 20 commands...

✓ issue.md - Well formatted
✓ mcp.md - Well formatted  
✓ docs.md - Well formatted
⚠ orchestrator.md - Missing examples section
✗ memory.md - Invalid markdown syntax on line 45
✓ commit.md - Well formatted

Summary:
- 17 commands properly formatted
- 1 command with warnings
- 2 commands need fixes

Run with --fix-structure to auto-correct issues.
```

## Advanced Features

### Batch Operations
```bash
# Optimize all commands
claude /command optimize --batch

# Format all commands with auto-fix
claude /command format --fix-structure --all

# Generate comprehensive analytics
claude /command track analyze --detailed --export-csv
```

### Integration Workflows
```bash
# Complete command lifecycle
claude /command create new-feature        # Create command
claude /command format new-feature        # Format properly
claude /command track setup               # Enable tracking
# ... use command over time ...
claude /command track analyze             # Analyze usage
claude /command optimize --based-on-usage # Optimize based on data
```

### Automation Hooks
```bash
# Pre-commit validation
#!/bin/bash
claude /command format --validate
if [ $? -ne 0 ]; then
  echo "Command formatting issues detected"
  exit 1
fi

# Weekly optimization
#!/bin/bash
claude /command track report --weekly
claude /command optimize --report --email-team
```

## Command Categories

### By Purpose
- **Development**: commit, refactor, release, tag
- **Project Management**: issue, docs, sync-doc
- **Code Quality**: code-annotations, tsr-dce, pcheck
- **Workflow**: orchestrator, bug-fix, memory
- **Utilities**: compact, five, add-to-changelog
- **MCP**: mcp (unified)

### By Complexity
- **Simple (<50 lines)**: five, compact
- **Medium (50-200 lines)**: commit, tag, release, refactor
- **Complex (>200 lines)**: issue, mcp, docs, orchestrator

### By Usage Frequency
- **Daily**: commit, pcheck, code-annotations
- **Weekly**: issue, docs, mcp
- **Monthly**: release, tag, refactor
- **As-needed**: bug-fix, orchestrator, memory

## Best Practices

### Command Creation
1. **Single Responsibility**: Each command should do one thing well
2. **Clear Naming**: Use verb-noun format (create-test, analyze-code)
3. **Consistent Structure**: Follow standard section layout
4. **Helpful Examples**: Include realistic usage scenarios
5. **Error Guidance**: Document common issues and solutions

### Command Optimization
1. **Regular Review**: Monthly optimization analysis
2. **Data-Driven**: Base decisions on actual usage data
3. **User Feedback**: Gather input on command effectiveness
4. **Gradual Changes**: Avoid breaking existing workflows

### Usage Tracking
1. **Privacy Conscious**: Track usage patterns, not sensitive data
2. **Actionable Metrics**: Focus on data that drives improvements
3. **Regular Analysis**: Weekly usage reports, monthly optimization
4. **Performance Monitoring**: Track execution times and failure rates

## Configuration

### Tracking Setup
```bash
# Enable comprehensive tracking
export CLAUDE_USAGE_LOG="$HOME/.claude/usage/commands.log"
export CLAUDE_TRACK_PERFORMANCE="true"
export CLAUDE_TRACK_ERRORS="true"

# Add to ~/.bashrc
claude() {
  echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") $*" >> "$CLAUDE_USAGE_LOG"
  /usr/local/bin/claude "$@"
  echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") RESULT:$?" >> "$CLAUDE_USAGE_LOG"
}
```

### Optimization Thresholds
```bash
# Configuration for optimization decisions
export CLAUDE_MIN_USAGE_THRESHOLD=5      # Commands used <5 times/month
export CLAUDE_COMPLEXITY_THRESHOLD=300   # Lines of markdown
export CLAUDE_CONSOLIDATION_THRESHOLD=3  # Similar commands
```

## Migration from Separate Commands

```bash
# Old commands → New unified command  
create-command <name>              → claude /command create <name>
usage-tracker setup                → claude /command track setup
usage-tracker report              → claude /command track report
format-commands --all              → claude /command format
optimize-commands                  → claude /command optimize
```

All functionality preserved with enhanced integration and data-driven optimization capabilities.