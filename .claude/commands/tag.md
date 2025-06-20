# Tag

Create semantic version tags with user-focused descriptions of capabilities and features.

## Usage

```
/tag
/tag v0.2.0
/tag --list
```

## What it does

1. **Determines version**
   - Checks existing tags
   - Follows semantic versioning
   - Suggests next version
   - Validates version format

2. **Analyzes changes**
   - Reviews commits since last tag
   - Identifies user-facing features
   - Groups related changes
   - Highlights capabilities

3. **Creates description**
   - Focuses on user capabilities
   - Avoids technical jargon
   - Lists concrete features
   - Explains what's new

4. **Applies tag**
   - Creates annotated tag
   - Verifies tag creation
   - Shows tag details
   - Confirms success

## Example

```
/tag

Current version: v0.1.0
Commits since last tag: 15

Suggested version: v0.2.0 (minor - new features)

Changes include:
✨ OAuth authentication flow
🔌 SSE endpoint for real-time updates
♻️ Improved error handling

Tag description:
"v0.2.0: Spotify control via MCP protocol

Features:
- 🔐 Authenticate with Spotify account
- 🎵 Control playback remotely
- 🔌 Real-time status updates
- ♻️ Automatic reconnection"

Create this tag? [Y/n]
```

## Version Guidelines

### Semantic Versioning
- **MAJOR (1.0.0)**: Breaking changes or complete features
- **MINOR (0.1.0)**: New capabilities or significant additions  
- **PATCH (0.0.1)**: Bug fixes or small improvements

### Version Progression
```
v0.1.0 → v0.2.0  # New feature
v0.2.0 → v0.2.1  # Bug fix
v0.2.1 → v1.0.0  # Production ready
v1.0.0 → v2.0.0  # Breaking change
```

### Pre-release Versions
- `v0.x.x` - Development phase
- `v1.0.0-rc.1` - Release candidate
- `v1.0.0-beta.1` - Beta version
- `v1.0.0` - Stable release

## Process

1. **Check existing tags**
   ```bash
   git tag -l --sort=-version:refname
   ```

2. **Review changes**
   ```bash
   git log $(git describe --tags --abbrev=0)..HEAD --oneline
   ```

3. **Determine version bump**
   - Breaking changes → MAJOR
   - New features → MINOR
   - Bug fixes → PATCH

4. **Write user-focused description**
   - Title: What users can do
   - Features: Specific capabilities
   - Format: Emoji + description

5. **Create annotated tag**
   ```bash
   git tag -a v0.2.0 -m "description"
   ```

6. **Verify tag**
   ```bash
   git show v0.2.0
   ```

## Good vs Bad Descriptions

### ✅ Good (User-focused)
```
v0.2.0: Full Spotify remote control

Features:
- 🔐 Login with Spotify account
- 🎵 Search and play any song
- ⏯️ Control playback (play/pause/skip)
- 📊 See what's currently playing
```

### ❌ Bad (Technical)
```
v0.2.0: Implement OAuth and MCP

- Added OAuth PKCE flow
- Implemented SSE transport
- Refactored error handling
- Updated dependencies
```

## Best Practices

### Focus on Capabilities
- What can users DO now?
- What problems are solved?
- What's the experience like?

### Use Clear Language
- Avoid technical terms
- Explain in simple words
- Use active voice
- Be specific

### Include Emojis
- 🔐 Security/Auth
- 🎵 Music/Audio
- 🔌 Connections
- ⚡ Performance
- 🐛 Bug fixes
- ✨ New features

### Tag Timing
- After feature completion
- At stable milestones
- Before major changes
- For releases

## Configuration

### List all tags
```bash
git tag -l -n  # With messages
git tag -l --sort=-version:refname  # Sorted
```

### Delete tag
```bash
git tag -d v0.2.0  # Local
git push origin --delete v0.2.0  # Remote
```

### Push tags
```bash
git push origin v0.2.0  # Specific tag
git push origin --tags  # All tags
```

## Tag Message Template

```
v{VERSION}: {What users can now do}

Features:
- {emoji} {User capability 1}
- {emoji} {User capability 2}
- {emoji} {User capability 3}

{Optional: brief context or notes}
```

## When to Tag

- **Feature complete**: Major functionality ready
- **Stable milestone**: All tests passing
- **Before refactor**: Checkpoint before changes
- **Release ready**: Production deployment
- **User value**: Something new users can do

## Notes

- Tags tell the story of user capabilities
- Each tag = meaningful user checkpoint
- Skip tags for internal-only changes
- Think "What's in it for users?"