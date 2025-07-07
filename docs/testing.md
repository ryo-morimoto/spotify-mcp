# テスト戦略

## 概要

本プロジェクトでは、モックを最小限に抑えたシンプルなテスト戦略を採用する。型システムによる静的検証を最大限活用し、実行時の振る舞いのみをテスト対象とする。

## 基本方針

### テスト哲学
- **モックレステスト** - モックフレームワークを使わず、実装ベースでテスト
- **型駆動開発** - 型で保証できる部分はテストしない
- **KISS原則** - シンプルで理解しやすいテストを書く

### テストの考え方
- 純粋関数を中心にテスト
- 外部依存は最小限の抽象化
- 実行時にのみ決定される値を検証

## テスト対象の選定

### ✅ テストすべきもの

1. **MCPツールの統合**
   - ツールが正しくMCPサーバーに登録されているか
   - ツールのメタデータ（名前、説明）が正しいか

2. **OAuth認証フロー（実装する場合）**
   - 認証状態の管理
   - トークンのリフレッシュロジック

3. **エラーハンドリング（実装する場合）**
   - Spotify APIのエラーレスポンス処理
   - ネットワークエラーの処理

4. **ビジネスロジック（存在する場合）**
   - 検索結果のフィルタリング
   - データの加工・整形

### ❌ テスト不要なもの

1. **型定義とスキーマ**
   - TypeScriptとZodが保証

2. **外部ライブラリの動作**
   - Spotify SDK、MCP SDK、Zodの責務

3. **単純なデータ変換**
   - JSONの文字列化など

4. **まだ実装していない機能**
   - YAGNI原則に従い、必要になってから

## 現実的なテスト対象

実際のところ、このプロジェクトでは以下のようなシンプルなテストで十分な可能性が高い：

### MCPツール統合テスト
```typescript
// mcp.test.ts
import { describe, test, expect } from "vitest";
import { createMCPServer } from "./mcp.ts";

describe("MCP Server", () => {
  test("registers searchTracks tool", () => {
    const server = createMCPServer();
    const tools = server.getTools();
    
    expect(tools).toContainEqual(
      expect.objectContaining({
        name: "search_tracks",
        description: expect.any(String)
      })
    );
  });
});
```

### 実行時エラーのテスト（必要な場合）
```typescript
// searchTracks.test.ts
describe("searchTracks error handling", () => {
  test("handles network timeout", async () => {
    // ネットワークタイムアウトのシミュレーション
    const result = await searchTracks({ query: "test" }, { timeout: 1 });
    
    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe("TIMEOUT");
  });
});
```

## まとめ

本プロジェクトのテスト戦略は最小限に抑える：

1. **MCPツール統合** - ツールが正しく登録されているか
2. **実行時エラー** - 予測可能なエラーケースの処理（実装する場合のみ）

シンプルなプロジェクトには、シンプルなテストで十分。過剰なテストは KISS/YAGNI 原則に反する。