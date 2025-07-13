# ADR-0003: Tool-Only設計の採用

## Status

Accepted

## Context

MCP (Model Context Protocol) では、サーバーが提供する機能を Tool と Resource の2つの方法で実装できる。

当初、以下のような実装を検討した：
- Resource: `/albums/{albumId}`, `/tracks/{trackId}`, `/user/profile` など
- Tool: 検索、再生制御などのアクション

しかし、Spotify Web API の特性を考慮すると、Resource パターンには重大な問題がある。

## Decision

**すべての Spotify API 機能を Tool として実装する。Resource は一切使用しない。**

## Rationale

### 1. 変更通知機能の実装不可能性

MCP Resource の主要な利点の1つは `subscribe` による変更通知だが、Spotify Web API では実装不可能：

```typescript
// 理想的なケース（実装不可能）
client.subscribe("/user/player/state")
// → 再生状態が変わったら通知

// 現実
// Spotify Web APIにはWebSocketやServer-Sent Eventsがない
// ポーリングしか方法がない
```

### 2. キャッシュによる情報の陳腐化

Resource として提供した場合、MCP クライアントがキャッシュする可能性がある：

```typescript
// 問題のシナリオ
GET /user/player/state → クライアントがキャッシュ
// 1秒後、実際は次の曲に変わっているが
// クライアントは古いキャッシュを使用
```

特に以下のデータは秒単位で変化する：
- 再生状態（progress_ms は常に変化）
- 再生キュー（曲が進むたびに変化）
- デバイスリスト（デバイスのオンライン/オフライン）

### 3. データの一貫性保証の困難さ

```typescript
// アルバム情報も変更される可能性
GET /albums/123 → キャッシュ
// その後、アルバムに新しいトラックが追加
// レーベル情報の更新
// 地域制限の変更
// → キャッシュは古い情報のまま
```

### 4. Tool によるキャッシュ制御

Tool として実装することで、常に最新のデータを返すことを保証：

```typescript
// Tool実装 - 常にフレッシュなデータ
handler: async (input) => {
  const album = await client.albums.get(input.albumId);
  // 必ず最新のデータを返す
  return { content: [{ type: "text", text: JSON.stringify(album) }] };
}
```

## Consequences

### Positive

1. **データの鮮度保証**: 常に最新の情報を提供
2. **実装の一貫性**: すべて Tool として統一的に実装
3. **明確な期待値**: クライアントは常に API 呼び出しが発生することを理解
4. **エラーハンドリング**: Result 型による一貫したエラー処理

### Negative

1. **パフォーマンス**: 毎回 API 呼び出しが発生
2. **レート制限**: Spotify API のレート制限により注意が必要

### Mitigation

パフォーマンスとレート制限の問題は、クライアント側で適切にキャッシュ戦略を実装することで対処可能。Tool の結果をクライアントが任意にキャッシュすることは可能。

## Examples

```typescript
// ❌ Resource として実装（不採用）
{
  uri: "/user/player/state",
  name: "Playback State",
  // キャッシュされると古い情報になる
}

// ✅ Tool として実装（採用）
{
  name: "get_playback_state",
  description: "Get current playback state",
  handler: async () => {
    // 常に最新の状態を取得
    const state = await client.player.getPlaybackState();
    return { content: [{ type: "text", text: JSON.stringify(state) }] };
  }
}
```

## Notes

将来的に Spotify が WebSocket API や Webhook を提供した場合、その時点で Resource パターンの採用を再検討する価値がある。しかし、現時点では Tool-only アプローチが最も適切である。