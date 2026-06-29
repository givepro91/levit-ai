# 0. 한눈에 보기 (Executive Summary)

<div class="keyline reveal"><div class="kt">싼 모델로 <b>대량(80%)</b>, 비싼 모델·사람으로 <b>소수(20%)</b>, 그리고 환류 루프 — 이 하나의 원리로 500만 상품의 분류·속성을 <b>예산의 5~7%</b>로 풀고, 남는 예산을 정확도에 투자한다.</div><div class="ks">예산(각 1억)은 압박이 아니라 <b>품질에 투자할 여유</b>다. 진짜 제약은 비용이 아니라 정확도·MECE·운영이다.</div></div>

이 문서는 두 개의 프로덕션급 AI 파이프라인을 설계한다. 모든 결정은 **"왜 이 선택인가 / 왜 다른 선택은 아닌가"** 를 정량 근거와 함께 방어한다.

## 두 파이프라인 한눈에

<div class="pipe2 reveal"><div class="pipe"><span class="tag">[1]</span><h4>카테고리 분류</h4><div style="color:var(--ink-2);font-size:13px">500만 상품 → 1만 leaf 카테고리(계층 Tree) 자동 분류</div><div class="steps"><span class="chip">멀티모달 임베딩</span><span class="chip">ANN 검색</span><span class="chip">계층 rerank</span><span class="chip cap">신뢰도 routing</span></div></div><div class="pipe"><span class="tag">[2]</span><h4>속성 추출</h4><div style="color:var(--ink-2);font-size:13px">카테고리별 Key-Value 스키마 구축 → 상품 값 추출 → 평가·관리</div><div class="steps"><span class="chip">택소노미 시드</span><span class="chip">멀티-LLM 앙상블</span><span class="chip">2-pass 추출</span><span class="chip cap">검색로그 평가</span></div></div></div>

## 설계 3원칙

<div class="cards c3 reveal"><div class="card"><div class="ci">💸</div><div class="ct">비용은 제약이 아니다</div><div class="cd">self-host 하이브리드 전수 처리는 <b>$1~5K</b>(예산의 5~7%). 진짜 제약은 정확도·MECE·운영. 깔때기로 비싼 연산을 <b>어려운 소수에만</b> 쓴다.</div></div><div class="card"><div class="ci">🇰🇷</div><div class="ct">한국어·도메인 최적화</div><div class="cd">임베딩 <b>KURE-v1</b>(한국어 검색 1위·MIT), 교사 <b>Solar Pro 2</b>. 라이선스도 실전 기준 — 상업 배포는 Apache/MIT로.</div></div><div class="card"><div class="ci">🔻</div><div class="ct">"깔때기"로 설계</div><div class="cd">recall → precision → adjudication → human. 단계별 독립 튜닝으로 <b>신규·롱테일·운영 장애</b>를 흡수한다.</div></div></div>

## 핵심 결과

<div class="cards c3 reveal"><div class="card"><div class="ct">🎯 분류 정확도</div><div class="cd">자동확정 구간 leaf P@1 <b>88%+</b>, 계층 일관성 <b>99%</b> 목표. 애매한 ~20%만 상용 LLM·사람이 보정.</div></div><div class="card"><div class="ct">💰 전수 처리 비용</div><div class="cd">[1]·[2-2] 각 <b>~₩2천만~5천만</b>(1억의 20~50%). naive "상용 LLM 전수"는 <b>1억 초과</b>.</div></div><div class="card"><div class="ct">📐 MECE 보장</div><div class="cd">멀티-LLM 앙상블 + critic으로 포괄성(CE), <b>검색로그 gap 마이닝</b>으로 "측정 불가의 누락"을 실수요 신호로 측정.</div></div></div>

## 추천 기술 스택

| 구성요소 | 선택 | 근거 |
|---|---|---|
| 한국어 임베딩 | **KURE-v1** (고려대, MIT) | 한국어 검색 1위, 상업 자유 |
| VLM (대량 self-host) | **Qwen2.5-VL-7B** (Apache 2.0) | 한국어 OCR, 상업 자유, 운영 실용적 |
| reranker | BGE-reranker-v2-m3 (Apache 2.0) | 상업 자유, 한국어 커버 |
| 교사·하드케이스 LLM | **Solar Pro 2** / HyperCLOVA X / Gemini·Claude | 한국어 1위 / 커머스 친화 / 범용 최고 |
| 인프라 | FAISS HNSW · vLLM · TEI · A100/L4(spot) | 1만 카테고리, 배치 throughput 최적 |

## 비즈니스 맥락 — 왜 이 일이 중요한가

Levit(레브잇)의 **올웨이즈(Alwayz)** 는 C2M 초저가 소셜커머스이며 **LLM 기반 쇼핑 AI 에이전트**로 확장 중이다. 정확한 카테고리·속성은 그 모든 것의 **기반 데이터** 다.

> **분류·속성 품질 → 검색·추천·AI에이전트 답변 품질 → 전환율 → GMV.** "지리산 수원지 무라벨 생수 추천해줘" 같은 자연어 요청을 에이전트가 답하려면, 그 속성이 구조화돼 있어야 한다. 이 문서는 "정확도"를 지표가 아니라 **다운스트림 임팩트**로 본다.

## 읽는 순서

| 장 | 내용 | 과제 |
|---|---|---|
| **1** | 카테고리 분류 아키텍처 + 고도화·배포 로드맵 | [1] |
| **2** | 카테고리별 속성 스키마 구축 | [2-1] |
| **3** | 상품별 속성값 추출 | [2-2] |
| **4** | 속성 체계 평가·품질관리 | [2-3] |
| **5** | 횡단 비용·처리량 모델 (정량) | 전체 |
| **6** | AI 활용 과정 | 안내사항 |

> 비용 수치는 *방어 가능한 가정에 근거한 추정* 이며 과도한 정밀도를 지양한다. 가정은 해당 위치에 명시한다.
