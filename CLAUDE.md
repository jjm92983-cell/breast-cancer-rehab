# 유방암 수술 후 자가간호 & 어깨 재활 기록 웹 앱 (Claude Code 가이드)

## 1. 프로젝트 개요
* **목적**: 유방암 수술(Mastectomy) 환자를 위한 일일 건강 기록, 어깨 재활운동(웹캠 AI 모션 트래킹), 위험신호 스크리닝, 실시간 AI 상담을 제공하는 모바일 웹 앱 (2분 시연용 프로토타입).
* **주요 사용자**: 유방암 수술 후 퇴원하여 가정에서 회복 중인 환자 및 보호자.

---

## 2. 기술 스택
* **프레임워크**: React 18 + Vite
* **스타일링**: Tailwind CSS v4 (Stitch "Warm Care & Recovery" 테마: 세이지 그린 `#1c503d`, 테라코타 `#9f4122`, 크림 캔버스 `#f7faf5`)
* **차트**: Recharts (7일 통증/체온 추세, 운동 달성률)
* **아이콘**: Google Material Symbols Outlined, Lucide React
* **폰트**: Plus Jakarta Sans, Inter
* **데이터 저장**: 브라우저 `localStorage` 전용 (별도 백엔드 DB 없음)

---

## 3. 핵심 명령어 (Windows PowerShell)
* **개발 서버 실행**:
  ```powershell
  npm.cmd run dev
  # 또는 동일 와이파이 기기 접속 지원 시:
  npm.cmd run dev -- --host
  ```
* **프로덕션 빌드 검증**:
  ```powershell
  npm.cmd run build
  ```

---

## 4. 프로젝트 폴더 및 파일 구조
```
src/
├── App.jsx                     # 메인 탭 라우팅 및 Stitch 헤더 셸
├── index.css                   # Tailwind v4 @theme, 애니메이션 및 토큰 정의
├── main.jsx                    # 진입점
├── pages/
│   ├── HomePage.jsx            # 홈 탭 (환자 요약, D+14 배너, 위험 알림, AI 채팅)
│   ├── CardsPage.jsx           # 지식 카드 탭 (림프부종 예방, 상처 관리 등 6장 카드)
│   ├── ExercisePage.jsx        # 운동 탭 (서울아산병원 기반 시기별 어깨 재활운동)
│   ├── RecordPage.jsx          # 기록 탭 (통증, 체온, 상처 징후, 팔 둘레, 가동범위 등 8개 항목)
│   ├── TrendsPage.jsx          # 추세 탭 (7일 통증/체온/운동 Recharts 그래프)
│   ├── AlertPage.jsx           # 알림 탭 (응급 / 병원 연락 / 주의 관찰 3단계 트리아지)
│   └── SettingsPage.jsx        # 설정 탭 (단계 변경, 데모 데이터 리셋, Gemini 키 입력)
├── components/
│   ├── BottomNav.jsx           # 하단 고정 네비게이션 바 (7개 탭, 알림 뱃지)
│   ├── ExerciseAiModal.jsx     # 운동 영상 안내 및 전면 웹캠 AI 모션 트래킹 모달
│   └── HomeLlmChat.jsx         # 홈 탭 실시간 AI 상담 위젯 (추천 프롬프트 3개)
├── config/
│   └── alertRules.json         # 3단계 위험신호 임계치 규칙 (의학적 판단 분리)
├── data/
│   ├── exercises.json          # 시기별(1주, 2~4주, 4~6주) 어깨 재활운동 목록
│   ├── educationCards.json     # 6가지 질환 이해 및 자가간호 지식 카드
│   └── demoRecords.json        # 10일치 가상 환자 시연용 기록 데이터
└── utils/
    ├── alertEvaluator.js       # 위험신호 룰 엔진 평가 로직
    ├── llmAssistant.js         # 실시간 LLM (GPT-4 / Gemini) 연동 및 환자 컨텍스트 주입
    └── storage.js              # LocalStorage 입출력 및 데모 데이터 초기화
```

---

## 5. 작업 시 주의사항 (Critical Rules)
1. **의학적 진단 금지**: 본 앱은 의료진을 대신하는 진단 도구가 아니며, 자가관리 및 위험신호 조기 감지(스크리닝) 목적임을 항상 명시합니다.
2. **규칙 분리 원칙**: 위험신호 임계치나 운동 데이터는 코드 내에 하드코딩하지 않고 반드시 `src/config/alertRules.json`, `src/data/exercises.json`에 정의된 값을 참조합니다.
3. **모바일 뷰포트**: 세로형 모바일 화면(`max-w-[430px] mx-auto`)에 맞춰 UI가 깨지지 않도록 유지합니다.
4. **한국어 우선**: 코드 주석과 사용자 UI 메시지는 자연스러운 한국어로 작성합니다.
