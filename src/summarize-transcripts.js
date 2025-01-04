import fs from 'fs/promises';
import path from 'path';
import { TextSummarizer } from './summarizer/index.js';

async function summarizeTranscripts() {
    try {
        const summarizer = new TextSummarizer();
        const transcriptsDir = 'data/transcripts';
        const summaryDir = 'data/summary';

        // transcriptsディレクトリ内のファイル一覧を取得
        const files = await fs.readdir(transcriptsDir);
        console.log(`${files.length}個のファイルを処理します...`);

        // 全てのテキストファイルの内容を収集
        const allContents = [];
        for (const file of files) {
            if (file.endsWith('.txt')) {
                console.log(`読み込み中: ${file}`);
                const content = await fs.readFile(path.join(transcriptsDir, file), 'utf-8');
                allContents.push({
                    filename: file,
                    content: content
                });
            }
        }

        if (allContents.length === 0) {
            console.log('処理対象のファイルが見つかりませんでした。');
            return;
        }

        // 時系列順にソート
        allContents.sort((a, b) => {
            const timeA = a.filename.match(/\d+/);
            const timeB = b.filename.match(/\d+/);
            return (timeA && timeB) ? Number(timeA[0]) - Number(timeB[0]) : 0;
        });

        // 全てのコンテンツをまとめる
        const combinedText = allContents.map(item => item.content).join('\n');

        // まとめたテキストを要約
        console.log('\nテキストを要約中...');
        const summary = await summarizer.summarize(combinedText);

        // Discord用に整形
        const result = summary;

        // タイムスタンプを含むファイル名を生成
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const summaryFile = path.join(summaryDir, `combined_summary_${timestamp}.txt`);
        
        // 結果をファイルに保存
        await fs.writeFile(summaryFile, result, 'utf-8');
        console.log(`\n要約を保存しました: ${summaryFile}`);
        
    } catch (error) {
        console.error('エラーが発生しました:', error);
    }
}

summarizeTranscripts();
