# Spotify API Testing Strategy

## 🔍 調査結果サマリー

### ❌ Spotify にはテスト環境がない
- **公式サンドボックス環境は存在しない**
- すべてのテストは本番 API (`https://api.spotify.com`) に対して実行
- 専用の「テストアカウント」という概念もない

### ✅ 推奨されるテスト戦略

## 1. テスト用 Spotify アカウントの作成

### アカウントタイプ
- **Free アカウント**: API アクセスは可能だが、一部機能制限あり
- **Premium アカウント** (推奨): すべての API 機能にアクセス可能

### 開発者アプリの登録手順
```bash
1. https://developer.spotify.com/dashboard にアクセス
2. Spotify アカウントでログイン
3. "Create app" をクリック
4. アプリ情報を入力:
   - App name: "Spotify MCP Test App"
   - App description: "Integration testing for Spotify MCP"
   - Redirect URI: http://127.0.0.1:8000/callback
5. "Web API" を選択
6. Client ID と Client Secret を保存
```

## 2. API 制限事項

### Development Mode (デフォルト)
- 最大 25 人の認証ユーザー
- 約 180 リクエスト/分（非公式情報）
- 約 10-20 リクエスト/秒
- 30 秒のローリングウィンドウ

### 2024年11月の API 変更
- 新規アプリは一部エンドポイントにアクセス不可:
  - ❌ Recommendations API
  - ❌ Audio Features/Analysis
  - ❌ Algorithmic Playlists
  - ❌ 30秒プレビュー URL

## 3. 推奨テスト構成

### 環境変数の設定
```bash
# .env.test
SPOTIFY_TEST_CLIENT_ID=your_test_app_client_id
SPOTIFY_TEST_CLIENT_SECRET=your_test_app_client_secret
SPOTIFY_TEST_REFRESH_TOKEN=obtained_from_oauth_flow
SPOTIFY_TEST_USER_ID=your_test_account_user_id
TEST_PLAYLIST_PREFIX=TEST_  # テスト用プレイリストの接頭辞
```

### テストの階層化

```
test/
├── unit/           # モックを使用した単体テスト
├── integration/    # 実 API を使用（読み取り専用操作）
└── e2e/           # フルシナリオ（要注意）
```

## 4. 実装提案

### Integration テストの改善

#### 現在の問題点
```typescript
// ❌ 現在: Integration test なのに完全にモック化
vi.mock('@external/spotify', () => ({
  searchTracks: vi.fn().mockResolvedValue(ok({ /* mock data */ }))
}))
```

#### 改善案
```typescript
// ✅ 実 API を使用する Integration テスト
describe('Integration: Spotify API', () => {
  const testClient = createAuthenticatedClient({
    accessToken: process.env.SPOTIFY_TEST_ACCESS_TOKEN
  });

  describe('読み取り専用操作', () => {
    it('should search tracks on real API', async () => {
      const result = await searchTracks(testClient, 'Beatles');
      expect(result.isOk()).toBe(true);
      expect(result.value.tracks.items.length).toBeGreaterThan(0);
    });
  });

  describe('書き込み操作', () => {
    it('should create test playlist', async () => {
      const playlistName = `TEST_${Date.now()}_Integration`;
      const result = await createPlaylist(testClient, playlistName);
      
      // クリーンアップ
      if (result.isOk()) {
        await deletePlaylist(testClient, result.value.id);
      }
    });
  });
});
```

### Mock サーバーの活用

#### Unit テスト用
```typescript
// Mockify や MSW を使用
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const mockServer = setupServer(
  rest.get('https://api.spotify.com/v1/search', (req, res, ctx) => {
    return res(ctx.json({ tracks: { items: [] } }));
  })
);
```

#### レート制限のシミュレーション
```typescript
describe('Rate limit handling', () => {
  it('should handle 429 responses', async () => {
    mockServer.use(
      rest.get('*', (req, res, ctx) => {
        return res(
          ctx.status(429),
          ctx.set('Retry-After', '5')
        );
      })
    );
    
    // レート制限時の動作をテスト
  });
});
```

## 5. テスト実行のガイドライン

### CI/CD での実行
- Unit tests: 毎回実行
- Integration tests (読み取り): 定期実行
- Integration tests (書き込み): 手動トリガー

### ローカル開発
```bash
# 単体テストのみ
pnpm test:unit

# 読み取り専用の integration テスト
pnpm test:integration:readonly

# すべてのテスト（API 呼び出しあり）
SPOTIFY_TEST_ENABLED=true pnpm test
```

## 6. 注意事項

### やってはいけないこと
- ❌ 本番ユーザーのデータを変更
- ❌ 過度な API 呼び出し
- ❌ レート制限の無視
- ❌ テストデータの放置

### ベストプラクティス
- ✅ テスト用プレフィックスの使用
- ✅ テスト後のクリーンアップ
- ✅ レート制限の遵守
- ✅ エラーハンドリングの実装

## 7. 参考ツール

### Mock サーバー
- **Mockify**: Spotify API の完全な mock 実装
- **MSW (Mock Service Worker)**: 汎用的な API mocking
- **Mockoon**: GUI ベースの mock サーバー

### テストツール
- **Postman**: Spotify API コレクション付き
- **Thunder Client**: VS Code 拡張
- **Bruno**: オープンソースの API クライアント

## まとめ

Spotify API のテストは本番環境に対して行う必要があるため、慎重な設計が必要です。読み取り専用の操作は integration テストで実 API を使用し、書き込み操作や複雑なシナリオは mock を活用することで、安全で効果的なテスト戦略を実現できます。