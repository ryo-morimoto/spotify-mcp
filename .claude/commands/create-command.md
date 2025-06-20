# Create Command

Guide for creating new custom Claude commands with proper structure and conventions.

## Usage

```
/create-command <command-name>
```

## What it does

1. **Analyzes command purpose**
   - Identifies problem being solved
   - Determines target users
   - Defines expected outcomes
   - Plans interaction patterns

2. **Selects appropriate template**
   - Planning commands for architecture
   - Implementation for code generation
   - Analysis for code review
   - Workflow for multi-step processes

3. **Creates command structure**
   - Generates markdown file
   - Adds required sections
   - Includes usage examples
   - Sets up parameter handling

4. **Validates and registers**
   - Checks naming conventions
   - Verifies file location
   - Tests command execution
   - Updates command index

## Example

```
/create-command sync-database

Creating new command: sync-database

✓ Created .claude/commands/sync-database.md
✓ Added command structure with:
  - Title and description
  - Usage section with parameters
  - Step-by-step process
  - Example outputs
  - Error handling notes

Command created successfully!
Test with: /sync-database
```

## Command Structure Template

```markdown
# Command Name

One-line description of what this command does.

## Usage

\```
/command-name [options] <arguments>
\```

## What it does

1. **First major step**
   - Sub-step details
   - Implementation notes

2. **Second major step**
   - Processing logic
   - Validation rules

3. **Third major step**
   - Output formatting
   - Success criteria

4. **Final step**
   - Cleanup actions
   - Result summary

## Example

\```
/command-name --option value

Expected output here...
\```

## Notes

- Special considerations
- Error handling
- Performance tips
```

## Best Practices

- **Single Responsibility**: Each command should do one thing well
- **Clear Naming**: Use verb-noun format (e.g., create-test, analyze-code)
- **Consistent Structure**: Follow the standard section layout
- **Helpful Examples**: Include realistic usage scenarios
- **Error Guidance**: Document common issues and solutions