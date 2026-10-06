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
}

/**
 * OCR 원본 텍스트에서 O↔0 등 오인식 문자를 교정하여 반환
 */
function correctOcrText(text: string): string {
  return text
    .replace(/[Oo](?=\d)/g, '0')
    .replace(/(?<=\d)[Oo]/g, '0')
    .replace(/\bO\b/g, '0')
    .replace(/[Zz](?=\d{2,3})/g, '2')
    .replace(/[Ii](?=\d)/g, '1')
    .replace(/(?<=\d)[Ii]/g, '1');
}

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
  // 1. 전체 텍스트 준비: 줄바꿈을 공백으로, 연속 공백 제거
  const fullText = rawText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  // OCR 교정본 (숫자 관련 오인식 보정)
  const corrected = correctOcrText(fullText);

  // ─────────────────────────────────────────────
  // 2. 분류번호 추출 (예: 43211507-25937082)
  // ─────────────────────────────────────────────
  const classNoMatch =
    corrected.match(/분류\s*번호\s*[:\s]*([\d-]{10,})/i) ||
    corrected.match(/(\d{8}-\d{8})/);
  const classificationNo = classNoMatch ? classNoMatch[1] : undefined;

  // ─────────────────────────────────────────────
  // 3. 취득단가 추출 (예: 1,257,000)
  // ─────────────────────────────────────────────
  const priceMatch = corrected.match(/취득\s*단가\s*[:\s]*([\d,]+)/i);
  let price = priceMatch ? priceMatch[1] : undefined;

  // OCR이 라벨을 놓치고 "1,257,000 FIL" 처럼 값만 읽었을 경우를 대비한 Fallback (콤마 포함된 숫자 탐색)
  if (!price) {
    const commaNumberMatch = corrected.match(/(?<![\d-])\d{1,3}(,\d{3})+(?![\d-])/);
    if (commaNumberMatch) {
      price = commaNumberMatch[0];
    }
  }

  // ─────────────────────────────────────────────
  // 4. 취득일자 추출
  // ─────────────────────────────────────────────
  let acquisitionYear = new Date().getFullYear();
  let acquisitionMonth = new Date().getMonth() + 1;

  (() => {
    let foundYear: number | null = null;
    let foundMonth: number | null = null;

    // 우선순위 1: "취득일" 또는 "취득일자" 키워드 직후의 완전한 날짜 형식 (예: 취득일 2020-03-30, 취득일자 2020.03.30, 취득일 2020년 3월)
    const directDateMatch = corrected.match(
      /(?:취득\s*일(?:\s*자)?)\s*[:\s]*((?:19|20)\d{2})[-./년\s]+(0?[1-9]|1[0-2])(?:[-./월\s]+(\d{1,2}))?/i
    );
    if (directDateMatch) {
      foundYear = parseInt(directDateMatch[1], 10);
      foundMonth = parseInt(directDateMatch[2], 10);
    }

    // 우선순위 2: 전체 텍스트에서 4자리 연도 기반의 표준 날짜 형식 탐색 (예: 2020-03-30, 2020-03-30(5))
    if (!foundYear) {
      const globalYmdMatch = corrected.match(/(?<![\d-])((?:19|20)\d{2})[-./\s](0?[1-9]|1[0-2])[-./\s](\d{1,2})(?![\d-])/);
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
      const ymMatch = corrected.match(/(?<![\d-])((?:19|20)\d{2})[-./년\s]+(0?[1-9]|1[0-2])(?![0-9])/);
      if (ymMatch) {
        foundYear = parseInt(ymMatch[1], 10);
        foundMonth = parseInt(ymMatch[2], 10);
      }
    }

    if (foundYear) acquisitionYear = foundYear;
    if (foundMonth) acquisitionMonth = foundMonth;
  })();

  // ─────────────────────────────────────────────
  // 5. 자산번호 추출
  // OCR이 "MO00005516" 처럼 O를 섞어 읽는 경우가 많으므로
  // 교정본(corrected)에서 M0000... 패턴 검색
  // ─────────────────────────────────────────────
  const mMatch =
    corrected.match(/\b(M0{4}\d+)\b/i) ||
    corrected.match(/\b(M\d{7,12})\b/i) ||
    corrected.match(/\b(M\d{5,})\b/i);
  const kkrMatch = corrected.match(/(KKR[-\u2013][A-Z0-9-]+)/i);

  const assetId = mMatch
    ? mMatch[1].toUpperCase()
    : `M0000${Math.floor(Math.random() * 89999 + 10000)}`;

  // ─────────────────────────────────────────────
  // 6. 규격명 CSV 파싱 → 품명, 제조사, 모델명 추출
  //
  // 학교 스티커 형식:
  // ─────────────────────────────────────────────
  // 6. 품명, 규격명 CSV 파싱 → 품명, 제조사, 모델명 추출
  //
  // 학교 스티커 형식:
  //   품명 LCD 패널 또는 모니터
  //   규격명 액정모니터, 다나와컴퓨터. SDM-24LEDJH. 60.8cm
  // ─────────────────────────────────────────────
  let name = '';
  let manufacturer = '';
  let modelName = '';

  // 1) 라벨에 명시된 "품명" 우선 추출 (예: 품명 LCD 패널 또는 모니터, 품명 데스크톱컴퓨터)
  const explicitNameMatch = fullText.match(/품\s*명\s*[:\s]*([^\r\n규분취비,\t]{2,})/i);
  if (explicitNameMatch && explicitNameMatch[1].trim()) {
    name = explicitNameMatch[1].trim();
  }

  // 2) 규격명 CSV 파싱
  const specAfterKeyword = fullText.match(/규\s*격\s*명?\s*[:\s]*([^규분취비\r\n]{5,})/i);
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

  if (!name && specParts.length >= 1) {
    name = specParts[0].replace(/,.*$/, '').trim();
  }
  if (specParts.length >= 2) {
    manufacturer = specParts[1].replace(/[.]*$/, '').trim();
  }
  if (specParts.length >= 3) {
    modelName = specParts[2].replace(/[.]*$/, '').trim();
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
  }

  // ─────────────────────────────────────────────
  // 7. 위치 추출
  // 비고 행: "KKR-GAN-... / M000005516 / 교무실 / 초등교무센터(2층)"
  // ─────────────────────────────────────────────
  let location = '';

  // 비고 행에서 슬래시 구분 위치 탐색
  const remarkLineMatch = fullText.match(/비\s*고\s*[:\s]*(.+?)(?=취득|분류|품명|규격|※|$)/i);
  if (remarkLineMatch) {
    const slashParts = remarkLineMatch[1].split('/').map((p: string) => p.trim());
    for (const part of slashParts) {
      if (
        /\d학년/.test(part) ||
        /교무실|행정실|과학실|컴퓨터실|도서관|교실|음악|보건|영양|특수|늘봄|영어실|정보실|초등교무/.test(part)
      ) {
        location = part.replace(/\(.*?\)/g, '').trim();
        if (!location) continue; // 괄호만 있는 경우 건너뜀
        break;
      }
    }
    // 슬래시 구분이 없을 때 비고 전체에서 위치 키워드 탐색
    if (!location) {
      const allText = remarkLineMatch[1];
      if (allText.includes('교무실') || allText.includes('초등교무센터')) location = '교무실';
      else if (allText.includes('행정실')) location = '행정실';
      else if (/\d학년/.test(allText)) {
        const gm = allText.match(/(\d학년\s*\d*반?교실?)/);
        location = gm ? gm[1] : allText.match(/(\d학년)/)?.[1] + '교실' || '';
      }
    }
  }

  // 전체 텍스트 fallback
  if (!location) {
    if (fullText.includes('교무실') || fullText.includes('초등교무센터')) location = '교무실';
    else if (fullText.includes('행정실')) location = '행정실';
    else if (fullText.includes('과학실')) location = '과학실';
    else if (fullText.includes('컴퓨터실')) location = '컴퓨터실';
    else if (fullText.includes('도서관')) location = '도서관';
    else if (/\d학년/.test(fullText)) {
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
  };
}

