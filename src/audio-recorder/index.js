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
  }

  start() {
    if (this.isRecording) {
      console.warn('録音は既に開始されています');
      return;
    }

    try {
      console.log('録音を開始します...');
      console.log('使用するデバイス:', config.audio.device);
      
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
    console.log('録音設定:', {
      rate: config.audio.sampleRate,
      channels: config.audio.channels,
      device: config.audio.device,
      encoding: config.audio.encoding,
      bitwidth: config.audio.bitDepth,
      fileType: config.audio.fileFormat,
    });

    this.recorder = new mic({
      rate: config.audio.sampleRate,
      channels: config.audio.channels,
      device: config.audio.device,
      encoding: config.audio.encoding,
      bitwidth: config.audio.bitDepth,
      fileType: config.audio.fileFormat,
    });

    const outputStream = fs.createWriteStream(this.currentFile, { flags: 'w' });
    const inputStream = this.recorder.getAudioStream();

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
      console.log('録音ストリームが正常に開始されました');
    });

    inputStream.on('stopComplete', () => {
      console.log('録音ストリームが正常に停止しました');
    });

    inputStream.on('processExitComplete', () => {
      console.log('録音プロセスが終了しました');
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
