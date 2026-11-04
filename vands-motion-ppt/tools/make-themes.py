#!/usr/bin/env python3
"""보라색 원본(style.css, motion/*.html, motion/base.css)에서 테마별 사본을 만든다.

    python3 tools/make-themes.py

색을 하나씩 손으로 바꾸지 않고, 원본 색의 밝기·채도와 쓰임(글자색인지 바탕·테두리인지)을 보고
테마의 색상(hue)으로 옮긴다. 원본 화면의 명암 관계가 그대로 유지된다.
- 어두운 테마(noir): 밝기는 그대로, 색만 샴페인 골드로.
- 밝은 테마(ivory, blush): 어두운 바탕은 밝은 바탕으로, 밝은 글자는 어두운 글자로 뒤집고,
  흰 카드와 종이는 그대로 밝게 둔다.
결과: themes/<테마>.css, motion/<이름>.<테마>.html, motion/base.<테마>.css
"""
import colorsys, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

THEMES = {
    # 이름: (종류, 색상 hue 0-360, 강조 채도, 설명)
    "noir":  ("dark",  40, .58, "블랙 · 샴페인 골드"),
    "ivory": ("light", 36, .42, "아이보리 · 골드"),
    "blush": ("light", 12, .38, "누드 · 로즈골드"),
}

HEX = re.compile(r"#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")


def parse(h):
    if len(h) == 3: h = "".join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    a = h[6:8] if len(h) == 8 else ""
    return r, g, b, a


def fmt(r, g, b, a):
    return "#" + "".join(f"{round(max(0, min(1, x)) * 255):02x}" for x in (r, g, b)) + a


def remap(hexv, kind, hue, sat, role):
    """role: 'text' (글자) 또는 'surface' (바탕·테두리·그림자·선)"""
    r, g, b, a = parse(hexv)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    H = hue / 360
    if kind == "dark":
        if s < .08: return fmt(r, g, b, a)                      # 무채색은 그대로
        s2 = min(s, .14) if l < .2 else min(s * .62, sat)       # 아주 어두운 바탕은 따뜻한 차콜
        return fmt(*colorsys.hls_to_rgb(H if l >= .2 else 30 / 360, l, s2), a)
    # 밝은 테마
    if role == "text":
        if l >= .7:   l2, s2 = .12 + (1 - l) * .9, .18          # 어두운 바탕용 밝은 글자 → 진한 글자
        elif l >= .4: l2, s2 = .30 + (l - .4) * .25, min(.5, sat + .05)   # 강조 글자 → 진한 골드·로즈
        else:         l2, s2 = min(l, .25), .18                 # 흰 카드 위 진한 글자는 그대로 진하게
    else:
        if l < .4:    l2, s2 = .975 - l * .32, .30 if l < .2 else .34     # 어두운 바탕 → 밝은 바탕
        elif l < .8:  l2, s2 = .55 + (l - .4) * .25, sat         # 강조 바탕·테두리 → 샴페인 톤
        else:         l2, s2 = l, s * .3                         # 흰 카드·종이 → 그대로 밝게
        if s < .08 and l >= .8: return fmt(r, g, b, a)
    return fmt(*colorsys.hls_to_rgb(H, l2, s2), a)


TEXT_PROPS = {"color", "fill", "--ink", "--muted", "--accent-ink", "--paper-ink", "caret-color"}


def theme_css(css, kind, hue, sat):
    # var(--accent)를 글자색으로 쓰는 곳은 --accent-ink로 분리 (밝은 테마에서 글자는 더 진해야 하므로)
    css = re.sub(r"(?<![-\w])color:(\s*)var\(--accent\)", r"color:\1var(--accent-ink)", css)
    if "--accent-ink" not in css.split("}")[0]:
        css = css.replace("--accent:", "--accent-ink:#b77aff;--accent:", 1)

    def decl(m):
        prop, val = m.group(1), m.group(2)
        role = "text" if prop.strip() in TEXT_PROPS else "surface"
        return prop + ":" + HEX.sub(lambda c: remap(c.group(1), kind, hue, sat, role), val)
    # 선언 단위(속성:값)로 바꿔 글자색과 바탕색을 구분
    return re.sub(r"([-\w]+)\s*:\s*([^;{}]+)", lambda m: decl(m) if HEX.search(m.group(2)) else m.group(0), css)


def theme_motion_html(html, kind, hue, sat, theme):
    # <style> 안은 CSS 규칙대로, 나머지(스크립트 문자열·인라인 style)는 바탕 규칙으로
    def style_block(m): return m.group(1) + theme_css(m.group(2), kind, hue, sat) + m.group(3)
    html = re.sub(r"(<style>)(.*?)(</style>)", style_block, html, flags=re.S)
    parts = re.split(r"(<style>.*?</style>)", html, flags=re.S)
    def other(p):
        # SVG 속성 stroke/fill 은 글자처럼(아이콘 선이 바탕과 섞이지 않게), 나머지 색은 바탕 규칙
        p = re.sub(r'((?:stroke|fill)=")(#[0-9a-fA-F]{3,8})(")', lambda m: m.group(1) + remap(m.group(2)[1:], kind, hue, sat, "text") + m.group(3), p)
        return re.sub(r'(?<![-\w])(?<!stroke=")(?<!fill=")#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b', lambda c: remap(c.group(1), kind, hue, sat, "surface"), p)
    parts = [p if p.startswith("<style>") else other(p) for p in parts]
    html = "".join(parts)
    return html.replace('href="base.css"', f'href="base.{theme}.css"')


def main():
    os.makedirs(os.path.join(ROOT, "themes"), exist_ok=True)
    src = open(os.path.join(ROOT, "style.css"), encoding="utf-8").read()
    base = open(os.path.join(ROOT, "motion/base.css"), encoding="utf-8").read()
    motions = [f for f in os.listdir(os.path.join(ROOT, "motion")) if f.endswith(".html") and f.count(".") == 1]
    for name, (kind, hue, sat, label) in THEMES.items():
        out = f"/* 자동 생성: tools/make-themes.py · 테마 {name} ({label}). 직접 고치지 말고 style.css를 고친 뒤 다시 실행 */\n"
        css = theme_css(src, kind, hue, sat)
        css = css.replace('url("assets/', 'url("../assets/')        # themes/ 폴더 기준 경로
        open(os.path.join(ROOT, f"themes/{name}.css"), "w", encoding="utf-8").write(out + css)
        open(os.path.join(ROOT, f"motion/base.{name}.css"), "w", encoding="utf-8").write(out + theme_css(base, kind, hue, sat))
        for f in motions:
            html = open(os.path.join(ROOT, "motion", f), encoding="utf-8").read()
            open(os.path.join(ROOT, "motion", f.replace(".html", f".{name}.html")), "w", encoding="utf-8").write(theme_motion_html(html, kind, hue, sat, name))
        print(f"✔ {name}: themes/{name}.css, motion/base.{name}.css, " + ", ".join(f.replace(".html", f".{name}.html") for f in motions))


if __name__ == "__main__":
    main()
