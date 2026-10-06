/**
 * 기기 일괄등록용 CSV 양식 생성 및 다운로드
 * + CSV 파싱 후 Asset 배열로 변환하는 importAssetsFromCsv 함수
 */

import type { Asset, DeviceCategory, DisposalStatus } from '../types/asset';

// ─────────────────────────────────────────────
// 컬럼 헤더 (한글 라벨 → 내부 필드명)
// ─────────────────────────────────────────────
export const CSV_COLUMNS: { label: string; field: keyof Asset | string; example: string; required: boolean }[] = [
  { label: '자산번호',        field: 'id',                example: 'M000005496',           required: true  },
  { label: '기기명',          field: 'name',              example: 'Galaxy Tab S8 Edu',    required: true  },
  { label: '기기종류',        field: 'category',          example: 'smart_tablet',         required: true  },
  { label: '모델명',          field: 'modelName',         example: 'SM-X700',              required: true  },
  { label: '제조사',          field: 'manufacturer',      example: 'Samsung',              required: true  },
  { label: '일련번호',        field: 'serialNumber',      example: 'R52T301ABCD',          required: true  },
  { label: '취득일자',        field: 'acquisitionDate',   example: '2024-03-01',           required: true  },
  { label: '내용연수(년)',    field: 'usefulLifeYears',   example: '5',                    required: false },
  { label: '위치',            field: 'location',          example: '3학년 1반',             required: true  },
  { label: '사용자직책',      field: 'assignedRole',      example: '3학년 1반 담임',        required: true  },
  { label: '상태',            field: 'status',            example: 'normal',               required: false },
  { label: '충전카트번호',    field: 'chargingCartNo',    example: '1호기-#03',            required: false },
  { label: '보관함번호',      field: 'cabinetNo',         example: 'A-02',                 required: false },
  { label: '토너모델',        field: 'tonerModel',        example: 'CLT-K406S',            required: false },
  { label: '토너잔량(%)',     field: 'tonerRemaining',    example: '80',                   required: false },
  { label: '토너재고수',      field: 'tonerStock',        example: '2',                    required: false },
  { label: 'IP주소',          field: 'ipAddress',         example: '192.168.1.100',        required: false },
  { label: 'CMOS암호',        field: 'cmosPassword',      example: '(보안-생략가능)',       required: false },
  { label: 'WiFi암호',        field: 'wifiPassword',      example: '(보안-생략가능)',       required: false },
  { label: '비고',            field: 'remarks',           example: '스크래치 있음',         required: false },
];

// 기기종류 안내 주석 행
const CATEGORY_GUIDE = [
  '# [기기종류 참고값]',
  '# smart_tablet = 스마트 태블릿',
  '# smart_laptop  = 교육용 노트북',
  '# teacher_laptop = 교원용 노트북',
  '# desktop_pc    = 데스크탑 PC',
  '# printer       = 프린터',
  '# monitors      = 모니터',
  '# network_ap    = 네트워크/AP',
  '# server        = 서버',
  '# digital_camera= 디지털카메라',
  '# etc           = 기타',
];

// 상태 안내 주석 행
const STATUS_GUIDE = [
  '# [상태 참고값]',
  '# normal             = 정상',
  '# repair             = 수리중',
  '# storage            = 보관중',
  '# disposal_scheduled = 불용 예정',
];

// 샘플 데이터 행 3개
const SAMPLE_ROWS = [
  [
    'M000005496', 'Galaxy Tab S8 Edu', 'smart_tablet', 'SM-X700', 'Samsung',
    'R52T301ABCD', '2024-03-01', '5', '3학년 1반', '3학년 1반 담임',
    'normal', '1호기-#03', '', '', '', '', '192.168.1.101', '', '', '정상 사용중',
  ],
  [
    'M000005497', 'ThinkPad L15 Gen4', 'smart_laptop', 'L15 Gen4', 'Lenovo',
    'MP2X12345', '2024-03-01', '5', '4학년 1반', '4학년 1반 담임',
    'normal', '2호기-#01', '', '', '', '', '192.168.1.102', '', '', '',
  ],
  [
    'M000005498', 'LG 그램 14', 'teacher_laptop', 'LG 14Z90R', 'LG',
    'LGT30011ABC', '2024-03-01', '5', '교무실', '교무부장',
    'normal', '', 'B-03', '', '', '', '192.168.1.103', '', '', '교원 배정 노트북',
  ],
];

