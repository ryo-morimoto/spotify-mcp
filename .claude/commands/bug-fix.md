# Bug Fix

Streamline bug fixing workflow from issue creation to pull request.

```
/bug-fix
```

## What it does

1. **Create tracking**
   - Create GitHub issue with descriptive title
   - Generate feature branch name
   - Check out new branch for fix
   - Link issue to development

2. **Reproduce and test**
   - Reproduce the reported issue
   - Write failing test demonstrating bug
   - Verify test fails as expected
   - Document reproduction steps

3. **Implement fix**
   - Apply minimal code changes
   - Ensure test now passes
   - Run full test suite
   - Check for regressions

4. **Complete workflow**
   - Commit with issue reference
   - Push branch to remote
   - Create pull request
   - Link PR to issue

## Example

```
/bug-fix

Starting bug fix workflow...

1. Create issue on GitHub:
   Title: "Fix memory leak in connection handler"
   ✓ Issue #45 created

2. Create feature branch:
   ✓ Switched to branch 'fix/memory-leak-connection-handler'

3. Write failing test:
   ✓ Test added: "should not leak memory on disconnect"
   ✗ Test fails as expected

4. Implement fix:
   ✓ Fixed memory leak by clearing handlers
   ✓ Test now passes
   ✓ All tests passing (42/42)

5. Commit and push:
   ✓ Committed: "fix: memory leak in connection handler (#45)"
   ✓ Pushed to origin/fix/memory-leak-connection-handler

6. Create pull request:
   ✓ PR #46 created and linked to issue #45

Bug fix workflow complete! 🐛✨
```

## Process Flow

### Before Starting
1. Create GitHub issue with clear title
2. Create feature branch: `fix/<issue-description>`
3. Ensure clean working directory

### During Fix
1. Reproduce the issue locally
2. Write test that fails due to bug
3. Implement minimal fix
4. Verify test passes
5. Run complete test suite
6. Review all changes

### After Fix
1. Commit with format: `fix: <description> (#issue)`
2. Push branch to remote
3. Create PR with "Fixes #issue"
4. Add labels and reviewers

## Best Practices

- Keep changes focused on specific bug
- Include regression tests
- Update docs if behavior changes
- Consider edge cases
- Test related functionality
- Use minimal code changes