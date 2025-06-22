# bug - Comprehensive Bug Management

**Unified command for complete bug lifecycle: exploration, detection, analysis, and resolution.**

## Quick Reference

```bash
claude /bug explore <symptoms>             # Explore and identify potential bugs
claude /bug find [--scope <path>]          # Find existing bugs in codebase
claude /bug analyze <issue-number>         # Deep analysis of reported bugs  
claude /bug fix <issue-number>             # Complete bug fixing workflow
```

## Subcommands

### `/bug explore` - Bug Exploration and Detection
*Proactive bug discovery and symptom investigation*

**Usage:**
```bash
claude /bug explore <symptoms-description>
claude /bug explore "performance degradation"
claude /bug explore "memory leak" --component auth
claude /bug explore --scan-logs --recent 24h
```

**Features:**
- **Symptom Analysis**: Analyze reported symptoms and identify potential causes
- **Pattern Detection**: Find similar issues in codebase and logs
- **Impact Assessment**: Evaluate potential scope and severity
- **Initial Triage**: Categorize and prioritize investigation

**Example:**
```bash
$ claude /bug explore "login fails intermittently"

🔍 Bug Exploration: Login Intermittent Failures

### Symptom Analysis
- **Pattern**: Intermittent failures suggest timing or race conditions
- **Component**: Authentication system (OAuth flow)
- **Frequency**: ~15% failure rate based on logs

### Potential Causes Identified
1. **Race Condition**: Token refresh during login flow
2. **Network Timeout**: OAuth provider response delays  
3. **Session Conflict**: Multiple login attempts from same user
4. **Cache Invalidation**: Stale authentication state

### Similar Issues Found
- Issue #123: OAuth race condition (resolved)
- Issue #234: Session timeout issues (open)
- Log pattern: "auth_token_expired" errors correlate

### Recommended Actions
1. Enable debug logging for auth module
2. Add timing measurements to OAuth flow
3. Check for concurrent login attempts
4. Investigate token refresh timing

### Next Steps
- Run: claude /bug find --scope src/auth/
- Create issue: claude /bug analyze --create-issue
```

### `/bug find` - Bug Detection in Codebase
*Systematic search for potential bugs and code issues*

**Usage:**
```bash
claude /bug find                           # Scan entire codebase
claude /bug find --scope src/auth/         # Scan specific directory
claude /bug find --type memory-leaks       # Focus on specific bug types
claude /bug find --since last-release      # Find recent introductions
```

**Detection Categories:**
- **Memory Issues**: Leaks, dangling pointers, buffer overflows
- **Concurrency**: Race conditions, deadlocks, atomicity violations  
- **Logic Errors**: Null pointer dereferences, boundary conditions
- **Security**: Input validation, injection vulnerabilities
- **Performance**: Inefficient algorithms, resource abuse

**Analysis Methods:**
- **Static Analysis**: Code pattern matching and AST analysis
- **Dynamic Patterns**: Common bug signatures and anti-patterns
- **Historical Data**: Git blame analysis for recent changes
- **Test Coverage**: Uncovered code paths and edge cases

**Example:**
```bash
$ claude /bug find --scope src/auth/ --type memory-leaks

🐛 Bug Detection Report: src/auth/

### Memory Issues Found (3)
1. **Potential Memory Leak** - src/auth/tokenManager.ts:45
   - Event listeners not removed on cleanup
   - Risk: High - affects long-running sessions
   - Fix: Add cleanup in destructor

2. **Buffer Overflow Risk** - src/auth/parser.ts:12
   - No bounds checking on input buffer
   - Risk: Critical - potential security issue  
   - Fix: Add input validation

3. **Dangling Reference** - src/auth/session.ts:78
   - Reference to destroyed object
   - Risk: Medium - may cause crashes
   - Fix: Null check before access

### Concurrency Issues Found (1)
1. **Race Condition** - src/auth/oauth.ts:156
   - Shared state modification without locking
   - Risk: High - causes intermittent failures
   - Fix: Add proper synchronization

### Recommendations
- Priority 1: Fix buffer overflow (security)
- Priority 2: Address race condition (reliability)
- Priority 3: Memory leak cleanup (performance)

Total Issues: 4 (1 Critical, 2 High, 1 Medium)
```

### `/bug analyze` - Deep Bug Analysis
*Comprehensive analysis of reported bugs with root cause investigation*

**Usage:**
```bash
claude /bug analyze <issue-number>         # Analyze existing issue
claude /bug analyze 123 --reproduction     # Focus on reproduction steps
claude /bug analyze 123 --impact          # Assess impact and severity
claude /bug analyze --create-issue         # Create new issue from exploration
```

