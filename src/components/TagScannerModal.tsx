import React, { useState, useRef, useMemo } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2, 
  X, 
  RefreshCw,
  Edit3
} from 'lucide-react';
import { 
  scanTagImage, 
  extractOcrTokens, 
  findAllM0000Candidates, 
  normalizeM0000Code, 
  type ParsedTagResult 
} from '../utils/tagOcrParser';
import type { DeviceCategory } from '../types/asset';

interface TagScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (data: ParsedTagResult) => void;
}

// 편집 가능한 스캔 결과 타입
interface EditableResult {
  assetId: string;
  name: string;
  category: DeviceCategory;
  manufacturer: string;
  modelName: string;
  acquisitionYear: number;
  acquisitionMonth: number;
  location: string;
  price: string;
}

const fieldNameMap: Record<keyof EditableResult, string> = {
  assetId: '자산 번호',
  name: '품명',
  category: '기기 구분',
  manufacturer: '제조사',
  modelName: '모델명',
  acquisitionYear: '취득 연도',
  acquisitionMonth: '취득 월',
  location: '배치 위치',
  price: '취득 단가',
};

const inputClass = "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600";
const labelClass = "block text-[11px] font-semibold text-slate-400 mb-1";

export const TagScannerModal: React.FC<TagScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedData
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedTagResult | null>(null);
  const [editableResult, setEditableResult] = useState<EditableResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<keyof EditableResult | null>('assetId');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const ocrTokens = useMemo(() => {
    return extractOcrTokens(rawOcrText);
  }, [rawOcrText]);

  const mCandidates = useMemo(() => {
    const list = parsedResult?.mCandidates && parsedResult.mCandidates.length > 0
      ? parsedResult.mCandidates
      : findAllM0000Candidates(rawOcrText);
    return Array.from(new Set(list));
  }, [parsedResult, rawOcrText]);

  if (!isOpen) return null;

  const applyResultToEditable = (result: ParsedTagResult) => {
    setParsedResult(result);
    setRawOcrText(result.rawText || '');
    setEditableResult({
      assetId: result.assetId || '',
      name: result.name || '',
      category: result.category || 'desktop_pc',
      manufacturer: result.manufacturer || '',
      modelName: result.modelName || '',
      acquisitionYear: result.acquisitionYear || new Date().getFullYear(),
      acquisitionMonth: result.acquisitionMonth || 1,
      location: result.location || '',
      price: result.price || '',
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => setPreviewImage(event.target?.result as string);
    reader.readAsDataURL(file);

    await runOcrScan(file);
  };

  const runOcrScan = async (file: File | Blob | string) => {
    setIsScanning(true);
    setEditableResult(null);
    setParsedResult(null);
    try {
      const result = await scanTagImage(file, (_, status) => {
        setProgressMessage(status);
      });
      applyResultToEditable(result);
    } catch (err: any) {
      console.error('OCR Scan Error:', err);
      alert(err.message || '사진 분석 중 오류가 발생했습니다. (환경 변수 누락 또는 API 오류)');
    } finally {
      setIsScanning(false);
    }
  };



  const handleApply = () => {
    if (parsedResult && editableResult) {
      // 편집된 값을 parsedResult에 반영하여 적용
      onApplyParsedData({
        ...parsedResult,
        assetId: editableResult.assetId,
        name: editableResult.name,
        category: editableResult.category,
        manufacturer: editableResult.manufacturer,
        modelName: editableResult.modelName,
        acquisitionYear: Number(editableResult.acquisitionYear),
        acquisitionMonth: Number(editableResult.acquisitionMonth),
        location: editableResult.location,
        price: editableResult.price || undefined,
      });
      onClose();
    }
  };

  const setField = (field: keyof EditableResult, value: string | number) => {
    let finalValue = value;
    if (field === 'assetId' && typeof value === 'string') {
      finalValue = normalizeM0000Code(value);
    }
    setEditableResult(prev => prev ? { ...prev, [field]: finalValue } : prev);
  };

  const assignTokenToField = (field: keyof EditableResult, value: string) => {
    if (field === 'acquisitionYear') {
      const y = parseInt(value.replace(/\D/g, ''), 10);
      if (y >= 1990 && y <= 2099) setField('acquisitionYear', y);
    } else if (field === 'acquisitionMonth') {
      const m = parseInt(value.replace(/\D/g, ''), 10);
      if (m >= 1 && m <= 12) setField('acquisitionMonth', m);
    } else {
      setField(field, value);
    }
    setToastMsg(`"${value}" ➔ [${fieldNameMap[field]}] 입력 완료`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleTokenClick = (token: string) => {
    setSelectedToken(token);
    if (focusedField) {
      assignTokenToField(focusedField, token);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400">
              <ImageIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>사진으로 추가 / AI 태그 자동 분석</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                  OCR 스캐너
                </span>
              </h3>
              <p className="text-xs text-slate-400">사진 등록 후 AI가 자동 분석하며, 잘못된 내용은 직접 수정 가능합니다.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Hidden Input */}
          <input ref={galleryInputRef} type="file" accept="image/png, image/jpeg, image/webp, image/heic" className="hidden" onChange={handleFileChange} />

          {/* Photo File Select Button */}
          <div>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isScanning}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>🖼️ 사진 / 이미지 파일 선택</span>
            </button>
          </div>

          {/* Preview & Demo */}
          <div className="flex gap-3">
            <div className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-3">
              {previewImage ? (
                <>
                  <img src={previewImage} alt="Tag preview" className="h-10 w-14 object-cover rounded-lg border border-slate-700 shrink-0" />
                  <p className="text-xs text-blue-300 font-semibold">선택된 사진 이미지</p>
                </>
              ) : (
                <p className="text-xs text-slate-500">사진 미선택</p>
              )}
            </div>
          </div>

          {/* Loading */}
          {isScanning && (
            <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-800/60 text-center space-y-2">
              <RefreshCw className="w-7 h-7 text-blue-400 animate-spin mx-auto" />
              <p className="text-xs font-bold text-blue-200">{progressMessage || '이미지 분석 진행 중...'}</p>
            </div>
          )}

          {/* ★ 핵심: 편집 가능한 결과 폼 */}
          {editableResult && !isScanning && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="flex items-center gap-2 pb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">AI 분석 완료 — 잘못된 항목은 직접 수정하세요</span>
                <Edit3 className="w-3.5 h-3.5 text-slate-400 ml-auto" />
              </div>

              {/* ⚠️ 텍스트 미감지 시 안내 배너 */}
              {(!rawOcrText || !rawOcrText.trim()) && (
                <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-200 space-y-1 animate-fade-in">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <span>⚠️ 사진에서 글자가 감지되지 않았습니다</span>
                  </div>
                  <p className="text-[11px] text-amber-300/80 leading-relaxed">
                    • 카메라 빛 반사(라벨 유광 코팅의 형광등 반사)나 초점 흐림으로 인해 글자가 읽히지 않았을 수 있습니다.<br />
                    • 빛 반사를 피하여 글자가 정면으로 수평이 되도록 다시 촬영해 보세요.
                  </p>
                </div>
              )}

              {/* ★ 핵심 집중: M0000 자산번호 우선 감지 & 선택 카드 ★ */}
              <div className="bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/90 border border-cyan-500/40 rounded-xl p-3.5 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-blue-500/20 text-cyan-300 border border-blue-400/30 text-base">
                      🏷️
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">핵심 자산번호 (M0000)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30">
                          에듀파인 고유번호
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {editableResult.assetId ? (
                          <span>현재 등록값: <strong className="text-cyan-300 font-mono text-sm tracking-wider font-bold">{editableResult.assetId}</strong></span>
                        ) : (
                          <span className="text-amber-400 font-medium">사진 속 M0000 번호 칩을 터치하여 지정하세요.</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {editableResult.assetId && (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> M0000 지정됨
                    </span>
                  )}
                </div>

                {/* 사진에서 감지된 M0000 번호 후보 목록 */}
                {mCandidates.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">사진에서 발견된 M번호:</span>
                    {mCandidates.map((mCode, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setField('assetId', mCode);
                          setToastMsg(`자산번호를 "${mCode}"(으)로 선택했습니다.`);
                          setTimeout(() => setToastMsg(null), 2500);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 ${
                          editableResult.assetId === mCode
                            ? 'bg-blue-600 text-white border-cyan-400 shadow-md shadow-blue-500/50 scale-105 ring-2 ring-cyan-400/60'
                            : 'bg-slate-800 text-cyan-300 border-slate-700 hover:bg-slate-700 hover:border-cyan-400 hover:text-white'
                        }`}
                      >
                        <span>🏷️</span>
                        <span>{mCode}</span>
                        {editableResult.assetId === mCode && (
                          <span className="text-[10px] text-cyan-200 font-normal">● 선택됨</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 💡 원터치 입력 칩 패널 */}
              {ocrTokens.length > 0 && (
                <div className="bg-slate-950/90 border border-blue-500/30 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>사진 인식 단어 조각 (터치 시 선택 칸에 자동 입력)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {focusedField ? (
                        <span className="text-cyan-400 font-semibold">
                          입력 대상: [{fieldNameMap[focusedField]}]
                        </span>
                      ) : (
                        '칩 클릭 후 채울 항목 선택'
                      )}
                    </span>
                  </div>

                  {/* 단어 칩 목록 */}
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-900/60 rounded-lg border border-slate-800">
                    {ocrTokens.map((token, idx) => {
                      const isM = /^M0{2,}\d+/i.test(token);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleTokenClick(token)}
                          title={`클릭 시 [${focusedField ? fieldNameMap[focusedField] : '선택 칸'}]에 입력`}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all ${
                            selectedToken === token
                              ? 'bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-500/50 scale-105'
                              : isM
                              ? 'bg-cyan-950/80 text-cyan-200 border-cyan-500/60 font-bold hover:bg-cyan-900'
                              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:border-slate-500 hover:text-white'
                          }`}
                        >
                          {isM && <span className="mr-1">🏷️</span>}
                          {token}
                        </button>
                      );
                    })}
                  </div>

                  {/* 선택된 칩에 대한 퀵 배정 버튼 바 */}
                  {selectedToken && (
                    <div className="pt-1.5 flex flex-wrap items-center gap-1.5 animate-fade-in text-[11px]">
                      <span className="text-cyan-300 font-semibold truncate max-w-[150px]">
                        "{selectedToken}" ➔
                      </span>
                      <button
                        type="button"
                        onClick={() => assignTokenToField('assetId', selectedToken)}
                        className="px-2 py-0.5 rounded bg-blue-900/70 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-700/50 transition-all font-semibold"
                      >
                        자산번호
                      </button>
                      <button
                        type="button"
                        onClick={() => assignTokenToField('name', selectedToken)}
                        className="px-2 py-0.5 rounded bg-emerald-900/70 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-700/50 transition-all font-semibold"
                      >
                        품명
                      </button>
                      <button
                        type="button"
                        onClick={() => assignTokenToField('manufacturer', selectedToken)}
                        className="px-2 py-0.5 rounded bg-purple-900/70 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-700/50 transition-all font-semibold"
                      >
                        제조사
                      </button>
                      <button
                        type="button"
                        onClick={() => assignTokenToField('modelName', selectedToken)}
                        className="px-2 py-0.5 rounded bg-amber-900/70 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-700/50 transition-all font-semibold"
                      >
                        모델명
                      </button>
                      <button
                        type="button"
                        onClick={() => assignTokenToField('location', selectedToken)}
                        className="px-2 py-0.5 rounded bg-rose-900/70 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-700/50 transition-all font-semibold"
                      >
                        배치위치
                      </button>
                      <button
                        type="button"
                        onClick={() => assignTokenToField('price', selectedToken)}
                        className="px-2 py-0.5 rounded bg-indigo-900/70 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-700/50 transition-all font-semibold"
                      >
                        취득단가
                      </button>
                    </div>
                  )}

                  {/* 알림 토스트 메시지 */}
                  {toastMsg && (
                    <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{toastMsg}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* 자산번호 */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelClass}>
                      자산 번호 (M0000...)
                      {focusedField === 'assetId' && (
                        <span className="text-[10px] text-cyan-400 font-normal ml-1.5">● 입력 대상</span>
                      )}
                    </label>
                    <span className="text-[10px] text-cyan-400 font-semibold">
                      ★ 학교 에듀파인 핵심 식별자
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      className={`${inputClass} font-mono font-bold text-sm text-cyan-300 pr-24 ${
                        focusedField === 'assetId' ? 'ring-2 ring-blue-500 border-blue-400 bg-slate-900/90' : ''
                      }`}
                      value={editableResult.assetId}
                      onFocus={() => setFocusedField('assetId')}
                      onClick={() => setFocusedField('assetId')}
                      onChange={e => setField('assetId', e.target.value)}
                      placeholder="예: M000004435 (위 감지 칩 클릭 시 즉시 입력)"
                    />
                    {editableResult.assetId && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-400/30 font-semibold pointer-events-none">
                        M0000 형식
                      </span>
                    )}
                  </div>
                </div>

                {/* 품명 */}
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>
                    품 명
                    {focusedField === 'name' && (
                      <span className="text-[10px] text-cyan-400 font-normal ml-1.5">● 입력 대상</span>
                    )}
                  </label>
                  <input
                    className={`${inputClass} ${focusedField === 'name' ? 'ring-2 ring-blue-500 border-blue-400 bg-slate-900/90' : ''}`}
                    value={editableResult.name}
                    onFocus={() => setFocusedField('name')}
                    onClick={() => setFocusedField('name')}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="예: LCD 패널 또는 모니터"
                  />
                </div>

                {/* 기기 종류 (카테고리) */}
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>기기 구분 (카테고리)</label>
                  <select
                    className={inputClass}
                    value={editableResult.category}
                    onChange={e => setField('category', e.target.value as DeviceCategory)}
                  >
                    <option value="desktop_pc">🖥️ 데스크톱 컴퓨터</option>
                    <option value="monitors">🖥️ 모니터 (LCD 패널 / 액정)</option>
                    <option value="smart_laptop">💻 스마트단말 (노트북)</option>
                    <option value="teacher_laptop">💻 교원 노트북</option>
                    <option value="smart_tablet">📱 태블릿</option>
                    <option value="printer">🖨️ 프린터 / 복합기 / 복사기</option>
                    <option value="digital_camera">📷 디지털카메라</option>
                    <option value="network_ap">📶 무선 AP</option>
                    <option value="server">🗄️ 서버</option>
                    <option value="etc">📦 기타 기기 (전자칠판, TV 등)</option>
                  </select>
                </div>

                {/* 제조사 */}
                <div>
                  <label className={labelClass}>
                    제조사
                    {focusedField === 'manufacturer' && (
                      <span className="text-[10px] text-cyan-400 font-normal ml-1.5">● 입력 대상</span>
                    )}
                  </label>
                  <input
                    className={`${inputClass} ${focusedField === 'manufacturer' ? 'ring-2 ring-blue-500 border-blue-400 bg-slate-900/90' : ''}`}
                    value={editableResult.manufacturer}
                    onFocus={() => setFocusedField('manufacturer')}
                    onClick={() => setFocusedField('manufacturer')}
                    onChange={e => setField('manufacturer', e.target.value)}
                    placeholder="예: 삼성전자"
                  />
                </div>

                {/* 모델명 */}
                <div>
                  <label className={labelClass}>
                    모델명
                    {focusedField === 'modelName' && (
                      <span className="text-[10px] text-cyan-400 font-normal ml-1.5">● 입력 대상</span>
                    )}
                  </label>
                  <input
                    className={`${inputClass} ${focusedField === 'modelName' ? 'ring-2 ring-blue-500 border-blue-400 bg-slate-900/90' : ''}`}
                    value={editableResult.modelName}
                    onFocus={() => setFocusedField('modelName')}
                    onClick={() => setFocusedField('modelName')}
                    onChange={e => setField('modelName', e.target.value)}
                    placeholder="예: NT900X"
                  />
                </div>

                {/* 취득연도 */}
                <div>
                  <label className={labelClass}>
                    취득 연도
                    {focusedField === 'acquisitionYear' && (
                      <span className="text-[10px] text-cyan-400 font-normal ml-1.5">● 입력 대상</span>
                    )}
                  </label>
                  <input
                    className={`${inputClass} ${focusedField === 'acquisitionYear' ? 'ring-2 ring-blue-500 border-blue-400 bg-slate-900/90' : ''}`}
                    type="number"
                    min={1990}
                    max={2099}
                    value={editableResult.acquisitionYear}
                    onFocus={() => setFocusedField('acquisitionYear')}
                    onClick={() => setFocusedField('acquisitionYear')}
                    onChange={e => setField('acquisitionYear', parseInt(e.target.value) || new Date().getFullYear())}
                  />
                </div>

                {/* 취득월 */}
                <div>
                  <label className={labelClass}>취득 월</label>
                  <select
                    className={inputClass}
                    value={editableResult.acquisitionMonth}
                    onChange={e => setField('acquisitionMonth', parseInt(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </select>
                </div>

                {/* 위치 */}
                <div>
                  <label className={labelClass}>
                    배치 위치
                    {focusedField === 'location' && (
                      <span className="text-[10px] text-cyan-400 font-normal ml-1.5">● 입력 대상</span>
                    )}
                  </label>
                  <input
                    className={`${inputClass} ${focusedField === 'location' ? 'ring-2 ring-blue-500 border-blue-400 bg-slate-900/90' : ''}`}
                    value={editableResult.location}
                    onFocus={() => setFocusedField('location')}
                    onClick={() => setFocusedField('location')}
                    onChange={e => setField('location', e.target.value)}
                    placeholder="예: 교무실"
                  />
                </div>

                {/* 취득단가 */}
                <div>
                  <label className={labelClass}>
                    취득 단가 (원)
                    {focusedField === 'price' && (
                      <span className="text-[10px] text-cyan-400 font-normal ml-1.5">● 입력 대상</span>
                    )}
                  </label>
                  <input
                    className={`${inputClass} ${focusedField === 'price' ? 'ring-2 ring-blue-500 border-blue-400 bg-slate-900/90' : ''}`}
                    value={editableResult.price}
                    onFocus={() => setFocusedField('price')}
                    onClick={() => setFocusedField('price')}
                    onChange={e => setField('price', e.target.value)}
                    placeholder="예: 1,000,000"
                  />
                </div>
              </div>

              {/* Raw OCR Debug */}
              <details className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
                <summary className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 cursor-pointer hover:bg-slate-800/60 transition-all flex items-center justify-between">
                  <span>🧐 OCR 원본 인식 전체 텍스트 보기 (참고용)</span>
                  <span className="text-[10px] text-slate-600">클릭하여 펼치기</span>
                </summary>
                <div className="p-4 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed select-all">
                  {rawOcrText || '인식된 텍스트가 없습니다.'}
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            취소
          </button>

          {editableResult && !isScanning && (
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>수정 완료 → 기기 등록 폼에 채우기</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
