# テスト戦略

## 概要

本プロジェクトでは、モックを最小限に抑えたシンプルなテスト戦略を採用する。型システムによる静的検証を最大限活用し、実行時の振る舞いのみをテスト対象とする。

## 基本方針

### テスト哲学
- **モックレステスト** - モックフレームワークを使わず、実装ベースでテスト
- **型駆動開発** - 型で保証できる部分はテストしない
- **KISS原則** - シンプルで理解しやすいテストを書く
- **Deep Module原則** - 公開APIのみをテストし、内部実装の詳細は隠蔽

### テストの考え方
- 公開API（`create*Tool`関数）を通じてテスト
- 外部依存は最小限の抽象化
- 実行時にのみ決定される値を検証
- 内部実装関数はexportせず、テストも書かない

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

## MCPツールのテストパターン

### 推奨パターン: Public API Testing

MCPツールは公開API（`create*Tool`関数）を通じてのみテストする。内部実装関数はexportせず、テストも書かない。

```typescript
// ✅ GOOD: 公開APIをテスト
import { describe, it, expect } from "vitest";
import { createGetAlbumTool } from "./get.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("get-album tool", () => {
  const mockClient = {
    albums: {
      get: vi.fn().mockResolvedValue(mockAlbum),
    },
  } as unknown as SpotifyApi;

  it("retrieves album successfully", async () => {
    const tool = createGetAlbumTool(mockClient);
    const result = await tool.handler({ albumId: "valid-id" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    
    const albumData = JSON.parse((result.content[0] as any).text);
    expect(albumData.id).toBe("valid-id");
  });

  it("handles API errors gracefully", async () => {
    mockClient.albums.get = vi.fn().mockRejectedValue(new Error("Not found"));
    
    const tool = createGetAlbumTool(mockClient);
    const result = await tool.handler({ albumId: "invalid-id" });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Failed to get album");
  });

  describe("tool metadata", () => {
    it("has correct definition", () => {
      const tool = createGetAlbumTool(mockClient);
      
      expect(tool.name).toBe("get_album");
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
    });
  });
});

// ❌ BAD: 内部実装をテスト
import { getAlbum } from "./get.ts"; // 内部関数をexportしない！

test("getAlbum returns data", async () => {
  const result = await getAlbum(client, "id");
  // ...
});
```

### テストの構造

1. **正常系のテスト** - ツールが期待通りに動作することを確認
2. **エラーハンドリング** - APIエラーや入力検証エラーの処理を確認
3. **ツールメタデータ** - name、description、inputSchemaが正しく設定されているか確認

## 現実的なテスト対象

実際のところ、このプロジェクトでは以下のようなシンプルなテストで十分な可能性が高い：

### MCPサーバー統合テスト
```typescript
// mcp.test.ts
import { describe, test, expect } from "vitest";
import { createMCPServer } from "./mcp.ts";

describe("MCP Server", () => {
  test("registers all tools", () => {
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

## テストガイドライン

### DO ✅
- 公開API（`create*Tool`関数）のみをテスト
- ツールのhandler関数の入出力を検証
- エラーケースとエッジケースをカバー
- ツールメタデータ（name、description、schema）を検証
- モックは最小限に留める

### DON'T ❌
- 内部実装関数をexportしない
- 内部実装の詳細をテストしない
- Spotify SDKの動作をテストしない
- 型で保証される部分をテストしない
- 複雑なモックやスタブを作らない

### 移行手順
1. 既存のテストを公開APIテストに書き換える
2. 内部関数のexportを削除
3. 全テストが通ることを確認
4. 新規ツールは最初から公開APIのみテスト

## まとめ

本プロジェクトのテスト戦略：

1. **Deep Module原則** - 公開APIのみをテストし、内部実装は隠蔽
2. **KISS原則** - シンプルで理解しやすいテスト
3. **YAGNI原則** - 必要なテストのみ、過剰なテストは避ける

この戦略により、メンテナンスしやすく、変更に強いテストスイートを実現する。