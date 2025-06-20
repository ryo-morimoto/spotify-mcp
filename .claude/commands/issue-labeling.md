# issue-labeling

> Automated issue labeling based on content analysis using GitHub CLI

## Purpose

Automatically apply relevant labels to GitHub issues by analyzing their title and body content. Uses pattern matching and keyword detection to categorize issues by component, type, priority, and other dimensions.

## Usage

```bash
issue-labeling <issue-number>
```

### Arguments
- `<issue-number>`: GitHub issue number to analyze and label

### Example
```bash
issue-labeling 123
```

## Implementation

### 1. Fetch Issue Content
```bash
# Get issue details including existing labels
ISSUE_DATA=$(gh issue view "$1" --json number,title,body,labels)
TITLE=$(echo "$ISSUE_DATA" | jq -r '.title')
BODY=$(echo "$ISSUE_DATA" | jq -r '.body')
CONTENT=$(echo -e "$TITLE\n$BODY" | tr '[:upper:]' '[:lower:]')
EXISTING_LABELS=$(echo "$ISSUE_DATA" | jq -r '.labels[].name' | paste -sd "," -)
```

### 2. Component Detection
```bash
# Frontend patterns
if echo "$CONTENT" | grep -qE "(ui|ux|component|styling|css|html|react|vue|angular|frontend|client|browser|dom|layout|responsive|design system)"; then
    gh issue edit "$1" --add-label "frontend"
fi

# Backend patterns
if echo "$CONTENT" | grep -qE "(api|server|backend|endpoint|route|controller|service|middleware|authentication|authorization|node\.js|python|java|golang)"; then
    gh issue edit "$1" --add-label "backend"
fi

# Database patterns
if echo "$CONTENT" | grep -qE "(database|db|sql|query|schema|migration|table|index|postgres|mysql|mongodb|redis|data model|orm|transaction)"; then
    gh issue edit "$1" --add-label "database"
fi

# Infrastructure patterns
if echo "$CONTENT" | grep -qE "(docker|kubernetes|k8s|deployment|ci\/cd|pipeline|aws|azure|gcp|cloud|infrastructure|devops|monitoring|logging)"; then
    gh issue edit "$1" --add-label "infrastructure"
fi

# Security patterns
if echo "$CONTENT" | grep -qE "(security|vulnerability|cve|auth|oauth|jwt|encryption|ssl|tls|xss|csrf|injection|penetration|audit)"; then
    gh issue edit "$1" --add-label "security"
fi

# Performance patterns
if echo "$CONTENT" | grep -qE "(performance|optimization|speed|slow|latency|cache|memory|cpu|bottleneck|profiling|benchmark)"; then
    gh issue edit "$1" --add-label "performance"
fi
```

### 3. Type Classification
```bash
# Bug detection
if echo "$CONTENT" | grep -qE "(bug|error|issue|problem|broken|fix|crash|fail|exception|regression|defect|not working|doesn't work)"; then
    gh issue edit "$1" --add-label "bug"
    
    # Bug severity
    if echo "$CONTENT" | grep -qE "(critical|blocker|severe|crash|data loss|security vulnerability)"; then
        gh issue edit "$1" --add-label "severity:critical"
    elif echo "$CONTENT" | grep -qE "(major|significant|impact)"; then
        gh issue edit "$1" --add-label "severity:major"
    else
        gh issue edit "$1" --add-label "severity:minor"
    fi
fi

# Feature detection
if echo "$CONTENT" | grep -qE "(feature|new|add|implement|create|introduce|support for|enhancement|improve|extend|upgrade)"; then
    if echo "$CONTENT" | grep -qE "(new feature|new functionality|add support|implement new)"; then
        gh issue edit "$1" --add-label "feature"
    else
        gh issue edit "$1" --add-label "enhancement"
    fi
fi

# Documentation
if echo "$CONTENT" | grep -qE "(documentation|docs|readme|guide|tutorial|example|clarify|explain)"; then
    gh issue edit "$1" --add-label "documentation"
fi

# Refactoring
if echo "$CONTENT" | grep -qE "(refactor|restructure|reorganize|cleanup|technical debt|code quality|maintainability)"; then
    gh issue edit "$1" --add-label "refactoring"
fi

# Testing
if echo "$CONTENT" | grep -qE "(test|testing|unit test|integration test|e2e|coverage|spec|jest|mocha|pytest)"; then
    gh issue edit "$1" --add-label "testing"
fi
```

