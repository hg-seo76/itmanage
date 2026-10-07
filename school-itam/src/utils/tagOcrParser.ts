// Google Cloud Vision API 기반 태그 파서
import type { DeviceCategory } from '../types/asset';

export interface ParsedTagResult {
  assetId: string;
  name: string;
  category: DeviceCategory;
  manufacturer: string;
  modelName: string;
  acquisitionYear: number;
  acquisitionMonth: number;
  location: string;
  price?: string;
  classificationNo?: string;
  remarks?: string;
  rawText: string;
  mCandidates?: string[];
}

/**
 * M0000 계열 자산번호 정규화 (대소문자 무관, 공백/하이픈 제거, O/o/D/Q -> 0 변환)
 * 예: "mo00004435" -> "M000004435", "M-000000009" -> "M000000009", "M 0000 1234" -> "M00001234"
 */
export function normalizeM0000Code(str: string): string {
  if (!str) return '';
  let s = str.trim();
  // 접두사 오인식 (IVI, 1V1, IV, RN, N 등) 보정
  s = s.replace(/^(?:IVI|IV1|1VI|1V1|RN|rn|N|n)(?=[O0oDQ\s\d])/i, 'M');
  if (/^[Mm]/i.test(s)) {
    let afterM = s.slice(1).replace(/[\s\-_.]/g, '').replace(/[OoDQ]/g, '0');
    // 학교 표준 10자리(M + 9자리 숫자) 자동 0 패딩 보정 (예: OCR이 0을 몇 개 빼먹은 경우 M004447 -> M000004447)
    if (afterM.length >= 4 && afterM.length < 9) {
      afterM = afterM.padStart(9, '0');
    }
    return 'M' + afterM.toUpperCase();
  }
  return s.toUpperCase();
}

/**
 * 텍스트 전체에서 M0000 (또는 유사 패턴) 자산번호 후보들을 모두 탐색하여 유효 순위별로 정렬 반환
 */
export function findAllM0000Candidates(text: string): string[] {
  if (!text) return [];
  // 1) 표준 M/N/IVI + 000... 패턴 (중간 공백 완벽 지원)
  const matches = Array.from(
    text.matchAll(/(?:[MmNn]|IVI|1V1|IV)[\s\-_.]*[0OoDQ]{2,8}[\s\-_.]*\d{1,6}/gi)
  );

  const candidates: string[] = [];
  for (const m of matches) {
    const normalized = normalizeM0000Code(m[0]);
    // M00... 형태이고 최소 6글자 이상인 경우
    if (/^M0{2,}\d+$/.test(normalized) && normalized.length >= 6) {
      if (!candidates.includes(normalized)) {
        candidates.push(normalized);
      }
    }
  }

  // 2) KKR- 슬래시 바로 뒤의 ID 토큰 탐색 (예: KKR-... / MO00004447 / ...)
  const kkrSlashTokens = Array.from(
    text.matchAll(/KKR[\s\-_A-Z0-9]+?[\/|]\s*([A-Za-z0-9\s]{4,15})[\/|]/gi)
  );
  for (const km of kkrSlashTokens) {
    const normalized = normalizeM0000Code(km[1]);
    if (/^M0{2,}\d+$/.test(normalized) && normalized.length >= 6) {
      if (!candidates.includes(normalized)) {
        candidates.push(normalized);
      }
    }
  }

  // 3) 분리형 태그: /숫자(4~8자리)/교실 형태 탐색 (M이 완전히 누락되거나 N으로 분리된 경우도 복원)
  const roomPrecedingTokens = Array.from(
    text.matchAll(/[\/|\n\s](0{2,8}\d{2,6})\s*[\/|]\s*(?:[가-힣\d\s]+(?:교실|실|관|부서|센터))/gi)
  );
  for (const rm of roomPrecedingTokens) {
    const normalized = normalizeM0000Code('M' + rm[1]);
    if (/^M0{2,}\d+$/.test(normalized) && normalized.length >= 6) {
      if (!candidates.includes(normalized)) {
        candidates.push(normalized);
      }
    }
  }

  // 선장초/충남교육청 공식 표준 형식 (M + 00000(5개) + 4자리 숫자 = 총 10자리) 최우선 정렬
  candidates.sort((a, b) => {
    const aIsM00000 = /^M0{5}[1-9]\d{3}$/.test(a);
    const bIsM00000 = /^M0{5}[1-9]\d{3}$/.test(b);
    if (aIsM00000 && !bIsM00000) return -1;
    if (!aIsM00000 && bIsM00000) return 1;

    const aIsTen = /^M\d{9}$/.test(a);
    const bIsTen = /^M\d{9}$/.test(b);
    if (aIsTen && !bIsTen) return -1;
    if (!aIsTen && bIsTen) return 1;

    return 0;
  });

  return candidates;
}

