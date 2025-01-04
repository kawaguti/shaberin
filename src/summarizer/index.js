import OpenAI from 'openai';
import { config } from '../config.js';

export class TextSummarizer {
    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey
        });
    }

    /**
     * テキストを要約する
     * @param {string} text - 要約する元のテキスト
     * @returns {Promise<string>} 要約されたテキスト
     */
    async summarize(text) {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "あなたは文章を要約する専門家です。与えられたテキストの重要なポイントを抽出し、簡潔に要約してください。"
                    },
                    {
                        role: "user",
                        content: `以下の文章を要約してください:\n\n${text}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('テキスト要約中にエラーが発生しました:', error);
            throw error;
        }
    }

    /**
     * テキストから重要なキーワードを抽出する
     * @param {string} text - キーワードを抽出する元のテキスト
     * @param {number} [count=5] - 抽出するキーワードの数
     * @returns {Promise<string[]>} 抽出されたキーワードの配列
     */
    async extractKeywords(text, count = 5) {
        try {
            // 単語の重要度を計算
            const words = text.match(/[一-龯ぁ-んァ-ヶａ-ｚＡ-Ｚ０-９a-zA-Z0-9]+/g) || [];
            const wordStats = new Map();
            
            words.forEach(word => {
                if (word.length > 1) {
                    const currentStats = wordStats.get(word) || { count: 0, positions: [] };
                    currentStats.count++;
                    currentStats.positions.push(words.indexOf(word));
                    wordStats.set(word, currentStats);
                }
            });
            
            // スコアの計算（出現頻度と分散を考慮）
            const wordScores = Array.from(wordStats.entries()).map(([word, stats]) => {
                const frequency = stats.count;
                const positions = stats.positions;
                const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length;
                const distribution = Math.sqrt(
                    positions.reduce((sum, pos) => sum + Math.pow(pos - avgPosition, 2), 0) / positions.length
                );
                
                // スコア = 頻度 * (1 + 分散の正規化)
                const score = frequency * (1 + 1 / (1 + distribution));
                return { word, score };
            });
            
            // スコアで降順ソートし、上位のキーワードを返す
            return wordScores
                .sort((a, b) => b.score - a.score)
                .slice(0, count)
                .map(item => item.word);
        } catch (error) {
            console.error('キーワード抽出中にエラーが発生しました:', error);
            throw error;
        }
    }
}
