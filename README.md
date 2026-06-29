# 대규모 상품 카테고리 분류 & 속성 추출 파이프라인 설계

> **Levit AI — Product Engineer (AI/Data) 직무과제**
> 500만 상품 · 1만 leaf 카테고리 규모의 프로덕션 AI 파이프라인 설계

[![web](https://img.shields.io/badge/문서-웹으로_보기-5b5bd6)](https://givepro91.github.io/levit-ai/) [![pdf](https://img.shields.io/badge/문서-PDF_다운로드-444)](docs/assignment.pdf)

🔗 **웹(GitHub Pages):** `https://givepro91.github.io/levit-ai/`  ·  📄 **PDF:** [`docs/assignment.pdf`](docs/assignment.pdf)

---

## 무엇을 설계했나

| | 문제 | 산출 |
|---|---|---|
| **[1]** | 500만 상품 → 1만 leaf 카테고리 자동 분류 | 모델 아키텍처(1-1) + 고도화·배포 로드맵(1-2) |
| **[2-1]** | 카테고리별 속성 스키마(Key-Value) 구축 | MECE 보장 스키마 induction 파이프라인 |
| **[2-2]** | 500만 상품 속성값 추출 | 멀티모달 추출 파이프라인 |
| **[2-3]** | 속성 체계 평가·품질관리 | 자동 메트릭 + 인간 피드백 루프 |

## 핵심 논증 3가지

1. **비용은 binding 제약이 아니다.** self-host 하이브리드 전수 처리는 ~$1K–5K(예산의 5~7%). 진짜 제약은 정확도·MECE·운영. → 깔때기(funnel): *경량 모델 대량(80%) + 하드케이스만 상용·사람(20%)*.
2. **레이블 부트스트랩이 심장.** 정답 없는 500만에 LLM 교사가 50만을 라벨링 → 경량 student로 distillation → 비싼 모델은 "가르치는 데 한 번", 싼 모델이 전수 처리.
3. **포괄성(CE)은 검색 로그 gap으로 측정.** "측정 불가의 누락"을 *실사용자가 원했는데 못 채운 속성*이라는 측정 가능한 신호로 전환.

## 문서 구조

`content/`의 단일 마크다운 소스에서 웹과 PDF를 동시 빌드한다.

| 장 | 내용 |
|---|---|
| [0. 한눈에 보기](content/00-overview.md) | 3원칙 · 스택 요약 · 임팩트 서사 |
| [1. 카테고리 분류](content/01-classification.md) | Distilled Funnel 아키텍처 + 로드맵 |
| [2. 속성 스키마 구축](content/02-attribute-schema.md) | 공유 라이브러리 + 4단계 + MECE |
| [3. 속성값 추출](content/03-attribute-extraction.md) | 텍스트 우선 2-pass 깔때기 |
| [4. 평가·품질관리](content/04-evaluation-qa.md) | 메트릭 + golden set + active learning |
| [5. 비용 모델](content/05-cost-model.md) | Naive vs Smart 정량 비교 |
| [6. AI 활용 과정](content/06-ai-usage.md) | 이 과제를 푼 방법 |

## 디렉토리

```
content/        # 설계 본문 (단일 소스, 마크다운)
src/            # 디자인 시스템(style.css) + 인터랙션(app.js)
build.mjs       # content → docs/index.html 빌드
docs/           # 빌드 결과: GitHub Pages + PDF (index.html, assignment.pdf)
```

## 빌드

```bash
npm install                 # markdown-it
node build.mjs              # → docs/index.html

# PDF (Chrome 헤드리스)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf=docs/assignment.pdf \
  "file://$(pwd)/docs/index.html"
```

**GitHub Pages 활성화:** Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `/docs`.

## AI 활용

이 과제는 **Claude(Opus 4.8) 기반 에이전트 워크플로우**로 수행했다: `deep-interview`로 요구사항 결정화(모호도 100%→13%) → **6개 병렬 리서치 에이전트**(가격·모델·SOTA를 웹 1차 소스로 검증) → Opus 설계 → 단일 소스 빌드 → 인용 검증. 상세는 [6장](content/06-ai-usage.md).
