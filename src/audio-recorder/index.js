import mic from 'node-mic';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

export class AudioRecorder {
  constructor() {
    this.isRecording = false;
    this.currentFile = null;
    this.startTime = null;
    this.recorder = null;
    this.currentDevice = null;
  }

  // 利用可能なデバイスを試行
  async tryDevices() {
    console.log('\n=== デバイス検出を開始 ===');
    
    for (const device of config.audio.devices) {
      try {
        console.log(`\nデバイスを試行: ${device}`);
        console.log('初期化設定:', {
          rate: config.audio.sampleRate,
          channels: config.audio.channels,
          encoding: config.audio.encoding,
          bitwidth: config.audio.bitDepth
        });

        // まずレコーダーを初期化
        const recorder = new mic({
          debug: true,
          rate: config.audio.sampleRate,
          channels: config.audio.channels,
          device: device,
          encoding: config.audio.encoding,
          bitwidth: config.audio.bitDepth,
          fileType: config.audio.fileFormat,
        });

        console.log('レコーダーを初期化しました');

        // 次にストリームを取得
        console.log('音声ストリームを取得中...');
        const testStream = recorder.getAudioStream();
        
        // ストリームのイベントをテスト
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('デバイスの応答がありません'));
          }, 3000);

          testStream.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });

          testStream.once('data', () => {
            clearTimeout(timeout);
            resolve();
          });

          // テスト録音を開始
          recorder.start();
        });

        // 成功したデバイスを記録
        this.currentDevice = device;
        console.log(`✓ デバイス ${device} が正常に動作することを確認`);
        
        // クリーンアップ
        recorder.stop();
        testStream.destroy();
        
        return true;
      } catch (error) {
        console.log(`✗ デバイス ${device} は使用できません:`, error.message);
        if (error.stack) {
          console.log('エラーの詳細:', error.stack);
        }
      }
    }

    console.log('\n✗ 利用可能なデバイスが見つかりませんでした');
    return false;
  }

  async start() {
    if (this.isRecording) {
      console.warn('録音は既に開始されています');
      return;
    }

    try {
      console.log('\n=== 録音デバイスの初期化 ===');
      
      // 利用可能なデバイスを探す
      const deviceFound = await this.tryDevices();
      if (!deviceFound) {
        throw new Error('利用可能な録音デバイスが見つかりません');
      }

      console.log('\n録音を開始します...');
      console.log('使用するデバイス:', this.currentDevice);
      
      this.isRecording = true;
      this.startTime = Date.now();
      this.setupRecorder();
    } catch (error) {
      console.error('録音の開始に失敗しました:', error);
      this.isRecording = false;
      throw error;
    }
  }

  stop() {
    if (!this.isRecording) {
      console.warn('録音は既に停止しています');
      return;
    }

    this.isRecording = false;
    if (this.recorder) {
      this.recorder.stop();
    }
  }

  setupRecorder() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.currentFile = path.join(config.paths.audio, `audio-${timestamp}.wav`);

    // 録音設定
    console.log('\n=== 録音設定 ===');
    console.log('選択されたデバイス:', {
      name: this.currentDevice,
      type: 'input',
      isDefault: this.currentDevice === 'default'
    });
    console.log('録音パラメータ:', {
      rate: config.audio.sampleRate,
      channels: config.audio.channels,
      encoding: config.audio.encoding,
      bitwidth: config.audio.bitDepth,
      fileType: config.audio.fileFormat,
    });
    console.log('出力ファイル:', this.currentFile);

    this.recorder = new mic({
      debug: true,  // デバッグモードを有効化
      rate: config.audio.sampleRate,
      channels: config.audio.channels,
      device: this.currentDevice,
      encoding: config.audio.encoding,
      bitwidth: config.audio.bitDepth,
      fileType: config.audio.fileFormat,
    });

    const outputStream = fs.createWriteStream(this.currentFile, { flags: 'w' });
    const inputStream = this.recorder.getAudioStream();

    // データ受信の監視
    let totalBytes = 0;
    let lastLogTime = Date.now();
    
    inputStream.on('data', (data) => {
      totalBytes += data.length;
      const now = Date.now();
      
      // 1秒ごとにログを出力
      if (now - lastLogTime >= 1000) {
        console.log(`音声データ受信中... (${Math.round(totalBytes / 1024)} KB)`);
        lastLogTime = now;
        totalBytes = 0;
      }
    });

    // エラーハンドリング
    inputStream.on('error', error => {
      console.error('録音エラー:', error);
      console.error('エラーの詳細:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      this.stop();
    });

    outputStream.on('error', error => {
      console.error('ファイル書き込みエラー:', error);
      console.error('エラーの詳細:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      this.stop();
    });

    // 録音ストリームの状態監視
    inputStream.on('startComplete', () => {
      console.log('\n=== 録音開始完了 ===');
      console.log('出力ファイル:', this.currentFile);
      console.log('開始時刻:', new Date().toLocaleString());
    });

    inputStream.on('stopComplete', () => {
      console.log('録音ストリームが正常に停止しました');
    });

    inputStream.on('processExitComplete', () => {
      console.log('\n=== 録音プロセス終了 ===');
      const endTime = new Date();
      console.log('終了時刻:', endTime.toLocaleString());
      if (this.startTime) {
        const duration = (endTime - this.startTime) / 1000;
        console.log('録音時間:', duration.toFixed(1), '秒');
      }
    });

    // 60秒ごとに新しいファイルを作成
    const intervalId = setInterval(() => {
      if (!this.isRecording) {
        clearInterval(intervalId);
        return;
      }

      // 現在のファイルを閉じる
      outputStream.end();

      // 新しいファイルの準備
      this.setupRecorder();
    }, config.audio.duration * 1000);

    // 録音ストリームをファイルに書き込む
    inputStream.pipe(outputStream);

    // 録音開始
    this.recorder.start();
  }
}

// 使用例
// const recorder = new AudioRecorder();
// recorder.start();
// 
// // 録音停止（必要な時に）
// // recorder.stop();
