import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  X, 
  RefreshCw,
  Edit3
} from 'lucide-react';
import { scanTagImage, type ParsedTagResult } from '../utils/tagOcrParser';

interface TagScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (data: ParsedTagResult) => void;
}

// 편집 가능한 스캔 결과 타입
interface EditableResult {
  assetId: string;
  name: string;
  manufacturer: string;
  modelName: string;
  acquisitionYear: number;
  acquisitionMonth: number;
  location: string;
  price: string;
}

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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const applyResultToEditable = (result: ParsedTagResult) => {
    setParsedResult(result);
    setRawOcrText(result.rawText || '');
    setEditableResult({
      assetId: result.assetId || '',
      name: result.name || '',
      manufacturer: result.manufacturer || '',
      modelName: result.modelName || '',
      acquisitionYear: result.acquisitionYear || new Date().getFullYear(),
      acquisitionMonth: result.acquisitionMonth || 1,
      location: result.location || '교무실',
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
    setEditableResult(prev => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400">
              <Camera className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>사진 촬영 / AI 태그 자동 분석</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                  OCR 스캐너
                </span>
              </h3>
              <p className="text-xs text-slate-400">스캔 후 잘못된 내용은 직접 수정 가능합니다.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Hidden Inputs */}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          <input ref={galleryInputRef} type="file" accept="image/png, image/jpeg, image/webp, image/heic" className="hidden" onChange={handleFileChange} />

          {/* Camera & Gallery Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isScanning}
              className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>📸 카메라 촬영</span>
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isScanning}
              className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>🖼️ 갤러리 선택</span>
            </button>
          </div>

          {/* Preview & Demo */}
          <div className="flex gap-3">
            <div className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-3">
              {previewImage ? (
                <>
                  <img src={previewImage} alt="Tag preview" className="h-10 w-14 object-cover rounded-lg border border-slate-700 shrink-0" />
                  <p className="text-xs text-blue-300 font-semibold">촬영 이미지 선택됨</p>
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
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 pb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">AI 분석 완료 — 잘못된 항목은 직접 수정하세요</span>
                <Edit3 className="w-3.5 h-3.5 text-slate-400 ml-auto" />
              </div>

              <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl px-4 py-2.5 text-[11px] text-amber-300">
                ✏️ OCR이 잘못 읽은 항목이 있다면 아래에서 직접 수정 후 [등록 폼에 채우기]를 누르세요.
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 자산번호 */}
                <div className="col-span-2">
                  <label className={labelClass}>자산 번호</label>
                  <input
                    className={inputClass}
                    value={editableResult.assetId}
                    onChange={e => setField('assetId', e.target.value)}
                    placeholder="예: M000012345"
                  />
                </div>

                {/* 품명 */}
                <div className="col-span-2">
                  <label className={labelClass}>품 명</label>
                  <input
                    className={inputClass}
                    value={editableResult.name}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="예: 데스크톱 컴퓨터"
                  />
                </div>

                {/* 제조사 */}
                <div>
                  <label className={labelClass}>제조사</label>
                  <input
                    className={inputClass}
                    value={editableResult.manufacturer}
                    onChange={e => setField('manufacturer', e.target.value)}
                    placeholder="예: 삼성전자"
                  />
                </div>

                {/* 모델명 */}
                <div>
                  <label className={labelClass}>모델명</label>
                  <input
                    className={inputClass}
                    value={editableResult.modelName}
                    onChange={e => setField('modelName', e.target.value)}
                    placeholder="예: NT900X"
                  />
                </div>

                {/* 취득연도 */}
                <div>
                  <label className={labelClass}>취득 연도</label>
                  <input
                    className={inputClass}
                    type="number"
                    min={1990}
                    max={2099}
                    value={editableResult.acquisitionYear}
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
                  <label className={labelClass}>배치 위치</label>
                  <input
                    className={inputClass}
                    value={editableResult.location}
                    onChange={e => setField('location', e.target.value)}
                    placeholder="예: 교무실"
                  />
                </div>

                {/* 취득단가 */}
                <div>
                  <label className={labelClass}>취득 단가 (원)</label>
                  <input
                    className={inputClass}
                    value={editableResult.price}
                    onChange={e => setField('price', e.target.value)}
                    placeholder="예: 1,000,000"
                  />
                </div>
              </div>

              {/* Raw OCR Debug */}
              <details className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden">
                <summary className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 cursor-pointer hover:bg-slate-800/60 transition-all">
                  🧐 OCR 원본 인식 텍스트 보기 (참고용)
                </summary>
                <div className="p-4 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
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
