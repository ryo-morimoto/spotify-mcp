# Commit

Create well-formatted commits with conventional commit messages and emojis.

## Usage

```
/commit
/commit --no-verify
```

## What it does

1. **Checks staged changes**
   - Verifies files are staged
   - Reviews changes for issues
   - Suggests staging if needed
   - Detects unintended modifications

2. **Reviews changes carefully**
   - Shows full diff of staged files
   - Identifies suspicious patterns
   - Checks for debug code
   - Validates dependencies

3. **Runs quality checks**
   - Linting and formatting
   - Type checking
   - Test execution
   - Build verification

4. **Creates commit message**
   - Determines commit type
   - Generates description
   - Adds scope if needed
   - Includes detailed body

## Example

```
/commit

Reviewing staged changes...
Found 3 files with modifications:
✅ src/index.ts - Added new feature
⚠️  package.json - New dependency 'dotenv' (verify if needed)
🔍 src/utils.ts - Contains console.log statement

Run `git diff --staged` to review? [Y/n]

Suggested commit type: feat
Message: "feat: implement OAuth authentication flow"

Proceed with commit? [y/N]
```

## Commit Types

### Feature Development
- ✨ **feat**: New USER-FACING features or functionality
- ✅ **test**: Adding tests ONLY to existing functionality
- ♻️ **refactor**: Code restructuring without changing functionality
- ⚡️ **perf**: Performance improvements

### Maintenance
- 🐛 **fix**: Bug fixes that affect users
- 🚑 **hotfix**: Critical fixes
- 🔒 **security**: Security improvements
- 📝 **docs**: Documentation changes

### Infrastructure & Development
- 🎨 **style**: Code formatting, missing semicolons, etc.
- 🧑‍💻 **chore**: Tooling, configuration, dependencies, maintenance
- 🔧 **build**: Build system, bundler config, deployment prep
- 🚧 **wip**: Work in progress
- 🔥 **remove**: Removing code or files

### Version Bump Guidelines
- **feat**: Requires minor version bump (0.X.0)
- **fix**: Requires patch version bump (0.0.X)
- **docs/chore/style**: No version bump needed (internal only)
- **Claude commands**: No version bump needed (developer tools)

⚠️ **Important**: Changes that only affect development tools (.claude/commands/*, 
internal documentation, test improvements) do NOT require version bumps as they 
don't impact end users.

## Process

1. **Check for staged changes**
   ```bash
   git status --porcelain
   ```

2. **Review staged changes**
   ```bash
   git diff --staged
   ```

3. **Identify issues**
   - Auto-imported unused dependencies
   - Environment-specific changes
   - Debug statements (console.log, debugger)
   - Unrelated formatting changes

4. **Run pre-commit checks**
   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```

5. **Determine commit type**
   - New user-facing functionality → feat
   - Infrastructure/config (wrangler.toml, package.json) → chore or build
   - Only tests added → test
   - Bug fixes affecting users → fix
   - Code cleanup → refactor
   - Deployment preparation → build

6. **Generate commit message**
   ```
   <type>(<scope>): <description>

   <body>

   <footer>
   ```

7. **Final confirmation**
   - Show summary: `git diff --staged --stat`
   - List key changes
   - Request confirmation

8. **Execute commit**
   ```bash
   git commit -m "message"
   ```

## Common Issues to Watch For

### Auto-imports
```typescript
// Unused import added by IDE
import { unusedFunction } from './utils';
```

### Environment Variables
```typescript
// Don't commit actual secrets
const API_KEY = 'sk-actual-secret-key';
```

### Debug Code
```typescript
console.log('debug', data);  // Remove before commit
debugger;                    // Remove before commit
```

### Generated Files
- `*.log` - Log files
- `dist/` - Build output
- `.env` - Environment files
- `coverage/` - Test coverage

## Configuration

### Skip Checks
```bash
/commit --no-verify  # Skip pre-commit hooks
```

### Stage Interactively
```bash
git add -p  # Stage specific hunks
git add -i  # Interactive staging
```

### Amend Last Commit
```bash
git commit --amend  # Modify previous commit
```

## Best Practices

- **Atomic commits**: One logical change per commit
- **Clear messages**: Explain why, not just what
- **Consistent style**: Follow conventional commits
- **Review diffs**: Always check `git diff --staged`
- **Split changes**: Separate unrelated modifications
- **Reference issues**: Link to related tickets

## Type Selection Guidelines

### When to use `feat`:
- Implementing new USER-FACING functionality
- Adding features that users can directly interact with
- Deploying to production with new capabilities
- Example: "feat: add Spotify search functionality"

### When to use `chore` or `build`:
- Configuration files (wrangler.toml, tsconfig.json)
- Dependencies updates (package.json)
- Build scripts and tooling
- Infrastructure preparation (not yet deployed)
- Example: "chore: add Cloudflare Workers configuration"

### Other guidelines:
- Use `test` only when adding tests to existing code
- If implementation + tests together, use `feat` (for user features)
- For breaking changes, add `!` after type: `feat!:`
- Internal tooling/commands use `chore`, not `feat`