import { AudioRecorder } from './audio-recorder/index.js';

console.log('録音を開始します。Ctrl+Cで停止します。');

const recorder = new AudioRecorder();

// Ctrl+C で停止した時の処理
process.on('SIGINT', () => {
  console.log('\n録音を停止します...');
  recorder.stop();
  // 少し待ってからプロセスを終了（アップロードを完了させるため）
  setTimeout(() => {
    process.exit(0);
  }, 2000);
});

try {
  await recorder.start();
} catch (error) {
  console.error('エラーが発生しました:', error);
  process.exit(1);
}