/**
 * Canvas API를 이용해 이미지를 OCR에 최적화된 형태로 전처리
 */
function preprocessImageForOcr(file: File | Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX_DIM = 2000;
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

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const contrast = 60;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const c = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
        data[i] = c;
        data[i + 1] = c;
        data[i + 2] = c;
      }

      ctx.putImageData(imageData, 0, 0);

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = w;
      finalCanvas.height = h;
      const finalCtx = finalCanvas.getContext('2d')!;
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, w, h);
      finalCtx.drawImage(canvas, 0, 0);

      resolve(finalCanvas);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file as Blob);
  });
}

function canvasToBase64(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  return dataUrl.split(',')[1];
}

/**
 * 이미지 파일 → Google Cloud Vision API → 파싱 결과 반환
 */
export async function scanTagImage(
  imageFile: File | Blob | string,
  onProgress?: (progress: number, status: string) => void
): Promise<ParsedTagResult> {
  if (onProgress) onProgress(0.1, '📷 이미지 전처리 중 (용량 최적화 및 흑백 변환)...');

  let base64Image = '';

  if (imageFile instanceof File || imageFile instanceof Blob) {
    try {
      const preprocessed = await preprocessImageForOcr(imageFile);
      base64Image = canvasToBase64(preprocessed);
    } catch (preprocessErr) {
      console.warn('이미지 전처리 실패:', preprocessErr);
      throw new Error('이미지 처리 중 오류가 발생했습니다.');
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

  const text = data.text || '';

  if (onProgress) onProgress(0.9, '✅ 인식 데이터 필드 파싱 중...');

  return parseTagText(text);
}
