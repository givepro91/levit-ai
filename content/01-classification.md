# 1. 대규모 카테고리 분류 모델 설계

> **과제 [1]** — 500만 상품을 1만 leaf 카테고리(계층 Tree)로 자동 분류.
> 입력: 상품명(텍스트) · 대표 이미지 · 상세페이지(텍스트/이미지)

---

## 1.0 무엇이 진짜 어려운가

"1만 개 클래스 분류"라고 하면 보통 클래스가 많아서 어렵다고 생각한다. 그런데 진짜 난점은 클래스 수가 아니다.

- **10K 클래스는 사실 "중간" 규모다.** 진짜 XMC(extreme multi-label classification)는 수십만~수백만 클래스를 다룬다. 10K개에 대한 flat softmax 출력층은 `10,000 × hidden(768) ≈ 7.7M` 파라미터로 **연산상 전혀 부담이 아니다.** 따라서 "클래스가 많아서 flat이 불가능하다"는 흔한 논리는 이 문제에선 약하다.
- **진짜 난점은 4가지다:**
  1. **레이블 부재(label scarcity).** "분류 모델을 새로 만든다" = 500만 건에 정답 leaf가 (충분히) 없다는 뜻이다. **학습 데이터를 어떻게 확보하느냐가 전체 설계를 좌우한다.** (대부분의 설계가 이 질문을 건너뛴다 — 우리는 정면으로 다룬다. §1.3)
  2. **롱테일(long-tail).** 1만 leaf 중 상위 ~100개가 데이터의 70~80%를 차지하는 파레토 분포가 일반적. 희소 클래스의 recall이 30% 밑으로 떨어지기 쉽다.
  3. **계층 일관성(hierarchical consistency).** leaf만 맞히면 끝이 아니다. "가전 > 냉장고" 상품이 "패션 > 상의"로 가면 안 된다. 부모-자식 경로가 모순되지 않아야 한다.
  4. **멀티모달 노이즈.** 이미지가 도움될 때(패션·인테리어)와 오히려 방해될 때(저화질·인포그래픽형 상세컷)가 갈린다.

이 4가지를 어떻게 푸느냐가 설계의 품질을 가른다.

---

## 1.1 모델 아키텍처 설계

### 1.1.1 후보 아키텍처 3종 비교

| 항목 | **A. 계층형 분류기**<br>(Hierarchical FT classifier) | **B. 검색 기반 하이브리드**<br>(Retrieve → Rerank) | **C. 깔때기 + 선택적 LLM**<br>(추천) |
|---|---|---|---|
| 핵심 구조 | 멀티모달 인코더 → 레벨별 softmax (top-down) | bi-encoder ANN → cross-encoder rerank | B + 신뢰도 기반 LLM 라우팅 + 사람 검수 |
| leaf 정확도(P@1) | 85~90% (충분한 라벨 시) | 88~93% | **88~93% + 하드케이스 보정** |
| Cold-start(신규 카테고리) | ✗ 재학습 필요 | ✓ 임베딩만 추가 | ✓ |
| 롱테일 | △ class-balanced 학습 필요 | ✓ 검색이 tail에 강함 | ✓ |
| 계층 일관성 | ✓ dynamic masking | △ 후처리 필요 | ✓ |
| 500만 추론 비용 | ~$500~2,000 | ~$1,000~5,000 | **~$3,000~15,000** |
| 운영 복잡도 | 낮음~중간 | 높음(2-stage) | 높음(3-stage, 단 부분 fallback 가능) |
| 레이블 의존성 | **높음**(많은 정답 필요) | 중간 | **낮음**(LLM 부트스트랩) |

**판단:** 단일 flat 분류기(표에 없음)는 cold-start·계층일관성·롱테일·taxonomy 변경에 모두 취약해 탈락. A는 운영은 단순하나 레이블 의존성이 크고 신규 카테고리에 약하다. B는 강력하나 정밀도를 cross-encoder에만 의존하고 하드케이스 안전망이 없다. **C는 B의 강점(검색→재순위)에 (a) 레이블 부트스트랩, (b) 하드케이스 LLM 보정, (c) 사람 검수 안전망을 더한 형태로, 우리 4대 난점을 모두 흡수한다.**

