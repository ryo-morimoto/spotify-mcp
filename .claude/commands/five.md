# Five Whys Analysis

Perform root cause analysis using the Five Whys technique to identify underlying problems.

## Usage

```
Ask me to analyze a problem using the Five Whys technique:
"Use Five Whys to analyze why [specific problem]"
```

## What it does

1. **Identifies root causes** - Traces problems back to their fundamental source by asking "why" repeatedly
2. **Reveals cause-effect chains** - Maps the logical progression from symptom to underlying issue
3. **Uncovers systemic issues** - Often reveals process or system failures rather than individual mistakes
4. **Guides effective solutions** - Ensures fixes address root causes, not just surface symptoms

## Example

```
Problem: Production deployment failed and caused 2-hour downtime

Why 1: The deployment script crashed during database migration
→ Why 2: Migration tried to add a column that already existed
→ Why 3: The staging database was out of sync with production
→ Why 4: Manual hotfixes were applied directly to production
→ Why 5: No documented process for emergency fixes

Root Cause: Lack of emergency fix procedures
Solution: Implement hotfix workflow with mandatory staging sync
```

## When to use

- **Incident analysis** - Post-mortem investigations after failures
- **Quality issues** - Recurring bugs or performance problems
- **Process breakdowns** - When workflows consistently fail
- **Team friction** - Understanding collaboration challenges

## Tips for effective analysis

- Keep asking "why" until you reach a process or system issue
- Avoid blaming individuals - focus on processes
- Validate each cause-effect link is logical
- Consider multiple root causes for complex problems
- Document findings for future reference