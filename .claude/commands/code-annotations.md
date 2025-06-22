# code-annotations

Comprehensive management and formatting of code annotations (TODO, FIXME, NOTE, HACK, etc.) for better tracking and tooling integration.

## Purpose

Standardize all code annotations across the codebase to ensure they are:
- Discoverable by tools (pcheck, grep, IDEs)
- Consistently formatted with actionable subtasks
- Properly prioritized and organized
- Compatible with pcheck for tracking

## Command Options

```bash
# Format specific annotation types for pcheck compatibility
claude /code-annotations --format-todos
claude /code-annotations --format-fixmes  
claude /code-annotations --format-all

# Comprehensive annotation management
claude /code-annotations --analyze
claude /code-annotations --organize
claude /code-annotations --report

# Default: Format all actionable annotations for pcheck
claude /code-annotations
```

## Annotation Types

### Actionable Annotations (require checklists)

#### TODO - Future Implementation
```typescript
// TODO: Implement new feature [MID]
// - [ ] Design the interface
// - [ ] Add core implementation
// - [ ] Write unit tests
// - [ ] Update documentation
```

#### FIXME - Known Issues
```typescript
// FIXME: Performance bottleneck in large datasets [HIGH]
// - [ ] Profile the current implementation
// - [ ] Optimize the algorithm
// - [ ] Add benchmarks
// - [ ] Document performance characteristics
// Impact: Token refresh failures cause service interruption
```

#### OPTIMIZE - Performance Improvements
```typescript
// OPTIMIZE: Cache results for repeated calls [LOW]
// - [ ] Implement LRU cache
// - [ ] Add cache invalidation
// - [ ] Measure performance impact
```

#### HACK - Temporary Solutions
```typescript
// HACK: Workaround for upstream bug #123 [MID]
// - [ ] Remove when dependency is updated to v2.0
// - [ ] Track issue: https://github.com/upstream/repo/issues/123
```

### Informational Annotations (no checklists needed)

#### NOTE - Important Information
```typescript
// NOTE: This approach is required due to platform limitations
// See: https://docs.example.com/limitations
```

#### WARNING - Critical Information
```typescript
// WARNING: Changing this will break backward compatibility
// Affected versions: < 2.0.0
```

## Workflow Options

### Option 1: Quick TODO/FIXME Formatting (pcheck focus)

```bash
claude /code-annotations --format-todos
```

**Steps:**
1. Find all TODO/FIXME comments
2. Transform to pcheck-compatible checklist format
3. Add priority tags where appropriate
4. Validate with `pcheck --code`

**Before:**
```typescript
// TODO: Add error handling
// FIXME: This breaks when Y happens
```

**After:**
```typescript
// TODO: Add error handling [MID]
// - [ ] Validate input parameters
// - [ ] Handle network errors
// - [ ] Add retry logic

// FIXME: This breaks when Y happens [HIGH]
// - [ ] Identify root cause
// - [ ] Implement proper fix
// - [ ] Add regression test
// - [ ] Document the solution
```

### Option 2: Comprehensive Annotation Management

```bash
claude /code-annotations --organize
```

**Steps:**
1. **Discovery Phase**
   ```bash
   # Find all annotations
   rg -t ts -t js "^\s*//(TODO|FIXME|NOTE|HACK|OPTIMIZE|WARNING):" --no-heading
   
   # Count by type
   rg -t ts -t js "^\s*//(TODO|FIXME|NOTE|HACK):" -o | sort | uniq -c
   
   # Check current tool detection
   pcheck --code
   ```

2. **Analysis Phase**
   - Categorize annotations by type and priority
   - Identify orphaned or outdated annotations
   - Find missing context or references

3. **Formatting Phase**
   - Apply proper formatting rules for each type
   - Add checklists to actionable items
   - Ensure priority tags are present
   - Add context and references

4. **Organization Phase**
   - Group related annotations
   - Cross-reference between files
   - Create architectural documentation for large items

### Option 3: Analysis and Reporting

```bash
claude /code-annotations --report
```

**Generates:**
- Summary by type and priority
- Files with highest annotation density
- Outdated or completed annotations
- Missing context or references
- Export for tracking tools

## Formatting Rules

