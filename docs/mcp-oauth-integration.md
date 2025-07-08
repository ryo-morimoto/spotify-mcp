# MCP と OAuth with PKCE の統合

## 概要

MCPサーバーでOAuth認証を統合する方法は2つあります：

### 1. セッションベースの認証（推奨）

MCPの`StreamableHTTPTransport`はセッション管理をサポートしています。各セッションでユーザー固有のトークンを管理できます。

```typescript
// セッションごとにSpotifyクライアントを管理
const sessions: Map<string, SpotifyApi> = new Map();

app.all('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string;
  
  if (sessionId && sessions.has(sessionId)) {
    // 既存セッションのクライアントを使用
    const spotifyClient = sessions.get(sessionId)!;
    const mcpServer = createMCPServer(spotifyClient);
    // ...
  } else {
    // 新規セッション: 認証が必要
    // クライアントにOAuth URLを返す特別なレスポンス
  }
});
```

### 2. トークンヘッダーベースの認証

クライアントが各リクエストでトークンを送信する方式：

```typescript
app.all('/mcp', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    // 認証エラーを返す
    return;
  }
  
  const sessionId = req.headers['mcp-session-id'];
  const accessToken = authHeader.substring(7);
  
  // トークンでSpotifyクライアントを作成
  const spotifyClient = SpotifyApi.withAccessToken(clientId, {
    access_token: accessToken,
    token_type: "Bearer",
    // ...
  });
});
```

## 実装案

### 1. MCPセッションとOAuthの統合

```typescript
// src/index.ts の修正案

// セッション管理
const sessions = new Map<string, {
  spotifyClient: SpotifyApi;
  expiresAt: number;
}>();

app.all('/mcp', async (c) => {
  const sessionId = c.req.header('mcp-session-id');
  
  // 既存セッションの確認
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    
    // トークンの有効期限確認
    if (Date.now() < session.expiresAt) {
      const mcpServer = createMCPServer(session.spotifyClient);
      const transport = new StreamableHTTPTransport();
      await mcpServer.connect(transport);
      return transport.handleRequest(c);
    }
  }
  
  // 認証が必要な場合
  // MCPの仕様に従ってエラーレスポンスを返す
  return c.json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Authentication required',
      data: {
        authUrl: `/auth/spotify?mcp_session=${sessionId || 'new'}`
      }
    },
    id: null
  }, 401);
});

// OAuth コールバックでセッションを作成
app.get('/auth/callback', async (c) => {
  // ... トークン交換処理 ...
  
  const mcpSessionId = c.req.query('mcp_session');
  if (mcpSessionId) {
    // MCPセッションにSpotifyクライアントを紐付け
    const spotifyClient = SpotifyApi.withAccessToken(
      c.env.CLIENT_ID as SpotifyClientId,
      {
        access_token: tokens.accessToken,
        token_type: "Bearer" as const,
        expires_in: tokens.expiresIn,
        refresh_token: tokens.refreshToken,
      }
    );
    
    sessions.set(mcpSessionId, {
      spotifyClient,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    });
    
    // MCPクライアントにリダイレクト
    return c.redirect(`/mcp-auth-success?session=${mcpSessionId}`);
  }
  
  // 通常のレスポンス
  return c.json({ message: "Authentication successful" });
});
```

### 2. MCPクライアント側の実装例

```typescript
// クライアント側
const client = new Client({
  name: "spotify-client",
  version: "1.0.0"
});

const transport = new StreamableHTTPClientTransport(
  new URL("http://localhost:8787/mcp")
);

// 認証エラーのハンドリング
transport.on('error', async (error) => {
  if (error.code === -32000 && error.data?.authUrl) {
    // ユーザーを認証URLにリダイレクト
    window.location.href = error.data.authUrl;
  }
});

await client.connect(transport);
```

## 推奨アプローチ

1. **セッションベース認証**を使用
2. MCPセッションIDとSpotifyトークンを紐付けて管理
3. トークンの自動リフレッシュ機能を実装
4. セッションの有効期限管理

この方式により、各ユーザーが自分のSpotifyアカウントでMCPサーバーを使用できます。