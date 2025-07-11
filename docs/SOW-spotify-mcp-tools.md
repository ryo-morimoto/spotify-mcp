# Statement of Work (SOW) - Spotify MCP Tools 実装計画

## 1. プロジェクト概要

Spotify Web APIのすべての主要機能をMCP (Model Context Protocol) toolとして実装し、AIアシスタントがSpotifyのデータを操作できるようにする。

### 1.1 目的
- Spotify Web API TypeScript SDKが提供するすべてのエンドポイントをMCP toolとして実装
- 厳格なコーディング規約とt-wadaのTDDメソドロジーに従った開発
- toolごとにコミットを行い、段階的に機能を追加

### 1.2 現在の状況
- 既に`search-tracks` toolが実装済み
- OAuth認証フローが実装済み
- 基本的なアーキテクチャが確立済み

## 2. 技術要件

### 2.1 使用技術
- TypeScript (厳格モード)
- @spotify/web-api-ts-sdk
- @modelcontextprotocol/sdk
- neverthrow (Result型による例外フリー設計)
- Vitest (テスティングフレームワーク)
- Zod (スキーマバリデーション)

### 2.2 コーディング規約

#### 2.2.1 絶対原則
1. **KISS原則**: 可能な限りシンプルに
2. **YAGNI原則**: 現在必要な機能のみ実装
3. **Deep Module**: 狭いインターフェース、豊富な機能
4. **型駆動開発**: 型を先に設計、実装は後
5. **例外なし設計**: すべてResult<T, E>を使用

#### 2.2.2 ファイル構造
```
src/
├── mcp/
│   └── tools/
│       ├── searchTracks.ts (既存)
│       ├── searchAlbums.ts
│       ├── searchArtists.ts
│       ├── searchPlaylists.ts
│       ├── getTrack.ts
│       ├── getAlbum.ts
│       └── ... (各tool 1ファイル)
├── types.ts (すべての型定義)
└── index.ts
```

#### 2.2.3 命名規則
- ファイル名: `<lowerCamelCase>.ts`
- tool名: kebab-case (例: `search-tracks`)
- 関数名: `create<ToolName>Tool`

## 3. 実装計画

### 3.1 フェーズ1: 検索機能 (Search)
既存の`search-tracks`に加えて：
1. `search-albums` - アルバム検索
2. `search-artists` - アーティスト検索
3. `search-playlists` - プレイリスト検索
4. `search-shows` - ポッドキャスト番組検索
5. `search-episodes` - ポッドキャストエピソード検索
6. `search-audiobooks` - オーディオブック検索

### 3.2 フェーズ2: 取得機能 (Get)
1. `get-track` - トラック詳細取得
2. `get-album` - アルバム詳細取得
3. `get-artist` - アーティスト詳細取得
4. `get-playlist` - プレイリスト詳細取得
5. `get-album-tracks` - アルバムのトラックリスト
6. `get-artist-albums` - アーティストのアルバムリスト
7. `get-artist-top-tracks` - アーティストの人気トラック
8. `get-playlist-items` - プレイリストのアイテム

### 3.3 フェーズ3: ユーザー関連機能 (Current User)
1. `get-user-profile` - ユーザープロフィール取得
2. `get-user-playlists` - ユーザーのプレイリスト
3. `get-user-top-items` - ユーザーのトップアイテム
4. `get-user-saved-tracks` - 保存済みトラック
5. `get-user-saved-albums` - 保存済みアルバム
6. `save-tracks` - トラックを保存
7. `remove-saved-tracks` - 保存済みトラックを削除

### 3.4 フェーズ4: プレイリスト操作 (Playlist Management)
1. `create-playlist` - プレイリスト作成
2. `update-playlist` - プレイリスト更新
3. `add-playlist-items` - プレイリストにアイテム追加
4. `remove-playlist-items` - プレイリストからアイテム削除
5. `reorder-playlist-items` - プレイリストアイテムの順序変更

### 3.5 フェーズ5: ブラウズ機能 (Browse)
1. `get-categories` - カテゴリー一覧
2. `get-category-playlists` - カテゴリーのプレイリスト
3. `get-featured-playlists` - 注目プレイリスト
4. `get-new-releases` - 新着リリース
5. `get-recommendations` - レコメンデーション取得

### 3.6 フェーズ6: 再生制御 (Player) ※Premium必須
1. `get-playback-state` - 再生状態取得
2. `get-available-devices` - 利用可能デバイス
3. `transfer-playback` - 再生デバイス切替
4. `play` - 再生開始
5. `pause` - 一時停止
6. `skip-to-next` - 次の曲へ
7. `skip-to-previous` - 前の曲へ

### 3.7 対象外機能
以下の機能は2024年11月の制限により利用不可：
- Audio Features (楽曲特性分析)
- Audio Analysis (楽曲構造分析)
- Algorithmically created playlists

## 4. 開発プロセス

### 4.1 TDD サイクル (t-wada方式)
各toolの実装において：
1. **Red Phase**: 失敗するテストを書く
2. **Green Phase**: テストを通す最小限のコード
3. **Refactor Phase**: コードを改善

### 4.2 コミット戦略
- 各toolの実装完了時にコミット
- コミットメッセージは Conventional Commits 形式
- 例: `feat: add search-albums tool`

### 4.3 型定義プロセス
1. `types.ts`に必要な型を追加
2. Zodスキーマを定義
3. ハンドラー関数を実装
4. テストを追加

## 5. 品質基準

### 5.1 必須要件
- すべての関数がResult型を返す
- 例外をthrowしない
- 100%のテストカバレッジ (ハンドラー関数)
- `pnpm check`がすべてパス

### 5.2 コードレビューチェックリスト
- [ ] KISS原則に従っているか
- [ ] YAGNI原則に違反していないか
- [ ] Deep Moduleパターンを維持しているか
- [ ] 型が適切に定義されているか
- [ ] Result型で適切にエラーハンドリングしているか

## 6. 実装順序の根拠

1. **検索機能から開始**: 最も基本的で、他の機能の前提となる
2. **取得機能**: 検索結果の詳細を取得する自然な流れ
3. **ユーザー機能**: パーソナライズされた体験の提供
4. **プレイリスト操作**: より高度な操作
5. **ブラウズ機能**: 探索的な使用
6. **再生制御**: 最も複雑でPremiumが必要

## 7. リスクと対策

### 7.1 リスク
- API制限によるレート制限
- OAuth トークンの有効期限
- SDKの仕様変更

### 7.2 対策
- 適切なエラーハンドリング
- トークンの自動更新機能 (既に実装済み)
- SDKのバージョン固定

## 8. 成功の定義

- すべての主要なSpotify Web API機能がMCP toolとして利用可能
- 高品質で保守性の高いコード
- 包括的なテストカバレッジ
- 明確で一貫性のあるAPI設計

---

このSOWに従って、段階的かつ体系的にSpotify MCP toolsを実装していく。