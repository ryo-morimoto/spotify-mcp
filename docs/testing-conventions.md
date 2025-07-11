# テストコード規約

## 🎯 目的
このドキュメントは、プロジェクト全体で一貫性のあるテストコードを書くための規約を定めます。

## 📐 基本原則

### 1. t-wadaのテスト原則
- **Arrange-Act-Assert (AAA) パターン**を厳守
- **テストは仕様書**として読めること
- **1テスト1アサーション**を基本とする

### 2. KISS原則の適用
- テストコードはプロダクションコードよりもシンプルに
- 複雑なテストヘルパーは作らない
- DRYよりもDAMP（Descriptive And Meaningful Phrases）を優先

## 🏗️ ディレクトリ構造

```
src/
├── authHandler.ts
├── authHandler.test.ts      # ユニットテスト（同階層）
└── authHandler.integration.test.ts  # 統合テスト（必要な場合）

test/
├── fixtures/               # 静的テストデータ
│   ├── clients.ts         # クライアント情報のフィクスチャ
│   ├── tokens.ts          # トークン関連のフィクスチャ
│   └── spotifyResponses.ts # Spotify APIレスポンスのフィクスチャ
├── helpers/                # テスト専用ヘルパー関数
│   ├── mockBindings.ts    # Bindings のモック作成
│   ├── mockKV.ts          # KVNamespace のモック作成
│   └── assertions.ts      # カスタムアサーション
└── integration/            # E2Eテスト・統合テスト
    └── oauth.test.ts
```

### 命名規則の使い分け

- **fixtures/**: 静的なテストデータ（JSON、定数、サンプルオブジェクト）
- **helpers/**: テストのセットアップ・実行を支援する関数
- **utils/**: 複数のテストで使う汎用的なユーティリティ（今回は使用しない）

## 📝 命名規則

### ファイル名
- ユニットテスト: `<対象ファイル名>.test.ts`
- 統合テスト: `<機能名>.integration.test.ts`
- E2Eテスト: `test/integration/<機能名>.test.ts`

### テストケース命名

```typescript
// ❌ BAD - 英語での命名
it("should return 400 when request body is invalid")

// ✅ GOOD - 日本語で仕様を明確に記述
it("リクエストボディが無効な場合は400エラーを返す")

// ✅ GOOD - Given-When-Then形式も可
it("無効なJSONが送信された時、400エラーとエラーメッセージを返す")
```

## 🧪 テスト構造

### 基本テンプレート

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Result } from "neverthrow";
// フィクスチャ
import { clientFixtures } from "../test/fixtures/clients.ts";
// ヘルパー
import { createMockBindings } from "../test/helpers/mockBindings.ts";

describe("対象モジュール名", () => {
  // セットアップ
  let mockEnv: MockBindings;
  let app: Hono;

  beforeEach(() => {
    // 各テストの前に初期化
    vi.clearAllMocks();
    mockEnv = createMockBindings();
    app = createTestApp(mockEnv);
  });

  describe("機能/メソッド名", () => {
    describe("正常系", () => {
      it("期待される振る舞いの説明", async () => {
        // Arrange（準備）
        const input = clientFixtures.valid;
        
        // Act（実行）
        const result = await targetFunction(input);
        
        // Assert（検証）
        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(expected);
      });
    });

    describe("異常系", () => {
      it("エラーケースの説明", async () => {
        // Arrange
        const invalidInput = clientFixtures.invalid;
        
        // Act
        const result = await targetFunction(invalidInput);
        
        // Assert
        expect(result.isErr()).toBe(true);
        expect(result.error).toBe("expected error");
      });
    });
  });
});
```

## 🔧 モックの規約

### 1. モックの命名
```typescript
// モック変数は mock プレフィックスを付ける
const mockKV = createMockKV();
const mockOAuthClient = vi.fn();
```

### 2. モックの配置
```typescript
// ファイル上部でモジュールモック
vi.mock("./oauth.ts", () => ({
  generateAuthorizationUrl: vi.fn(),
  exchangeCodeForTokens: vi.fn(),
}));

// テスト内で振る舞いを定義
beforeEach(() => {
  vi.mocked(generateAuthorizationUrl).mockReturnValue(
    ok({ url: "https://spotify.com/auth", state: mockState })
  );
});
```

## 📊 アサーションの規約

### 1. Result型のアサーション
```typescript
// ✅ GOOD - Result型を適切に検証
expect(result.isOk()).toBe(true);
if (result.isOk()) {
  expect(result.value).toEqual(expected);
}

// ❌ BAD - 型安全でない
expect(result.value).toEqual(expected); // valueが存在しない可能性
```

### 2. HTTPレスポンスのアサーション
```typescript
// 統一されたレスポンス検証
async function expectResponse(
  response: Response,
  expectedStatus: number,
  expectedBody?: unknown
) {
  expect(response.status).toBe(expectedStatus);
  if (expectedBody !== undefined) {
    const body = await response.json();
    expect(body).toEqual(expectedBody);
  }
}

// 使用例
it("400エラーを返す", async () => {
  const response = await app.request("/auth/token", {
    method: "POST",
    body: "invalid",
  });
  
  await expectResponse(response, 400, {
    error: "invalid_request",
    error_description: "Missing required parameters"
  });
});
```

## 🎭 キャラクタライゼーションテストの規約

### 現在の振る舞いを記録する際の書き方
```typescript
describe("POST /register - 現在の振る舞い", () => {
  it("【現状】有効なリクエストでクライアントを登録する", async () => {
    // 現在の実装の振る舞いをそのまま記録
    // バグも含めて記録する
  });
  
  it.todo("【理想】本来はこうあるべき", () => {
    // 将来的に修正したい振る舞いはtodoとして記録
  });
});
```

## 🚀 フィクスチャとヘルパーの作成ガイドライン

### フィクスチャ（test/fixtures/）
静的なテストデータを定義：

```typescript
// test/fixtures/clients.ts
export const clientFixtures = {
  valid: {
    client_name: "Test Client",
    redirect_uris: ["http://localhost:3000/callback"],
    grant_types: ["authorization_code"],
  },
  
  minimal: {
    redirect_uris: ["http://localhost:3000/callback"],
  },
  
  invalid: {
    client_name: "Invalid Client",
    // redirect_uris が欠けている
  },
} as const;
```

### ヘルパー（test/helpers/）
テストのセットアップや実行を支援する関数：

```typescript
// test/helpers/mockKV.ts
export function createMockKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key, value) => {
      store.set(key, value);
    }),
    get: vi.fn(async (key) => store.get(key) || null),
    delete: vi.fn(async (key) => store.delete(key)),
  };
}
```

## ✅ チェックリスト

新しいテストを書く際の確認事項：

- [ ] AAA パターンに従っているか
- [ ] テストケース名は日本語で仕様を表現しているか
- [ ] 1テスト1アサーションを守っているか
- [ ] Result型を適切に検証しているか
- [ ] モックは最小限か
- [ ] エラーケースも網羅しているか
- [ ] フィクスチャは `test/fixtures/` に配置したか
- [ ] ヘルパーは `test/helpers/` に配置したか
- [ ] 静的データとヘルパー関数を適切に分離したか

## 📚 参考資料
- [t-wada/power-assert](https://github.com/power-assert-js/power-assert)
- [Testing best practices](https://testingjavascript.com/)
- [Kent C. Dodds - Common Testing Mistakes](https://kentcdodds.com/blog/common-testing-mistakes)