### 4. Priority Assessment
```bash
# P0 - Critical/Urgent
if echo "$CONTENT" | grep -qE "(critical|urgent|blocker|asap|emergency|production down|data loss|security breach|showstopper)"; then
    gh issue edit "$1" --add-label "priority:P0"
# P1 - High
elif echo "$CONTENT" | grep -qE "(high priority|important|significant impact|major|production issue|customer facing)"; then
    gh issue edit "$1" --add-label "priority:P1"
# P2 - Medium
elif echo "$CONTENT" | grep -qE "(medium priority|moderate|standard|normal)"; then
    gh issue edit "$1" --add-label "priority:P2"
# P3 - Low
elif echo "$CONTENT" | grep -qE "(low priority|nice to have|future|someday|minor|cosmetic)"; then
    gh issue edit "$1" --add-label "priority:P3"
else
    # Default to P2 if no clear priority indicators
    gh issue edit "$1" --add-label "priority:P2"
fi
```

### 5. Additional Classifications
```bash
# Good first issue detection
if echo "$CONTENT" | grep -qE "(beginner|easy|simple|straightforward|good first|starter|newcomer)"; then
    gh issue edit "$1" --add-label "good first issue"
fi

# Help wanted
if echo "$CONTENT" | grep -qE "(help wanted|looking for|need help|contributions welcome|community)"; then
    gh issue edit "$1" --add-label "help wanted"
fi

# Platform specific
if echo "$CONTENT" | grep -qE "(windows|win32|microsoft)"; then
    gh issue edit "$1" --add-label "platform:windows"
fi
if echo "$CONTENT" | grep -qE "(macos|mac|darwin|apple)"; then
    gh issue edit "$1" --add-label "platform:macos"
fi
if echo "$CONTENT" | grep -qE "(linux|ubuntu|debian|fedora|centos)"; then
    gh issue edit "$1" --add-label "platform:linux"
fi

# Browser specific
if echo "$CONTENT" | grep -qE "(chrome|chromium)"; then
    gh issue edit "$1" --add-label "browser:chrome"
fi
if echo "$CONTENT" | grep -qE "(firefox|mozilla)"; then
    gh issue edit "$1" --add-label "browser:firefox"
fi
if echo "$CONTENT" | grep -qE "(safari|webkit)"; then
    gh issue edit "$1" --add-label "browser:safari"
fi
if echo "$CONTENT" | grep -qE "(edge|internet explorer|ie11)"; then
    gh issue edit "$1" --add-label "browser:edge"
fi
```

### 6. Status Assignment
```bash
# Set initial status based on content
if echo "$CONTENT" | grep -qE "(investigation|research|analysis needed|more info|unclear)"; then
    gh issue edit "$1" --add-label "status:needs-investigation"
elif echo "$CONTENT" | grep -qE "(ready to implement|clear requirements|well defined)"; then
    gh issue edit "$1" --add-label "status:ready"
else
    gh issue edit "$1" --add-label "status:needs-triage"
fi

# Check for blocking/blocked
if echo "$CONTENT" | grep -qE "(blocked by|waiting for|depends on|prerequisite)"; then
    gh issue edit "$1" --add-label "blocked"
fi
if echo "$CONTENT" | grep -qE "(blocks|blocking|blocker for)"; then
    gh issue edit "$1" --add-label "blocking"
fi
```

### 7. Team/Area Assignment
```bash
# Detect team mentions
if echo "$CONTENT" | grep -qE "(@team-frontend|frontend team|ui team)"; then
    gh issue edit "$1" --add-label "team:frontend"
fi
if echo "$CONTENT" | grep -qE "(@team-backend|backend team|api team)"; then
    gh issue edit "$1" --add-label "team:backend"
fi
if echo "$CONTENT" | grep -qE "(@team-devops|devops team|infrastructure team)"; then
    gh issue edit "$1" --add-label "team:devops"
fi
if echo "$CONTENT" | grep -qE "(@team-qa|qa team|testing team|quality)"; then
    gh issue edit "$1" --add-label "team:qa"
fi
```

