# OAuth with PKCE 手動テスト手順

## 前提条件

1. Spotify Appを作成済み（https://developer.spotify.com/dashboard）
2. Redirect URIに `http://localhost:8787/auth/callback` を追加済み

## セットアップ

```bash
# 1. 環境変数ファイルを作成
cp .dev.vars.example .dev.vars

# 2. .dev.varsを編集
CLIENT_ID=your-spotify-client-id
CLIENT_SECRET=                           # PKCEでは不要、空のままでOK
SPOTIFY_REDIRECT_URI=http://localhost:8787/auth/callback
CORS_ORIGIN=*
```

## テスト実行

```bash
# 1. 開発サーバーを起動
pnpm dev

# 2. ブラウザで認証フローを開始
open http://localhost:8787/auth/spotify

# 3. Spotifyにログインして認証を許可

# 4. 成功レスポンスを確認
# {
#   "message": "Authentication successful",
#   "sessionId": "xxx-xxx-xxx",
#   "expiresAt": 1234567890000
# }
```

## エラーケースのテスト

### 1. 認証キャンセル
- Spotifyログイン画面で「キャンセル」をクリック
- エラーレスポンス: `{"error": "OAuth error: access_denied"}`

### 2. 無効なstate
```bash
curl "http://localhost:8787/auth/callback?code=test&state=invalid"
# レスポンス: {"error": "Invalid or expired state"}
```

### 3. パラメータ不足
```bash
curl "http://localhost:8787/auth/callback"
# レスポンス: {"error": "Missing code or state parameter"}
```

## トークンリフレッシュのテスト

現在の実装では、MCPエンドポイント呼び出し時に自動的にトークンがリフレッシュされます：

```bash
# MCPエンドポイントを呼び出し
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

## デバッグ情報

KVストレージの内容を確認するには、Wrangler CLIを使用：

```bash
# KVネームスペースの一覧
wrangler kv:namespace list

# KVのキー一覧
wrangler kv:key list --namespace-id=your-namespace-id

# 特定のキーの値を取得
wrangler kv:get "session:xxx" --namespace-id=your-namespace-id
```