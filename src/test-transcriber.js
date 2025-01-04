import { Transcriber } from './transcriber/index.js';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';

async function testTranscriber() {
  console.log('=== Whisper API 文字起こしテスト ===');

  try {
    // 出力ディレクトリの確認
    if (!fs.existsSync(config.paths.transcripts)) {
      console.log(`ディレクトリを作成: ${config.paths.transcripts}`);
      fs.mkdirSync(config.paths.transcripts, { recursive: true });
    }

    // 音声ファイルの検索
    const audioFiles = fs.readdirSync(config.paths.audio)
      .filter(file => file.endsWith('.wav'))
      .map(file => path.join(config.paths.audio, file))
      .sort((a, b) => {
        const statsA = fs.statSync(a);
        const statsB = fs.statSync(b);
        return statsB.mtimeMs - statsA.mtimeMs;
      });

    if (audioFiles.length === 0) {
      console.log('処理対象の音声ファイルが見つかりません');
      console.log(`確認するディレクトリ: ${config.paths.audio}`);
      return;
    }

    console.log('\n処理対象ファイル:');
    audioFiles.forEach(file => {
      const stats = fs.statSync(file);
      console.log(`- ${path.basename(file)}`);
      console.log(`  サイズ: ${Math.round(stats.size / 1024)} KB`);
      console.log(`  更新: ${stats.mtime.toLocaleString()}`);
    });

    // Whisper APIクライアントの初期化
    const transcriber = new Transcriber();

    // 文字起こしの実行
    console.log('\n文字起こし処理を開始します...');
    const results = await transcriber.transcribeMultiple(audioFiles);

    // 結果の表示
    console.log('\n=== 処理結果 ===');
    results.forEach((text, index) => {
      if (text) {
        console.log(`\n[${path.basename(audioFiles[index])}]`);
        console.log(text);
      } else {
        console.log(`\n[${path.basename(audioFiles[index])}]`);
        console.log('(文字起こし結果なし)');
      }
    });

    console.log('\n=== テスト完了 ===');

  } catch (error) {
    console.error('\n=== テストエラー ===');
    console.error('エラーの詳細:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    process.exit(1);
  }
}

// テスト実行
console.log('Node.jsバージョン:', process.version);
testTranscriber();
