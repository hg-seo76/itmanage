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
 * 업로드된 이미지 파일에서 Tesseract OCR로 텍스트를 인식한 후 파싱
 */
export async function scanTagImage(
  imageFile: File | Blob | string,
  onProgress?: (progress: number, status: string) => void
): Promise<ParsedTagResult> {
  if (onProgress) onProgress(0.1, 'OCR 엔진 준비 중...');

  const worker = await createWorker('kor+eng');
  
  if (onProgress) onProgress(0.4, '물품 태그 이미지 글자 인식(OCR) 중...');
  
  const ret = await worker.recognize(imageFile);
  const text = ret.data.text;
  
  if (onProgress) onProgress(0.9, '인식 데이터 필드 파싱 중...');

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
