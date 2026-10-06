export type DeviceCategory = 
  | 'smart_tablet' 
  | 'smart_laptop' 
  | 'desktop_pc' 
  | 'teacher_laptop' 
  | 'printer' 
  | 'monitors' 
  | 'network_ap' 
  | 'server' 
  | 'digital_camera'
  | 'etc';

export type DisposalStatus = 'none' | 'pending' | 'reviewing' | 'approved' | 'disposed';

export interface TonerInfo {
  model: string;
  remainingPercentage: number;
  isCompatible: boolean;
  stockCount: number;
}

export interface SecurityCredentials {
  ipAddress?: string;
  cmosPassword?: string;
  loginPassword?: string;
  wifiPassword?: string;
  lockerKeyNo?: string;
}

export interface Asset {
  id: string;                  // 자산번호 (예: M000005496)
  serialNumber: string;        // 일련번호 / S/N
  name: string;                // 기명/상세 품명 (예: Galaxy Tab S8 Edu, ThinkPad L15 Gen4)
  category: DeviceCategory;
  modelName: string;
  manufacturer: string;
  acquisitionDate: string;    // 취득일자 (YYYY-MM-DD)
  usefulLifeYears: number;     // 내용연수 (년)
  
  // 위치 정보 (장부위치 vs 실치위치)
  ledgerLocation: string;      // 장부상 운용부서 (예: 1학년 1반, 과학실1, 컴퓨터실)
  actualLocation: string;      // 실제 설치/위치 (예: 1학년 1반, 정보담당실, 도서관)
  isLocationMismatch: boolean; // actualLocation !== ledgerLocation
  
  // 담당자 / 사용자 (Zero-PII 준수!)
  assignedRole: string;        // 예: "1학년 담임교사", "도서관 담당교사", "정보업무 담당교사", "행정실 주무관"
  assignedStudentId?: string;  // 예: "3학년 배정학생 #01", "학생용 지정배정 #14"
  
  // 상태 정보
  status: 'normal' | 'repair' | 'storage' | 'disposal_scheduled';
  isUsed?: boolean;            // 사용 여부 (true: 사용, false: 미사용)
  disposalStatus: DisposalStatus;
  disposalReason?: string;     // 불용사유 (예: 내용연수 초과 및 수리 불가, 성능 저하)

  // 스마트단말 전용 옵션 (태블릿 51대, 노트북 44대)
  chargingCartNo?: string;     // 충전함 번호 (예: 1호기 - #05)
  cabinetNo?: string;          // 보관함 번호

  // 프린터 전용 (21대)
  tonerInfo?: TonerInfo;

  // 보안 및 네트워크 마스킹 대상 데이터
  credentials: SecurityCredentials;

  // 비고 / 메모
  remarks?: string;
  updatedAt: string;
}

export type ViewTab = 'building_map' | 'placement' | 'smart_device' | 'printer' | 'disposal' | 'report';

export interface AuditLog {
  id: string;
  timestamp: string;
  assetId: string;
  assetName: string;
  action: string;
  operatorRole: string; // Zero-PII 역할명
  details: string;
}

/**
 * 기기 사용 여부 판별 헬퍼 (isUsed 플래그 우선, 없으면 status 기반)
 * true: 사용 중, false: 미사용 (보관/유휴)
 */
export function isAssetInUse(asset?: { isUsed?: boolean; status?: string } | null): boolean {
  if (!asset) return false;
  if (asset.isUsed !== undefined) {
    return asset.isUsed;
  }
  return asset.status !== 'storage' && asset.status !== 'disposal_scheduled';
}
