# Spotify MCP Server Documentation

Welcome to the Spotify MCP Server documentation. This guide will help you understand, develop, and deploy the MCP server for Spotify integration.

## 📚 Documentation Structure

### Getting Started
- [Getting Started](./getting-started.md) - Quick start guide (5 minutes!)
- [Overview](./overview.md) - Project introduction and architecture overview
- [Development Setup](./development-setup.md) - Local development environment setup
- [API Reference](./api-reference.md) - Complete API documentation

### Architecture & Design
- [Architecture](./architecture.md) - System architecture and design decisions
- [MCP Protocol Specification](./mcp-protocol-spec.md) - Model Context Protocol implementation details
- [Detailed Specifications](./spec/) - Component-level specifications

### Deployment
- [Deployment Guide](./deployment-guide.md) - Production deployment instructions (includes Cloudflare Workers)

### Reference
- [Final Specification](./final-specification.md) - Complete system specification

## 🚀 Quick Links

- **Get started quickly**: See [Getting Started](./getting-started.md) (5 min setup!)
- **Start developing**: See [Development Setup](./development-setup.md)
- **Understand MCP**: See [MCP Protocol Specification](./mcp-protocol-spec.md)
- **Deploy to production**: See [Deployment Guide](./deployment-guide.md)
- **API documentation**: See [API Reference](./api-reference.md)

## 📋 Documentation Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| Getting Started | ✅ Current | 2025-06-22 |
| Overview | ✅ Current | 2025-06-22 |
| Development Setup | ✅ Current | 2025-06-22 |
| API Reference | ✅ Current | 2025-06-22 |
| Architecture | ✅ Current | 2025-06-22 |
| MCP Protocol Spec | ✅ Current | 2025-06-22 |
| Deployment Guide | ✅ Current | 2025-06-22 |

## 🏗️ Project Structure

```
src/
├── external/          # External API integrations
│   └── spotify/       # Spotify Web API functions
├── routes/            # HTTP route handlers (Hono)
│   ├── auth.ts        # OAuth endpoints
│   ├── mcp.ts         # MCP JSON-RPC endpoint
│   └── health.ts      # Health check
├── mcp/               # MCP protocol implementation
│   ├── tools/         # MCP tool implementations
│   ├── resources/     # MCP resource handlers
│   └── prompts/       # MCP prompt templates
├── auth/              # Authentication logic
├── types/             # TypeScript type definitions
├── middleware/        # Hono middleware
├── storage/           # Data persistence layer
├── adapters/          # Integration adapters
├── server.ts          # Main Hono HTTP server
├── worker.ts          # Cloudflare Workers entry
└── durableObjects.ts  # Durable Objects implementation
```

## 🛠️ Technology Stack

- **Framework**: [Hono](https://hono.dev/) - Ultrafast web framework
- **Runtime**: Cloudflare Workers with Durable Objects
- **Language**: TypeScript with strict type checking
- **Testing**: Vitest with >80% coverage target
- **Error Handling**: neverthrow Result types
- **API Integration**: Spotify Web API SDK

## 📝 Contributing to Documentation

When updating documentation:
1. Keep information current with the codebase
2. Use clear, concise language
3. Include code examples where helpful
4. Update the status table above
5. Follow the existing format and style

For questions or clarifications, refer to the [CLAUDE.md](../CLAUDE.md) file for project conventions.