/**
 * OCR 원본 텍스트에서 O↔0 등 오인식 문자를 교정하여 반환
 */
function correctOcrText(text: string): string {
  return text
    // 1. M 00000 4435 등 공백/하이픈/오탈자가 섞인 M00000 계열 집중 교정
    .replace(/(?:[Mm]|(?:IVI|1V1|IV))[\s\-_.]*[0OoDQ]{3,8}[\s\-_.]*\d{1,6}/gi, (m) => normalizeM0000Code(m))
    // 2. KKR- 슬래시/파이프 내부의 MO000... 형태 교정
    .replace(/([\/|]\s*)([Mm][O0oDQ\s\d-]{4,})(\s*[\/|])/gi, (_, p1, id, p2) => p1 + normalizeM0000Code(id) + p2)
    .replace(/[Oo](?=\d)/g, '0')
    .replace(/(?<=\d)[Oo]/g, '0')
    .replace(/\bO\b/g, '0')
    .replace(/[Zz](?=\d{2,3})/g, '2')
    .replace(/[Ii](?=\d)/g, '1')
    .replace(/(?<=\d)[Ii]/g, '1');
}

const schoolRoomsRegex = /교무실|행정실|급식실|영양실|영양사실|조리실|과학실|컴퓨터실|도서관|도서실|방송실|보건실|돌봄교실|늘봄교실|음악실|미술실|체육관|강당|당직실|인쇄실|회의실|상담실|위클래스|Wee클래스|영어실|어학실|특수학급|특수교실|유치원|교장실|행정실장실|숙직실|서고|문서고|동아리실|학생회실|진로상담실|전산실|스마트교실|무한상상실|메이커스페이스|서버실|초등교무|초등교무센터|초등교무실|중등교무실|교원연구실/;

/**
 * 물품 스티커 텍스트를 분석하여 자산 필드로 추출하는 파서
 *
 * ※ 학교 자산 스티커 OCR 특성:
 *   - Google Vision이 행 순서와 상관없이 텍스트 블록을 반환
 *   - "분류 번호", "품명", "규격명", "비 고" 등 레이블이 값과 분리되어 나옴
 *   - 자산번호(M0000...)가 비고 행의 슬래시 구분 항목에 포함
 *   - O(알파벳)과 0(숫자) 혼동 빈번
 */
