export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  discord: {
    token: process.env.DISCORD_BOT_TOKEN,
    channelId: process.env.DISCORD_CHANNEL_ID,
  },
  audio: {
    device: 'CABLE Output (VB-Audio Virtual Cable)',  // VB-Cableの入力デバイス名
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
