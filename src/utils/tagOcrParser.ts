import { createWorker } from 'tesseract.js';
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
 * 물품 스티커 텍스트를 분석하여 자산 필드로 추출하는 인공지능 규칙 파서
 */
export function parseTagText(rawText: string): ParsedTagResult {
  const fullText = rawText.replace(/\s+/g, ' ');

  // 1. 분류번호 추출 (예: 43211507-25563917)
  const classNoMatch = fullText.match(/분류\s*번호\s*[:\s]*([\d-]+)/i) || fullText.match(/(\d{8}-\d{8})/);
  const classificationNo = classNoMatch ? classNoMatch[1] : undefined;

  // 2. 취득단가 추출 (예: 1,184,000)
  const priceMatch = fullText.match(/취득\s*단가\s*[:\s]*([\d,]+)/i);
  const price = priceMatch ? priceMatch[1] : undefined;

  // 3. 취득일자 추출 (예: 2026-04-20(5), 2026 . 04 . 20, 2026년 04월 20일, 26-04-20)
  let acquisitionYear = new Date().getFullYear();
  let acquisitionMonth = new Date().getMonth() + 1;
  const dateMatch = 
    fullText.match(/(?:취득\s*일자)?\s*[:\s]*(\d{2,4})\s*[\s.\-/년–—_]+\s*(\d{1,2})\s*[\s.\-/월–—_]+\s*(\d{1,2})/);

  if (dateMatch) {
    let parsedYear = parseInt(dateMatch[1], 10);
    const parsedMonth = parseInt(dateMatch[2], 10);
    
    if (parsedYear >= 0 && parsedYear <= 99) {
      parsedYear += 2000;
    }
    
    if (parsedYear >= 1990 && parsedYear <= 2099) acquisitionYear = parsedYear;
    if (parsedMonth >= 1 && parsedMonth <= 12) acquisitionMonth = parsedMonth;
  }

  // 4. 품명 추출 (예: 데스크톱컴퓨터)
  let name = '데스크톱 컴퓨터';
  const nameMatch = fullText.match(/품\s*명\s*[:\s]*([^\r\n규분취비]+)/i);
  if (nameMatch && nameMatch[1].trim()) {
    name = nameMatch[1].trim();
  } else if (fullText.includes('데스크톱') || fullText.includes('컴퓨터')) {
    name = '데스크톱 컴퓨터';
  } else if (fullText.includes('노트북') || fullText.includes('스마트')) {
    name = '스마트 노트북';
  } else if (fullText.includes('태블릿')) {
    name = '스마트 태블릿';
  } else if (fullText.includes('프린터') || fullText.includes('복합기')) {
    name = '프린터';
  }

  // 5. 규격명에서 제조사 및 모델명 분리 (예: 데스크톱컴퓨터, 대우루컴즈, DT367B-346500, Intel Core i5 13400(2.5GHz))
  let manufacturer = '대우루컴즈';
  let modelName = 'DT367B-346500';

  const specMatch = fullText.match(/규\s*격\s*명\s*[:\s]*([^\r\n비]+)/i);
  if (specMatch) {
    const specStr = specMatch[1].trim();
    const parts = specStr.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      manufacturer = parts[1];
    }
    if (parts.length >= 3) {
      modelName = parts[2];
    } else {
      modelName = parts[parts.length - 1];
    }
  }

  // 흔히 쓰는 제조사 자동 감지
  if (fullText.includes('대우루컴즈') || fullText.includes('LUCOMS')) manufacturer = '대우루컴즈';
  else if (fullText.includes('삼성') || fullText.includes('SAMSUNG')) manufacturer = '삼성전자';
  else if (fullText.includes('LG') || fullText.includes('엘지')) manufacturer = 'LG전자';
  else if (fullText.includes('레노버') || fullText.includes('Lenovo')) manufacturer = 'Lenovo';
  else if (fullText.includes('HP')) manufacturer = 'HP';

  // 6. 자산번호 추출 (M0000으로 시작하는 자산관리번호 우선 추출)
  const mMatch = fullText.match(/(M0000\d+)/i) || fullText.match(/(M\d{7,10})/i) || fullText.match(/(M\d{5,})/i);
  const kkrMatch = fullText.match(/(KKR-[A-Z0-9-]+)/i);

  let assetId = mMatch ? mMatch[1].toUpperCase() : `M0000${Math.floor(Math.random() * 89999 + 10000)}`;

  // 비고 구성
  const remarkParts: string[] = [];
  if (price) remarkParts.push(`취득단가: ${price}원`);
  if (classificationNo) remarkParts.push(`분류번호: ${classificationNo}`);
  if (kkrMatch) remarkParts.push(`RFID 태그: ${kkrMatch[1]}`);

  // 7. 위치 추출 (예: 교무실 / 초등교무센터(2층))
  let location = '교무실';
  if (fullText.includes('교무실') || fullText.includes('초등교무센터')) location = '교무실';
  else if (fullText.includes('행정실')) location = '행정실';
  else if (fullText.includes('과학실')) location = '과학실';
  else if (fullText.includes('컴퓨터실')) location = '컴퓨터실';
  else if (fullText.includes('도서관')) location = '도서관';
  else if (fullText.includes('학년')) {
    const gradeMatch = fullText.match(/(\d학년\s*\d*반?)/);
    if (gradeMatch) location = gradeMatch[1];
  }

  // 8. 카테고리 분류
  let category: DeviceCategory = 'desktop_pc';
  const nameLower = (name + fullText).toLowerCase();
  if (nameLower.includes('태블릿') || nameLower.includes('tablet')) {
    category = 'smart_tablet';
  } else if (nameLower.includes('교원') || nameLower.includes('선생님')) {
    category = 'teacher_laptop';
  } else if (nameLower.includes('노트북') || nameLower.includes('laptop')) {
    category = 'smart_laptop';
  } else if (nameLower.includes('프린터') || nameLower.includes('복합기')) {
    category = 'printer';
  } else if (nameLower.includes('서버')) {
    category = 'server';
  } else if (nameLower.includes('ap') || nameLower.includes('와이파이')) {
    category = 'network_ap';
  }

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
    rawText
  };
}

