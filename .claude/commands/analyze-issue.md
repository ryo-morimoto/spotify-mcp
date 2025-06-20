# Analyze Issue

Fetch GitHub issue details and create a comprehensive implementation specification.

```
/analyze-issue <issue-number>
```

## What it does

1. **Fetch issue details**
   - Get issue title, body, and metadata using GitHub CLI
   - Review related comments and discussions
   - Extract requirements and specifications
   - Identify linked issues and PRs

2. **Analyze requirements**
   - Review problem statement thoroughly
   - Identify technical constraints
   - Check existing code and utilities
   - Determine implementation scope

3. **Create specification**
   - Generate detailed technical approach
   - Break down into implementation tasks
   - Define test plan and success criteria
   - List files to modify and create

4. **Output documentation**
   - Produce complete technical specification
   - Follow TDD principles and KISS approach
   - Enforce code quality standards
   - Ready for implementation review

## Example

```
/analyze-issue 42

Fetching issue #42 from GitHub...
Analyzing requirements and codebase...

## Technical Specification: Add User Notification System

### 1. Issue Summary
Implement a notification system for user events

### 2. Problem Statement  
Users need real-time notifications for important events

### 3. Technical Approach
- WebSocket for real-time delivery
- Queue system for reliability
- Database storage for history

### 4. Implementation Plan
1. Create notification service
2. Add WebSocket handler
3. Implement queue processor
4. Add database schema

[... continues with full specification ...]
```

## Specification Sections

The command generates a comprehensive specification including:

1. **Issue Summary** - Brief overview
2. **Problem Statement** - Clear problem definition
3. **Technical Approach** - Architecture decisions
4. **Implementation Plan** - Step-by-step tasks
5. **Test Plan** - Testing strategy and cases
6. **Files to Modify** - Existing files needing changes
7. **Files to Create** - New files required
8. **Existing Utilities** - Reusable project code
9. **Success Criteria** - Measurable completion criteria
10. **Out of Scope** - What won't be addressed

## Best Practices

- Review issue thoroughly before starting
- Follow TDD principles strictly
- Keep it simple (KISS approach)
- Enforce 300-line file limit
- Identify reusable components
- Define clear success criteria