export function parseTagText(rawText: string): ParsedTagResult {
  // 전체 M0000 후보군 사전 추출
  const rawMCandidates = findAllM0000Candidates(rawText);

  // 1. 다중 스티커(타 학교 전입 전 구 라벨 + 선장초등학교 현 라벨) 감지 및 타겟팅
  // KKR- 또는 선장초등학교 RFID 라벨이 감지되면 해당 영역을 최우선으로 타겟팅
  let targetText = rawText;
  if (/선장초|선장|아산\s*선장/i.test(rawText) || /KKR[-\u2013]/i.test(rawText)) {
    const kkrPos = rawText.search(/KKR[-\u2013]/i);
    const sunjangPos = rawText.search(/선장초등학교|선장초/i);
    const keyPos = kkrPos !== -1 ? kkrPos : sunjangPos;
    if (keyPos !== -1) {
      // keyPos 앞의 가장 가까운 "분류번호" 또는 시작점으로 슬라이스
      const startIdx = Math.max(0, rawText.lastIndexOf('분류번호', keyPos));
      targetText = rawText.slice(startIdx);

      // 이전 학교(아산공수초 등)가 여전히 앞에 포함되어 있다면, 두 번째 분류번호로 슬라이스하여 완벽 분리
      if (/아산공수|공수초/i.test(targetText)) {
        const secondClassIdx = targetText.indexOf('분류번호', 5);
        if (secondClassIdx !== -1) {
          targetText = targetText.slice(secondClassIdx);
        }
      }
    }
  }

  // 1. 전체 텍스트 준비: 줄바꿈을 공백으로, 연속 공백 제거
  const fullText = targetText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  // OCR 교정본 (숫자 관련 오인식 보정)
  const corrected = correctOcrText(fullText);

  // ─────────────────────────────────────────────
  // 2. RFID 태그 및 슬래시 구조 (KKR-GAN-xxx / M0000xxx / 위치) 최우선 추출
  // 충남 교육청 RFID 정식 라벨 형식: KKR-GAN-0011513160 / MO00004435 / 급식실
  // ─────────────────────────────────────────────
  const kkrSlashMatch = corrected.match(
    /(?:[•*·]\s*)?(KKR[\s\-_A-Z0-9]+?)\s*[\/|]\s*([A-Z0-9\s]+?)\s*[\/|]\s*([가-힣A-Za-z0-9\s()]+)/i
  );
  let rfidAssetId = '';
  let rfidLocation = '';
  const kkrMatch = corrected.match(/(KKR[\s\-_A-Z0-9]+)/i);

  if (kkrSlashMatch) {
    const rawId = normalizeM0000Code(kkrSlashMatch[2]);
    if (/^M0{2,}\d+/i.test(rawId) || /^M\d{5,}/i.test(rawId)) {
      rfidAssetId = rawId.toUpperCase();
    }
    const locCandidate = kkrSlashMatch[3]
      .replace(/이\s*물품은.*$/i, '')
      .replace(/※.*$/i, '')
      .replace(/\(.*?\)/g, '')
      .trim();
    if (locCandidate) {
      const locMatch = locCandidate.match(schoolRoomsRegex);
      rfidLocation = locMatch ? locMatch[0] : locCandidate.replace(/(?:취득|단가|규격|분류|선장초|이\s*물품).*$/i, '').trim();
    }
  }

  // ─────────────────────────────────────────────
  // 3. 자산번호 추출 (★ M00000(5개) 고유번호 최우선 집중 탐색 ★)
  // ─────────────────────────────────────────────
  let assetId = '';

  // 1) RFID 슬래시 매칭에서 추출된 ID가 M0000/M00000 형식인 경우 최우선 확정
  if (rfidAssetId && /^M0{2,}\d+/i.test(rfidAssetId)) {
    assetId = rfidAssetId;
  }

  // 2) 타겟 영역(현재 학교 스티커)에서 선장초 공식 표준 (M00000 + 4자리: 총 10자리) 우선 탐색
  if (!assetId) {
    const targetCandidates = findAllM0000Candidates(targetText);
    const standardCandidate = targetCandidates.find(c => /^M0{5}[1-9]\d{3}$/.test(c));
    if (standardCandidate) {
      assetId = standardCandidate;
    } else if (targetCandidates.length > 0) {
      assetId = targetCandidates[0];
    }
  }

  // 3) 전체 텍스트에서 선장초 공식 표준(M00000 + 4자리) 탐색 (이전 학교 구 스티커 번호보다 항상 최우선)
  if (!assetId || !/^M0{5}[1-9]\d{3}$/.test(assetId)) {
    const standardCandidate = rawMCandidates.find(c => /^M0{5}[1-9]\d{3}$/.test(c));
    if (standardCandidate) {
      assetId = standardCandidate;
    }
  }

  // 4) 명시적 키워드 (고유번호, 물품번호, 자산번호, RFID, 바코드) 직후의 번호
  if (!assetId) {
    const explicitIdMatch = corrected.match(
      /(?:고유\s*번호|물품\s*번호|자산\s*번호|RFID|바코드)\s*[:\s]*([A-Za-z0-9\s-]+)/i
    );
    if (explicitIdMatch && explicitIdMatch[1].length >= 4) {
      const norm = normalizeM0000Code(explicitIdMatch[1]);
      if (/^M0{2,}\d+/i.test(norm)) {
        assetId = norm;
      }
    }
  }

  // 5) rawMCandidates의 최우선 후보 (선장초 M00000 표준 순서로 기정렬됨)
  if (!assetId && rawMCandidates.length > 0) {
    assetId = rawMCandidates[0];
  }

  // 6) 일반 M 번호 fallback (M0... 이상)
  if (!assetId) {
    const mMatch =
      corrected.match(/\b(M0{2,}\d+)\b/i) ||
      corrected.match(/\b(M\d{7,12})\b/i) ||
      corrected.match(/\b(M\d{5,})\b/i);
    assetId = mMatch ? normalizeM0000Code(mMatch[1]) : '';
  }

  // ─────────────────────────────────────────────
  // 4. 분류번호 추출 (예: 43211507-25937082)
  // ─────────────────────────────────────────────
  const classNoMatch =
    corrected.match(/분류\s*번호\s*[:\s]*([\d-]{10,})/i) ||
    corrected.match(/(\d{8}-\d{8})/);
  const classificationNo = classNoMatch ? classNoMatch[1] : undefined;

  // ─────────────────────────────────────────────
  // 5. 취득단가 & 취득일자 추출 (표 형태 레이아웃 우선 지원)
  // ─────────────────────────────────────────────
  let price: string | undefined = undefined;
  let acquisitionYear = new Date().getFullYear();
  let acquisitionMonth = new Date().getMonth() + 1;

  // 패턴 A: 취득단가 취득일자 1,115,690 2017-03-29(5) (스티커 표형식 OCR)
  const tableHeaderMatch = corrected.match(
    /취득\s*단가\s*취득\s*일자\s*[:\s]*([\d,]+)\s+((?:19|20)\d{2}[-./년\s]+\d{1,2}(?:[-./월\s]+\d{1,2})?)/i
  );
  if (tableHeaderMatch) {
    price = tableHeaderMatch[1];
    const dMatch = tableHeaderMatch[2].match(/((?:19|20)\d{2})[-./년\s]+(1[0-2]|0?[1-9])/);
    if (dMatch) {
      acquisitionYear = parseInt(dMatch[1], 10);
      acquisitionMonth = parseInt(dMatch[2], 10);
    }
  }

  // 패턴 B: 취득단가 또는 단가 직접 매칭
  if (!price) {
    const priceMatch = corrected.match(/(?:취득\s*)?단가\s*[:\s]*([\d,]+)/i);
    price = priceMatch ? priceMatch[1] : undefined;
  }

  // Fallback: 콤마 포함된 5자리 이상 숫자 탐색 (예: 1,115,690 또는 125,000)
  if (!price) {
    const commaNumberMatch = corrected.match(/(?<![\d-])\d{1,3}(,\d{3})+(?![\d-])/);
    if (commaNumberMatch) {
      price = commaNumberMatch[0];
    }
  }

  // 패턴 C: 취득일자 매칭 (패턴 A에서 못 찾았을 경우)
  (() => {
    let foundYear: number | null = null;
    let foundMonth: number | null = null;

    // 우선순위 1: "취득일" 또는 "취득일자" 키워드 직후의 완전한 날짜 형식
    const directDateMatch = corrected.match(
      /(?:취득\s*일(?:\s*자)?)\s*[:\s]*((?:19|20)\d{2})[-./년\s]+(1[0-2]|0?[1-9])(?:[-./월\s]+(\d{1,2}))?/i
    );
    if (directDateMatch) {
      foundYear = parseInt(directDateMatch[1], 10);
      foundMonth = parseInt(directDateMatch[2], 10);
    }

    // 우선순위 2: 전체 텍스트에서 4자리 연도 기반의 표준 날짜 형식 탐색 (예: 2020-03-30, 2020-03-30(5), 2017-03-29(5))
    if (!foundYear) {
      const globalYmdMatch = corrected.match(/(?<![\d-])((?:19|20)\d{2})[-./\s](1[0-2]|0?[1-9])[-./\s](\d{1,2})(?![\d-])/);
      if (globalYmdMatch) {
        foundYear = parseInt(globalYmdMatch[1], 10);
        foundMonth = parseInt(globalYmdMatch[2], 10);
      }
    }

    // 우선순위 3: "취득일" 또는 "취득일자" 컨텍스트(주변 80자 이내)에서 4자리 연도 + 월 토큰 탐색
    if (!foundYear) {
      const dateContextMatch = corrected.match(/(?:취득\s*일(?:\s*자)?)\s*[:\s]*(.{0,80})/i);
      const dateContext = dateContextMatch ? dateContextMatch[1] : '';
      const numTokens = dateContext.match(/\d+/g) || [];

      for (let i = 0; i < numTokens.length; i++) {
        const n = parseInt(numTokens[i], 10);
        const raw = numTokens[i];

        if (raw.length === 4 && n >= 1990 && n <= 2099) {
          foundYear = n;
          if (i + 1 < numTokens.length) {
            const nextN = parseInt(numTokens[i + 1], 10);
            if (nextN >= 1 && nextN <= 12) foundMonth = nextN;
          }
          break;
        }
      }
    }

    // 우선순위 4: 전체 텍스트에서 4자리 연도 + 월 (예: 2020년 3월, 2020.03)
    if (!foundYear) {
      const ymMatch = corrected.match(/(?<![\d-])((?:19|20)\d{2})[-./년\s]+(1[0-2]|0?[1-9])(?![0-9])/);
      if (ymMatch) {
        foundYear = parseInt(ymMatch[1], 10);
        foundMonth = parseInt(ymMatch[2], 10);
      }
    }

    if (foundYear) acquisitionYear = foundYear;
    if (foundMonth) acquisitionMonth = foundMonth;
  })();

  // ─────────────────────────────────────────────
  // 7. 품명, 규격명 CSV 파싱 → 품명, 제조사, 모델명 추출
  //
  // 학교 스티커 형식:
  //   품명 LCD 패널 또는 모니터
  //   규격명 액정모니터, 다나와컴퓨터. SDM-24LEDJH. 60.8cm
  // ─────────────────────────────────────────────
  let name = '';
  let manufacturer = '';
  let modelName = '';

  // 1) 라벨에 명시된 "품명" 우선 추출 (예: 품명 LCD 패널 또는 모니터, 품명 데스크톱컴퓨터)
  const explicitNameMatch = fullText.match(
    /품\s*명\s*[:\s]*(.+?)(?=규격|분류|취득|비고|단가|내용연수|운용|설치|KKR|※|$)/i
  );
  if (explicitNameMatch && explicitNameMatch[1].trim()) {
    name = explicitNameMatch[1].replace(/^[•*·\s]+/, '').replace(/[:=,\s]+$/, '').trim();
  }

  // 1-2) 분류번호 바로 다음 줄/단어에 품명이 위치한 레이아웃 지원
  if (!name) {
    const classNoFollowMatch = fullText.match(/분류\s*번호\s*[\d-]+\s+([가-힣A-Za-z0-9]+)/);
    if (classNoFollowMatch && !/^(취득|규격|비고|단가|운용|설치)/.test(classNoFollowMatch[1])) {
      name = classNoFollowMatch[1].trim();
    }
  }

  // 2) 규격명 CSV 파싱
  const specAfterKeyword = fullText.match(
    /규\s*격\s*명?\s*[:\s]*(.+?)(?=취득|분류|품명|비고|단가|내용연수|운용|설치|※|$)/i
  );
  let specParts: string[] = [];

  if (specAfterKeyword) {
    const specStr = specAfterKeyword[1].trim();
    if (specStr.includes(',')) {
      specParts = specStr.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    }
    // 쉼표 분할이 2개 이하이고 점(.)이나 가운뎃점(·)이 포함되어 있다면 점으로도 분할 지원 (OCR이 쉼표를 마침표로 오인식한 경우)
    if (specParts.length < 3 && /[.·]/.test(specStr)) {
      const dotParts = specStr.split(/[,.·]\s+/).map((p: string) => p.trim()).filter((p: string) => p.length > 0);
      if (dotParts.length >= 3) {
        specParts = dotParts;
      }
    }
  }

  // 전략 B: 텍스트 어딘가에 있는 "품목, 제조사, 모델명, ..." 형태의 패턴 직접 탐지
  if (specParts.length < 2) {
    const specCsvDirect = fullText.match(
      /([가-힣]{2,}(?:컴퓨터|태블릿|노트북|프린터|복합기|서버|모니터|스캐너)?)\s*[,.·]\s*([가-힣A-Za-z]{2,})\s*[,.·]\s*([A-Za-z0-9][A-Za-z0-9\-_.]+)/
    );
    if (specCsvDirect) {
      specParts = [specCsvDirect[1].trim(), specCsvDirect[2].trim(), specCsvDirect[3].trim()];
    }
  }

  const knownMfrPattern = /삼성|LG|엘지|삼보|다나와|레노버|Lenovo|HP|대우루컴즈|루컴즈|라인피아|주연테크|한성|에이서|ASUS|아수스|DELL|델|애플|Apple|캐논|Canon|니콘|Nikon|소니|Sony|신도리코|후지/i;

  if (specParts.length >= 2 && knownMfrPattern.test(specParts[0])) {
    // 규격명 첫 항목이 이미 제조사인 경우: [제조사, 모델명, ...]
    if (!manufacturer) manufacturer = specParts[0].replace(/[.]*$/, '').trim();
    if (!modelName) modelName = specParts[1].replace(/[.]*$/, '').trim();
  } else {
    // 표준 규격명: [품목명, 제조사, 모델명, ...]
    if (!name && specParts.length >= 1) {
      name = specParts[0].replace(/,.*$/, '').trim();
    }
    if (specParts.length >= 2) {
      manufacturer = specParts[1].replace(/[.]*$/, '').trim();
    }
    if (specParts.length >= 3) {
      modelName = specParts[2].replace(/[.]*$/, '').trim();
    }
  }

  // 모델명 fallback: 텍스트 내에서 모델 품번/규격 코드 직접 탐지 (예: DT166-G671-OU01, SDM-24LEDJH, NT900X5N)
  if (!modelName) {
    const modelPattern = /\b([A-Z0-9]{2,8}[-_][A-Z0-9]{2,8}(?:[-_][A-Z0-9]+)?)\b/i;
    const modelMatch = fullText.match(modelPattern);
    if (modelMatch && !/^KKR-/i.test(modelMatch[1])) {
      modelName = modelMatch[1].trim();
    }
  }

  // 모델명, 품명, 제조사 후처리 정제 (불필요한 후행 라벨 및 기호 제거)
  if (modelName) {
    modelName = modelName
      .replace(/(?:단가|취득|비고|규격|분류|KKR|선장초|내용연수|운용).*$/i, '')
      .replace(/[:=,\s]+$/, '')
      .trim();
  }
  if (name) {
    name = name.replace(/[:=,\s]+$/, '').trim();
  }
  if (manufacturer) {
    manufacturer = manufacturer.replace(/[:=,\s]+$/, '').trim();
  }

  // 품명 fallback
  if (!name) {
    if (fullText.includes('데스크톱') || fullText.includes('컴퓨터')) {
      name = '데스크톱컴퓨터';
    } else if (fullText.includes('모니터') || fullText.includes('lcd')) {
      name = '액정모니터';
    } else if (fullText.includes('노트북')) {
      name = '노트북';
    } else if (fullText.includes('태블릿')) {
      name = '태블릿';
    } else if (fullText.includes('프린터') || fullText.includes('복합기')) {
      name = '프린터';
    } else if (fullText.includes('디지털카메라') || fullText.includes('카메라') || fullText.includes('캠코더')) {
      name = '디지털카메라';
    }
  }

  // 제조사 fallback (키워드 감지)
  if (!manufacturer) {
    if (fullText.includes('다나와') || fullText.includes('danawa')) manufacturer = '다나와컴퓨터';
    else if (fullText.includes('라인피아') || fullText.toLowerCase().includes('linepia')) manufacturer = '라인피아';
    else if (fullText.includes('대우루컴즈') || fullText.includes('LUCOMS')) manufacturer = '대우루컴즈';
    else if (fullText.includes('삼성') || fullText.includes('SAMSUNG')) manufacturer = '삼성전자';
    else if (fullText.includes('LG') || fullText.includes('엘지')) manufacturer = 'LG전자';
    else if (fullText.includes('레노버') || fullText.includes('Lenovo')) manufacturer = 'Lenovo';
    else if (fullText.includes('HP')) manufacturer = 'HP';
    else if (fullText.includes('캐논') || fullText.includes('Canon')) manufacturer = 'Canon';
    else if (fullText.includes('니콘') || fullText.includes('Nikon')) manufacturer = 'Nikon';
    else if (fullText.includes('소니') || fullText.includes('SONY')) manufacturer = 'SONY';
  }

  // ─────────────────────────────────────────────
  // 8. 위치 추출
  // 비고 행: "KKR-GAN-... / M000005516 / 교무실 / 초등교무센터(2층)"
  // ─────────────────────────────────────────────
  let location = rfidLocation;

  // 1순위: 설치장소, 운용부서, 사용위치, 배치위치 키워드
  if (!location) {
    const locKeyMatch = fullText.match(/(?:설치\s*장소|운용\s*부서|사용\s*위치|배치\s*위치)\s*[:\s]*([^\r\n취분품규비※]{2,20})/i);
    if (locKeyMatch) {
      location = locKeyMatch[1].replace(/\(.*?\)/g, '').trim();
    }
  }

  // RFID 슬래시에서 위치를 못 찾았을 때 비고 행에서 슬래시 구분 위치 탐색
  if (!location) {
    const remarkLineMatch = fullText.match(/비\s*고\s*[:\s]*(.+?)(?=취득|분류|품명|규격|※|$)/i);
    if (remarkLineMatch) {
      const slashParts = remarkLineMatch[1].split(/[\/|]/).map((p: string) => p.trim());
      for (const part of slashParts) {
        const roomM = part.match(schoolRoomsRegex);
        if (roomM) {
          location = roomM[0];
          break;
        }
        if (/\d학년/.test(part)) {
          const gm = part.match(/(\d학년\s*\d*반?교실?)/);
          location = gm ? gm[1] : (part.match(/(\d학년)/)?.[1] + '교실' || part.replace(/\(.*?\)/g, '').trim());
          if (location) break;
        }
      }
      // 슬래시 구분이 없을 때 비고 전체에서 위치 키워드 탐색
      if (!location) {
        const allText = remarkLineMatch[1];
        const matchRoom = allText.match(schoolRoomsRegex);
        if (matchRoom) {
          location = matchRoom[0];
        } else if (/\d학년/.test(allText)) {
          const gm = allText.match(/(\d학년\s*\d*반?교실?)/);
          location = gm ? gm[1] : allText.match(/(\d학년)/)?.[1] + '교실' || '';
        }
      }
    }
  }

  // 전체 텍스트 fallback
  if (!location) {
    const matchRoom = fullText.match(schoolRoomsRegex);
    if (matchRoom) {
      location = matchRoom[0];
    } else if (/\d학년/.test(fullText)) {
      const gm = fullText.match(/(\d학년\s*\d*반?교실?)/);
      if (gm) location = gm[1];
      else {
        const sg = fullText.match(/(\d학년)/);
        if (sg) location = sg[1] + '교실';
      }
    }
  }

  // ─────────────────────────────────────────────
  // 8. 카테고리 분류 (모니터, 컴퓨터, 노트북, 태블릿 등 정밀 분류)
  // ─────────────────────────────────────────────
  let category: DeviceCategory = 'etc';
  const nameLower = (name + ' ' + (specParts[0] || '') + ' ' + fullText).toLowerCase();
  if (nameLower.includes('태블릿') || nameLower.includes('tablet') || nameLower.includes('아이패드') || nameLower.includes('ipad') || nameLower.includes('갤럭시탭')) {
    category = 'smart_tablet';
  } else if (nameLower.includes('교원') || nameLower.includes('선생님')) {
    category = 'teacher_laptop';
  } else if (nameLower.includes('노트북') || nameLower.includes('laptop') || nameLower.includes('씽크패드') || nameLower.includes('thinkpad') || nameLower.includes('그램')) {
    category = 'smart_laptop';
  } else if (nameLower.includes('모니터') || nameLower.includes('monitor') || nameLower.includes('lcd') || nameLower.includes('액정') || nameLower.includes('화면')) {
    category = 'monitors';
  } else if (nameLower.includes('프린터') || nameLower.includes('printer') || nameLower.includes('복합기') || nameLower.includes('복사기')) {
    category = 'printer';
  } else if (nameLower.includes('서버') || nameLower.includes('server')) {
    category = 'server';
  } else if (nameLower.includes('ap') || nameLower.includes('와이파이') || nameLower.includes('공유기')) {
    category = 'network_ap';
  } else if (nameLower.includes('디지털카메라') || nameLower.includes('디카') || nameLower.includes('카메라') || nameLower.includes('camera') || nameLower.includes('캠코더')) {
    category = 'digital_camera';
  } else if (nameLower.includes('데스크톱') || nameLower.includes('데스크탑') || nameLower.includes('본체') || nameLower.includes('컴퓨터')) {
    category = 'desktop_pc';
  }

  // ─────────────────────────────────────────────
  // 9. 비고 문자열 구성
  // ─────────────────────────────────────────────
  const remarkParts: string[] = [];
  if (price) remarkParts.push(`취득단가: ${price}원`);
  if (classificationNo) remarkParts.push(`분류번호: ${classificationNo}`);
  if (kkrMatch) remarkParts.push(`RFID 태그: ${kkrMatch[1]}`);

  return {
    assetId,
    name,
    category,
    manufacturer,
    modelName,
    acquisitionYear,
    acquisitionMonth,
    location,
    price,
    classificationNo,
    remarks: remarkParts.length > 0 ? remarkParts.join(' | ') : 'RFID 태그 AI 스캔 자동 등록',
    rawText,
    mCandidates: rawMCandidates,
  };
}

