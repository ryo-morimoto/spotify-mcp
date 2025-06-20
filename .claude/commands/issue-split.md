Split complex GitHub issue into manageable sub-tasks: $ARGUMENTS

OVERVIEW:
This command analyzes a complex GitHub issue and intelligently splits it into smaller, manageable sub-tasks. It ensures each child issue is independently deliverable, properly scoped, and maintains clear relationships with the parent issue.

EXECUTION STEPS:

1. **Parent Issue Deep Analysis**
   ```bash
   # Fetch complete issue details
   gh issue view $ARGUMENTS --json number,title,body,labels,assignees,milestone,state > parent_issue.json
   
   # Extract issue number and title
   PARENT_NUMBER=$(jq -r '.number' parent_issue.json)
   PARENT_TITLE=$(jq -r '.title' parent_issue.json)
   PARENT_LABELS=$(jq -r '.labels[].name' parent_issue.json | paste -sd "," -)
   
   # Analyze issue complexity
   echo "📊 Analyzing issue #$PARENT_NUMBER: $PARENT_TITLE"
   ```

2. **Intelligent Split Strategy Selection**
   Based on issue analysis, select optimal decomposition approach:
   
   **a) Technical Layer Split** (for full-stack features)
   - Database Schema & Migration
   - Backend API & Business Logic
   - Frontend UI Components
   - Integration & E2E Testing
   - Documentation & API Spec
   
   **b) User Journey Split** (for workflow features)
   - Entry Point & Navigation
   - Core User Action Flow
   - Edge Cases & Error Handling
   - Success States & Feedback
   
   **c) Incremental Enhancement Split** (for improvements)
   - Basic Implementation (MVP)
   - Performance Optimization
   - UX Polish & Animations
   - Advanced Features
   
   **d) Cross-Cutting Concerns Split** (for system-wide changes)
   - Security & Authentication
   - Logging & Monitoring
   - Caching & Performance
   - Configuration & Deployment

3. **Generate Comprehensive Child Issue Plan**
   ```bash
   # Create split analysis
   cat << EOF > split_analysis.md
   ## Issue Split Analysis for #$PARENT_NUMBER
   
   ### Selected Strategy: [STRATEGY_NAME]
   Rationale: [Why this strategy fits best]
   
   ### Proposed Child Issues:
   1. **[Component A]** - [Brief description] (Est: X days)
   2. **[Component B]** - [Brief description] (Est: Y days)
   3. **[Component C]** - [Brief description] (Est: Z days)
   
   ### Dependency Graph:
   \`\`\`mermaid
   graph LR
     A[Component A] --> B[Component B]
     B --> C[Component C]
   \`\`\`
   
   ### Risk Factors:
   - [Potential blockers or challenges]
   - [Integration complexity points]
   EOF
   ```

4. **Create Well-Structured Child Issues**
   ```bash
   # Function to create child issues with rich content
   create_child_issue() {
     local order=$1
     local component=$2
     local title=$3
     local estimate=$4
     local deps=$5
     
     gh issue create \
       --title "[#$PARENT_NUMBER-$order] $title" \
       --body "$(generate_rich_child_body "$component" "$title" "$estimate" "$deps")" \
       --label "child-task,${component,,},$PARENT_LABELS" \
       --milestone "$(jq -r '.milestone.title // empty' parent_issue.json)" \
       --assignee "$(jq -r '.assignees[0].login // empty' parent_issue.json)"
   }
   
   # Create each child issue
   create_child_issue 1 "backend" "API endpoints for $FEATURE" "2d" "none"
   create_child_issue 2 "frontend" "UI components for $FEATURE" "3d" "#xxx"
   create_child_issue 3 "testing" "E2E tests for $FEATURE" "1d" "#xxx,#yyy"
   ```

5. **Enhanced Parent Issue Update**
   ```bash
   # Add epic label and metadata
   gh issue edit $PARENT_NUMBER \
     --add-label "epic,needs-refinement" \
     --remove-label "ready-for-development"
   
   # Create comprehensive tracking comment
   gh issue comment $PARENT_NUMBER --body "$(cat << 'EOF'
   ## 🎯 Issue Decomposition Complete
   
   ### 📋 Child Tasks Overview
   
   | # | Task | Component | Estimate | Status | Assignee |
   |---|------|-----------|----------|---------|----------|
   | 1 | #XXX | Backend   | 2 days   | 🔵 Open | @assignee |
   | 2 | #YYY | Frontend  | 3 days   | 🔵 Open | @assignee |
   | 3 | #ZZZ | Testing   | 1 day    | 🔵 Open | @assignee |
   
   ### 🔄 Workflow Sequence
   ```mermaid
   gantt
     title Development Timeline
     dateFormat YYYY-MM-DD
     section Backend
       API Implementation :a1, 2024-01-01, 2d
     section Frontend  
       UI Development :a2, after a1, 3d
     section Testing
       E2E Tests :a3, after a2, 1d
   ```
   
   ### 📊 Progress Tracking
   - **Total Estimate**: 6 days
   - **Parallelizable**: Backend prep can start immediately
   - **Critical Path**: Backend → Frontend → Testing
   
   ### 🚀 Quick Links
   - [View all child tasks](../../issues?q=is:issue+%23$PARENT_NUMBER)
   - [Project board](../../projects/1)
   
   ---
   *🤖 Automated split by issue-split command on $(date -u +"%Y-%m-%d %H:%M UTC")*
   EOF
   )"
   ```

