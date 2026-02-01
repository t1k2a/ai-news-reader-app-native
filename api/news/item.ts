import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchAllFeeds } from "../../lib/rss-feed";

function setCorsHeaders(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const idParam = req.query.id;
    if (!idParam || typeof idParam !== "string") {
      return res.status(400).json({ message: "記事IDが指定されていません" });
    }

    const decodedId = decodeURIComponent(idParam);
    const newsItems = await fetchAllFeeds();
    const target = newsItems.find((item): boolean => {
      return item.id === decodedId;
    });

    if (!target) {
      return res.status(404).json({ message: "記事が見つかりませんでした" });
    }

    return res.status(200).json(target);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
