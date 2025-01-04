import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

export class Transcriber {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY環境変数が設定されていません');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.requestQueue = [];
    this.isProcessing = false;
  }

  /**
   * 音声ファイルを文字起こし
   * @param {string} audioFilePath 音声ファイルのパス
   * @returns {Promise<string>} 文字起こし結果
   */
  async transcribe(audioFilePath) {
    try {
      // ファイルの存在確認
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`ファイルが見つかりません: ${audioFilePath}`);
      }

      // 出力ファイル名の生成（タイムスタンプ付き）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const basename = path.basename(audioFilePath, '.wav');
      const outputPath = path.join(
        config.paths.transcripts,
        `${basename}-${timestamp}.txt`
      );

      console.log(`文字起こし開始: ${audioFilePath}`);
      console.log(`出力先: ${outputPath}`);

      // Whisper APIにリクエスト
      const response = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: 'whisper-1',
        response_format: 'text',
        temperature: 1.0,
        language: 'ja'
      });

      // 結果の取得と保存
      const transcription = response.trim();
      
      // 空の結果をスキップ
      if (!transcription) {
        console.log('空の文字起こし結果をスキップします');
        return '';
      }

      // 結果をファイルに保存
      fs.writeFileSync(outputPath, transcription, 'utf8');
      console.log(`文字起こし完了: ${outputPath}`);

      return transcription;

    } catch (error) {
      console.error('文字起こしエラー:', error);
      if (error.response) {
        console.error('API応答:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * 複数の音声ファイルを順次処理
   * @param {string[]} audioFilePaths 音声ファイルパスの配列
   * @returns {Promise<string[]>} 文字起こし結果の配列
   */
  async transcribeMultiple(audioFilePaths) {
    const results = [];
    
    for (const filePath of audioFilePaths) {
      try {
        const result = await this.transcribe(filePath);
        results.push(result);
      } catch (error) {
        console.error(`ファイル処理エラー: ${filePath}`, error);
        results.push(''); // エラー時は空文字を追加
      }
    }

    return results;
  }
}
