# Add to Changelog

Update the project's CHANGELOG.md file with a new entry following Keep a Changelog format.

```
/add-to-changelog <version> <change_type> <message>
```

## What it does

1. **Check changelog file**
   - Verify CHANGELOG.md exists or create if missing
   - Ensure proper Keep a Changelog format
   - Locate specified version section

2. **Add new entry**
   - Find or create version section
   - Add entry under appropriate change type
   - Format as bullet point with message
   - Maintain chronological order

3. **Format properly**
   - Group changes by type (Added, Changed, Fixed, etc.)
   - Include date for new version sections
   - Keep entries concise but descriptive
   - Follow markdown formatting rules

4. **Save and commit**
   - Write updated changelog back to file
   - Stage changes for git
   - Optionally create commit with message
   - Verify formatting is correct

## Example

```
/add-to-changelog 1.1.0 added "OAuth authentication flow with PKCE"

Updating CHANGELOG.md...
✓ Found existing version 1.1.0 section
✓ Added entry under "Added"
✓ Saved changes to CHANGELOG.md

Preview:
## [1.1.0] - 2024-03-20
### Added
- OAuth authentication flow with PKCE

Would you like to commit these changes? [y/N]
```

## Parameters

- **version**: Version number (e.g., "1.1.0", "2.0.0-beta.1")
- **change_type**: One of: "added", "changed", "deprecated", "removed", "fixed", "security"
- **message**: Description of the change (in quotes if contains spaces)

## Change Types

Following [Keep a Changelog](https://keepachangelog.com) format:
- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes

## Format Example

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.1.0] - 2024-03-20
### Added
- New feature description
- Another new feature

### Fixed
- Bug fix description

## [1.0.0] - 2024-03-01
### Added
- Initial release
```