**Analysis Dimensions:**
- **Root Cause Analysis**: Identify underlying technical causes
- **Reproduction**: Create reliable reproduction steps
- **Impact Assessment**: Evaluate user impact and business effects
- **Fix Complexity**: Estimate effort and risk for resolution
- **Related Issues**: Find similar or blocking issues

**Investigation Methods:**
- **Code Analysis**: Examine relevant code paths and dependencies
- **Log Analysis**: Parse error logs and trace execution flow
- **Test Analysis**: Review existing tests and coverage gaps
- **Version Analysis**: Git bisect to identify introduction point

**Example:**
```bash
$ claude /bug analyze 123

🔬 Deep Bug Analysis: Issue #123 - OAuth Token Refresh Failure

### Root Cause Analysis
**Primary Cause**: Race condition in token refresh mechanism
- Token refresh triggered while authentication in progress
- Shared token state modified concurrently
- No proper locking mechanism implemented

**Contributing Factors**:
- High-frequency API calls triggering multiple refreshes
- Token expiry check has timing window vulnerability
- Error handling doesn't account for concurrent operations

### Reproduction Steps
1. Start authentication flow with expired token
2. Trigger 3+ simultaneous API calls requiring authentication
3. Observe race condition in token refresh (~70% reproduction rate)

**Minimal Test Case**:
```typescript
// Reproduces race condition
Promise.all([
  authService.refreshToken(),
  authService.refreshToken(), 
  authService.refreshToken()
]); // Multiple refreshes create race condition
```

### Impact Assessment
- **Severity**: High (affects 15% of login attempts)
- **User Impact**: Login failures, poor user experience
- **Business Impact**: Reduced conversion, support tickets
- **Affected Users**: ~500 users/day experiencing issues

### Fix Complexity
- **Effort**: Medium (2-3 days)
- **Risk**: Low (isolated to auth module)
- **Dependencies**: None
- **Testing Required**: Unit + integration + E2E

### Recommended Solution
1. **Immediate**: Add mutex/lock for token operations
2. **Short-term**: Implement token refresh queue
3. **Long-term**: Redesign token state management

### Related Issues
- Issue #124: Similar timing issues in logout
- Issue #125: Token persistence race condition
- PR #126: Partial fix for refresh logic
```

### `/bug fix` - Complete Bug Resolution Workflow
*End-to-end bug fixing process from reproduction to deployment*

**Usage:**
```bash
claude /bug fix <issue-number>             # Full fixing workflow
claude /bug fix 123 --quick               # Skip some validation steps
claude /bug fix 123 --test-only           # Write tests without implementing
```

**Workflow Steps:**
1. **Issue Analysis**: Understand bug from issue description
2. **Reproduction**: Create failing test demonstrating bug
3. **Implementation**: Apply minimal fix to resolve issue
4. **Validation**: Ensure fix works and doesn't break anything
5. **Documentation**: Update code comments and docs
6. **Integration**: Commit, push, and create pull request

**Quality Assurance:**
- **Test-Driven**: Write failing test before implementing fix
- **Minimal Changes**: Smallest possible code modification
- **Regression Testing**: Full test suite validation
- **Code Review**: Proper git workflow with PR

**Example:**
```bash
$ claude /bug fix 123

🐛 Bug Fix Workflow: Issue #123 - OAuth Token Refresh Race Condition

### 1. Issue Analysis
✓ Analyzed issue #123: OAuth race condition
✓ Identified root cause: Concurrent token refresh
✓ Created branch: fix/oauth-race-condition-123

### 2. Reproduction Phase
✓ Created failing test: 
  - test/auth/tokenManager.test.ts
  - Reproduces race condition with concurrent refreshes
✗ Test fails as expected (race condition occurs)

### 3. Implementation Phase  
✓ Added mutex lock to token refresh logic
✓ Modified: src/auth/tokenManager.ts
  - Added refreshMutex: Mutex
  - Wrapped refresh logic with mutex.acquire()
  - Added proper error handling

### 4. Validation Phase
✓ Test now passes (race condition resolved)
✓ Full test suite: 127/127 tests passing
✓ No regressions detected
✓ Performance impact: <1ms overhead

### 5. Documentation Phase
✓ Updated code comments explaining mutex usage
✓ Added troubleshooting section to auth/README.md
✓ Documented fix approach in issue comments

### 6. Integration Phase
✓ Committed: "fix: resolve OAuth token refresh race condition (#123)"
✓ Pushed to: origin/fix/oauth-race-condition-123
✓ Created PR #156: "Fix OAuth race condition"
✓ Linked PR to issue #123
✓ Added reviewers: @team-auth

Bug fix complete! 🎉

### Summary
- **Files Changed**: 2 (tokenManager.ts, tokenManager.test.ts)
- **Lines Added**: +15, Removed: -3
- **Test Coverage**: +5% (race condition scenarios)
- **Ready for Review**: PR #156 created

Next Steps:
1. Await code review approval
2. Merge to main branch
3. Deploy and monitor for resolution
```

