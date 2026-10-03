# AGENT IMPLEMENTATION PLAN: School-ITAM (Privacy-Safe Edition)

> **문서 목적:** 본 문서는 AI 코딩 에이전트(Google Antigravity)가 학교 정보화기기 통합관리 시스템(`School-ITAM`)을 처음부터 끝까지 자율적으로 구축하기 위한 표준 실행 명세서(Execution Spec)입니다. 에이전트는 아래 정의된 보안 규칙, 데이터 스키마, 디렉터리 구조, 단계별 체크리스트를 엄격히 준수하여 코드를 생성하고 실행해야 합니다.

---

## 1. 핵심 보안 및 개인정보 보호 절대 수칙 (Strict Guardrails)

1. **Zero-PII (실명 사용 절대 금지):**
   - 모든 소스코드, 초기 데이터(`sanitizedAssets.ts`), 주석, UI 화면에 교직원 및 학생의 **실명(개인 이름)을 절대 표기하지 않는다**.
   - 교직원 담당자는 반드시 **`1학년 담임교사`**, **`도서관 담당교사`**, **`정보업무 담당교사`**, **`행정실 주무관`**, **`보건교사`**, **`특수교사`**, **`급식/영양담당`** 등 **직책/역할명(Role)**으로만 표기한다[cite: 4, 5].
   - 학생 사용자는 반드시 **`3학년 배정학생 #01`**, **`학생용 지정배정 #01`** 등 **학년 + 고유번호** 코드로만 표기한다[cite: 4].
2. **네트워크 및 암호 기본 마스킹 (`privacyMode`):**
   - 앱의 전역 상태인 `privacyMode`의 기본값은 항상 `true`로 설정한다.
   - `privacyMode === true`일 때 모든 IP 주소는 중간 대역을 마스킹(`10.41.***.86`)하여 표시하고, CMOS 암호·PC 로그인 암호·무선망(AP) 비밀번호·보관함 열쇠 번호는 `••••••••`로 숨김 처리한다[cite: 4, 5].
3. **장부 위치 불일치 자동 감지:**
   - `actualLocation`(현 설치위치)과 `ledgerLocation`(RFID 스티커 기준 운용부서)을 비교하여 두 값이 다를 경우 `isLocationMismatch = true`로 판정하고, UI에 빨간색 경고 배지(`! 장부위치 불일치`)를 렌더링한다.

---

## 2. 기술 스택 및 아키텍처 (Tech Stack)

- **Framework:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS + `lucide-react` (아이콘)
- **State & Persistence:** React Hooks (`useState`, `useMemo`, `useEffect`) + `localStorage` 자동 동기화 (새로고침 시에도 수정 내역 유지)
- **Print Support:** `@media print` CSS 유틸리티 적용 (인쇄 시 사이드바·검색창·필터 버튼 자동 숨김)

---

## 3. 목표 디렉터리 및 파일 구조 (Target Directory Structure)

에이전트는 다음 파일 트리를 정확히 생성해야 합니다.

```text
school-itam/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── asset.ts                # 전체 데이터 인터페이스 정의
    ├── data/
    │   └── sanitizedAssets.ts      # 비식별화 완료된 213대 자산 초기 데이터
    └── components/
        ├── Sidebar.tsx             # 좌측 네비게이션 및 개인정보 보호 배지
        ├── Header.tsx              # 검색창, 보안 마스킹 토글, 인쇄 버튼
        ├── KpiCards.tsx            # 상단 4대 핵심 요약 지표 카드
        └── views/
            ├── RoomPlacementView.tsx   # 탭1: 교실별 기기 배치 및 인수인계 뷰
            ├── SmartDeviceView.tsx     # 탭2: 스마트단말(태블릿 51/노트북 44) 뷰
            ├── PrinterTonerView.tsx    # 탭3: 프린터(21대) 및 토너 재고 매칭 뷰
            ├── DisposalKanbanView.tsx  # 탭4: 불용/폐기 예정(21건) 칸반 보드
            └── EduReportView.tsx       # 탭5: 교육청 제출용 현황통계 자동 집계표