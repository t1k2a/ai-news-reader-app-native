import { AI_RSS_FEEDS } from '../../lib/rss-feed.js';
import RssParser from 'rss-parser';
const Parser = RssParser as any;
const parser = new Parser({ headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });

let total = 0;
for (const feed of AI_RSS_FEEDS) {
  try {
    const result = await parser.parseURL(feed.url);
    const count = result.items.length;
    total += Math.min(count, 5);
    console.log(`✅ ${feed.name}: ${count} items`);
  } catch(e: any) {
    console.log(`❌ ${feed.name}: ${e.message?.slice(0, 60)}`);
  }
}
console.log(`\n合計（最大5件/フィード）: 最大 ${total} 件`);
console.log(`登録フィード数: ${AI_RSS_FEEDS.length}`);
