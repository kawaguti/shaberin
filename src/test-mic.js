import mic from 'node-mic';

// 最小限の設定でマイクテスト
const recorder = new mic({
  rate: '16000',
  channels: '1',
  debug: true,
  exitOnSilence: 6
});

const micInputStream = recorder.getAudioStream();

micInputStream.on('data', (data) => {
  console.log('音声データを受信: ' + data.length + ' bytes');
});

micInputStream.on('error', (err) => {
  console.error('エラーが発生しました:', err);
});

micInputStream.on('startComplete', () => {
  console.log('録音開始完了');
});

micInputStream.on('stopComplete', () => {
  console.log('録音停止完了');
  process.exit(0);
});

micInputStream.on('processExitComplete', () => {
  console.log('録音プロセス終了');
});

console.log('録音を開始します...');
recorder.start();

// 10秒後に停止
setTimeout(() => {
  console.log('録音を停止します...');
  recorder.stop();
}, 10000);