## Advanced Features

### Batch Bug Operations
```bash
# Find and analyze multiple bugs
claude /bug find --export-issues           # Create issues for found bugs
claude /bug analyze --batch 123,124,125    # Analyze multiple issues

# Mass bug triage
claude /bug explore --scan-all --create-backlog
```

### Integration Workflows
```bash
# Complete bug investigation
claude /bug explore "memory usage spikes"   # Initial exploration
claude /bug find --type memory-leaks        # Systematic detection  
claude /bug analyze --create-issue          # Deep analysis with issue creation
claude /bug fix <new-issue-number>          # Fix implementation

# Continuous bug monitoring
#!/bin/bash
claude /bug find --since yesterday --auto-report
claude /bug explore --monitor-logs --alert-critical
```

### Automation Hooks
```bash
# CI/CD Integration
- name: Bug Detection
  run: |
    claude /bug find --scope . --format junit
    if [ $? -ne 0 ]; then
      claude /bug analyze --create-issues --assign-team
    fi

# GitHub Actions
- name: Auto-bug Analysis  
  run: claude /bug analyze ${{ github.event.issue.number }} --comment
```

## Bug Categories

### By Type
- **Logic Bugs**: Incorrect algorithms, business logic errors
- **Memory Issues**: Leaks, corruption, dangling pointers
- **Concurrency**: Race conditions, deadlocks, atomicity
- **Security**: Vulnerabilities, injection, validation
- **Performance**: Inefficiency, resource abuse, bottlenecks
- **Integration**: API failures, dependency issues

### By Severity
- **Critical**: Security vulnerabilities, data loss, system crashes
- **High**: Major functionality broken, significant user impact
- **Medium**: Feature partially working, workarounds available
- **Low**: Minor issues, cosmetic problems, edge cases

### By Detection Method
- **User Reported**: Issues found by users in production
- **Testing**: Caught during manual or automated testing
- **Monitoring**: Detected through logs, metrics, alerts
- **Code Review**: Found during peer review process
- **Static Analysis**: Identified by automated code analysis

## Best Practices

### Bug Exploration
1. **Systematic Investigation**: Follow structured exploration process
2. **Document Findings**: Record all investigation steps and results
3. **Pattern Recognition**: Look for similar issues and trends
4. **Impact Assessment**: Evaluate severity and user impact

### Bug Detection  
1. **Regular Scanning**: Integrate into CI/CD pipeline
2. **Multiple Methods**: Combine static analysis with dynamic testing
3. **Priority Focus**: Address critical and high-severity issues first
4. **Prevention**: Fix bug classes, not just individual instances

### Bug Analysis
1. **Root Cause Focus**: Don't just treat symptoms
2. **Reproducible Steps**: Create reliable reproduction cases
3. **Environmental Factors**: Consider different deployment scenarios
4. **Related Issues**: Check for similar or blocking problems

### Bug Fixing
1. **Test-Driven**: Write failing test before implementing fix
2. **Minimal Changes**: Smallest possible code modification
3. **Regression Prevention**: Ensure fix doesn't break other functionality
4. **Proper Workflow**: Use git branching and pull request process

## Configuration

### Detection Settings
```bash
# Customize bug detection sensitivity
export BUG_DETECTION_LEVEL="high"           # low, medium, high, paranoid
export BUG_SCAN_TIMEOUT="300"               # seconds
export BUG_REPORT_FORMAT="github"           # github, jira, console
```

### Analysis Configuration
```bash
# Configure analysis depth
export BUG_ANALYSIS_DEPTH="deep"            # quick, normal, deep
export BUG_AUTO_CREATE_ISSUES="true"        # Auto-create GitHub issues
export BUG_ASSIGN_TEAM="@team-backend"      # Default assignee
```

## Migration from bug-fix.md

```bash
# Old command → New unified command
/bug-fix                          → claude /bug fix <issue-number>

# Enhanced workflows now available:
claude /bug explore <symptoms>    # New: Proactive bug discovery
claude /bug find --scope <path>   # New: Systematic code scanning  
claude /bug analyze <issue>       # New: Deep root cause analysis
claude /bug fix <issue>           # Enhanced: Complete workflow
```

All original bug-fix functionality preserved with comprehensive bug lifecycle management.