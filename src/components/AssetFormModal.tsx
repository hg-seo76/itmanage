import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Wifi, 
  MapPin, 
  UserCheck,
  Camera
} from 'lucide-react';
import type { Asset, DeviceCategory } from '../types/asset';
import { BUILDING_STRUCTURE } from '../data/buildingLayout';
import { TagScannerModal } from './TagScannerModal';
import type { ParsedTagResult } from '../utils/tagOcrParser';

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetToEdit?: Asset | null;
  initialData?: { location?: string; assignedRole?: string } | null;
  onSaveAsset: (assetData: Partial<Asset>) => void;
  onDeleteAsset?: (assetId: string) => void;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  onClose,
  assetToEdit,
  initialData,
  onSaveAsset,
  onDeleteAsset
}) => {
  const isEditing = !!assetToEdit;

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DeviceCategory>('desktop_pc');
  const [modelName, setModelName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [location, setLocation] = useState('');
  
  // 실별 사용자 풀다운 전용 상태
  const [assignedRole, setAssignedRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState('');

  const [assignedStudentId, setAssignedStudentId] = useState('');
  const [acquisitionYear, setAcquisitionYear] = useState<number>(new Date().getFullYear());
  const [acquisitionMonth, setAcquisitionMonth] = useState<number>(new Date().getMonth() + 1);
  const [ipAddress, setIpAddress] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [chargingCartNo, setChargingCartNo] = useState('');
  const [cabinetNo, setCabinetNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isTagScannerOpen, setIsTagScannerOpen] = useState(false);

  const handleApplyTagData = (data: ParsedTagResult) => {
    if (data.assetId) setId(data.assetId);
    if (data.name) setName(data.name);
    if (data.category) setCategory(data.category);
    if (data.manufacturer) setManufacturer(data.manufacturer);
    if (data.modelName) setModelName(data.modelName);
    if (data.acquisitionYear) setAcquisitionYear(data.acquisitionYear);
    if (data.acquisitionMonth) setAcquisitionMonth(data.acquisitionMonth);
    if (data.location) setLocation(data.location);
    if (data.remarks) setRemarks(data.remarks);
  };

  // 1. 전체 실(Location) 목록 추출 (1층~3층)
  const roomLocations = useMemo(() => {
    const locs: string[] = [];
    BUILDING_STRUCTURE.forEach(floor => {
      floor.rooms.forEach(room => {
        locs.push(room.name);
      });
    });
    return Array.from(new Set(locs));
  }, []);

  // 2. 현재 선택된 위치(location)에 해당하는 실별 사용자 목록 동적 계산
  const currentRoomMembers = useMemo(() => {
    const currentLoc = location.trim().toLowerCase();
    const foundRoom = BUILDING_STRUCTURE.flatMap(f => f.rooms).find(r => {
      const rName = r.name.toLowerCase();
      return currentLoc.includes(rName) || rName.includes(currentLoc);
    });

    if (foundRoom) {
      return foundRoom.members.map(m => m.name);
    }

    // 기본 추천 직책 목록
    return [
      '1학년 담임교사', '2학년 담임교사', '3학년 담임교사', '4학년 담임교사', '5학년 담임교사', '6학년 담임교사',
      '실장', '초등계장', '중등계장', '윤주무관', '운전주무관', '행정실 주무관',
      '교장', '교감', '교무', '행정사', '영어', '공용',
      '유치원 교사', '푸른도서관', '씨알도서관', '영양사', '조리사', '음악관',
      '과학실', '특수교사 (우리친구반)', '보건교사', '늘봄실장', '늘봄코디', '늘봄교실',
      '영어실', '컴퓨터실', '정보실'
    ];
  }, [location]);

  useEffect(() => {
    if (assetToEdit) {
      setId(assetToEdit.id);
      setName(assetToEdit.name);
      setCategory(assetToEdit.category);
      setModelName(assetToEdit.modelName);
      setManufacturer(assetToEdit.manufacturer);
      setLocation(assetToEdit.actualLocation || assetToEdit.ledgerLocation || '행정실');
      
      setAssignedRole(assetToEdit.assignedRole);
      setCustomRoleInput(assetToEdit.assignedRole);
      setIsCustomRole(false);

      setAssignedStudentId(assetToEdit.assignedStudentId || '');
      // 도입날짜 파싱
      const acqDate = assetToEdit.acquisitionDate || '';
      const acqParts = acqDate.split('-');
      setAcquisitionYear(parseInt(acqParts[0]) || new Date().getFullYear());
      setAcquisitionMonth(parseInt(acqParts[1]) || 1);
      // IP 주소 파싱 (10.41.33. 접두사 분리)
      const existingIp = assetToEdit.credentials?.ipAddress || (assetToEdit as any).ipAddress || '';
      setIpAddress(existingIp.replace(/^10\.41\.33\./, ''));
      setWifiPassword(assetToEdit.credentials?.wifiPassword || '');
      setChargingCartNo(assetToEdit.chargingCartNo || '');
      setCabinetNo(assetToEdit.cabinetNo || '');
      setRemarks(assetToEdit.remarks || '');
    } else {
      setId(`M0000${Math.floor(Math.random() * 89999 + 10000)}`);
      setName('');
      setCategory('desktop_pc');
      setModelName('');
      setManufacturer('LG전자');
      setLocation(initialData?.location || '행정실');
      setAssignedRole(initialData?.assignedRole || '실장');
      setCustomRoleInput('');
      setIsCustomRole(false);
      setAssignedStudentId('');
      setAcquisitionYear(new Date().getFullYear());
      setAcquisitionMonth(new Date().getMonth() + 1);
      setIpAddress('');
      setWifiPassword('EduWiFi#2024!');
      setChargingCartNo('');
      setCabinetNo('');
      setRemarks('');
    }
  }, [assetToEdit, initialData, isOpen]);

  // 위치 변경 시 사용자 풀다운 첫 번째 옵션으로 자동 추천
  const handleLocationChange = (newLoc: string) => {
    setLocation(newLoc);
    // 새로 선택된 위치의 첫 번째 사용자 선택
    const foundRoom = BUILDING_STRUCTURE.flatMap(f => f.rooms).find(r => r.name === newLoc);
    if (foundRoom && foundRoom.members.length > 0) {
      setAssignedRole(foundRoom.members[0].name);
      setIsCustomRole(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = isCustomRole ? customRoleInput.trim() : assignedRole.trim();

    if (!name.trim() || !location.trim() || !finalRole) {
      alert('기명, 위치, 담당자 직책을 반드시 입력해 주세요.');
      return;
    }

    const trimmedIp = ipAddress.trim();
    const formattedIp = trimmedIp
      ? (trimmedIp.includes('.') ? trimmedIp : `10.41.33.${trimmedIp}`)
      : undefined;

    onSaveAsset({
      id: id || `M0000${Math.floor(Math.random() * 89999 + 10000)}`,
      serialNumber: assetToEdit?.serialNumber || `SN-${Math.floor(Math.random() * 89999 + 10000)}`,
      name: name.trim(),
      category,
      modelName: modelName.trim() || '표준 기종',
      manufacturer: manufacturer.trim() || '기타',
      acquisitionDate: `${acquisitionYear}-${String(acquisitionMonth).padStart(2, '0')}-01`,
      usefulLifeYears: 5,
      ledgerLocation: location.trim(),
      actualLocation: location.trim(),
      isLocationMismatch: false,
      assignedRole: finalRole,
      assignedStudentId: assignedStudentId.trim() || undefined,
      chargingCartNo: chargingCartNo.trim() || undefined,
      cabinetNo: cabinetNo.trim() || undefined,
      status: assetToEdit?.status || 'normal',
      disposalStatus: assetToEdit?.disposalStatus || 'none',
      credentials: {
        ipAddress: formattedIp,
        wifiPassword: wifiPassword.trim() || undefined,
        loginPassword: assetToEdit?.credentials?.loginPassword || 'school1234!'
      },
      remarks: remarks.trim() || '프로그램 내 직접 수정됨',
      updatedAt: new Date().toISOString().slice(0, 10)
    });

    onClose();
  };

  const handleDelete = () => {
    if (assetToEdit && onDeleteAsset) {
      if (window.confirm(`[${assetToEdit.id}] ${assetToEdit.name} 기기를 완전히 삭제하시겠습니까?`)) {
        onDeleteAsset(assetToEdit.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                {isEditing ? `기기 정보 수정 [${assetToEdit.id}]` : '신규 정보화기기 등록'}
              </h3>
              <p className="text-xs text-slate-400">실별 사용자 풀다운 선택 및 Zero-PII 직책 기반 관리</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTagScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
              title="카메라로 물품 스티커/태그를 촬영하여 자동 추가합니다"
            >
              <Camera className="w-4 h-4" />
              <span>📷 카메라로 추가</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs"
            >
              닫기
            </button>
          </div>
        </div>

        {/* Quick Camera Scan Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border border-blue-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
              <Camera className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-200">📷 카메라 촬영으로 자동 등록하기</div>
              <div className="text-[11px] text-slate-400">카메라로 기기 라벨/RFID 태그를 촬영하면 자산번호·기종명이 자동 입력됩니다.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsTagScannerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>카메라 촬영 스캔</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 자산번호 */}
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">자산 관리번호 (ID)</label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="예: M000005496"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 disabled:opacity-60"
              />
            </div>

            {/* 기종 카테고리 */}
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">기종 카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DeviceCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="smart_tablet">스마트 교육용 태블릿</option>
                <option value="smart_laptop">스마트 교육용 노트북 (학생 수업용)</option>
                <option value="teacher_laptop">교직원 / 교원용 노트북 (선생님 업무용)</option>
                <option value="desktop_pc">교무/행정용 데스크톱 PC</option>
                <option value="printer">프린터 및 복합기</option>
                <option value="monitors">업무/학습용 모니터</option>
                <option value="network_ap">학급 무선 AP (Wi-Fi 6)</option>
                <option value="server">학내망 서버</option>
                <option value="etc">기타 기자재</option>
              </select>
            </div>

            {/* 기명 / 상세 품명 */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-300 font-semibold block mb-1">기기명 / 상세 품명</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 1학년 수업용 스마트 태블릿 #01, 교무실 행정 PC"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 모델명 & 제조사 */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">모델명 (규격)</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="예: Galaxy Tab S8 11', LG Gram 15'"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">제조사</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="예: 삼성전자, LG전자, HP, Apple"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            {/* 도입날짜 (년도 + 월) */}
            <div className="md:col-span-2 p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/30">
              <label className="text-xs text-blue-300 font-bold block mb-2.5 flex items-center gap-1.5">
                <span>📅</span> 도입 날짜 (년도 / 월)
              </label>
              <div className="flex items-center gap-3">
                {/* 연도 풀다운 */}
                <div className="flex-1">
                  <label className="text-[10px] text-slate-400 block mb-1">연도</label>
                  <select
                    value={acquisitionYear}
                    onChange={(e) => setAcquisitionYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-blue-200 font-semibold focus:outline-none focus:border-blue-500"
                  >
                    {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 12 + i).map(yr => (
                      <option key={yr} value={yr}>{yr}년</option>
                    ))}
                  </select>
                </div>
                <span className="text-slate-500 text-sm font-bold pt-5">—</span>
                {/* 월 풀다운 */}
                <div className="flex-1">
                  <label className="text-[10px] text-slate-400 block mb-1">월</label>
                  <select
                    value={acquisitionMonth}
                    onChange={(e) => setAcquisitionMonth(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-blue-200 font-semibold focus:outline-none focus:border-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
                      <option key={mo} value={mo}>{mo}월</option>
                    ))}
                  </select>
                </div>
                {/* 미리보기 배지 */}
                <div className="flex-1 pt-5">
                  <div className="px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-600/30 text-center">
                    <span className="text-xs font-bold text-blue-300">
                      {acquisitionYear}년 {acquisitionMonth}월 도입
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 설치 / 운용 위치 (단일 선택) */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-300 font-semibold block mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> 설치 및 운용 위치 (풀다운 선택)
              </label>
              <select
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-blue-300 font-semibold focus:outline-none focus:border-blue-500"
              >
                {roomLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* ✨ 실별 사용자 풀다운 선택 */}
            <div className="md:col-span-2 p-3.5 rounded-xl bg-slate-950/80 border border-indigo-900/50 space-y-2">
              <label className="text-xs text-indigo-300 font-bold block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  [{location}] 실별 사용자 / 담당 직책 선택 (풀다운)
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Zero-PII 직책 명칭
                </span>
              </label>

              {!isCustomRole ? (
                <div className="flex items-center gap-2">
                  <select
                    value={assignedRole}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomRole(true);
                      } else {
                        setAssignedRole(e.target.value);
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-indigo-700/60 rounded-xl px-3 py-2.5 text-xs text-indigo-200 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <optgroup label={`${location} 구성원 (추천)`}>
                      {currentRoomMembers.map(roleName => (
                        <option key={roleName} value={roleName}>
                          👤 {roleName}
                        </option>
                      ))}
                    </optgroup>
                    <option value="__custom__">✏️ 직접 입력하기...</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    placeholder="직접 직책명 입력 (예: 1학년 담임교사, 실장)"
                    className="flex-1 bg-slate-900 border border-indigo-500 rounded-xl px-3 py-2 text-xs text-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomRole(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs"
                  >
                    풀다운 선택으로 전환
                  </button>
                </div>
              )}

              <p className="text-[10px] text-slate-400 pt-0.5">
                * 현재 선택하신 <strong className="text-amber-300">[{location}]</strong>에 배치된 사용자/담당 직책 목록이 자동 나열됩니다.
              </p>
            </div>

            {/* 지정 배정 학생 ID */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">지정 배정 학생 (선택)</label>
              <input
                type="text"
                value={assignedStudentId}
                onChange={(e) => setAssignedStudentId(e.target.value)}
                placeholder="예: 3학년 배정학생 #01"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            {/* IP 주소 */}
            <div>
              <label className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
                <Wifi className="w-3 h-3 text-blue-400" /> 네트워크 IP 주소
              </label>
              <div className="flex items-center rounded-xl overflow-hidden border border-slate-700 bg-slate-950 focus-within:border-blue-500 transition-colors px-3 py-2">
                <span className="text-xs text-slate-400 font-mono font-bold select-none pr-1">
                  10.41.33.
                </span>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => {
                    let val = e.target.value.trim();
                    if (val.startsWith('10.41.33.')) {
                      val = val.replace('10.41.33.', '');
                    }
                    setIpAddress(val);
                  }}
                  placeholder="101 (나머지 숫자)"
                  className="w-full bg-transparent text-xs text-emerald-300 font-mono font-bold focus:outline-none placeholder:text-slate-600"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">마지막 자리 숫자만 입력하시면 10.41.33.XXX 로 자동 저장됩니다.</p>
            </div>

            {/* 충전함 & 보관함 번호 */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">충전함 번호 (선택)</label>
              <input
                type="text"
                value={chargingCartNo}
                onChange={(e) => setChargingCartNo(e.target.value)}
                placeholder="예: 충전함 1호기 - #05"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">보관함 구역 (선택)</label>
              <input
                type="text"
                value={cabinetNo}
                onChange={(e) => setCabinetNo(e.target.value)}
                placeholder="예: C-BLOCK-01"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            {/* 메모 / 비고 */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">비고 / 메모</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="기타 참고사항 기재"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/40 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>기기 삭제</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditing ? '기기 정보 저장' : '신규 기기 등록'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>

      {/* AI Tag Scanner Modal */}
      <TagScannerModal
        isOpen={isTagScannerOpen}
        onClose={() => setIsTagScannerOpen(false)}
        onApplyParsedData={handleApplyTagData}
      />
    </div>
  );
};
