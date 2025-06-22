# MCP Management

Comprehensive MCP (Model Context Protocol) server development and deployment management.

```
/mcp validate [--strict]          # Check best practices compliance
/mcp release [--prepare|--publish] # Release management
/mcp remote <connect|test> <url>   # Remote server management  
/mcp auth <setup|refresh|status>   # OAuth authentication
/mcp info                          # Server diagnostics
```

## What it does

### 1. **MCP Validation & Best Practices** (`/mcp validate`)
- **Configuration Validation**: Environment variables, sensible defaults
- **Code Quality Checks**: No stdio output, proper error handling
- **Tool Compliance**: Parameter descriptions, dynamic versioning
- **Logging Setup**: Pino file-based logging verification
- **Runtime Checks**: MCP protocol compliance, tool registration

**Key Validations:**
- ✅ No `console.log()` or stdio output in production code
- ✅ All tools have proper descriptions and parameter schemas  
- ✅ Environment variables have sensible defaults
- ✅ File-based logging (Pino) configured correctly
- ✅ Dynamic version reading from package.json
- ✅ Proper error handling without crashes

### 2. **Release Management** (`/mcp release`)
- **Pre-release Checks**: Git status, version consistency, security audit
- **Build Verification**: TypeScript compilation, test execution
- **Package Validation**: NPM package structure, dependencies
- **Automated Publishing**: Version bumping, changelog generation
- **Distribution**: NPM registry deployment

**Release Workflow:**
1. **Git Status**: Ensures main branch, no uncommitted changes
2. **Dependencies**: Validates and updates package dependencies
3. **Security Audit**: Runs npm audit for vulnerabilities
4. **Version Check**: Confirms version availability on NPM
5. **Build & Test**: Compiles TypeScript and runs full test suite
6. **Package Build**: Generates .d.ts files and builds distribution
7. **Changelog**: Updates CHANGELOG.md with current version
8. **Publish**: Deploys to NPM registry with proper tags

### 3. **Remote Server Management** (`/mcp remote`)
- **Server Discovery**: Checks transport type and endpoints
- **Connection Testing**: Validates connectivity and protocols
- **Session Management**: Establishes and maintains connections
- **Communication**: Handles tool requests and SSE streams

**Connection Process:**
1. **Discovery**: Checks server capabilities and transport
2. **Initialization**: Sends handshake and negotiates protocols
3. **Authentication**: Handles OAuth if required
4. **Session**: Maintains persistent connection with heartbeat
5. **Tool Execution**: Sends requests and processes responses

### 4. **OAuth Authentication** (`/mcp auth`)
- **Dynamic Registration**: Creates OAuth clients automatically
- **PKCE Flow**: Implements secure authorization code flow
- **Token Management**: Handles refresh and storage
- **Browser Integration**: Opens auth flows in default browser

**Auth Features:**
- **Auto-Discovery**: Finds OAuth endpoints from server metadata
- **No Manual Setup**: Dynamic client registration eliminates config
- **Secure Storage**: Encrypted token storage with auto-refresh
- **PKCE Support**: Modern OAuth 2.1 security standards

### 5. **Server Diagnostics** (`/mcp info`)
- **Version Information**: Server version and dependencies
- **Configuration Status**: Environment variables and setup
- **Health Checks**: Tool availability and functionality
- **Dependency Verification**: Native dependencies and paths

## Examples

### Validation and Best Practices
```bash
# Basic validation
/mcp validate

Checking MCP best practices compliance...
✅ Configuration: All environment variables have defaults
✅ Logging: Pino file logging configured
✅ Tools: 8 tools properly documented
⚠️ Warning: Found 2 console.log statements in dev files
✅ Error Handling: No crashes on misconfiguration
✅ Version: Dynamic version reading from package.json

Compliance Score: 95/100 (Excellent)
```

```bash
# Strict validation
/mcp validate --strict

Running strict compliance checks...
❌ CRITICAL: console.log found in src/server.ts:42
❌ CRITICAL: Missing parameter description for 'options' in search tool
❌ CRITICAL: Tool 'player_control' missing input schema validation
⚠️ Warning: No integration tests for remote connections

Strict Compliance: FAILED (3 critical issues)
Must fix critical issues before release.
```