// ─────────────────────────────────────────────
// CSV 직렬화 (셀에 쉼표/줄바꿈 있으면 따옴표 처리)
// ─────────────────────────────────────────────
function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ─────────────────────────────────────────────
// 다운로드 트리거
// ─────────────────────────────────────────────
export function downloadBulkTemplate(): void {
  const headers = CSV_COLUMNS.map(c => escapeCell(c.label));

  const lines: string[] = [
    // 안내 주석
    '# =====================================================',
    '# 학교 IT 자산관리 시스템 - 기기 일괄등록 양식 (CSV)',
    '# =====================================================',
    '# 이 파일을 엑셀 또는 구글 스프레드시트로 열어 작성 후',
    '# 프로그램 > 일괄 가져오기 버튼으로 업로드하세요.',
    '# * 표시 컬럼은 필수 입력입니다.',
    '#',
    ...CATEGORY_GUIDE,
    '#',
    ...STATUS_GUIDE,
    '#',
    '# ─────────────────────────────────────────────',
    // 필수여부 행
    CSV_COLUMNS.map(c => escapeCell(c.required ? '* 필수' : '선택')).join(','),
    // 헤더 행
    headers.join(','),
    // 예시 행 (주석)
    '# 아래는 예시 데이터입니다. 삭제 후 실제 데이터를 입력하세요.',
    // 샘플 3행
    ...SAMPLE_ROWS.map(row => row.map(escapeCell).join(',')),
  ];

  const BOM = '\uFEFF'; // Excel UTF-8 인식용 BOM
  const csvContent = BOM + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `기기_일괄등록_양식_${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
// CSV → Asset[] 파싱 (일괄 가져오기용)
// ─────────────────────────────────────────────
export interface ImportResult {
  success: Asset[];
  errors: { row: number; message: string }[];
}

export function importAssetsFromCsv(csvText: string): ImportResult {
  const lines = csvText.split(/\r?\n/);
  const success: Asset[] = [];
  const errors: { row: number; message: string }[] = [];

  // 헤더 행 위치 찾기 (주석 제외)
  let headerRowIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('#') && lines[i].includes('자산번호')) {
      headerRowIndex = i;
      break;
    }
  }
  if (headerRowIndex === -1) {
    errors.push({ row: 0, message: '헤더 행(자산번호 포함)을 찾을 수 없습니다.' });
    return { success, errors };
  }

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  // 헤더 → 컬럼 인덱스 맵핑
  const headerCells = parseRow(lines[headerRowIndex]);
  const colIndex: Record<string, number> = {};
  CSV_COLUMNS.forEach(col => {
    const idx = headerCells.findIndex(h => h.replace(/\*/g, '').trim() === col.label);
    if (idx !== -1) colIndex[col.field as string] = idx;
  });

  const get = (cells: string[], field: string): string =>
    colIndex[field] !== undefined ? (cells[colIndex[field]] ?? '') : '';

  // 데이터 행 파싱 (필수 여부 행 + 헤더 행 + 주석 건너뜀)
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.startsWith('#')) continue;

    const cells = parseRow(line);
    const rowNum = i + 1;

    const id = get(cells, 'id');
    const name = get(cells, 'name');
    const category = get(cells, 'category') as DeviceCategory;
    const ledgerLocation = get(cells, 'ledgerLocation');
    const actualLocation = get(cells, 'actualLocation') || ledgerLocation;
    const serialNumber = get(cells, 'serialNumber');
    const assignedRole = get(cells, 'assignedRole');

    // 필수 항목 검증
    if (!id) { errors.push({ row: rowNum, message: '자산번호가 비어 있습니다.' }); continue; }
    if (!name) { errors.push({ row: rowNum, message: `[${id}] 기기명이 비어 있습니다.` }); continue; }
    if (!category) { errors.push({ row: rowNum, message: `[${id}] 기기종류가 비어 있습니다.` }); continue; }
    if (!ledgerLocation) { errors.push({ row: rowNum, message: `[${id}] 장부위치가 비어 있습니다.` }); continue; }

    const tonerRemaining = parseInt(get(cells, 'tonerRemaining')) || 100;
    const tonerStock = parseInt(get(cells, 'tonerStock')) || 0;
    const tonerModel = get(cells, 'tonerModel');

    const status = (get(cells, 'status') || 'normal') as Asset['status'];
    const usefulLifeYears = parseInt(get(cells, 'usefulLifeYears')) || 5;

    const asset: Asset = {
      id,
      name,
      category,
      modelName: get(cells, 'modelName'),
      manufacturer: get(cells, 'manufacturer'),
      serialNumber,
      acquisitionDate: get(cells, 'acquisitionDate') || new Date().toISOString().slice(0, 10),
      usefulLifeYears,
      ledgerLocation,
      actualLocation,
      isLocationMismatch: ledgerLocation !== actualLocation,
      assignedRole,
      status,
      disposalStatus: 'none' as DisposalStatus,
      chargingCartNo: get(cells, 'chargingCartNo') || undefined,
      cabinetNo: get(cells, 'cabinetNo') || undefined,
      tonerInfo: tonerModel ? { model: tonerModel, remainingPercentage: tonerRemaining, isCompatible: true, stockCount: tonerStock } : undefined,
      credentials: {
        ipAddress: get(cells, 'ipAddress') || undefined,
        cmosPassword: get(cells, 'cmosPassword') || undefined,
        wifiPassword: get(cells, 'wifiPassword') || undefined,
      },
      remarks: get(cells, 'remarks') || undefined,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    success.push(asset);
  }

  return { success, errors };
}