/**
 * Canvas API를 이용해 이미지를 OCR에 최적화된 형태로 전처리
 * (원본 색상/디테일을 온전히 보존하면서 전송 용량만 2048px 이하로 안전하게 리사이징)
 */
function preprocessImageForOcr(file: File | Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX_DIM = 2048;
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > MAX_DIM || h > MAX_DIM) {
        const scale = MAX_DIM / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file as Blob);
  });
}

function canvasToBase64(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  return dataUrl.split(',')[1];
}

function fileToBase64Direct(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 이미지 파일 → Google Cloud Vision API → 파싱 결과 반환
 */
export async function scanTagImage(
  imageFile: File | Blob | string,
  onProgress?: (progress: number, status: string) => void
): Promise<ParsedTagResult> {
  if (onProgress) onProgress(0.1, '📷 이미지 준비 중...');

  let base64Image = '';

  if (imageFile instanceof File || imageFile instanceof Blob) {
    try {
      // 3.8MB 이하의 경우 카메라 원본 해상도와 EXIF 회전 정보를 100% 보존하기 위해 원본 직접 전송
      if (imageFile.size > 0 && imageFile.size <= 3.8 * 1024 * 1024) {
        base64Image = await fileToBase64Direct(imageFile);
      } else {
        const preprocessed = await preprocessImageForOcr(imageFile);
        base64Image = canvasToBase64(preprocessed);
      }
    } catch (preprocessErr) {
      console.warn('이미지 전처리 실패, 원본 직접 전송 시도:', preprocessErr);
      base64Image = await fileToBase64Direct(imageFile);
    }
  } else {
    throw new Error('문자열 URL 이미지는 지원하지 않습니다. 파일 객체가 필요합니다.');
  }

  if (onProgress) onProgress(0.5, '☁️ Google Cloud AI 텍스트 분석 중...');

  const response = await fetch('/api/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64Image }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Google Vision API 호출 실패');
  }

  // 1순위: Gemini Vision AI가 직접 정밀 추출한 구조화 데이터가 있으면 즉시 반환
  if (data.parsed) {
    const p = data.parsed;
    if (onProgress) onProgress(1.0, '✨ 최신 Vision AI 분석 완료!');
    const parsedAssetId = normalizeM0000Code(p.assetId || '');
    return {
      assetId: parsedAssetId,
      name: p.name || '',
      category: p.category || 'desktop_pc',
      manufacturer: p.manufacturer || '',
      modelName: p.modelName || '',
      acquisitionYear: Number(p.acquisitionYear) || new Date().getFullYear(),
      acquisitionMonth: Number(p.acquisitionMonth) || 1,
      location: p.location || '',
      price: p.price ? String(p.price) : undefined,
      classificationNo: p.classificationNo,
      remarks: p.remarks || 'Vision AI 태그 자동 분석 등록',
      rawText: JSON.stringify(p, null, 2),
      mCandidates: parsedAssetId ? [parsedAssetId] : [],
    };
  }

  const text = data.text || '';

  if (onProgress) onProgress(0.9, '✅ 인식 데이터 필드 파싱 중...');

  return parseTagText(text);
}

