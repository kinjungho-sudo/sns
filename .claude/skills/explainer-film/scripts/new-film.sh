#!/usr/bin/env bash
# Scaffold a self-contained film project.  bash <skill>/scripts/new-film.sh <target-dir>
# Copies the template film (a finished 30 s example to rewrite), fonts, tools and a package.json, then installs Playwright.
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"; T="${1:?usage: new-film.sh <target-dir>}"
[ -e "$T/film.js" ] && { echo "✖ $T/film.js already exists; refusing to overwrite"; exit 1; }
mkdir -p "$T/tools"
cp -r "$SKILL/assets/template/." "$T/"
cp "$SKILL/scripts/"{server.mjs,render.mjs,check-video.mjs,narrate.mjs,build.sh,build-narrated.sh} "$T/tools/"
[ -f "$T/package.json" ] || cat > "$T/package.json" <<'JSON'
{
  "name": "explainer-film",
  "private": true,
  "type": "module",
  "scripts": {
    "preview": "node -e \"import('./tools/server.mjs').then(m=>m.createServer(process.cwd()).listen(8080,()=>console.log('http://localhost:8080/film.html')))\"",
    "film": "bash tools/build.sh",
    "check": "node tools/render.mjs contrast && node tools/render.mjs timing && node tools/render.mjs fit && node tools/render.mjs determinism",
    "narrated": "bash tools/build-narrated.sh"
  },
  "devDependencies": { "playwright": "^1.49.0" }
}
JSON
printf 'node_modules\nout/*.mp4\nout/*.wav\nout/*.json\nout/vo/\nout/motion/\n' > "$T/.gitignore"
(cd "$T" && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=${PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD:-1} npm install --silent >/dev/null 2>&1 && echo "✔ playwright installed") || echo "! npm install failed — run it in $T"
echo "✔ $T ready: edit film.js, then npm run check && npm run film"
