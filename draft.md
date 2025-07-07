# リモートMCPサーバー実装ガイド：TypeScript、Hono、Cloudflare Workers環境でのSpotify API統合

## 1. MCP（Model Context Protocol）仕様の詳細

### 1.1 MCPサーバーの基本構造

MCPは、AIアプリケーションが外部ツール、データソース、サービスと安全に相互作用するためのオープンスタンダードです。以下の3つのコアプリミティブを実装できます：

- **Tools**: モデル制御の実行可能な関数（API呼び出し、計算など）
- **Resources**: アプリケーション制御のデータソース（ファイル、データベースレコードなど）
- **Prompts**: ユーザー制御のテンプレート化されたインタラクション

### 1.2 リモートMCPサーバーの実装パターン

**推奨されるStreamable HTTPトランスポート**では、単一のHTTPエンドポイントですべてのMCP通信を処理します：

```typescript
// JSON-RPC 2.0メッセージフォーマット
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "method": "method-name",
  "params": {
    // メソッド固有のパラメータ
  }
}
```

### 1.3 必要なエンドポイントとメソッド

#### Initialize メソッド
```typescript
// リクエスト
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-03-26",
    "clientInfo": {
      "name": "claude-desktop",
      "version": "1.0.0"
    }
  }
}

// レスポンス
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-03-26",
    "serverInfo": {
      "name": "spotify-mcp-server",
      "version": "1.0.0"
    },
    "capabilities": {
      "tools": {}
    }
  }
}
```

#### List Tools メソッド
```typescript
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

#### Tool Call メソッド
```typescript
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "search-tracks",
    "arguments": {
      "query": "Bohemian Rhapsody"
    }
  }
}
```

## 2. Spotify API OAuth PKCE実装

### 2.1 PKCE (Proof Key for Code Exchange) の仕様

PKCEは、クライアントシークレットを安全に保存できないアプリケーション向けの認証方法です：

```typescript
// Code Verifier生成（43-128文字）
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Code Challenge生成（SHA256 + base64url）
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
```

### 2.2 認証フローの実装

#### ステップ1: 認証URLの構築
```typescript
const authUrl = new URL('https://accounts.spotify.com/authorize');
authUrl.searchParams.append('response_type', 'code');
authUrl.searchParams.append('client_id', CLIENT_ID);
authUrl.searchParams.append('scope', 'user-read-private user-read-email');
authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
authUrl.searchParams.append('state', state);
authUrl.searchParams.append('code_challenge', codeChallenge);
authUrl.searchParams.append('code_challenge_method', 'S256');
```

#### ステップ2: トークン交換
```typescript
const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: codeVerifier,
  }),
});
```

### 2.3 Cloudflare KVを使った認証状態管理

```typescript
// OAuth状態の保存（10分間のTTL）
await c.env.OAUTH_KV.put(
  `oauth_state:${state}`,
  JSON.stringify({
    codeVerifier,
    timestamp: Date.now(),
    clientId: CLIENT_ID
  }),
  { expirationTtl: 600 }
);

// 状態の取得と検証
const stateData = await c.env.OAUTH_KV.get(`oauth_state:${state}`);
if (!stateData) {
  throw new Error('Invalid or expired state');
}
```

## 3. Cloudflare Workers + Honoでの実装

### 3.1 プロジェクトセットアップ

```bash
# プロジェクト作成
npm create hono@latest spotify-mcp-server
cd spotify-mcp-server
npm install @modelcontextprotocol/sdk zod
```

### 3.2 wrangler.toml設定

```toml
name = "spotify-mcp-server"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "OAUTH_KV"
id = "your-kv-namespace-id"

[vars]
CLIENT_ID = "your-spotify-client-id"
CORS_ORIGIN = "http://localhost:3000"
```

### 3.3 型定義とHonoアプリケーション設定

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

type Bindings = {
  CLIENT_ID: string;
  OAUTH_KV: KVNamespace;
  CORS_ORIGIN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS設定
app.use('*', cors({
  origin: (origin, c) => c.env.CORS_ORIGIN || '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

### 3.4 MCPエンドポイント実装

```typescript
// MCPサーバーインスタンス
const mcpServer = {
  name: 'spotify-mcp-server',
  version: '1.0.0',
  capabilities: {
    tools: {}
  }
};

