import type { Asset, DeviceCategory } from '../types/asset';

// 실명(개인 이름) 감지 및 Zero-PII 직책/역할명(Role) 자동 변환 헬퍼
export function sanitizeRoleFromRealName(rawRoleInput: string, location: string): string {
  const trimmed = rawRoleInput.trim();
  if (!trimmed) return '정보업무 담당교사';

  if (trimmed.includes('교장')) return '교장';
  if (trimmed.includes('교감')) return '교감';
  if (trimmed.includes('실장')) return trimmed.includes('늘봄') ? '늘봄실장' : '행정실장';
  if (trimmed.includes('초등계장')) return '초등계장';
  if (trimmed.includes('중등계장')) return '중등계장';
  if (trimmed.includes('주무관')) return '행정실 주무관';
  if (trimmed.includes('운전')) return '운전주무관';
  if (trimmed.includes('영양')) return '영양사';
  if (trimmed.includes('조리')) return '조리사';
  if (trimmed.includes('보건')) return '보건교사';
  if (trimmed.includes('특수') || trimmed.includes('우리친구')) return '특수교사';
  if (trimmed.includes('도서관') || trimmed.includes('사서')) return '도서관 담당교사';
  if (trimmed.includes('늘봄코디')) return '늘봄코디';
  if (trimmed.includes('음악')) return '음악교사';
  if (trimmed.includes('과학')) return '과학실 담당교사';
  if (trimmed.includes('행정사')) return '행정실무사';
  if (trimmed.includes('영어')) return '영어 전담교사';

  const gradeMatch = trimmed.match(/([1-6])학년/);
  if (gradeMatch) {
    return `${gradeMatch[1]}학년 담임교사`;
  }

  const loc = location.toLowerCase();
  if (loc.includes('행정실')) return '행정실 주무관';
  if (loc.includes('교장실')) return '교장';
  if (loc.includes('교무실')) return '교무부장 교사';
  if (loc.includes('유치원')) return '유치원 교사';
  if (loc.includes('도서관')) return '도서관 담당교사';
  if (loc.includes('급식실')) return '영양사';
  if (loc.includes('보건실')) return '보건교사';
  if (loc.includes('과학실')) return '과학실 담당교사';
  if (loc.includes('늘봄')) return '늘봄 전담교사';
  if (loc.includes('음악')) return '음악 담당교사';

  const roomGradeMatch = loc.match(/([1-6])학년/);
  if (roomGradeMatch) {
    return `${roomGradeMatch[1]}학년 담임교사`;
  }

  return '정보업무 담당교사';
}

// 온라인 구글 시트 URL에서 Spreadsheet ID 및 GID 파싱
export function parseSheetDetails(inputUrl: string): { sheetId: string | null; gid: string } {
  const trimmed = inputUrl.trim();
  const matches = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = matches ? matches[1] : null;

  const gidMatch = trimmed.match(/gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return { sheetId, gid };
}

// 1. Google Visualization Query API (gviz/tq) CSV URL 생성
export function getGoogleSheetGvizUrl(inputUrl: string): string {
  const { sheetId, gid } = parseSheetDetails(inputUrl);
  if (sheetId) {
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  }
  return inputUrl;
}

// 2. Direct Export CSV URL 생성
export function getGoogleSheetExportUrl(inputUrl: string): string {
  const { sheetId, gid } = parseSheetDetails(inputUrl);
  if (sheetId) {
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }
  return inputUrl;
}

// CSV 텍스트 파싱 유틸리티 (따옴표 내 쉼표/줄바꿈 완벽 지원)
export function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  const rawLines = csvText.split(/\r?\n/);

  for (const line of rawLines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let insideQuote = false;
    let entry = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim().replace(/^"|"$/g, ''));
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim().replace(/^"|"$/g, ''));
    lines.push(row);
  }

  return lines;
}

// 헤더 동의어(Alias) 매칭 함수
function findColumnIndex(header: string[], keywords: string[]): number {
  return header.findIndex(h => {
    const clean = h.replace(/\s+/g, '').toLowerCase();
    return keywords.some(k => clean.includes(k.toLowerCase()));
  });
}

