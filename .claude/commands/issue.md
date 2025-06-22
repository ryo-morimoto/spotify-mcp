# issue - Comprehensive GitHub Issue Management

**Unified command for all GitHub issue operations: analysis, complexity assessment, automated labeling, and decomposition.**

## Quick Reference

```bash
claude /issue analyze <number> [--mode spec|requirements|both] [--comment]  # Issue analysis
claude /issue complexity <number>                                          # Complexity assessment
claude /issue label <number>                                              # Automated labeling  
claude /issue split <number>                                              # Complex issue decomposition
```

## Subcommands

### `/issue analyze` - Comprehensive Issue Analysis
*Enhanced analysis with implementation specs and requirements validation*

**Usage:**
```bash
claude /issue analyze <number> --mode spec          # Implementation specification
claude /issue analyze <number> --mode requirements  # Requirements analysis
claude /issue analyze <number> --mode both          # Complete analysis
claude /issue analyze <number> --comment            # Post as GitHub comment
```

**Features:**
- **Implementation Mode**: Creates detailed technical specifications
- **Requirements Mode**: Analyzes completeness, validates requirements
- **Combined Mode**: Full analysis with both outputs
- **GitHub Integration**: Posts analysis as issue comment

**Example Output:**
```markdown
## Technical Implementation Analysis for #42

### Component Architecture
- **Backend**: OAuth service implementation (src/auth/)
- **Frontend**: Login UI components (src/components/auth/)
- **Storage**: Token management with Durable Objects

### Implementation Tasks
- [ ] PKCE flow implementation
- [ ] Token refresh automation
- [ ] Session management
- [ ] Error handling and retries

### Technical Considerations
- Security: PKCE prevents authorization code interception
- Performance: Token refresh in background
- UX: Seamless re-authentication flow
```

### `/issue complexity` - Complexity Assessment
*Evaluate issue complexity and recommend splitting strategies*

**Usage:**
```bash
claude /issue complexity <number>
claude /issue complexity owner/repo#42
claude /issue complexity                    # Current issue in context
```

**Assessment Dimensions (0-5 points each):**
- **Development Effort**: Time and resource requirements  
- **Component Count**: Number of system parts affected
- **Technical Complexity**: Algorithm and architecture challenges
- **Integration Scope**: External system dependencies
- **Testing Complexity**: QA and automation needs

**Complexity Tiers:**
- **Simple (0-7)**: Single sprint, minimal dependencies
- **Moderate (8-14)**: Multi-sprint, some coordination needed
- **Complex (15-20)**: Epic-level, requires decomposition

**Example Output:**
```markdown
📊 Complexity Analysis: #42 - OAuth Implementation

### Score: 16/20 (Complex) - Split Recommended

- **Development Effort**: 4/5 (8-10 days estimated)
- **Component Count**: 4/5 (Frontend, Backend, DB, Gateway)  
- **Technical Complexity**: 3/5 (PKCE, token rotation)
- **Integration Scope**: 3/5 (External OAuth provider)
- **Testing Complexity**: 2/5 (Unit, integration, E2E)

### Recommended Split Strategies:
1. **Phase-Based**: Basic OAuth → Token management → Advanced features
2. **Component-Based**: Backend service → Frontend UI → Integration
3. **Risk-Based**: Core flow → Security features → Optional enhancements
```

### `/issue label` - Automated Issue Labeling  
*Apply relevant labels based on intelligent content analysis*

**Usage:**
```bash
claude /issue label <number>
```

**Label Categories:**
- **Component**: frontend, backend, database, infrastructure, security
- **Type**: bug, feature, enhancement, documentation, refactoring
- **Priority**: P0 (critical), P1 (high), P2 (medium), P3 (low)
- **Status**: needs-investigation, ready, needs-triage, blocked
- **Severity**: critical, major, minor (for bugs)
- **Platform**: windows, macos, linux, browser-specific
- **Team**: frontend, backend, devops, qa

**Intelligence Features:**
- **Keyword Analysis**: Pattern matching with confidence scoring
- **Context Understanding**: Distinguishes bugs vs features
- **Mutual Exclusion**: Prevents contradictory labels
- **Custom Rules**: Project-specific labeling patterns

**Example Application:**
```bash
Issue: "Frontend login form crashes on Safari with OAuth redirect"

Applied Labels:
✅ frontend
✅ bug
✅ browser:safari  
✅ security
✅ priority:P1
✅ severity:major
✅ status:ready
```

### `/issue split` - Complex Issue Decomposition
*Intelligently decompose complex issues into manageable sub-tasks*

