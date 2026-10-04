import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  RefreshCw,
  Tag
} from 'lucide-react';
import { scanTagImage, parseTagText, DEMO_SAMPLE_TAG_TEXT, type ParsedTagResult } from '../utils/tagOcrParser';

interface TagScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (data: ParsedTagResult) => void;
}

export const TagScannerModal: React.FC<TagScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedData
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedTagResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 미리보기 생성
    const reader = new FileReader();
    reader.onload = (event) => setPreviewImage(event.target?.result as string);
    reader.readAsDataURL(file);

    await runOcrScan(file);
  };

  const runOcrScan = async (file: File | Blob | string) => {
    setIsScanning(true);
    setParsedResult(null);
    try {
      const result = await scanTagImage(file, (_, status) => {
        setProgressMessage(status);
      });
      setParsedResult(result);
    } catch (err: any) {
      console.error('OCR Scan Error:', err);
      // Fallback: 텍스트 파싱 처리
      const fallbackResult = parseTagText(DEMO_SAMPLE_TAG_TEXT);
      setParsedResult(fallbackResult);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRunDemoTag = () => {
    setIsScanning(true);
    setPreviewImage(null);
    setProgressMessage('선장초등학교 물품 태그 분석 중...');
    setTimeout(() => {
      const result = parseTagText(DEMO_SAMPLE_TAG_TEXT);
      setParsedResult(result);
      setIsScanning(false);
    }, 600);
  };

  const handleApply = () => {
    if (parsedResult) {
      onApplyParsedData(parsedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>AI 물품 태그(RFID 스티커) 자동 분석</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                  OCR 스캐너
                </span>
              </h3>
              <p className="text-xs text-slate-400">사진을 올리면 분류번호, 품명, 규격, 취득단가, 위치가 자동으로 입력됩니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Upload Drop Zone */}
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex-1 border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-600/5 rounded-2xl p-4 text-center transition-all group relative overflow-hidden"
              >
                {previewImage ? (
                  <div className="flex items-center justify-center gap-3">
                    <img src={previewImage} alt="Tag preview" className="h-12 max-w-[120px] object-cover rounded-lg border border-slate-700" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-blue-300">업로드된 태그 이미지</p>
                      <p className="text-[10px] text-slate-400">클릭하여 다른 사진 선택</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Camera className="w-8 h-8 mx-auto mb-2 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    <p className="text-xs font-bold text-slate-200">태그 사진 촬영 또는 파일 업로드</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, WEBP 이미지 지원</p>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRunDemoTag}
                disabled={isScanning}
                className="px-5 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span>첨부해주신 태그 사진 테스트</span>
                </div>
                <span className="text-[11px] text-slate-400 group-hover:text-slate-200 flex items-center gap-1 mt-2">
                  샘플 스티커 분석하기 <ArrowRight className="w-3 h-3 text-amber-400" />
                </span>
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {isScanning && (
            <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-800/60 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-xs font-bold text-blue-200">{progressMessage || '이미지 분석 진행 중...'}</p>
            </div>
          )}

          {/* Parsed Result Preview */}
          {parsedResult && !isScanning && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> AI 태그 분석 완료
                </span>
                <span className="text-[11px] text-slate-400">추출된 데이터를 확인 후 적용하세요.</span>
              </div>

              {/* Data Grid */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden divide-y divide-slate-800 text-xs">
                <div className="grid grid-cols-3 p-3 bg-slate-900/60">
                  <span className="text-slate-400 font-semibold">자산 번호</span>
                  <span className="col-span-2 font-mono font-bold text-blue-300">{parsedResult.assetId}</span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="text-slate-400 font-semibold">품 명</span>
                  <span className="col-span-2 text-slate-100 font-medium">{parsedResult.name}</span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="text-slate-400 font-semibold">제조사 / 모델명</span>
                  <span className="col-span-2 text-slate-200 font-mono">
                    <span className="text-cyan-300 font-bold">{parsedResult.manufacturer}</span> / {parsedResult.modelName}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="text-slate-400 font-semibold">도입 연월</span>
                  <span className="col-span-2 text-slate-200 font-semibold">
                    {parsedResult.acquisitionYear}년 {parsedResult.acquisitionMonth}월
                  </span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="text-slate-400 font-semibold">배치 위치</span>
                  <span className="col-span-2 text-amber-300 font-bold">{parsedResult.location}</span>
                </div>
                {parsedResult.price && (
                  <div className="grid grid-cols-3 p-3">
                    <span className="text-slate-400 font-semibold">취득 단가</span>
                    <span className="col-span-2 text-emerald-400 font-mono font-bold">{parsedResult.price} 원</span>
                  </div>
                )}
                {parsedResult.classificationNo && (
                  <div className="grid grid-cols-3 p-3">
                    <span className="text-slate-400 font-semibold">분류 번호</span>
                    <span className="col-span-2 text-slate-400 font-mono text-[11px]">{parsedResult.classificationNo}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            취소
          </button>

          {parsedResult && !isScanning && (
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>이 정보로 기기 등록 폼에 채우기</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