HELPER FUNCTIONS:

```bash
# Generate rich child issue body with all necessary context
generate_rich_child_body() {
  local component=$1
  local title=$2
  local estimate=$3
  local dependencies=$4
  
  cat << EOF
## 🎯 Parent Context
**Epic**: #$PARENT_NUMBER - $PARENT_TITLE
**Component**: $component
**Estimated Effort**: $estimate

## 📝 Task Description
$title

### Scope Definition
- **What's Included**:
  - [Specific deliverable 1]
  - [Specific deliverable 2]
  
- **What's NOT Included**:
  - [Out of scope item 1]
  - [Handled in different task]

## ✅ Acceptance Criteria
\`\`\`gherkin
Given [initial context]
When [action is performed]
Then [expected outcome]
\`\`\`

- [ ] Implementation matches acceptance criteria
- [ ] Unit tests cover all new code (>80% coverage)
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] Code review approved

## 🔧 Technical Details
### Implementation Approach
[High-level technical approach]

### Key Files/Modules
- \`src/path/to/file.ts\` - [What to modify]
- \`tests/path/to/test.ts\` - [Test coverage needed]

### API/Interface Changes
\`\`\`typescript
// Example interface or API change
interface NewFeature {
  // ...
}
\`\`\`

## 🔗 Dependencies
$( [ "$dependencies" != "none" ] && echo "**Blocked by**: $dependencies" || echo "**No blockers** - Can start immediately" )

### Integration Points
- [ ] Coordinate with [other component]
- [ ] Ensure compatibility with [existing feature]

## 🧪 Testing Strategy
1. **Unit Tests**: Cover individual functions/methods
2. **Integration Tests**: Verify component interactions
3. **E2E Tests**: User journey validation

## 📚 Resources
- [Design doc](../docs/design.md)
- [API specification](../docs/api.md)
- [Related PR/Issue](#)

---
*🤖 Generated from epic #$PARENT_NUMBER by issue-split command*
EOF
}

# Analyze issue complexity and recommend split strategy
analyze_issue_complexity() {
  local body=$1
  local labels=$2
  
  # Count indicators of complexity
  local line_count=$(echo "$body" | wc -l)
  local has_frontend=$(echo "$labels" | grep -c "frontend")
  local has_backend=$(echo "$labels" | grep -c "backend")
  local has_api=$(echo "$body" | grep -ci "api\|endpoint")
  local has_ui=$(echo "$body" | grep -ci "ui\|interface\|component")
  
  # Recommend strategy based on indicators
  if [ $has_frontend -gt 0 ] && [ $has_backend -gt 0 ]; then
    echo "technical-layer"
  elif [ $has_api -gt 0 ] && [ $has_ui -gt 0 ]; then
    echo "full-stack"
  elif [ $line_count -gt 50 ]; then
    echo "incremental"
  else
    echo "user-journey"
  fi
}
```

COMPLETION CRITERIA:
- ✅ Parent issue properly labeled as "epic"
- ✅ 3-7 child issues created with clear scope
- ✅ Each child issue has acceptance criteria
- ✅ Dependencies documented and visualized
- ✅ Progress tracking comment added
- ✅ Consistent naming convention applied
- ✅ Estimates provided for planning
- ✅ Integration points identified

ERROR HANDLING:
```bash
# Validate parent issue exists and is open
if ! gh issue view $ARGUMENTS &>/dev/null; then
  echo "❌ Error: Issue #$ARGUMENTS not found"
  exit 1
fi

# Check if already split
if gh issue view $ARGUMENTS --json labels | jq -e '.labels[] | select(.name == "epic")' &>/dev/null; then
  echo "⚠️  Warning: Issue #$ARGUMENTS is already marked as epic"
  read -p "Continue with re-split? (y/n) " -n 1 -r
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi
```

BEST PRACTICES:
1. **Size child issues appropriately** - Each should be 1-3 days of work
2. **Maintain independence** - Child issues should be deployable separately
3. **Document dependencies** - Clear blocking relationships
4. **Include testing** - Each child issue includes its own tests
5. **Consider parallelization** - Identify work that can happen simultaneously
6. **Add visual aids** - Use mermaid diagrams for clarity
7. **Link everything** - Cross-reference related issues and docs