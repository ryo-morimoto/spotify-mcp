# Update Documentation

Generate LLM-optimized documentation with concrete file references for comprehensive project understanding.

## Purpose

Create documentation that enables LLMs and developers to:
- **Understand** - Core functionality and architecture
- **Build** - Compile and run on all platforms
- **Extend** - Add features following patterns
- **Debug** - Troubleshoot with file locations
- **Test** - Run and create comprehensive tests
- **Deploy** - Package and distribute effectively

## Core Requirements

### Document Structure
1. **Timestamp Header** - `<!-- Generated: YYYY-MM-DD HH:MM:SS UTC -->`
2. **Brief Overview** - 2-3 paragraphs maximum
3. **Key Files** - Concrete references with line numbers
4. **Workflows** - Practical guidance with examples
5. **Reference** - Quick lookup tables

### LLM Optimization
- **Token efficient** - No redundant explanations
- **File references** - Always include paths and line numbers
- **Real examples** - Show actual code from codebase
- **Cross-references** - Use `See [docs/file.md](docs/file.md)`

### No Duplication Rule
Each piece of information appears in EXACTLY ONE file:
- Build info → `build-system.md`
- Code patterns → `development.md`
- Deployment → `deployment.md`

## Documentation Files

### Project Overview (`docs/project-overview.md`)
```
- Overview: Purpose, value proposition (2-3 paragraphs)
- Key Files: Entry points, core configs
- Technology Stack: With file examples
- Platform Support: Requirements and locations
```

### Architecture (`docs/architecture.md`)
```
- Overview: System organization (2-3 paragraphs)
- Component Map: Source file locations
- Key Files: Core implementations
- Data Flow: Function/file references
```

### Build System (`docs/build-system.md`)
```
- Overview: Build configuration references
- Build Workflows: Commands and configs
- Platform Setup: Platform-specific paths
- Reference: Targets and troubleshooting
```

### Testing (`docs/testing.md`)
```
- Overview: Test approach and locations
- Test Types: Categories with examples
- Running Tests: Commands and outputs
- Reference: Organization and targets
```

### Development (`docs/development.md`)
```
- Overview: Environment, style, patterns
- Code Style: Conventions with examples
- Common Patterns: Implementation examples
- Workflows: Tasks with file locations
- Reference: Organization and issues
```

### Deployment (`docs/deployment.md`)
```
- Overview: Packaging and distribution
- Package Types: Build targets, outputs
- Platform Deployment: Platform specifics
- Reference: Scripts and locations
```

### Files Catalog (`docs/files.md`)
```
- Overview: File relationships (2-3 paragraphs)
- Core Source: Main logic descriptions
- Platform Code: Interface mappings
- Build System: Configuration files
- Configuration: Supporting files
- Reference: Patterns and dependencies
```

## Process Steps

1. **Analyze Codebase** - Systematic examination
2. **Create/Update Docs** - In `docs/*.md`
3. **Synthesize README** - Minimal, LLM-friendly
4. **Remove Duplication** - Cross-file check

## File Reference Format

```markdown
**Core System** - Implementation in `src/core.h` (lines 15-45)
**Build Config** - Main file at `CMakeLists.txt` (lines 67-89)
**Key Function** - `process_data()` in `src/module.c:134`
```

## Code Example Format

```c
// From src/example.h:23-27
typedef struct {
    bool active;
    void *data;
    int count;
} ExampleState;
```

## Final Steps

1. **Create README.md**:
   - Project description (2-3 sentences)
   - Key entry points
   - Quick build commands
   - Documentation links
   - Under 50 lines total

2. **Quality Checks**:
   - Remove all duplication
   - Verify file paths
   - Update timestamps

## Success Criteria

- LLMs can quickly locate functionality
- All file paths are accurate
- No redundant information
- Practical, actionable content
- Token-efficient format