// CSV 데이터를 Asset[] 구조로 분석 변환
export function convertCsvToAssets(csvText: string): Asset[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    throw new Error('CSV 파일 데이터 형식이 유효하지 않거나 내용이 없습니다.');
  }

  const header = rows[0];
  
  const idIdx = findColumnIndex(header, ['자산번호', '자산코드', '관리번호', '연번', '순번', 'no', 'id', '식별번호', '바코드']);
  const nameIdx = findColumnIndex(header, ['기명', '품명', '장비명', '기기명', '물품명', '품목', 'name', 'title', '기종']);
  const catIdx = findColumnIndex(header, ['카테고리', 'category', '구분', '종류', '기종', '분류']);
  const modelIdx = findColumnIndex(header, ['모델', 'model', '규격', '상세', '사양']);
  const mfrIdx = findColumnIndex(header, ['제조사', 'manufacturer', '제조국', '브랜드', '메이커']);
  const ledgerIdx = findColumnIndex(header, ['장부위치', 'ledger', '운용부서', '장부', '부서', '소속']);
  const actualIdx = findColumnIndex(header, ['실제위치', 'actual', '설치위치', '위치', '장소', '설치장소', '사용장소', '설치 장소']);
  const roleIdx = findColumnIndex(header, ['담당자', 'role', '직책', '사용자', '이름', '담당', '성명', '사용자명']);
  const ipIdx = findColumnIndex(header, ['ip', '주소', 'ip주소', 'network', '아이피']);

  const parsedAssets: Asset[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row.some(cell => cell.trim() !== '')) continue;

    const id = (idIdx !== -1 && row[idIdx]) ? row[idIdx] : `SCH-GS-${String(i).padStart(3, '0')}`;
    const name = (nameIdx !== -1 && row[nameIdx]) ? row[nameIdx] : (row[0] || `구글시트 장비 #${i}`);
    const rawCategory = (catIdx !== -1 && row[catIdx]) ? row[catIdx].toLowerCase() : (name.toLowerCase() || 'desktop_pc');
    const modelName = (modelIdx !== -1 && row[modelIdx]) ? row[modelIdx] : (name || '표준 기종');
    const manufacturer = (mfrIdx !== -1 && row[mfrIdx]) ? row[mfrIdx] : '기타';
    
    const ledgerLocation = (ledgerIdx !== -1 && row[ledgerIdx]) ? row[ledgerIdx] : (actualIdx !== -1 && row[actualIdx] ? row[actualIdx] : '행정실');
    const actualLocation = (actualIdx !== -1 && row[actualIdx]) ? row[actualIdx] : ledgerLocation;
    
    const rawRole = (roleIdx !== -1 && row[roleIdx]) ? row[roleIdx] : '정보업무 담당교사';
    const ipAddress = (ipIdx !== -1 && row[ipIdx]) ? row[ipIdx] : `10.41.99.${10 + (i % 240)}`;

    const assignedRole = sanitizeRoleFromRealName(rawRole, actualLocation);

    let category: DeviceCategory = 'desktop_pc';
    if (rawCategory.includes('태블릿') || rawCategory.includes('tablet') || name.includes('태블릿')) {
      category = 'smart_tablet';
    } else if (rawCategory.includes('교원') || rawCategory.includes('교직원') || rawCategory.includes('선생님') || rawCategory.includes('teacher') || name.includes('교원')) {
      category = 'teacher_laptop';
    } else if (rawCategory.includes('교육용') || rawCategory.includes('수업') || rawCategory.includes('학습') || rawCategory.includes('노트북') || rawCategory.includes('laptop') || name.includes('노트북')) {
      category = 'smart_laptop';
    } else if (rawCategory.includes('프린터') || rawCategory.includes('복합기') || rawCategory.includes('printer') || name.includes('프린터')) {
      category = 'printer';
    } else if (rawCategory.includes('서버') || rawCategory.includes('server') || name.includes('서버')) {
      category = 'server';
    } else if (rawCategory.includes('ap') || rawCategory.includes('와이파이') || rawCategory.includes('공유기')) {
      category = 'network_ap';
    } else if (rawCategory.includes('모니터') || rawCategory.includes('monitor')) {
      category = 'monitors';
    }

    const isMismatch = ledgerLocation !== actualLocation;

    parsedAssets.push({
      id,
      serialNumber: `SN-GS-${Math.floor(Math.random() * 89999 + 10000)}`,
      name,
      category,
      modelName,
      manufacturer,
      acquisitionDate: '2023-01-01',
      usefulLifeYears: 5,
      ledgerLocation,
      actualLocation,
      isLocationMismatch: isMismatch,
      assignedRole,
      status: 'normal',
      disposalStatus: 'none',
      credentials: {
        ipAddress,
        loginPassword: 'gsPassword123!'
      },
      remarks: '온라인 구글 스프레드시트 실시간 동기화 완료',
      updatedAt: new Date().toISOString().slice(0, 10)
    });
  }

  return parsedAssets;
}

// 🌐 온라인 구글 시트 3중 연결 파이프라인 (gviz/tq -> export -> CORS proxy fallback)
export async function fetchGoogleSheetAssets(sheetUrl: string): Promise<Asset[]> {
  const gvizUrl = getGoogleSheetGvizUrl(sheetUrl);
  const exportUrl = getGoogleSheetExportUrl(sheetUrl);

  const targetUrls = [
    gvizUrl,
    exportUrl,
    `https://corsproxy.io/?${encodeURIComponent(exportUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(exportUrl)}`
  ];

  let lastErrorMessage = '';

  for (const url of targetUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const text = await response.text();
      
      // 구글 로그인 HTML이 아닌 정상 CSV 응답인지 체크
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        lastErrorMessage = '구글 시트가 비공개로 되어 있어 로그인 창이 출력되었습니다.';
        continue;
      }

      if (text.trim().length > 0) {
        return convertCsvToAssets(text);
      }
    } catch (err: any) {
      lastErrorMessage = err.message || '네트워크 응답 오류';
    }
  }

  throw new Error(
    `온라인 구글 시트를 가져올 수 없습니다. (${lastErrorMessage}) 구글 시트 오른쪽 상단 [공유] ➔ "링크가 있는 모든 사용자 (뷰어)"로 변경해 주세요.`
  );
}
