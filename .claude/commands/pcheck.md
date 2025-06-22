# pcheck

pcheck is a TODO management tool installed in this project. It helps track tasks across TODO.md files and code comments.

## Terminology

1. **todo** = TODO.md files
   - Main project TODO.md and subdirectory TODO.md files (e.g., src/TODO.md)
   - pcheck recursively reads these by default
   - Displayed with `pcheck` command

2. **code-todo** = Code comments with TODO/FIXME
   - Source code comments: `// TODO:`, `// FIXME:`, `// NOTE:`
   - Must include checklist format `- [ ]`
   - Displayed with `pcheck --code` command

## Commands

### Basic Commands

```bash
# Show all todos (from TODO.md files)
pcheck

# Show all code-todos (from code comments)
pcheck --code

# Update TODO.md by moving completed tasks to COMPLETED section
pcheck u

# Remove completed tasks and output them (useful for git commits)
pcheck u --vacuum

# Validate TODO.md formatting
pcheck validate

# Add a new task to TODO.md
pcheck add -m "Task description"

# Toggle a task by its ID
pcheck check <id>
```

### Usage Examples

```bash
# Count todos vs code-todos
pcheck | grep -E "^\s*├── \[.\]|└── \[.\]" | wc -l  # todos
pcheck --code | grep -E "^\s*├── \[.\]|└── \[.\]" | wc -l  # code-todos
```

## Best Practices

1. Use **todos** (TODO.md) for structured task management
2. Use **code-todos** for implementation details and inline notes
3. Keep both in sync for effective project management
4. Run `pcheck validate` before commits

## Related Commands

- `/todo-format` - Format TODO.md files
- `/code-todo-format` - Format TODO/FIXME comments in code

## References

- pcheck documentation: https://github.com/mizchi/project-checklist