### 1.1.2 추천 아키텍처 — "Distilled Funnel"

<div class="diagram reveal"><div class="dh">추천 아키텍처 — "Distilled Funnel"</div><div class="dc">입력: 상품명 + 상세페이지 텍스트(요약) + 대표 이미지 · 단계마다 비싼 연산을 어려운 소수에만</div><div class="flow"><div class="flow-step"><div class="idx">0</div><div class="stxt"><b>전처리 · 멀티모달 인코딩</b><span>텍스트(상품명 + 상세 핵심문장) → KURE-v1 임베딩 · 대표 이미지 1장 → ViT/CLIP(품질 필터 통과 시) · intermediate fusion → 단일 query 임베딩</span></div></div><div class="flow-conn"></div><div class="flow-step"><div class="idx">1</div><div class="stxt"><b>Recall — ANN 검색</b><span>1만 카테고리 대표 임베딩(프로토타입) FAISS HNSW 인덱스에서 top-50 후보 검색 (목표: 정답 포함률 ≥ 99%)</span></div><div class="pill">p50 &lt; 20ms · CPU</div></div><div class="flow-conn"></div><div class="flow-step"><div class="idx">2</div><div class="stxt"><b>Precision — 계층형 Cross-encoder 재순위</b><span>(상품, 후보 경로) joint encoding · LLM 교사 라벨로 distillation한 student · dynamic masking으로 계층 일관성 · temperature scaling 보정 → top-1 + 신뢰도</span></div></div><div class="flow-conn"></div><div class="flow-step"><div class="idx">3</div><div class="stxt"><b>Routing — 신뢰도 기반 분기</b><span>보정된 신뢰도에 따라 세 갈래로 — 비용을 어려운 소수에 집중</span></div></div></div><div class="split-branches"><div class="branch auto"><div class="pct">75~85%</div><div class="bn">자동 확정</div><div class="bd">신뢰도 ≥ 0.85 · 자체 모델로 거의 공짜 처리</div></div><div class="branch mid"><div class="pct">12~20%</div><div class="bn">상용 LLM 판별</div><div class="bd">0.55 ≤ 신뢰도 &lt; 0.85 · top-5 후보 + 설명 주고 택1</div></div><div class="branch human"><div class="pct">3~5%</div><div class="bn">사람 검수 큐</div><div class="bd">신뢰도 &lt; 0.55 · active learning으로 환류</div></div></div></div>

핵심은 **"비싼 연산을 어려운 소수에만 쓴다"** 는 깔때기 원리다. 85%는 자체 모델로 거의 공짜로 처리하고, 애매한 15~20%에만 상용 LLM(건당 수 원)을, 정말 모호한 3~5%에만 사람을 투입한다.

### 1.1.3 멀티모달 융합 — 텍스트 주도, 이미지는 tie-breaker

- 일반적으로 **텍스트가 이미지보다 분류에 강하고**, 둘을 **함께 쓰면 텍스트만 쓸 때보다 분명히 나아진다**(향상폭은 카테고리·이미지 품질에 따라 다름).
- **결정: 텍스트를 1차 신호, 이미지를 보조(tie-breaker)로 둔다.** 이미지는 "빨간 원피스" vs "빨간 티셔츠"처럼 텍스트가 모호할 때 결정적이다. 단 **이미지 품질 필터**(해상도·블러·인포그래픽 감지)를 통과한 경우만 가중하고, 저품질이면 이미지 weight=0으로 fallback해 노이즈를 차단한다.
- 비용 함의: 이미지 인코딩(ViT)은 임베딩 단계에서만 1회 — VLM 풀추론(건당 비싼)은 Stage 3 하드케이스에만. (전수 VLM이 예산을 깨는 이유 → §5)

### 1.1.4 계층 일관성 — dynamic masking + hierarchical loss

- **Dynamic masking:** cross-encoder가 leaf를 고를 때, 먼저 예측한 상위 레벨(대분류·중분류)의 유효 자식 집합으로 후보를 제한한다 → 부모-자식 모순 원천 차단.
- **Hierarchical loss:** 학습 시 오답을 트리상 거리에 비례해 penalize한다. "냉장고→김치냉장고"(형제 오답)보다 "냉장고→원피스"(먼 오답)에 더 큰 손실. → 틀려도 "가까이" 틀리게 유도(다운스트림 피해 최소화).
- **Error cascade 완화:** 상위 레벨 정확도를 별도 모니터링하고, 상위가 애매하면 곧장 Stage 3로 라우팅한다.

