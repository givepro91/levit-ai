# 7. 참고 문헌

> 아래 인용은 작성 중 **독립 검증 패스**(전용 에이전트가 각 논문/페이지의 제목·발표처·연도를 1차 소스로 대조)를 거쳤다. 검증 과정에서 발표처·수치 오류를 교정했고(예: Dual-Expert는 ACL이 아니라 EMNLP 2024, NGAME은 ICML이 아니라 WSDM 2023, ExtractGPT의 F1은 91%가 아니라 85%), **1차 소스로 확인되지 않은 수치는 본문에서 제거**했다(예: 텍스트/이미지 단독 macro-F1 비교치). 본문 설계는 특정 인용의 진위와 무관하게 표준 기법에 기반한다.

## 카테고리 분류

| 출처 | 발표처 | 링크 |
|---|---|---|
| E-Commerce Product Categorization with LLM-based Dual-Expert Classification (Amazon) | EMNLP 2024 · CustomNLP4U Workshop | [aclanthology](https://aclanthology.org/2024.customnlp4u-1.22/) |
| e-CLIP: Large-Scale Vision-Language Representation Learning in E-commerce (NAVER) | CIKM 2022 | [arXiv 2207.00208](https://arxiv.org/abs/2207.00208) |
| LLM-based Approach to Large-scale Item Category Classification (Mercari) | Mercari Engineering Blog, 2024 | [blog](https://engineering.mercari.com/en/blog/entry/20240411-large-scale-item-categoraization-using-llm/) |
| PECOS / XR-Transformer — extreme multi-label classification (Amazon) | NeurIPS 2021 · OSS | [github amzn/pecos](https://github.com/amzn/pecos) |
| DEXA — Deep Encoders with Auxiliary Parameters for Extreme Classification | KDD 2023 | [acm](https://dl.acm.org/doi/10.1145/3580305.3599301) |
| NGAME — Negative Mining-aware Mini-batching for Extreme Classification | WSDM 2023 | [acm](https://dl.acm.org/doi/10.1145/3539597.3570392) |
| PGKD — Performance-Guided LLM Knowledge Distillation for Efficient Text Classification (Amazon) | 2024 | [arXiv 2411.05045](https://arxiv.org/abs/2411.05045) |

## 속성 스키마 구축 & 값 추출

| 출처 | 발표처 | 링크 |
|---|---|---|
| OpenTag — Open Attribute Value Extraction (BiLSTM+Attention+CRF) | KDD 2018 | [arXiv 1806.01264](https://arxiv.org/abs/1806.01264) |
| AVEQA — Attribute Value Extraction via Question Answering (Amazon) | KDD 2020 | [acm](https://dl.acm.org/doi/abs/10.1145/3394486.3403047) |
| TXtract — Taxonomy-Aware Knowledge Extraction for Thousands of Categories | ACL 2020 | [aclanthology](https://aclanthology.org/2020.acl-main.751/) |
| AdaTag — Multi-Attribute Value Extraction with Adaptive Decoding | ACL 2021 | [aclanthology](https://aclanthology.org/2021.acl-long.362/) |
| ExtractGPT — LLMs for Product Attribute Value Extraction (GPT-4 F1 ≈ 85%) | 2023 | [arXiv 2310.12537](https://arxiv.org/abs/2310.12537) |
| EIVEN — Efficient Implicit Attribute Value Extraction using Multimodal LLM | NAACL 2024 Industry | [arXiv 2404.08886](https://arxiv.org/abs/2404.08886) |
| MADIAVE — Multi-Agent Debate for Implicit Attribute Value Extraction | EACL 2026 Findings | [arXiv 2510.05611](https://arxiv.org/abs/2510.05611) |
| BEATS — Bootstrapping E-commerce Attribute Taxonomies (Human-AI, Rakuten) | SIGIR 2026 Industry | [arXiv 2606.04909](https://arxiv.org/abs/2606.04909) |
| AutoPKG — Product-Attribute Knowledge Graph Construction (Lazada) | ACL 2026 Findings | [arXiv 2604.16950](https://arxiv.org/abs/2604.16950) |

## 평가 벤치마크

| 출처 | 발표처 | 링크 |
|---|---|---|
| WDC-PAVE — Extraction & Normalization of Product Attribute Values | ADBIS 2024 | [arXiv 2403.02130](https://arxiv.org/abs/2403.02130) · [WDC](https://webdatacommons.org/structureddata/wdc-pave/) |
| ImplicitAVE — Multimodal Benchmark for Implicit Attribute Value Extraction | ACL 2024 Findings | [arXiv 2404.15592](https://arxiv.org/abs/2404.15592) |
| MAVE — Multi-source Attribute Value Extraction (데이터: Amazon 상품) | WSDM 2022 | [arXiv 2112.08663](https://arxiv.org/abs/2112.08663) |

## 표준 분류체계 (택소노미 시드)

- **Google Product Taxonomy** — [support.google.com](https://support.google.com/merchants/answer/6324436)
- **schema.org / Product** — [schema.org/Product](https://schema.org/Product)
- **GS1 GPC (Global Product Classification)** — [gs1.org/gpc](https://www.gs1.org/standards/gpc)

## 모델 · 임베딩 (라이선스 주의)

| 모델 | 라이선스 | 링크 |
|---|---|---|
| KURE-v1 (한국어 임베딩, 고려대 NLP) | **MIT** | [HF](https://huggingface.co/nlpai-lab/KURE-v1) · [github](https://github.com/nlpai-lab/KURE) |
| Solar Pro 2 (Upstage) | API/Enterprise | [upstage](https://www.upstage.ai/blog/en/solar-pro-2-launch) |
| HyperCLOVA X (NAVER) | API | [arXiv 2404.01954](https://arxiv.org/abs/2404.01954) |
| EXAONE 4.x (LG AI) | **NC(비상업)** — 상업 배포 제약 | [HF](https://huggingface.co/LGAI-EXAONE) |
| Qwen2.5-VL / Qwen3-Embedding | Apache 2.0 (**Qwen2.5-VL 72B 제외**) | [github](https://github.com/QwenLM) |
| BGE-M3 / bge-reranker-v2-m3 (BAAI) | Apache 2.0 | [HF](https://huggingface.co/BAAI/bge-m3) |

## 가격 · 인프라 (2026-06 기준, 공식 페이지)

- **Anthropic Claude** pricing — [platform.claude.com](https://platform.claude.com/docs/en/about-claude/pricing)
- **Google Gemini** pricing — [ai.google.dev/pricing](https://ai.google.dev/pricing)
- **OpenAI** pricing — [developers.openai.com](https://developers.openai.com/api/docs/pricing)
- **GPU (self-host)** — [RunPod](https://www.runpod.io/pricing) · [Lambda](https://lambda.ai/pricing)