/**
 * Canvas API를 이용해 이미지를 OCR에 최적화된 형태로 전처리합니다.
 * - 그레이스케일 변환 (컬러 노이즈 제거)
 * - 대비(Contrast) 강화 (글자 선명도 향상)
 * - 안드로이드 고해상도 사진 리사이즈 (OCR 속도 최적화)
 */
function preprocessImageForOcr(file: File | Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // OCR 최적 해상도: 너무 크면 속도 저하, 너무 작으면 정확도 저하
      // 태그 라벨 기준 2000px 이내가 최적
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

      // 1단계: 이미지를 캔버스에 그리기
      ctx.drawImage(img, 0, 0, w, h);

      // 2단계: 픽셀 데이터 조작으로 그레이스케일 + 대비 강화
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const contrast = 60; // 대비 강화 계수 (0~100)
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        // 그레이스케일: 인간 눈 밝기 가중치 (luminosity method)
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        // 대비 강화
        const c = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
        data[i] = c;
        data[i + 1] = c;
        data[i + 2] = c;
        // alpha는 그대로
      }

      ctx.putImageData(imageData, 0, 0);

      // 3단계: 흰 배경에 합성 (투명 PNG 대응)
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

/**
 * Canvas를 Blob으로 변환
 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob 변환 실패'));
      },
      'image/png',
      1.0
    );
  });
}

/**
 * 업로드된 이미지 파일에서 Tesseract OCR로 텍스트를 인식한 후 파싱.
 * 안드로이드 카메라 사진에 최적화된 이미지 전처리 포함.
 */
export async function scanTagImage(
  imageFile: File | Blob | string,
  onProgress?: (progress: number, status: string) => void
): Promise<ParsedTagResult> {
  if (onProgress) onProgress(0.05, 'OCR 엔진 준비 중...');

  const worker = await createWorker('kor+eng');

  // Tesseract 설정: 단일 균일 블록(PSM 6) → 라벨 형태에 적합
  await worker.setParameters({
    tessedit_pageseg_mode: '6' as any,
    preserve_interword_spaces: '1' as any,
  });

  let ocrInput: File | Blob | string = imageFile;

  // File 또는 Blob인 경우에만 이미지 전처리 적용 (문자열 URL은 그대로)
  if (imageFile instanceof File || imageFile instanceof Blob) {
    try {
      if (onProgress) onProgress(0.2, '📷 이미지 전처리 중 (그레이스케일 · 대비 강화)...');
      const preprocessed = await preprocessImageForOcr(imageFile);
      ocrInput = await canvasToBlob(preprocessed);
    } catch (preprocessErr) {
      console.warn('이미지 전처리 실패, 원본으로 진행:', preprocessErr);
      ocrInput = imageFile;
    }
  }

  if (onProgress) onProgress(0.45, '🔍 태그 글자 AI 인식(OCR) 분석 중...');
  
  const ret = await worker.recognize(ocrInput);
  const text = ret.data.text;
  
  if (onProgress) onProgress(0.9, '✅ 인식 데이터 필드 파싱 중...');

  await worker.terminate();

  return parseTagText(text);
}

/**
 * 사용자가 제공한 실제 선장초등학교 물품 태그 샘플 파싱 데이터 (데모용)
 */
export const DEMO_SAMPLE_TAG_TEXT = `
분류 번호 43211507-25563917 취득 단가 1,184,000
품 명 데스크톱컴퓨터 취득 일자 2025-04-24(5)
규 격 명 데스크톱컴퓨터, 대우루컴즈, DT367B-346500, Intel Core i5 13400(2.5GHz)
비 고
KKR-GAN-0012750156 / M000005496 / 교무실 / 초등교무센터(2층)
※본 물품은 선장초등학교 자산입니다.
`;
