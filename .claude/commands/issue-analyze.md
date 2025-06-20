# Issue Analyze

Automatically analyze GitHub issues for technical completeness and generate missing requirements.

```
/issue-analyze <issue-number>
```

## What it does

1. **Fetch issue content**
   - Get issue title, body, labels, and comments
   - Extract existing requirements and specifications
   - Identify stakeholders and assignees
   - Check for related issues and dependencies

2. **Analyze completeness**
   - Assess feature description clarity
   - Identify missing technical requirements
   - Evaluate user story quality
   - Check for business value articulation

3. **Generate requirements**
   - Create missing API specifications
   - Define database schema needs
   - Suggest UI/UX requirements
   - Add performance and security criteria

4. **Post analysis comment**
   - Add comprehensive technical analysis
   - Propose acceptance criteria
   - Suggest implementation approach
   - Identify risks and dependencies

## Example

```
/issue-analyze 123

Fetching issue #123 from GitHub...
Analyzing technical completeness...

## 🔍 Technical Requirements Analysis

### 📋 Missing Requirements Identified
- API endpoint specifications not defined
- Error handling scenarios unclear
- Performance requirements missing
- No integration test criteria

### ✅ Recommended Acceptance Criteria
- [ ] API returns data within 200ms (p95)
- [ ] Error messages follow RFC 7807 format
- [ ] Integration tests cover all endpoints
- [ ] Documentation includes OpenAPI spec

### 🔧 Implementation Approach
1. **Architecture**: Repository pattern with caching
2. **Technology**: FastAPI + Redis + PostgreSQL
3. **Phases**: 
   - Phase 1: Core API implementation
   - Phase 2: Caching layer
   - Phase 3: Monitoring setup

### ⚠️ Technical Risks
- **Performance**: Large dataset queries → Implement pagination
- **Dependencies**: External API rate limits → Add circuit breaker

### 📊 Next Steps
1. Clarify data retention requirements
2. Define SLA for API availability
3. Create technical design document

---
*🤖 Auto-analyzed: 2024-01-15 14:30 UTC*
```

## Analysis Components

The automated analysis evaluates and enhances:

1. **Functional Requirements** - Core features and behaviors
2. **Non-functional Requirements** - Performance, security, scalability
3. **Technical Specifications** - API design, data models, architecture
4. **Acceptance Criteria** - Testable success conditions
5. **Implementation Approach** - Technical recommendations
6. **Risk Assessment** - Technical challenges and mitigations
7. **Dependencies** - External systems and blockers
8. **Effort Estimation** - Complexity and time considerations

## Requirements Templates

### API Requirements
- Endpoint definitions with methods
- Request/response schemas
- Authentication requirements
- Rate limiting specifications
- Error response formats

### Database Requirements
- Entity relationships
- Index requirements
- Migration strategies
- Data retention policies
- Backup considerations

### UI/UX Requirements
- User flow descriptions
- Accessibility standards
- Responsive design needs
- Performance targets
- Error state handling

## Best Practices

- Focus on technical gaps, not process
- Generate actionable requirements
- Propose concrete solutions
- Include testable criteria
- Consider edge cases
- Maintain neutral, helpful tone