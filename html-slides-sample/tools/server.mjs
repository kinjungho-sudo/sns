// 검사·영상 렌더용 정적 서버 (슬라이드 자체는 서버 없이도 열린다)
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".woff2": "font/woff2", ".mp4": "video/mp4", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };
export function serve(root, port = 0) {
  const srv = http.createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
    const file = normalize(join(root, p)); if (!file.startsWith(normalize(root))) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(file), type = MIME[extname(file)] || "application/octet-stream";
      const range = req.headers.range?.match(/bytes=(\d+)-(\d*)/);   // 영상 탐색용
      if (range) { const s = +range[1], e = range[2] ? +range[2] : body.length - 1;
        res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${s}-${e}/${body.length}`, "Accept-Ranges": "bytes", "Content-Length": e - s + 1 }); res.end(body.subarray(s, e + 1)); }
      else { res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-store" }); res.end(body); }
    } catch { res.writeHead(404).end("not found"); }
  });
  return new Promise((ok) => srv.listen(port, "127.0.0.1", () => ok({ srv, url: `http://127.0.0.1:${srv.address().port}` })));
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const { url } = await serve(new URL("..", import.meta.url).pathname, +(process.env.PORT || 8080));
  console.log(`▶ ${url}/index.html`);
}
