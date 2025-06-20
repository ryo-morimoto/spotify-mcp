# Tag

Create semantic version tags with user-focused descriptions of capabilities and features.

## Usage:
- `/tag` - Create a tag for the current commit
- `/tag [version]` - Create a specific version tag (e.g., `/tag v0.2.0`)
- `/tag --list` - List all tags with descriptions

## Process:

### 1. Determine Version Number
- Check existing tags with `git tag -l`
- Follow semantic versioning (MAJOR.MINOR.PATCH):
  - MAJOR: Breaking changes or complete features
  - MINOR: New capabilities or significant additions
  - PATCH: Bug fixes or small improvements

### 2. Analyze Changes Since Last Tag
- Run `git log [last-tag]..HEAD --oneline`
- Identify user-facing changes and capabilities
- Focus on what users can now do, not how it's implemented

### 3. Write User-Focused Description
- **Title**: What can users do now? (NOT technical details)
- **Body**: List specific capabilities added
- Avoid technical jargon unless necessary
- Think from the user's perspective

### 4. Create Annotated Tag
- Use `git tag -a [version] -m "[description]"`
- For past commits: `git tag -a [version] [commit-hash] -m "[description]"`

### 5. Verify Tag Creation
- Run `git tag -l -n` to confirm
- Check tag points to correct commit

## Examples:

### Good Tag Descriptions:
```
v0.1.0 - Foundation for Spotify control capabilities
- Search tracks functionality
- Playback control methods (play, pause, next, previous)
- Get current playback state

v0.2.0 - Spotify control via MCP protocol
- Control Spotify through Claude
- OAuth authentication support
- Real-time playback status

v1.0.0 - Full Spotify remote control
- Complete MCP integration
- Automatic token refresh
- Error recovery and retry logic
```

### Bad Tag Descriptions (Too Technical):
```
v0.1.0 - Implement Spotify API client with neverthrow
v0.2.0 - Add OAuth PKCE flow implementation
v1.0.0 - Refactor error handling with Result types
```

## Tag Naming Rules:

### Version Guidelines:
- Start with `v` prefix (e.g., `v0.1.0`)
- Use semantic versioning strictly
- Pre-release: `v0.x.x` (not feature-complete)
- Stable release: `v1.0.0` (ready for production use)

### Description Guidelines:
- Lead with what users can do
- List capabilities, not implementations
- Use present tense
- Keep it concise but complete
- No technical implementation details in title

### When to Create Tags:
- After completing a user-facing feature
- When reaching a stable milestone
- Before major refactoring
- For release candidates

## Notes:
- Tags should tell a story of the project's evolution from the user's perspective
- Each tag should represent a meaningful checkpoint where something new can be done
- Avoid creating tags for internal changes that don't affect users
- If changes are purely technical, consider if a tag is necessary