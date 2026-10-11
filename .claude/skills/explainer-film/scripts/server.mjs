/* 로컬 정적 서버 — index.html 미리보기용 (폰트가 file:// 에서 막히는 문제 방지)
   실행: npm run serve  →  http://localhost:8080 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = process.cwd();
const PORT = process.env.PORT || 8080;
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".woff2": "font/woff2", ".png": "image/png",
  ".svg": "image/svg+xml", ".json": "application/json",
};

export function createServer(root = ROOT) {
  return http.createServer(async (req, res) => {
    try {
      let path = decodeURIComponent((req.url || "/").split("?")[0]);
      if (path === "/") path = "/index.html";
      const file = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ""));
      const data = await readFile(file);
      res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
      res.end(data);
    } catch {
      res.writeHead(404); res.end("Not found");
    }
  });
}

// 직접 실행된 경우에만 listen
if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(PORT, () =>
    console.log(`▶ http://localhost:${PORT}  (Ctrl+C 로 종료)`));
}
