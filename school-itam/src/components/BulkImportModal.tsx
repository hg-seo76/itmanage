import { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Table2,
  Info,
  ChevronRight,
} from 'lucide-react';
import type { Asset } from '../types/asset';
import { downloadBulkTemplate, importAssetsFromCsv, CSV_COLUMNS, type ImportResult } from '../utils/csvTemplate';

interface BulkImportModalProps {
  onClose: () => void;
  onImport: (assets: Asset[]) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ onClose, onImport }) => {
  const [step, setStep] = useState<'guide' | 'upload' | 'preview' | 'done'>('guide');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    downloadBulkTemplate();
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('CSV 파일(.csv)만 업로드할 수 있습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = importAssetsFromCsv(text);
      setImportResult(result);
      setStep('preview');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleConfirmImport = () => {
    if (!importResult) return;
    onImport(importResult.success);
    setStep('done');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">기기 일괄 등록</h2>
              <p className="text-xs text-slate-400 mt-0.5">CSV 양식 다운로드 → 작성 → 업로드로 다수 기기를 한 번에 등록</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4 flex items-center gap-2">
          {(['guide', 'upload', 'preview', 'done'] as const).map((s, i) => {
            const labels = ['① 양식 다운로드', '② 파일 업로드', '③ 내용 확인', '④ 완료'];
            const active = s === step;
            const done = ['guide', 'upload', 'preview', 'done'].indexOf(step) > i;
            return (
              <div key={s} className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                  active ? 'bg-violet-600 text-white' :
                  done ? 'bg-slate-700 text-slate-300' :
                  'text-slate-600'
                }`}>
                  {labels[i]}
                </span>
                {i < 3 && <ChevronRight className="w-3.5 h-3.5 text-slate-700" />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">

          {/* ── STEP 1: GUIDE ── */}
          {step === 'guide' && (
            <div className="space-y-5">
              {/* 안내 카드 */}
              <div className="p-4 rounded-xl bg-violet-950/40 border border-violet-700/40 space-y-3">
                <div className="flex items-center gap-2 text-violet-300 font-semibold text-sm">
                  <Info className="w-4 h-4" /> 일괄 등록 방법
                </div>
                <ol className="text-xs text-slate-300 space-y-2 pl-1">
                  <li className="flex gap-2"><span className="text-violet-400 font-bold">1.</span> 아래 버튼으로 <strong>CSV 양식</strong>을 다운로드합니다.</li>
                  <li className="flex gap-2"><span className="text-violet-400 font-bold">2.</span> 엑셀 또는 구글 스프레드시트에서 열어 기기 정보를 입력합니다.</li>
                  <li className="flex gap-2"><span className="text-violet-400 font-bold">3.</span> <strong>CSV 형식으로 저장</strong>한 뒤 다음 단계에서 업로드합니다.</li>
                  <li className="flex gap-2"><span className="text-violet-400 font-bold">4.</span> 미리보기에서 내용을 확인하고 등록을 완료합니다.</li>
                </ol>
              </div>

              {/* 컬럼 안내 테이블 */}
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-2">📋 양식 컬럼 목록</p>
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-950/80">
                      <tr>
                        <th className="px-3 py-2 text-left text-slate-400 font-semibold">컬럼명</th>
                        <th className="px-3 py-2 text-left text-slate-400 font-semibold">필수</th>
                        <th className="px-3 py-2 text-left text-slate-400 font-semibold">입력 예시</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {CSV_COLUMNS.map(col => (
                        <tr key={col.field as string} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-3 py-2 font-medium text-slate-200">{col.label}</td>
                          <td className="px-3 py-2">
                            {col.required
                              ? <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">필수</span>
                              : <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 text-[10px]">선택</span>
                            }
                          </td>
                          <td className="px-3 py-2 text-slate-400 font-mono">{col.example}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 다운로드 버튼 */}
              <button
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-violet-600/20 transition-all group"
              >
                <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>기기 일괄등록 양식 (CSV) 다운로드</span>
              </button>
            </div>
          )}

          {/* ── STEP 2: UPLOAD ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-violet-400 bg-violet-600/10'
                    : 'border-slate-700 hover:border-violet-500 hover:bg-violet-600/5'
                }`}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragging ? 'text-violet-400' : 'text-slate-600'}`} />
                <p className="text-slate-300 font-semibold mb-1">CSV 파일을 여기에 끌어다 놓거나 클릭하세요</p>
                <p className="text-xs text-slate-500">작성 완료된 기기 일괄등록 양식 (.csv) 파일을 선택합니다</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-700/30 flex gap-2 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>엑셀에서 저장 시 반드시 <strong>「CSV UTF-8(쉼표로 분리)」</strong> 형식을 선택하세요. 일반 CSV 형식은 한글이 깨질 수 있습니다.</span>
              </div>
            </div>
          )}

          {/* ── STEP 3: PREVIEW ── */}
          {step === 'preview' && importResult && (
            <div className="space-y-4">
              {/* 요약 배지 */}
              <div className="flex gap-3">
                <div className="flex-1 p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/30 text-center">
                  <p className="text-2xl font-black text-emerald-400">{importResult.success.length}</p>
                  <p className="text-xs text-slate-400 mt-0.5">등록 가능 기기</p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-rose-950/40 border border-rose-700/30 text-center">
                  <p className="text-2xl font-black text-rose-400">{importResult.errors.length}</p>
                  <p className="text-xs text-slate-400 mt-0.5">오류 행</p>
                </div>
              </div>

              {/* 오류 목록 */}
              {importResult.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-700/30 space-y-1.5">
                  <p className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> 오류 내역 (해당 행은 건너뜁니다)
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-[11px] text-rose-300/80 font-mono">
                        Row {err.row}: {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* 성공 미리보기 테이블 */}
              {importResult.success.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2">
                    등록 예정 기기 미리보기 (최대 10건 표시)
                  </p>
                  <div className="rounded-xl border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-950/80">
                          <tr>
                            {['자산번호', '기기명', '기기종류', '장부위치', '사용자직책', '상태'].map(h => (
                              <th key={h} className="px-3 py-2 text-left text-slate-400 font-semibold whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {importResult.success.slice(0, 10).map(asset => (
                            <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="px-3 py-2 font-mono text-blue-300 font-bold whitespace-nowrap">{asset.id}</td>
                              <td className="px-3 py-2 text-slate-200 whitespace-nowrap">{asset.name}</td>
                              <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{asset.category}</td>
                              <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{asset.ledgerLocation}</td>
                              <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{asset.assignedRole}</td>
                              <td className="px-3 py-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  asset.status === 'normal' ? 'bg-emerald-500/20 text-emerald-300' :
                                  asset.status === 'repair' ? 'bg-amber-500/20 text-amber-300' :
                                  'bg-slate-700 text-slate-400'
                                }`}>
                                  {asset.status === 'normal' ? '정상' :
                                   asset.status === 'repair' ? '수리중' :
                                   asset.status === 'storage' ? '보관중' : '불용예정'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importResult.success.length > 10 && (
                      <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-500">
                        외 {importResult.success.length - 10}건 더 있음
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: DONE ── */}
          {step === 'done' && (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-black text-slate-100 mb-1">
                  {importResult?.success.length}대 등록 완료!
                </p>
                <p className="text-xs text-slate-400">기기 목록에 반영됐습니다. 창을 닫아 확인하세요.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 pb-6 pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            {step === 'done' ? '닫기' : '취소'}
          </button>

          <div className="flex items-center gap-2">
            {step === 'guide' && (
              <button
                onClick={() => setStep('upload')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all"
              >
                <FileText className="w-4 h-4" />
                양식 작성 완료 → 파일 업로드
              </button>
            )}
            {step === 'upload' && (
              <button
                onClick={() => setStep('guide')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
              >
                ← 양식 다운로드로
              </button>
            )}
            {step === 'preview' && importResult && (
              <>
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                >
                  ← 다시 업로드
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importResult.success.length === 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {importResult.success.length}대 등록 확정
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