### 1.1.5 보정(calibration)과 라우팅 임계값

- Softmax 확률은 과신(overconfident) 경향 → **temperature scaling** 으로 보정, **ECE(Expected Calibration Error)** 를 검증셋으로 주기 측정.
- 라우팅 임계값(0.85 / 0.55)은 **고정값이 아니라 예산·정확도 트레이드오프의 다이얼**이다. 임계값을 낮추면 자동 비율↑·비용↓·정확도↓. A/B로 캘리브레이션한다. (이 다이얼이 "1억 안에서 어디까지 품질을 살까"를 직접 조절하는 손잡이다.)

---

## 1.2 정답 데이터를 어떻게 마련하나 — 이 설계의 관건

> 정답 leaf가 없는데 어떻게 cross-encoder를 학습시키나? 이 질문을 푸는 방식이 설계의 성패를 가른다.

**3-소스 부트스트랩:**

1. **약한 신호 수확(weak labels).** 크롤링 데이터에 판매자 지정 카테고리·태그·상세 스펙이 있으면 1차 시드로. 노이즈가 있지만 공짜이고 대량이다.
2. **LLM 교사 라벨링(핵심).** 대표 표본 **30만~50만 건**을 상용 LLM(Solar Pro 2 / HyperCLOVA X / Gemini)으로 "이 상품의 leaf 카테고리는?"(top-5 후보 + 카테고리 정의를 in-context로 제공) 라벨링. 비용은 **약 $70~200** 에 불과(§5.2). 이게 distillation의 정답셋이 된다.
3. **사람 golden set.** 카테고리별 대표 상품을 전문가가 검수한 **소량 고품질 셋** — 교사 라벨 품질 검증 + 최종 평가 기준.

→ LLM 교사가 만든 50만 라벨로 cross-encoder student를 **distillation** 하면, student는 교사 정확도의 85~95%를 **추론 비용 1/50 이하**로 달성한다. *"비싼 LLM은 가르치는 데 한 번만 쓰고, 싼 student가 500만을 처리한다."* — 이것이 예산을 지키며 정확도를 얻는 메커니즘이다.

**산업 검증:** Amazon은 *fine-tuned 도메인 전문가가 top-K 후보를 제시하고 LLM이 그중에서 판별* 하는 dual-expert 방식으로 높은 분류 정확도를 보고했고, Mercari는 라벨 없는 카탈로그를 OSS 임베딩 + LLM으로 일괄 재분류한 사례를 공유했다. 우리 설계는 이 두 검증된 패턴(전문가 후보 + LLM 판별, LLM 부트스트랩 재분류)을 합친 것이다.

---

## 1.3 [1] 비용 요약 (상세 §5)

> 가정: self-host = RunPod A100/L4, 환율 1,350원/USD. 1회 전수(500만) 기준.

| 항목 | 추정 비용 | 비고 |
|---|---|---|
| 멀티모달 임베딩 500만 | ~$5 | self-host, 3.3 GPU-hr |
| Cross-encoder 재순위 500만 | ~$50~200 | self-host |
| LLM 교사 라벨링 50만(부트스트랩) | ~$70~200 | 1회, 저가 모델 batch |
| 인코더/reranker 학습 | ~$500~2,000 | A100 수일 |
| 하드케이스 LLM 라우팅 ~100만 건 | ~$200~2,500 | 모델 등급에 따라 |
| 사람 검수 ~25만 건 | ₩10M~30M | 진짜 비용 항목 |
| **합계** | **≈ ₩2,000만~5,000만** | **1억의 20~50%, 충분한 여유** |

→ 남는 예산은 **상용 교사 등급 상향(Solar Pro 2 → Claude/Gemini), 사람 검수 확대, 롱테일 집중 라벨링**에 재투자해 정확도를 끌어올린다.

---

## 1.4 정확도 극대화 레버

