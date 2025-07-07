# Spotify API 型定義の選定

## ステータス
承認済み

## コンテキスト
Spotify MCP サーバーの実装において、Spotify Web API のリクエスト/レスポンスの型定義をどのように管理するかを決定する必要があった。

### 検討した選択肢

1. **公式 Spotify TypeScript SDK (`@spotify/web-api-ts-sdk`) の使用**
   - Spotifyが公式に提供するTypeScript SDK
   - 型定義が組み込まれている
   - 定期的にメンテナンスされている

2. **コミュニティメンテナンスのOpenAPIスキーマ (`sonallux/spotify-web-api`) の使用**
   - 公式OpenAPIの修正版を提供
   - 自動的に最新のAPIに追従
   - OpenAPIからコード生成が可能

3. **その他のコミュニティ型定義パッケージ**
   - `@types/spotify-api` - 2年以上更新なし
   - `spotify-types` - 2022年で更新停止

### 公式OpenAPIの問題点
調査の結果、Spotify公式のOpenAPIには以下の問題があることが判明した：
- パラメータ制約の誤り（例：`limit`の最小値が0だが実際は1）
- レスポンススキーマの不整合
- 新しいAPIオブジェクトの定義欠落
- 型定義の誤り

これらの問題を修正するため、コミュニティ版が存在している。

## 決定
**公式Spotify TypeScript SDK (`@spotify/web-api-ts-sdk`) を使用し、必要に応じて手動でZodスキーマを定義する。**

## 理由

1. **信頼性**
   - Spotify公式のSDKであり、実際のAPIの動作と一致している
   - 定期的なメンテナンスが保証されている

2. **KISS原則の遵守**
   - OpenAPI → 型生成 → Zodスキーマという複雑な変換プロセスを避ける
   - SDKの関数シグネチャに直接合わせたシンプルな実装

3. **メンテナンス性**
   - 個人プロジェクトへの依存を避ける
   - 公式SDKの型定義で必要十分

4. **実装の簡潔性**
   - SDKが提供する型を直接利用
   - 追加の型生成ツールや依存関係が不要

## 実装方針

```typescript
// 公式SDKの関数シグネチャに合わせたZodスキーマ
const searchTracksSchema = z.object({
  q: z.string().describe("Search query"),
  market: z.string().optional().describe("ISO 3166-1 alpha-2 country code"),
  limit: z.number().min(1).max(50).optional().describe("Number of results"),
  offset: z.number().min(0).optional().describe("Index offset"),
  include_external: z.string().optional().describe("Include external content")
});
```

## 結果
- 型の再定義を避け、公式SDKの型を最大限活用
- 必要最小限のZodスキーマ定義で型安全性を確保
- 外部依存を最小化し、メンテナンス性を向上