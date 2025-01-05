import mic from 'node-mic';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { config, API_BASE_URL } from '../config.js';

export class AudioRecorder {
  constructor() {
    this.isRecording = false;
    this.currentFile = null;
    this.startTime = null;
    this.recorder = null;
    this.currentDevice = null;
    this.isUploading = false;
    this.lastUploadError = null;
    this.currentInputStream = null;
    this.currentOutputStream = null;
    this.currentInterval = null;
  }

  async uploadFile(filePath) {
    this.isUploading = true;
    this.lastUploadError = null;

    try {
      console.log(`\nファイルをアップロード中: ${filePath}`);
      const formData = new FormData();
      const fileStream = fs.createReadStream(filePath);
      
      // ファイルストリームのエラーハンドリング
      fileStream.on('error', (error) => {
        throw new Error(`ファイル読み込みエラー: ${error.message}`);
      });

      formData.append('file', fileStream, {
        filename: path.basename(filePath),
        contentType: 'audio/wav',
        knownLength: fs.statSync(filePath).size
      });

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '詳細なエラー情報を取得できませんでした');
        throw new Error(`アップロードエラー: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const result = await response.json();
      console.log('アップロード成功:', result);
      return result;
    } catch (error) {
      this.lastUploadError = error;
      console.error('アップロードエラー:', error);
      throw error;
    } finally {
      this.isUploading = false;
    }
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
    // クリーンアップ用の変数
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
    }
    if (this.currentInputStream) {
      this.currentInputStream.removeAllListeners();
      this.currentInputStream.destroy();
    }
    if (this.currentOutputStream) {
      this.currentOutputStream.removeAllListeners();
      this.currentOutputStream.end();
    }

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

    this.currentOutputStream = fs.createWriteStream(this.currentFile, { flags: 'w' });
    this.currentInputStream = this.recorder.getAudioStream();

    // データ受信の監視
    let totalBytes = 0;
    let fileBytes = 0;
    let lastLogTime = Date.now();
    
    const createNewRecording = async () => {
      // 現在のファイルパスを保存
      const completedFile = this.currentFile;

      // 現在のストリームを適切にクローズ
      if (this.currentOutputStream) {
        this.currentOutputStream.end();
        // ストリームが完全に閉じられるのを待つ
        await new Promise(resolve => {
          const finishHandler = () => {
            this.currentOutputStream.removeListener('finish', finishHandler);
            resolve();
          };
          this.currentOutputStream.once('finish', finishHandler);
        });
        
        // ファイルをアップロード
        try {
          await this.uploadFile(completedFile);
        } catch (error) {
          console.error('ファイルのアップロードに失敗しました:', error);
        }
      }

      if (this.recorder) {
        this.recorder.stop();
      }

      // 少し待ってから新しいレコーダーをセットアップ
      setTimeout(() => {
        if (this.isRecording) {
          this.setupRecorder();
        }
      }, 100);
    };
    
    this.currentInputStream.on('data', async (data) => {
      if (!this.isRecording) return;
      
      totalBytes += data.length;
      fileBytes += data.length;
      const now = Date.now();
      
      // 1秒ごとにログを出力
      if (now - lastLogTime >= 1000) {
        process.stdout.write(`\r音声データ受信中 (${Math.round(totalBytes / 1024)} KB)`);
        lastLogTime = now;
        totalBytes = 0;
      } else {
        process.stdout.write('.');
      }

      // ファイルサイズが制限に達した場合、新しいファイルを作成
      if (fileBytes >= config.audio.maxFileSize) {
        console.log(`ファイルサイズが制限(${config.audio.maxFileSize / 1024 / 1024}MB)に達しました。新しいファイルを作成します。`);
        await createNewRecording();
        fileBytes = 0;
      }
    });

    // エラーハンドリング
    this.currentInputStream.on('error', error => {
      console.error('録音エラー:', error);
      console.error('エラーの詳細:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      this.stop();
    });

    this.currentOutputStream.on('error', error => {
      console.error('ファイル書き込みエラー:', error);
      console.error('エラーの詳細:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      this.stop();
    });

    // 録音ストリームの状態監視
    this.currentInputStream.on('startComplete', () => {
      console.log('\n=== 録音開始完了 ===');
      console.log('出力ファイル:', this.currentFile);
      console.log('開始時刻:', new Date().toLocaleString());
    });

    this.currentInputStream.on('stopComplete', () => {
      console.log('録音ストリームが正常に停止しました');
    });

    this.currentInputStream.on('processExitComplete', async () => {
      console.log('\n=== 録音プロセス終了 ===');
      const endTime = new Date();
      console.log('終了時刻:', endTime.toLocaleString());
      if (this.startTime) {
        const duration = (endTime - this.startTime) / 1000;
        console.log('録音時間:', duration.toFixed(1), '秒');
      }

      // ファイルをアップロード
      if (this.currentFile) {
        try {
          await this.uploadFile(this.currentFile);
        } catch (error) {
          console.error('ファイルのアップロードに失敗しました:', error);
        }
      }
    });

    // 30秒ごとに新しいファイルを作成
    this.currentInterval = setInterval(async () => {
      if (!this.isRecording) {
        clearInterval(this.currentInterval);
        return;
      }

      console.log('30秒経過しました。新しいファイルを作成します。');
      await createNewRecording();
    }, config.audio.duration * 1000);

    // 録音ストリームをファイルに書き込む
    this.currentInputStream.pipe(this.currentOutputStream);

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