/**
 * OCR 전체 텍스트에서 사용자가 원터치로 입력 칸에 채울 수 있는 유효 단어/구문 토큰 목록 추출
 */
export function extractOcrTokens(rawText: string): string[] {
  if (!rawText) return [];

  // ★ 0순위: M0000 계열 고유 자산번호 최우선 수집
  const mCodes = findAllM0000Candidates(rawText);

  // 불필요한 라벨성 단어 제외 필터
  const skipPattern = /^(이\s*물품은|선장초등학교|아산공수초등학교|자산입니다|비고|규격명?|품명|분류번호|취득일자?|취득단가|단가|내용연수|운용부서|설치장소|고유번호|물품번호|규격|확인|등록)$/i;

  // 1) 의미 단위 분할 (줄바꿈, 슬래시, 쉼표, 특수기호)
  const segments = rawText
    .split(/[\r\n/|•·,]+/)
    .map(s => s.trim().replace(/^[:\-\s]+|[:\-\s]+$/g, ''))
    .filter(s => s.length >= 2 && s.length <= 40 && !skipPattern.test(s));

  // 2) 단어 단위 분할 (자산번호, 모델명, 단가, 날짜, 실명 등 핵심 단어 추출)
  const words: string[] = [];
  rawText.split(/\s+/).forEach(token => {
    const clean = token.replace(/^[()[\]{}<>•·,:"'-]+|[()[\]{}<>•·,:"'-]+$/g, '').trim();
    if (clean.length >= 2 && clean.length <= 35 && !skipPattern.test(clean)) {
      if (
        /^M[O0\d]{4,}/i.test(clean) ||
        /\d{1,3}(,\d{3})+/.test(clean) ||
        /\d{4}[-./]\d{1,2}[-./]\d{1,2}/.test(clean) ||
        /[A-Z0-9]{2,8}[-_][A-Z0-9]{2,8}/i.test(clean) ||
        /교무실|행정실|급식실|과학실|컴퓨터실|도서관|방송실|보건실|돌봄|늘봄|교실/i.test(clean) ||
        /컴퓨터|노트북|모니터|태블릿|프린터|카메라/i.test(clean) ||
        /삼성|LG|삼보|다나와|레노버|HP|루컴즈|라인피아/i.test(clean)
      ) {
        words.push(clean);
      }
    }
  });

  // 중복 제거 및 정제 (M0000 계열이 최상단에 오도록 순서 유지)
  const unique = Array.from(new Set([...mCodes, ...segments, ...words]));
  return unique.filter(t => t.length >= 2 && !/^\d{1}$/.test(t));
}

