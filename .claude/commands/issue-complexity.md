# Issue Complexity

Analyze GitHub issue complexity and recommend story splitting strategies

## Usage

```bash
# Analyze issue complexity by number
issue-complexity 42

# Analyze with owner/repo specified
issue-complexity owner/repo#42

# Analyze current issue in context
issue-complexity
```

## What it does

1. **Evaluates issue complexity** - Analyzes effort, components, technical difficulty, integrations, and testing requirements
2. **Calculates complexity score** - Computes a 0-20 point score across five dimensions
3. **Applies complexity labels** - Tags issues as simple (0-7), moderate (8-14), or complex (15-20)
4. **Provides splitting recommendations** - Suggests story breakdown strategies for complex issues

## Example

```bash
$ issue-complexity 42

Fetching issue #42: Implement OAuth 2.0 authentication flow...

📊 Complexity Analysis Results

Issue: #42 - Implement OAuth 2.0 authentication flow

### 📈 Complexity Score: 16/20 (Complex)

- **Development Effort**: 4/5 (Estimated: 8-10 days)
  • OAuth flow implementation
  • Token management system
  • Session handling
  
- **Affected Components**: 4/5 (4 components)
  • Frontend auth UI
  • Backend auth service
  • Database schema changes
  • API gateway updates

- **Technical Complexity**: 3/5
  • PKCE implementation required
  • Secure token storage
  • Refresh token rotation

- **Integration Requirements**: 3/5
  • External OAuth provider
  • Session management service
  • User profile service

- **Testing Complexity**: 2/5
  • Unit tests for auth flow
  • Integration tests with provider
  • E2E auth scenarios

### 🎯 Recommended Action: Story Splitting Required

This issue exceeds the complexity threshold (15+) and should be broken down.

### ⚡ Suggested Split Strategy

1. **Phase-Based Split**:
   - Story 1: Basic OAuth flow (login/logout)
   - Story 2: Token refresh and rotation
   - Story 3: Session management and persistence

2. **Component-Based Split**:
   - Frontend: Auth UI components
   - Backend: OAuth service implementation
   - Infrastructure: Database and security updates

3. **Risk-Based Split**:
   - Core: Essential auth flow (must have)
   - Enhanced: Advanced security features
   - Optional: SSO integrations

Applied labels: ✅ complex, split-story
Comment posted to issue #42
```

## Complexity Scoring

Each dimension is scored 0-5 points:

- **Development Effort**: Time and resource requirements
- **Component Count**: Number of system parts affected
- **Technical Complexity**: Algorithm and architecture challenges
- **Integration Scope**: External system dependencies
- **Testing Complexity**: QA and automation needs

## Splitting Strategies

### Component-Based
Split by system boundaries (frontend/backend/database)

### Phase-Based
Split by delivery milestones (MVP/enhancement/optimization)

### Risk-Based
Split by priority (core/enhanced/optional features)

### Team-Based
Split by team expertise and ownership

## Tips

- Run early in sprint planning to identify complex stories
- Use with `issue-estimate` for comprehensive planning
- Complex issues (15+) should always be split
- Moderate issues (8-14) may benefit from splitting
- Simple issues (0-7) can proceed as single stories