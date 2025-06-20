# Compact

Optimize context window usage by summarizing and removing unnecessary information.

## Usage

```
/compact
/compact --aggressive
/compact --keep-recent <n>
```

## What it does

1. **Analyzes context usage**
   - Measures current size
   - Identifies redundancies
   - Finds old content
   - Calculates savings

2. **Removes unnecessary data**
   - Clears resolved issues
   - Removes old outputs
   - Compresses discussions
   - Archives completed tasks

3. **Preserves essential info**
   - Keeps active tasks
   - Maintains key decisions
   - Retains error context
   - Saves important code

4. **Summarizes conversations**
   - Creates concise history
   - Highlights decisions
   - Notes key changes
   - Links to commits

## Example

```
/compact

Analyzing context window usage...

Current usage: 85% (102,400 / 120,000 tokens)

Optimization opportunities:
- 15% Old command outputs (15,360 tokens)
- 12% Resolved discussions (12,288 tokens)
- 8% Duplicate file reads (8,192 tokens)
- 5% Outdated TODO items (5,120 tokens)

Recommended actions:
✂️ Remove old outputs: save 15%
📝 Summarize discussions: save 10%
🔄 Update file cache: save 8%

Proceed with optimization? [Y/n]
```

## Optimization Strategies

### Standard Mode
- Remove command outputs older than 10 messages
- Clear resolved error messages
- Compress repetitive file reads
- Archive completed TODOs

### Aggressive Mode
- Keep only last 5 messages
- Remove all but current file contents
- Clear all resolved issues
- Minimal context retention

### Custom Settings
```
/compact --keep-recent 20    # Keep last 20 messages
/compact --preserve tests     # Keep test-related context
/compact --archive            # Save before clearing
```

## What Gets Removed

### Safe to Remove
- ✅ Old command outputs
- ✅ Resolved error messages
- ✅ Duplicate file contents
- ✅ Completed task details
- ✅ Outdated git status

### Always Preserved
- ❌ Active task context
- ❌ Current file states
- ❌ Unresolved issues
- ❌ Key decisions
- ❌ Recent changes

## Context Summary Format

After compaction, provides summary:

```markdown
## Session Summary

### Completed Tasks
- ✅ Implemented OAuth flow
- ✅ Added MCP tools
- ✅ Set up testing

### Active Work
- 🔄 Cloudflare deployment
- 🔄 Documentation updates

### Key Decisions
- Using neverthrow for errors
- SSE for transport
- KV for token storage

### Important Files
- src/worker.ts (modified)
- wrangler.toml (created)
- package.json (updated)

### Next Steps
1. Deploy to Cloudflare
2. Test SSE endpoint
3. Update documentation
```

## Best Practices

### When to Compact
- Before starting new features
- After completing major tasks
- When context >80% full
- Before complex operations

### What to Keep
- Current task information
- Recent error contexts
- Active file modifications
- Unresolved discussions

### Archiving
- Save summaries to `.claude/sessions/`
- Include timestamp and description
- Link to relevant commits
- Note key learnings

## Integration

### Automatic Triggers
- Context usage >90%
- After task completion
- Before large file reads
- On explicit request

### With Other Commands
- `/commit` - Compact after commits
- `/task` - Clear completed tasks
- `/memory` - Archive solutions
- `/analyze` - Before deep analysis

## Performance Tips

- Run regularly for smooth operation
- Use aggressive mode for fresh starts
- Archive important discussions
- Keep project notes updated
- Clear test outputs frequently