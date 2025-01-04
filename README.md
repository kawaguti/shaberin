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
une   - Discord Bot Token
   - OpenAI API Key

2. インストール
```bash
npm install
```

3. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、必要な値を設定します：

```bash
cp .env.example .env
```

`.env`ファイルを編集：
```env
# OpenAI API設定（必須）
OPENAI_API_KEY=your_api_key_here

# Discord設定（オプション）
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CHANNEL_ID=your_channel_id_here

# 音声設定（オプション - デフォルト値が設定されています）
AUDIO_DEVICE=CABLE Output (VB-Audio Virtual Cable)
```

## 使用方法

### 1. 音声録音テスト

VB-CABLEの設定が正しく行われているか確認するために、録音テストを実行できます：

```bash
npm run test:recorder
```

このコマンドは30秒間の録音を行い、`data/sound`ディレクトリに60秒ごとのWAVファイルを生成します。

### 2. マイク動作テスト

より基本的なマイクの動作テストを行うには：

```bash
npm run test:mic
```

このコマンドは10秒間の基本的な録音テストを実行し、音声データの受信を確認します。

### 3. 文字起こしテスト

録音した音声ファイルをWhisper APIで文字起こしするには：

```bash
npm run test:transcriber
```

このコマンドは`data/sound`ディレクトリ内のWAVファイルを処理し、結果を`data/transcripts`に保存します。

## 開発状況

- [x] プロジェクト構造の設定
- [x] 音声録音コンポーネント
- [x] Whisper API連携
- [ ] テキスト要約
- [ ] Discord投稿

## 使用手順

### 1. 音声の録音

```bash
# VB-CABLEの動作テスト（10秒）
npm run test:mic

# 音声録音（30秒）
npm run test:recorder
```

録音された音声ファイルは `data/sound` ディレクトリに保存されます。

### 2. 文字起こし

`.env`ファイルにOpenAI API Keyを設定した後：

```bash
# 文字起こしの実行
npm run transcribe
```

文字起こし結果は `data/transcripts` ディレクトリに保存されます。
各ファイルには録音時のタイムスタンプが付与され、前回の結果との混同を防ぎます。

## トラブルシューティング

### 録音デバイスの問題

- VB-CABLEが正しく認識されない場合は、Windowsの音声設定でデフォルトの入力デバイスを確認してください
- デバッグ情報を確認するには `npm run test:mic` を実行してください

### 文字起こしの問題

- OpenAI API Keyが正しく設定されているか確認してください
- 音声ファイルが正しく生成されているか確認してください
- エラーメッセージを確認し、必要に応じてリトライしてください

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