### 8. Summary Output
```bash
# Show applied labels
echo "🏷️  Issue #$1 labeled successfully!"
echo ""
echo "Applied labels:"
gh issue view "$1" --json labels --jq '.labels[].name' | while read -r label; do
    if [[ ! ",$EXISTING_LABELS," =~ ",$label," ]]; then
        echo "  ✅ $label"
    fi
done
```

## Advanced Features

### Label Confidence Scoring
```bash
# Count keyword matches for each category
FRONTEND_SCORE=$(echo "$CONTENT" | grep -oE "(ui|ux|component|styling|css|html|react|vue|angular|frontend|client|browser|dom|layout|responsive|design system)" | wc -l)
BACKEND_SCORE=$(echo "$CONTENT" | grep -oE "(api|server|backend|endpoint|route|controller|service|middleware|authentication|authorization|node\.js|python|java|golang)" | wc -l)

# Apply labels only if confidence threshold met
if [ "$FRONTEND_SCORE" -ge 2 ]; then
    gh issue edit "$1" --add-label "frontend"
fi
```

### Multi-label Validation
```bash
# Ensure mutually exclusive labels aren't applied together
if gh issue view "$1" --json labels --jq '.labels[].name' | grep -q "bug"; then
    # Remove feature label if bug is detected
    gh issue edit "$1" --remove-label "feature" 2>/dev/null || true
fi
```

### Custom Label Patterns
```bash
# Load custom patterns from config
if [ -f ".github/labeling-rules.json" ]; then
    # Apply custom rules defined by the project
    jq -r '.rules[] | "\(.pattern) \(.label)"' .github/labeling-rules.json | while IFS=' ' read -r pattern label; do
        if echo "$CONTENT" | grep -qE "$pattern"; then
            gh issue edit "$1" --add-label "$label"
        fi
    done
fi
```

## Integration Examples

### Pre-commit Hook
```bash
#!/bin/bash
# .github/hooks/issue-created.sh
issue-labeling "$1"
# Notify team based on labels
gh issue view "$1" --json labels --jq '.labels[].name' | while read -r label; do
    case "$label" in
        "priority:P0"|"severity:critical")
            # Send alert to on-call
            ;;
        "security")
            # Notify security team
            ;;
    esac
done
```

### Batch Processing
```bash
# Label all unlabeled issues
gh issue list --label="" --json number --jq '.[].number' | while read -r issue; do
    issue-labeling "$issue"
    sleep 1  # Rate limiting
done
```

### Weekly Report
```bash
# Generate labeling accuracy report
echo "## Issue Labeling Report"
echo "### Labels Applied This Week"
gh issue list --state all --created ">=$(date -d '7 days ago' +%Y-%m-%d)" --json number,labels | \
    jq -r '.[] | "Issue #\(.number): \(.labels | map(.name) | join(", "))"'
```

## Best Practices

1. **Regular Review**: Periodically review labeling patterns and adjust rules
2. **Team Input**: Gather feedback on label accuracy and usefulness
3. **Label Hygiene**: Remove outdated or incorrect labels during triage
4. **Documentation**: Keep label descriptions updated in repo settings
5. **Automation Balance**: Allow manual override of automated labels

## Troubleshooting

### Common Issues

1. **Over-labeling**: Too many labels applied
   - Solution: Increase confidence thresholds
   - Add mutual exclusion rules

2. **Missing Labels**: Important labels not detected
   - Solution: Review keyword patterns
   - Add domain-specific terms

3. **Conflicting Labels**: Contradictory labels applied
   - Solution: Implement validation rules
   - Define label hierarchy

### Debug Mode
```bash
# Run with verbose output
DEBUG=1 issue-labeling 123
```

This will show:
- Pattern matches found
- Confidence scores
- Labels skipped due to rules
- API responses