import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse): VercelResponse {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const path = req.url?.split("?")[0] || "";

  // Health check
  if (path === "/api/health" || path === "/api") {
    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(404).json({ message: "Not found" });
}
