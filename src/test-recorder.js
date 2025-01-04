import { AudioRecorder } from './audio-recorder/index.js';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';

process.on('unhandledRejection', (error) => {
  console.error('未処理のPromise拒否:', error);
  process.exit(1);
});

// 録音テスト用の関数
async function testRecording() {
  console.log('=== 録音テストを開始します ===');
  console.log('設定情報:', config.audio);
  
  // 保存ディレクトリの確認と作成
  if (!fs.existsSync(config.paths.audio)) {
    console.log(`ディレクトリを作成: ${config.paths.audio}`);
    fs.mkdirSync(config.paths.audio, { recursive: true });
  }

  const recorder = new AudioRecorder();
  
  try {
    // 録音開始
    console.log('\n録音を開始します...');
    recorder.start();

    // 30秒後に録音を停止
    await new Promise((resolve) => {
      setTimeout(() => {
        console.log('\n録音を停止します...');
        recorder.stop();
        resolve();
      }, 30000); // 30秒
    });

    // 生成されたファイルを確認
    console.log('\n=== 生成されたファイルの確認 ===');
    const files = fs.readdirSync(config.paths.audio)
      .filter(file => file.endsWith('.wav'))
      .sort((a, b) => {
        const statsA = fs.statSync(path.join(config.paths.audio, a));
        const statsB = fs.statSync(path.join(config.paths.audio, b));
        return statsB.mtimeMs - statsA.mtimeMs;
      });

    if (files.length === 0) {
      console.log('警告: 音声ファイルが生成されませんでした');
    } else {
      console.log('生成された音声ファイル:');
      files.forEach(file => {
        const filePath = path.join(config.paths.audio, file);
        const stats = fs.statSync(filePath);
        console.log(`- ${file}`);
        console.log(`  サイズ: ${Math.round(stats.size / 1024)} KB`);
        console.log(`  作成時刻: ${stats.mtime.toLocaleString()}`);
      });
    }

    console.log('\n=== テスト完了 ===');
    process.exit(0);
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
testRecording();
