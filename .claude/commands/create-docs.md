# Create Documentation

Generate comprehensive documentation for specified components, features, or systems.

## Usage

```
/create-docs <target> [--format <type>]
```

## What it does

1. **Analyzes target code**
   - Examines structure and purpose
   - Identifies public interfaces
   - Maps dependencies and relationships
   - Documents edge cases

2. **Generates documentation sections**
   - Overview and purpose
   - Usage examples with code
   - API specifications
   - Error handling patterns

3. **Adds supporting materials**
   - Architecture diagrams
   - State flow charts
   - Integration examples
   - Testing guidelines

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