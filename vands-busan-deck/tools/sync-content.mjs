// content.json → js/content.js 사본.
// 브라우저는 더블클릭(file://)으로 연 페이지에서 content.json을 읽지 못하게 막는다.
// 그래서 같은 내용을 스크립트로 한 번 더 두고, content.json을 고친 뒤 이 명령으로 맞춘다.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const data = JSON.parse(readFileSync(root + "content.json", "utf8"));   // 형식이 틀리면 여기서 멈춘다
writeFileSync(root + "js/content.js",
  "/* 자동 생성: content.json의 사본 (더블클릭으로 열 때 사용). 직접 고치지 말고 content.json을 고친 뒤 node tools/sync-content.mjs */\n" +
  "window.CONTENT_FALLBACK = " + JSON.stringify(data, null, 2) + ";\n");
console.log("✔ js/content.js ← content.json");