### Release Management
```bash
# Prepare release (dry run)
/mcp release --prepare

🔍 Pre-release validation...
✅ Git: On main branch, no uncommitted changes
✅ Version: 1.2.0 available on NPM
✅ Dependencies: All up to date
✅ Security: No vulnerabilities found
✅ Tests: 47/47 passing (100% coverage)
✅ Build: TypeScript compilation successful
✅ Package: All required files included

Ready for release! Run '/mcp release --publish' to deploy.
```

```bash
# Publish release
/mcp release --publish

🚀 Publishing spotify-mcp v1.2.0...
📝 Updating CHANGELOG.md
🏗️ Building package...
🧪 Final tests... ✅
📦 Publishing to NPM...
🏷️ Creating Git tag v1.2.0...
📤 Pushing to GitHub...

✅ Release successful!
📊 Package: https://www.npmjs.com/package/spotify-mcp
🏷️ Tag: https://github.com/user/spotify-mcp/releases/tag/v1.2.0
```

### Remote Server Management
```bash
# Test remote connection
/mcp remote test https://api.example.com/mcp

🔍 Testing connection to https://api.example.com/mcp...
✅ Server discovery: MCP Server v2.1.0 found
✅ Transport: HTTP with SSE support
✅ Endpoints: /tools, /resources, /prompts available
✅ Authentication: OAuth 2.1 supported
✅ Connection: Handshake successful
⚡ Tools available: search, analyze, transform (3 total)

Connection Status: Ready for use
```

```bash
# Connect to remote server
/mcp remote connect https://api.example.com/mcp

🔗 Connecting to remote MCP server...
🔐 Authentication required - opening browser...
✅ OAuth flow completed
📡 Establishing SSE connection...
✅ Connected to server

Remote tools now available:
- /search-remote <query>
- /analyze-remote <data>  
- /transform-remote <input>

Use '/mcp remote disconnect' to close connection.
```

### Authentication Management
```bash
# Setup OAuth for server
/mcp auth setup https://api.example.com

🔍 Discovering OAuth configuration...
✅ Authorization Server: https://auth.example.com
✅ Client Registration: Dynamic registration supported
🔐 Registering OAuth client...
✅ Client ID: mcp-client-abc123
🌐 Opening browser for authorization...
✅ Authorization granted
🔑 Tokens stored securely

Authentication setup complete!
```

```bash
# Check auth status
/mcp auth status

📊 Authentication Status:
┌─────────────────────────────┬──────────────┬─────────────────────┐
│ Server                      │ Status       │ Token Expires       │
├─────────────────────────────┼──────────────┼─────────────────────┤
│ https://api.example.com     │ ✅ Active    │ 2024-06-28 15:30   │
│ https://dev.example.com     │ ⚠️ Expires   │ 2024-06-22 09:15   │
│ https://staging.example.com │ ❌ Expired   │ 2024-06-20 14:45   │
└─────────────────────────────┴──────────────┴─────────────────────┘

💡 Run '/mcp auth refresh <server>' to renew expiring tokens
```

## Configuration

### Environment Variables
```bash
# MCP Server Configuration
export SPOTIFY_MCP_LOG_FILE="/var/log/spotify-mcp.log"
export SPOTIFY_MCP_LOG_LEVEL="info"
export SPOTIFY_MCP_CONSOLE_LOGGING="false"  # Critical: must be false for production

# OAuth Configuration  
export OAUTH_CLIENT_ID="your-client-id"      # Optional: for static clients
export OAUTH_CLIENT_SECRET="your-secret"     # Optional: for confidential clients
export OAUTH_REDIRECT_URI="http://localhost:3000/callback"

# Development Settings
export NODE_ENV="development"                 # Enables additional logging
export MCP_DEBUG="true"                      # Detailed debug information
```

### Best Practices Integration
This command incorporates all MCP best practices:

1. **No stdio output** - All logging goes to files
2. **Dynamic versioning** - Version read from package.json
3. **Sensible defaults** - Environment variables have fallbacks
4. **Robust error handling** - Graceful failure with helpful messages
5. **Comprehensive tool descriptions** - All parameters documented
6. **OAuth 2.1 compliance** - Modern security standards
7. **File-based logging** - Pino structured logging to files

## Migration from Individual Commands

This command replaces and enhances:
- **`mcp-best-practices`** → `/mcp validate`
- **`mcp-releasing`** → `/mcp release`  
- **`remote-mcp`** → `/mcp remote`
- **`remote-mcp-auth`** → `/mcp auth`

All functionality is preserved with improved workflows and unified interface.