**Usage:**
```bash
claude /issue split <number>
```

**Split Strategies:**
1. **Technical Layer**: Database → Backend → Frontend → Testing
2. **User Journey**: Entry → Core flow → Edge cases → Polish
3. **Incremental**: MVP → Optimization → Advanced features  
4. **Cross-cutting**: Security → Monitoring → Configuration

**Generated Outputs:**
- **Epic Label**: Parent issue marked as epic
- **Child Issues**: 3-7 sub-tasks with rich descriptions
- **Dependency Graph**: Visual relationship mapping
- **Progress Tracking**: Gantt chart and status table
- **Acceptance Criteria**: Clear deliverable definitions

**Child Issue Template:**
```markdown
## 🎯 Parent Context
**Epic**: #123 - OAuth Implementation
**Component**: Backend API
**Estimated Effort**: 2 days

## 📝 Task Description
Implement OAuth PKCE flow with token management

## ✅ Acceptance Criteria
- [ ] PKCE challenge generation
- [ ] Authorization code exchange
- [ ] Token refresh automation
- [ ] Error handling with retries

## 🔗 Dependencies
**Blocked by**: None - Can start immediately
**Blocks**: #124 (Frontend UI), #125 (Integration tests)
```

## Advanced Features

### Batch Operations
```bash
# Process multiple issues
for issue in 123 124 125; do
  claude /issue label $issue
  claude /issue complexity $issue  
done

# Label all unlabeled issues
gh issue list --label="" --json number --jq '.[].number' | \
  xargs -I {} claude /issue label {}
```

### Integration Workflows
```bash
# Complete issue workflow
claude /issue analyze 123 --mode both --comment  # Deep analysis
claude /issue complexity 123                     # Assess scope
if [[ "$(claude /issue complexity 123 | grep -o '[0-9]\+/20')" > "14/20" ]]; then
  claude /issue split 123                       # Split if complex
fi
claude /issue label 123                         # Apply labels
```

### Automation Hooks
```bash
# GitHub Actions integration
- name: Auto-label new issues
  run: claude /issue label ${{ github.event.issue.number }}

# Pre-planning automation  
- name: Complexity assessment
  run: |
    claude /issue complexity ${{ github.event.issue.number }}
    if [[ $? -eq 2 ]]; then  # Complex issue detected
      claude /issue split ${{ github.event.issue.number }}
    fi
```

## Best Practices

### Issue Analysis
1. **Use appropriate mode**: `--mode spec` for implementation, `--mode requirements` for validation
2. **Post analysis**: Use `--comment` to share findings with team
3. **Follow up**: Create implementation tasks based on analysis

### Complexity Assessment  
1. **Regular evaluation**: Assess during sprint planning
2. **Split threshold**: Always split issues scoring 15+ points
3. **Team calibration**: Review scoring with team for consistency

### Automated Labeling
1. **Review accuracy**: Periodically validate label assignments
2. **Customize patterns**: Add project-specific keyword rules
3. **Manual override**: Adjust incorrect automated labels

### Issue Splitting
1. **Appropriate sizing**: Child issues should be 1-3 days each
2. **Maintain independence**: Ensure each child can deploy separately  
3. **Document dependencies**: Clear blocking relationships
4. **Include testing**: Each child has its own test requirements

## Configuration

### Custom Labeling Rules
Create `.github/labeling-rules.json`:
```json
{
  "rules": [
    {
      "pattern": "spotify|music|playlist",
      "label": "domain:music"
    },
    {
      "pattern": "oauth|auth|login",  
      "label": "security"
    }
  ]
}
```

### Team Assignment
```bash
# Configure team mentions in issue content
export TEAM_FRONTEND="@team-ui"
export TEAM_BACKEND="@team-api"  
export TEAM_DEVOPS="@team-platform"
```

## Error Handling

```bash
# Validation checks
if ! gh issue view $1 &>/dev/null; then
  echo "❌ Issue #$1 not found"
  exit 1
fi

# Prevent duplicate operations
if claude /issue complexity $1 | grep -q "Already analyzed"; then
  echo "⚠️ Issue already processed"
  exit 0
fi
```

## Migration from Separate Commands

```bash
# Old commands → New unified command
analyze-issue 123 --mode spec      → claude /issue analyze 123 --mode spec
issue-complexity 123               → claude /issue complexity 123  
issue-labeling 123                 → claude /issue label 123
issue-split 123                    → claude /issue split 123
```

All functionality preserved with enhanced integration and consistent interface.