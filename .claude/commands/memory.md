# Memory

Document repeated problem solutions to avoid solving the same issue multiple times.

## Usage

```
/memory
/memory <problem-description>
```

## What it does

1. **Identifies repeated problems**
   - Detects similar issues
   - Checks solution history
   - Suggests existing fixes
   - Prevents duplicate work

2. **Documents solutions**
   - Records problem context
   - Saves solution steps
   - Notes key insights
   - Links related issues

3. **Updates knowledge base**
   - Adds to CLAUDE.md
   - Creates solution patterns
   - Tags common issues
   - Improves future responses

4. **Provides quick reference**
   - Shows similar problems
   - Lists proven solutions
   - Highlights best practices
   - Accelerates resolution

## Example

```
/memory

Analyzing current context for repeated problems...

Found similar issue solved before:
🔄 "TypeScript import path errors"
   
Previous solution (2 occurrences):
- Always use .ts extension in imports
- Check tsconfig moduleResolution setting
- Run typecheck to validate

Would you like to:
1. Apply previous solution
2. Document new approach
3. View full history
```

## Solution Categories

### Build & Configuration
- Module resolution errors
- Build tool configurations
- Dependency conflicts
- Environment setup issues

### Testing
- Test setup problems
- Mocking strategies
- Coverage configuration
- Async test patterns

### Type Errors
- Generic type constraints
- Union type narrowing
- Interface vs type aliases
- Declaration merging

### Performance
- Bundle size optimization
- Memory leak patterns
- Async operation batching
- Caching strategies

## Documentation Format

When documenting a solution:

```markdown
## Problem: [Brief description]

### Context
- When this occurs
- Error messages
- Environment details

### Solution
1. Step-by-step fix
2. Key commands
3. Configuration changes

### Prevention
- Best practices
- Checks to add
- Tools to use

### References
- Related issues
- Documentation links
- Similar problems
```

## Storage Locations

### Project-specific
- `.claude/memory/` - Local solutions
- `CLAUDE.md` - Key patterns
- `docs/troubleshooting.md` - Common issues

### Global patterns
- User's CLAUDE.md - Cross-project solutions
- Command improvements - Workflow optimizations

## Best Practices

- **Document immediately**: Record solutions while fresh
- **Be specific**: Include exact error messages
- **Test solutions**: Verify fixes work before saving
- **Link context**: Reference commits, PRs, issues
- **Update regularly**: Refine solutions as you learn

## Integration Points

### With other commands
- `/commit` - Link fixes to commits
- `/analyze-issue` - Check for known solutions
- `/bug-fix` - Apply documented fixes

### Automatic triggers
- After solving complex issues
- When similar errors repeat
- During debugging sessions
- Post-mortem reviews

## Search & Retrieval

Find solutions by:
- Error message keywords
- Problem categories
- Technology stack
- Date range
- Frequency of occurrence