// MCPリクエストハンドラー
app.post('/mcp', async (c) => {
  const request = await c.req.json();
  
  switch (request.method) {
    case 'initialize':
      return c.json({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2025-03-26',
          serverInfo: mcpServer,
          capabilities: mcpServer.capabilities
        }
      });
      
    case 'tools/list':
      return c.json({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: [{
            name: 'search-tracks',
            description: 'Search for tracks on Spotify',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum results (1-50)',
                  default: 10
                }
              },
              required: ['query']
            }
          }]
        }
      });
      
    case 'tools/call':
      if (request.params.name === 'search-tracks') {
        const result = await searchTracks(
          request.params.arguments.query,
          request.params.arguments.limit || 10,
          c.env
        );
        return c.json({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          }
        });
      }
      break;
  }
  
  return c.json({
    jsonrpc: '2.0',
    id: request.id,
    error: {
      code: -32601,
      message: 'Method not found'
    }
  });
});
```

## 4. Spotify検索API実装

### 4.1 検索エンドポイントの仕様

- **エンドポイント**: `https://api.spotify.com/v1/search`
- **メソッド**: GET
- **必須ヘッダー**: `Authorization: Bearer <access_token>`

### 4.2 検索関数の実装

```typescript
async function searchTracks(
  query: string, 
  limit: number,
  env: Bindings
): Promise<any> {
  // アクセストークンをKVから取得
  const tokenData = await env.OAUTH_KV.get('spotify_access_token');
  if (!tokenData) {
    throw new Error('No access token available');
  }
  
  const { access_token } = JSON.parse(tokenData);
  
  const response = await fetch(
    `https://api.spotify.com/v1/search?` + 
    new URLSearchParams({
      q: query,
      type: 'track',
      limit: limit.toString()
    }),
    {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    }
  );
  
  if (!response.ok) {
    if (response.status === 401) {
      // トークンの更新が必要
      await refreshAccessToken(env);
      // リトライロジック
    }
    throw new Error(`Spotify API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // 結果の整形
  return data.tracks.items.map(track => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map(a => a.name).join(', '),
    album: track.album.name,
    duration_ms: track.duration_ms,
    preview_url: track.preview_url
  }));
}
```

## 5. 最小限の実装例（KISSとYAGNI原則）

### 5.1 最小構成のMCPサーバー

```typescript
// src/index.ts - 最小限の実装
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  CLIENT_ID: string;
  OAUTH_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors());

// OAuth初期化エンドポイント
app.post('/oauth/init', async (c) => {
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  await c.env.OAUTH_KV.put(
    `oauth:${state}`,
    JSON.stringify({ codeVerifier }),
    { expirationTtl: 600 }
  );
  
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('client_id', c.env.CLIENT_ID);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', 'http://localhost:8787/oauth/callback');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  
  return c.json({ authUrl: authUrl.toString() });
});

// OAuthコールバック
app.post('/oauth/callback', async (c) => {
  const { code, state } = await c.req.json();
  
  const stateData = await c.env.OAUTH_KV.get(`oauth:${state}`);
  if (!stateData) {
    return c.json({ error: 'Invalid state' }, 400);
  }
  
  const { codeVerifier } = JSON.parse(stateData);
  
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'http://localhost:8787/oauth/callback',
      client_id: c.env.CLIENT_ID,
      code_verifier: codeVerifier
    })
  });
  
  const tokens = await tokenResponse.json();
  
  // トークンを保存
  await c.env.OAUTH_KV.put(
    'spotify_token',
    JSON.stringify(tokens),
    { expirationTtl: 3600 }
  );
  
  await c.env.OAUTH_KV.delete(`oauth:${state}`);
  
  return c.json({ success: true });
});

// 最小限のMCPエンドポイント
app.post('/mcp', async (c) => {
  const request = await c.req.json();
  
  if (request.method === 'initialize') {
    return c.json({
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2025-03-26',
        serverInfo: { name: 'spotify-mcp', version: '0.1.0' },
        capabilities: { tools: {} }
      }
    });
  }
  
  if (request.method === 'tools/list') {
    return c.json({
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools: [{
          name: 'search',
          description: 'Search Spotify',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string' } },
            required: ['query']
          }
        }]
      }
    });
  }
  
  return c.json({
    jsonrpc: '2.0',
    id: request.id,
    error: { code: -32601, message: 'Method not found' }
  });
});

// ヘルパー関数
function generateCodeVerifier(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export default app;
```

### 5.2 初期リリースの機能セット

**MVPに含めるもの**：
- 単一の検索ツール
- 基本的なOAuth PKCE認証
- 最小限のエラーハンドリング
- Streamable HTTPトランスポート

**将来の拡張（YAGNIにより延期）**：
- 複数のツール（プレイリスト操作など）
- リソース機能
- プロンプト機能
- 高度なエラーハンドリング
- セッション管理
- レート制限処理

### 5.3 デプロイ設定

```json
// package.json
{
  "name": "spotify-mcp-server",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.0.0",
    "wrangler": "^3.0.0"
  }
}
```

この実装ガイドは、KISS（Keep It Simple, Stupid）とYAGNI（You Aren't Gonna Need It）の原則に従い、最小限の機能から始めて、必要に応じて段階的に拡張できる構造になっています。初期リリースでは基本的な検索機能とOAuth認証のみを実装し、実際のユーザーフィードバックに基づいて機能を追加していくことを推奨します。