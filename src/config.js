import 'dotenv/config';

// 環境変数の存在確認
if (!process.env.OPENAI_API_KEY) {
  console.warn('警告: OPENAI_API_KEYが設定されていません');
}

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    channelId: process.env.DISCORD_CHANNEL_ID,
  },
  audio: {
    // 環境変数から設定を読み込み、デフォルト値にフォールバック
    devices: [
      process.env.AUDIO_DEVICE || 'CABLE Output (VB-Audio Virtual Cable)',  // 環境変数から
      'CABLE Output',                                                       // 短縮名称
      'VB-Audio Virtual Cable',                                            // 代替名称
      'Microsoft Sound Mapper - Input',                                    // Windows デフォルト入力
      'default'                                                            // 最終フォールバック
    ],
    device: process.env.AUDIO_DEVICE || 'CABLE Output (VB-Audio Virtual Cable)',
    sampleRate: 16000,   // Whisper APIに最適な設定
    channels: 1,         // モノラル
    encoding: 'signed-integer',
    bitDepth: 16,
    fileFormat: 'wav',
    duration: 60,        // 60秒ごとに区切る
  },
  paths: {
    audio: 'data/sound',
    transcripts: 'data/transcripts',
  }
};