### Actionable Annotations Format
```typescript
// TYPE: Brief description [PRIORITY]
// - [ ] Specific subtask 1
// - [ ] Specific subtask 2
// Context: Additional information if needed
// Related: Links to issues, docs, or code
```

### Informational Annotations Format
```typescript
// TYPE: Clear explanation
// Reference: Link or documentation
// Impact: What this affects
```

### Priority Levels
- `[HIGH]` - Critical, blocks release
- `[MID]` - Important, plan for next sprint  
- `[LOW]` - Nice to have, backlog
- No tag - Normal priority

## Common Transformation Examples

### Simple TODO → Actionable TODO
```typescript
// Before:
// TODO: Add more search parameters

// After:
// TODO: Add more search parameters [LOW]
// - [ ] market: string - Country code for market-specific results
// - [ ] offset: number - For pagination support
// - [ ] include_external: 'audio' - Include content from external sources
// - [ ] type: 'track' | 'album' | 'artist' | 'playlist' - Search type
// Reference: https://developer.spotify.com/documentation/web-api/reference/search
```

### Complex FIXME with Full Context
```typescript
// Before:
// FIXME: Performance issue

// After:
// FIXME: Performance issue with large datasets [HIGH]
// - [ ] Profile current implementation
// - [ ] Optimize algorithm complexity
// - [ ] Add caching layer
// - [ ] Benchmark improvements
// Impact: Token refresh failures cause service interruption
// Related: #123, src/performance.ts
```

### Multi-line TODO → Structured TODO
```typescript
// Before:
// TODO: Support more options
// - option1
// - option2

// After:
// TODO: Support more options [MID]
// - [ ] option1 - Add description and implementation details
// - [ ] option2 - Add description and implementation details
```

## Special Handling

### Large Refactoring Plans
Create dedicated documentation:
```
src/
  refactoring/
    auth-system.md    # Detailed auth refactoring plan
    api-v2.md        # API migration guide
```

### Architecture Decisions
```typescript
// NOTE: Architecture Decision Record #001
// We chose X over Y because...
// See: docs/adr/001-choose-x.md
```

### Security Concerns
```typescript
// WARNING: Security - Input validation required [HIGH]
// - [ ] Sanitize user input
// - [ ] Add rate limiting
// - [ ] Log suspicious activity
// CVE: CVE-2023-12345
```

## Validation

After processing:
```bash
# Verify all actionable items have checklists
pcheck --code

# Check for missed annotations
grep -r "TODO\|FIXME\|HACK\|OPTIMIZE" --include="*.ts" --include="*.js" src/

# Validate TODO.md files
pcheck validate
```

## Integration Features

### pcheck Integration
- All actionable annotations become trackable tasks
- Use `pcheck --code` to view all annotations
- Compatible with pcheck terminology (code-todos)

### IDE Integration
- Configure IDE to highlight annotations
- Set up code inspection rules
- Add snippets for common patterns

### Git Hooks
```bash
# Pre-commit hook to check annotation format
#!/bin/bash
if grep -r "TODO[^:]" --include="*.ts" src/; then
  echo "Found improperly formatted TODOs"
  exit 1
fi
```

## Example Output

```
=== Code Annotations Processing Complete ===

Mode: --format-todos (pcheck compatibility)
Files processed: 15
Annotations transformed: 47
  - TODO: 25 (5 HIGH, 10 MID, 10 LOW)
  - FIXME: 12 (3 HIGH, 9 MID)
  - HACK: 2
  - OPTIMIZE: 8

pcheck compatibility: 47/47 annotations detected ✓
Validation passed: ✓

Next steps:
- Run `pcheck --code` to view all annotations
- Use `pcheck validate` to check format
- Consider `/code-annotations --organize` for comprehensive management
```

## Best Practices

1. **Be Specific**: Add concrete subtasks, not vague descriptions
2. **Add Context**: Include why the annotation exists and its impact
3. **Prioritize**: Use [HIGH], [MID], [LOW] tags for planning
4. **Group Related**: Keep related annotations near relevant code
5. **Add References**: Link to issues, docs, or related code
6. **Clean Up**: Remove completed annotations, don't accumulate
7. **Review Regularly**: Part of sprint planning and code reviews

## Related Commands

- `pcheck --code` - View all code annotations
- `pcheck validate` - Validate format
- `/todo-format` - Format TODO.md files
- `/pcheck` - Complete pcheck documentation