1. **앙상블** — 텍스트 분류기 + 이미지 분류기 + 검색 스코어 weighted voting (단일 대비 +3~5%p 기대).
2. **계층 손실** — §1.1.4. 정확도 + 일관성 동시 개선.
3. **롱테일 대비 contrastive learning** — 희소 클래스를 anchor로 hard negative 구성, 임베딩 공간에서 tail 분리 강화.
4. **Active learning 루프** — 저신뢰·검수 케이스를 가장 모호한 클래스 경계에 집중 재학습.
5. **LLM self-summary few-shot** — LLM이 각 카테고리의 "구분 기준"을 자기 생성 → reranker의 in-context 예시로 → 경계 카테고리 정밀도↑ (Amazon 패턴).
6. **데이터 증강** — 상품명 paraphrase(back-translation/LLM), 이미지 augmentation으로 희소 클래스 보강.

---

## 1.5 리스크와 완화

| 리스크 | 심각도 | 완화책 |
|---|---|---|
| LLM 라우팅 비용 폭증(임계값 과민) | 높음 | 임계값 A/B 캘리브레이션, 하드케이스용 저가 모델(Gemini Flash-Lite) 확보, 상한(budget cap) 설정 |
| 계층 error cascade | 높음 | 레벨별 독립 + dynamic masking, 상위 레벨 별도 모니터링 |
| 롱테일 recall 저하 | 높음 | class-balanced sampling, contrastive, tail 우선 LLM 라우팅 |
| 이미지 품질 편차 | 중간 | 품질 필터 → 저품질 시 image weight=0 |
| 보정 불량(과신) | 중간 | temperature scaling, ECE 주기 측정 |
| 교사 라벨 노이즈 전파 | 중간 | golden set로 교사 품질 검증, 다수 교사 합의(이질 LLM), 신뢰도 낮은 교사 라벨 제외 |
| taxonomy 변경 | 낮음~중간 | 검색 기반이라 카테고리 임베딩만 추가하면 무재학습 적응(Mercari 패턴) |

---

## 1.6 고도화 로드맵 (과제 1-2)

> "1회성 전수 분류"로 끝이 아니라, **지속 운영되는 분류 시스템**으로 키우는 단계별 계획.

### Phase 0 — 부트스트랩 & 전수 처리 (0~2개월) · *예산 1억의 대상*
- 약한 신호 + LLM 교사 라벨링 50만 → cross-encoder distillation → 초기 시스템.
- 500만 전수 1회 분류 실행. 사람 검수로 golden set 1차 구축.
- **게이트 지표:** leaf P@1 ≥ 88%(자동확정 구간), 계층 일관성 ≥ 99%, 사람 큐 ≤ 5%.

### Phase 1 — 서빙 & 모니터링 (2~4개월)
- 신규 상품 실시간 분류 API (p99 < 100ms). 신규는 Stage 1~2, 저신뢰만 Stage 3.
- 운영 대시보드: 카테고리 분포 드리프트, 신뢰도 분포, 사람 큐 적체, 비용/건.
- **게이트:** 실시간 정확도 = 배치 정확도 ±2%p, 큐 처리 SLA 충족.

### Phase 2 — Active Learning & 롱테일 개선 (4~8개월)
- 저신뢰·검수 결과를 학습셋에 환류 → 주기 재학습. 롱테일 집중 라벨링.
- 보정 모니터링(ECE), 임계값 재튜닝.
- **게이트:** 롱테일(하위 50% 클래스) recall +10%p, ECE < 0.05.

### Phase 3 — 자기개선 & 다운스트림 연동 (8개월~)
- **다운스트림 피드백을 라벨로**: 검색 클릭·추천 전환·에이전트 정정 로그를 약한 라벨로 환류(공짜 라벨 공장).
- taxonomy 진화(검색 기반이라 저비용), 교사 모델 주기 업그레이드 후 재distillation.
- A/B로 라우팅 임계값·앙상블 가중 최적화.
- **게이트:** 분류 품질 → 검색/추천 지표(CTR·전환) 개선으로 연결 입증.

> **로드맵의 핵심:** 예산 1억은 Phase 0(전수 처리)용이다. Phase 1+ 운영비는 별도지만, 설계가 처음부터 *"싼 student가 대량 + 비싼 교사가 소량"* 구조라 **운영 한계비용이 낮게** 유지된다 — 고도화의 핵심은 돈이 아니라 **라벨 환류 루프**다.
