# MCP (Model Context Protocol) 調査結果

## 概要

本ドキュメントは、MCP（Model Context Protocol）の仕様調査結果をまとめたものです。特に、JSON-RPC 2.0の実装方法、SSEからStreamable HTTPへの移行、Honoフレームワークでの実装パターンについて記載します。

## MCPのJSON-RPC 2.0仕様

### 基本的なメッセージタイプ

#### 1. Request（リクエスト）
```typescript
{
  jsonrpc: "2.0";
  id: string | number;  // nullは不可、セッション内で一意
  method: string;
  params?: {
    [key: string]: unknown;
  };
}
```

#### 2. Response（レスポンス）
```typescript
{
  jsonrpc: "2.0";
  id: string | number;  // リクエストと同じID
  result?: {
    [key: string]: unknown;
  }
  error?: {
    code: number;
    message: string;
    data?: unknown;
  }
}
```

#### 3. Notification（通知）
```typescript
{
  jsonrpc: "2.0";
  method: string;
  params?: {
    [key: string]: unknown;
  };
  // idフィールドは含まない
}
```

### 標準エラーコード

- `-32602`: Invalid params（無効なパラメータ）
- `-32603`: Internal error（内部エラー）
- `-32002`: Resource not found（リソース未発見）

## SSEからStreamable HTTPへの移行

### レガシーSSE実装（非推奨）

従来のMCP実装では、SSE専用のエンドポイントを別途用意していました：

```typescript
// レガシーな実装パターン
app.get('/sse', handleSSEConnection)    // SSE専用
app.post('/messages', handleMessages)   // メッセージ送信用
```

この実装は「deprecated」として、後方互換性のためのみ存在します。

### 新しいStreamable HTTP実装（推奨）

最新の仕様では、単一エンドポイントで全ての通信を処理します：

```typescript
// 推奨される実装パターン
app.all('/mcp', async (c) => {
  const response = await server.handleRequest(c);
  
  if (needsStreaming) {
    // SSEストリームとして応答
    res.setHeader("Content-Type", "text/event-stream");
    // ストリーミング処理
  } else {
    // 通常のJSONレスポンス
    res.json(response);
  }
});
```

### Streamable HTTPの特徴

1. **単一エンドポイント**: `/mcp`のみで全てを処理
2. **柔軟な応答形式**: 
   - 単一のJSONレスポンス（`application/json`）
   - SSEストリーム（`text/event-stream`）
3. **セッション管理**: `Mcp-Session-Id`ヘッダーによる
4. **プロトコルバージョン**: `MCP-Protocol-Version`ヘッダー必須

## HTTPトランスポート仕様

### クライアント→サーバー通信

#### HTTP POSTリクエスト
- **エンドポイント**: `/mcp`
- **メソッド**: POST
- **必須ヘッダー**: 
  ```
  Accept: application/json, text/event-stream
  ```
- **ボディ**: JSON-RPCメッセージ（単一またはバッチ配列）

#### サーバーレスポンス

1. **通知/レスポンスの場合**: HTTP 202 Accepted（ボディなし）
2. **リクエストの場合**:
   - 単一レスポンス: `Content-Type: application/json`
   - ストリーミング: `Content-Type: text/event-stream`

### サーバー→クライアント通信（SSE）

HTTP GETリクエストでSSEストリームを開始：
- **エンドポイント**: `/mcp`
- **メソッド**: GET
- **必須ヘッダー**: `Accept: text/event-stream`

## Honoでの実装パターン

### @hono/mcpパッケージ

最新のStreamable HTTP仕様に準拠した公式実装：

```typescript
import { StreamableHTTPTransport } from '@hono/mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Hono } from 'hono'

const app = new Hono()

const mcpServer = new McpServer({
  name: 'my-mcp-server',
  version: '1.0.0',
})

app.all('/mcp', async (c) => {
  const transport = new StreamableHTTPTransport()
  await mcpServer.connect(transport)
  return transport.handleRequest(c)
})
```

### 実装の特徴

1. **`app.all()`を使用**: GET/POST両方を同一ハンドラーで処理
2. **自動的な応答形式の判断**: `transport.handleRequest()`が適切な形式を選択
3. **セッション管理の統合**: トランスポートレイヤーで自動処理

## パッケージ比較

### hono-mcp-server-sse-transport（レガシー）
- SSE専用の実装
- 複数エンドポイント（`/sse`と`/messages`）が必要
- 旧仕様に基づく設計

### @hono/mcp（推奨）
- Streamable HTTP対応
- 単一エンドポイントで完結
- 最新のMCP仕様に準拠
- SSEは内部的に使用されるが、専用エンドポイントは不要

## まとめ

1. MCPはJSON-RPC 2.0をベースとしたプロトコル
2. SSE技術自体は廃止されないが、使用方法が変更された
3. 独立したSSEエンドポイントは非推奨
4. @hono/mcpはStreamable HTTPに対応した現代的な実装
5. 単一エンドポイントパターンが推奨される

## 参考資料

- [Model Context Protocol Specification](https://github.com/modelcontextprotocol/specification)
- [Hono Middleware Repository](https://github.com/honojs/middleware)
- MCP公式ドキュメント（Context7経由で取得）