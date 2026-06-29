// 단일 소스(content/*.md) → 정적 사이트(docs/index.html) 빌드
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const CONTENT = path.join(ROOT, "content");
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "docs");

const ORDER = [
  "00-overview.md", "01-classification.md", "02-attribute-schema.md",
  "03-attribute-extraction.md", "04-evaluation-qa.md", "05-cost-model.md", "06-ai-usage.md",
  "07-references.md",
];

const md = new MarkdownIt({ html: true, linkify: true, breaks: false });

// ---- read + render ----
let raw = ORDER.map((f) => fs.readFileSync(path.join(CONTENT, f), "utf8")).join("\n\n");
let html = md.render(raw);

// ---- cost chart injection ----
const COST_CHART = `
<div class="costchart">
  <h4>같은 500만 처리, 설계가 자릿수를 가른다</h4>
  <div class="cap">500만 상품 1회 처리 비용 (USD) · 막대는 $150K 기준 상대 길이 · 1억원 ≈ $74K</div>
  <div class="bar-row"><div class="lab">Smart — 본 설계<small>self-host 대량 + 하드케이스만 상용 + 2-pass</small></div>
    <div class="bar-track"><div class="bar-fill smart" style="width:3.3%"></div></div><div class="bar-val">~$1–5K</div></div>
  <div class="bar-row"><div class="lab">예산 한도<small>1억원</small></div>
    <div class="bar-track"><div class="bar-fill budget" style="width:49%"></div></div><div class="bar-val">$74K</div></div>
  <div class="bar-row"><div class="lab">Naive 1<small>상용 플래그십 VLM 전수</small></div>
    <div class="bar-track"><div class="bar-fill naive" style="width:40%"></div></div><div class="bar-val">~$56–60K</div></div>
  <div class="bar-row"><div class="lab">Naive 2<small>GPT-4o급 비전 전수(멀티 Key·이미지)</small></div>
    <div class="bar-track"><div class="bar-fill naive2" style="width:100%"></div></div><div class="bar-val naive2-val">~$75–150K</div></div>
  <div class="note">Smart는 예산의 <b>5~7%</b>. Naive 2는 단일 task만으로 1억을 넘기고(×3이면 완전 초과), 깔때기 + 2-pass가 이 격차를 만든다.</div>
</div>`;
html = html.replace(/<p>\[\[COST_CHART\]\]<\/p>/g, COST_CHART);

// ---- wrap tables for horizontal scroll ----
html = html.replace(/<table>/g, '<div class="tablewrap"><table>').replace(/<\/table>/g, "</table></div>");

// ---- heading ids + anchors + TOC ----
const toc = [];
let n = 0;
html = html.replace(/<(h[123])>([\s\S]*?)<\/\1>/g, (m, tag, inner) => {
  n++;
  const id = "sec-" + n;
  const label = inner.replace(/<[^>]+>/g, "").trim();
  if (tag === "h1") toc.push({ level: 1, id, label });
  else if (tag === "h2") toc.push({ level: 2, id, label });
  return `<${tag} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${inner}</${tag}>`;
});

// ---- build TOC html (chapters w/ nested sections) ----
let tocHtml = "";
toc.forEach((t) => {
  if (t.level === 1) tocHtml += `<a class="h1" href="#${t.id}">${t.label}</a>`;
  else tocHtml += `<a class="h2" href="#${t.id}">${t.label}</a>`;
});

// ---- inline assets ----
const css = fs.readFileSync(path.join(SRC, "style.css"), "utf8");
const js = fs.readFileSync(path.join(SRC, "app.js"), "utf8");

const page = `<!doctype html>
<html lang="ko" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>대규모 상품 카테고리 분류 & 속성 추출 파이프라인 설계 — Levit AI 직무과제</title>
<meta name="description" content="500만 상품 · 1만 leaf 카테고리 규모의 카테고리 분류 + 속성 추출 AI 파이프라인 설계. 프로덕션 실용성·트레이드오프 논증·정량 비용모델.">
<meta name="color-scheme" content="light dark">
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${css}</style>
</head>
<body>
<div id="progress"></div>
<div class="layout">
  <aside class="sidebar" id="sidebar">
    <div class="brand"><span class="dot"></span><span><b>분류 × 속성 파이프라인</b><small>Levit AI · Product Engineer 과제</small></span></div>
    <nav class="toc">
      <div class="grp">목차</div>
      ${tocHtml}
    </nav>
  </aside>
  <div id="scrim" class="scrim" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:70"></div>

  <main class="main">
    <div class="topbar">
      <button class="btn" id="menuBtn" aria-label="menu">☰ 목차</button>
      <div class="sp"></div>
      <a class="btn" href="assignment.pdf">⤓ PDF</a>
      <button class="btn" id="themeBtn">☾ 다크</button>
    </div>

    <div class="wrap">
      <header class="hero">
        <span class="kicker">Levit AI · Product Engineer (AI/Data) 직무과제</span>
        <h1>대규모 상품 카테고리 분류 &amp; 속성 추출 파이프라인 설계</h1>
        <p class="lead">500만 상품을 1만 leaf 카테고리로 분류하고, 카테고리별 속성 체계를 구축·추출·평가하는 프로덕션급 AI 파이프라인. 모든 설계 결정을 <b>대안·선택 이유·정량 비용</b>과 함께 방어한다.</p>
        <div class="meta">
          <span><b>규모</b> 500만 상품 · 1만 카테고리</span>
          <span><b>예산</b> 1회 전수 각 1억원</span>
          <span><b>스택</b> 오픈소스 대량 + 상용 전략 · 한국어 우선</span>
        </div>
        <div class="stats">
          <div class="stat"><div class="n">5M × 10K</div><div class="l">상품 × leaf 카테고리(계층 Tree)</div></div>
          <div class="stat"><div class="n">~$1–5K</div><div class="l">Smart 설계 전수 처리 비용 — 예산(≈$74K)의 5~7%</div></div>
          <div class="stat"><div class="n">80 / 20</div><div class="l">경량 모델 대량 + 하드케이스만 상용·사람 (깔때기)</div></div>
        </div>
      </header>

      <article class="content">
        ${html}
      </article>

      <footer class="foot">
        <p>Claude(Opus 4.8) 기반 에이전트 워크플로우로 작성 · deep-interview → 병렬 리서치(웹 검증) → 설계 → 빌드 → 인용 검증. 비용은 방어 가능한 가정에 근거한 추정. 자세한 방법은 <a href="#${(toc.find(t=>t.label.includes("AI 활용"))||{}).id||""}">6장</a> 참조.</p>
      </footer>
    </div>
  </main>
</div>
<script>${js}</script>
</body>
</html>`;

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "index.html"), page, "utf8");
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
console.log("built docs/index.html  ·  sections:", n, " toc:", toc.length, " bytes:", page.length);
