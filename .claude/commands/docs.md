# Documentation Management

Generate, update, and maintain comprehensive project documentation with LLM optimization.

## Usage

```
/docs create <target> [--format <type>]     # Generate new documentation
/docs update [--target <path>] [--optimize] # Update existing documentation
/docs validate [--target <path>]            # Validate documentation completeness
/docs sync <source-project>                 # Cross-project synchronization
```

## What it does

### 1. **Documentation Creation** (`/docs create`)
   - **Code Analysis**: Examines structure, interfaces, dependencies
   - **Section Generation**: Overview, usage examples, API specs
   - **Supporting Materials**: Diagrams, examples, troubleshooting
   - **Format Options**: Markdown, API docs, inline comments

### 2. **Documentation Updates** (`/docs update`)
   - **LLM Optimization**: Token-efficient, structured content
   - **File References**: Concrete references with line numbers
   - **Timestamp Tracking**: Automatic generation timestamps
   - **Cross-referencing**: Links between related documentation

### 3. **Documentation Validation** (`/docs validate`)
   - **Completeness Check**: Missing sections, outdated info
   - **Link Verification**: Broken references and dead links
   - **Consistency Audit**: Style and format standardization
   - **Coverage Analysis**: Code vs documentation alignment

### 4. **Cross-project Synchronization** (`/docs sync`)
   - **Structure Alignment**: Consistent documentation patterns
   - **Content Merging**: Best practices from reference projects
   - **Template Application**: Standardized section formats
   - **Conflict Resolution**: Smart merge of divergent content

## Documentation Standards

### LLM Optimization Principles
- **Token Efficient**: No redundant explanations or verbose content
- **File References**: Always include concrete paths and line numbers
- **Real Examples**: Show actual code from codebase, not hypotheticals
- **Cross-references**: Use `See [docs/file.md](docs/file.md)` format
- **Timestamp Headers**: `<!-- Generated: YYYY-MM-DD HH:MM:SS UTC -->`

### No Duplication Rule
Each piece of information appears in EXACTLY ONE file:
- **Build info** → `docs/build-system.md`
- **Code patterns** → `docs/development.md`  
- **Deployment** → `docs/deployment.md`
- **Testing** → `docs/testing.md`

### Document Structure Template
```markdown
<!-- Generated: 2024-06-21 16:30:00 UTC -->
# [Document Title]

## Overview
[2-3 paragraphs maximum - purpose and value]

## Key Files
- `src/main.ts:1-50` - Entry point and core initialization
- `config/app.json` - Application configuration
- `package.json:scripts` - Available commands

## [Section Name]
### Implementation
```typescript
// Real code from src/example.ts:15-25
export function example() {
  return "actual code here";
}
```

### Reference
| Command | File | Description |
|---------|------|-------------|
| `build` | `build.ts:10` | Production build |
```

## Examples

### Create New Documentation
```bash
/docs create src/auth/oauth.ts --format api

📝 Analyzing src/auth/oauth.ts...
✅ Found 5 public functions, 2 interfaces
✅ Identified dependencies: spotify-api, crypto
📄 Generating API documentation...

## OAuth Handler API Reference

### Overview
Handles Spotify OAuth 2.1 authentication with PKCE flow.

### Key Functions
- `generateAuthUrl()` - Creates authorization URL
- `exchangeCodeForTokens()` - Token exchange
- `refreshAccessToken()` - Token refresh

### Usage Example
```typescript
// From src/auth/oauth.ts:45-52
const authUrl = await generateAuthUrl({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  redirectUri: 'http://localhost:3000/callback'
});
```

Documentation created: docs/api/oauth.md
```

### Update Existing Documentation
```bash
/docs update --target docs/ --optimize

🔍 Scanning documentation directory...
📄 Found 12 documentation files
⚡ Optimizing for LLM efficiency...

Updates made:
✅ docs/README.md - Added file references, reduced tokens by 23%
✅ docs/api-reference.md - Updated timestamps, fixed broken links
✅ docs/development.md - Added line number references
⚠️ docs/deployment.md - Found outdated configuration (line 45)

📊 Optimization complete:
- Total tokens: 15,420 → 11,890 (-23%)
- Broken links fixed: 7
- Missing references added: 23
```

### Validate Documentation
```bash
/docs validate --target docs/

📋 Documentation Validation Report
================================

✅ Structure: All required sections present
✅ References: 156/156 file references valid
⚠️ Coverage: 3 functions lack documentation
❌ Links: 2 broken external links found

Issues found:
1. src/utils/cache.ts:clearCache() - No documentation
2. src/utils/cache.ts:invalidate() - No documentation  
3. src/helpers/format.ts:formatError() - No documentation
4. docs/api.md:23 - Broken link to examples/oauth.md
5. docs/setup.md:67 - Dead link to external resource

Recommendations:
- Run '/docs create src/utils/cache.ts' for missing functions
- Update external links in docs/setup.md
- Consider adding integration examples

Overall Score: 82/100 (Good)
```

### Cross-project Sync
```bash
/docs sync ../reference-mcp-project

🔄 Synchronizing documentation with reference project...
📁 Analyzing reference structure...

Structural differences found:
+ Reference has docs/troubleshooting.md (missing here)
+ Reference has docs/api/errors.md (missing here)
~ Different format in docs/development.md

Sync options:
1. Copy missing files: troubleshooting.md, api/errors.md
2. Update development.md format to match reference
3. Preserve local customizations

Apply changes? [y/N]
```

## Migration from Individual Commands

This command replaces and enhances:
- **`create-docs`** → `/docs create`
- **`update-docs`** → `/docs update`  
- **`sync-doc`** → `/docs sync`

All functionality is preserved with improved workflows and unified interface.

4. **Formats and validates**
   - Applies project standards
   - Checks completeness
   - Verifies code examples
   - Cross-references related docs

## Example

```
/create-docs src/spotifyApi.ts --format markdown

Analyzing src/spotifyApi.ts...

✓ Generated documentation:
  - Overview section with purpose
  - API reference for 12 methods
  - Error handling guide
  - Usage examples for each method
  - Integration patterns
  - Testing recommendations

Created: docs/spotify-api.md (2,847 lines)
```

## Documentation Sections

### Core Sections
- **Overview**: Purpose and key features
- **Installation**: Setup instructions
- **Usage**: Quick start examples
- **API Reference**: Detailed specifications
- **Examples**: Real-world scenarios

### Advanced Sections
- **Architecture**: System design details
- **State Management**: Data flow patterns
- **Error Handling**: Exception scenarios
- **Performance**: Optimization tips
- **Security**: Best practices

### Supporting Materials
- **Diagrams**: Visual representations
- **Code Samples**: Working examples
- **Migration Guides**: Version updates
- **Troubleshooting**: Common issues

## Output Formats

- **Markdown**: General documentation (default)
- **JSDoc/TSDoc**: Inline code comments
- **OpenAPI**: API specifications
- **README**: Project overviews
- **ADR**: Architecture decisions