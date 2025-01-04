# Shaberin

音声を文字起こしてDiscordに投稿するツール

## 機能

- VB-CABLEからの音声録音
- Whisper APIによる文字起こし
- テキスト要約
- Discordへの投稿

## セットアップ

1. 必要なソフトウェア
   - Node.js
   - VB-CABLE Virtual Audio Device
   - Discord Bot Token
   - OpenAI API Key

2. インストール
```bash
npm install
```

3. 環境変数の設定
```bash
# OpenAI API Key
export OPENAI_API_KEY=your_api_key

# Discord設定
export DISCORD_BOT_TOKEN=your_bot_token
export DISCORD_CHANNEL_ID=your_channel_id
```

## 使用方法

### 音声録音テスト

VB-CABLEの設定が正しく行われているか確認するために、録音テストを実行できます：

```bash
npm run test:recorder
```

このコマンドは2分間の録音を行い、`data/sound`ディレクトリに60秒ごとのWAVファイルを生成します。

## 開発状況

- [x] プロジェクト構造の設定
- [x] 音声録音コンポーネント
- [ ] Whisper API連携
- [ ] テキスト要約
- [ ] Discord投稿

## ディレクトリ構造

```
shaberin/
  ├── src/
  │   ├── audio-recorder/     # 音声録音
  │   ├── transcriber/        # Whisper API
  │   ├── summarizer/         # テキスト要約
  │   └── discord-poster/     # Discord投稿
  ├── data/
  │   ├── sound/             # 音声ファイル
  │   └── transcripts/       # 文字起こし結果
  └── tests/                 # テスト
