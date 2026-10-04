import React, { useState } from 'react';
import { 
  Printer, 
  Droplet, 
  PackageCheck, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  Minus
} from 'lucide-react';
import type { Asset } from '../../types/asset';

interface PrinterTonerViewProps {
  assets: Asset[];
  onUpdateToner: (assetId: string, remainingPercentage: number, stockCount: number) => void;
}

export const PrinterTonerView: React.FC<PrinterTonerViewProps> = ({
  assets,
  onUpdateToner
}) => {
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [newPercentage, setNewPercentage] = useState<number>(100);
  const [newStock, setNewStock] = useState<number>(0);

  const printers = assets.filter(a => a.category === 'printer');

  const lowTonerCount = printers.filter(
    p => p.tonerInfo && (p.tonerInfo.remainingPercentage < 15 || p.tonerInfo.stockCount === 0)
  ).length;

  const handleOpenEditModal = (printer: Asset) => {
    setEditingAsset(printer);
    setNewPercentage(printer.tonerInfo?.remainingPercentage ?? 100);
    setNewStock(printer.tonerInfo?.stockCount ?? 0);
  };

  const handleSaveToner = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAsset) {
      onUpdateToner(editingAsset.id, newPercentage, newStock);
      setEditingAsset(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Printer className="w-6 h-6 text-amber-400" />
            프린터 및 토너 소모품 호환 매칭 현황 (21대)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            각 학급 및 행정실 프린터 21대의 토너 잔량 모니터링 및 호환 토너 모델/재고 수량 매칭
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <Droplet className="w-4 h-4 text-amber-400" />
            <span>토너 부족/재고 없음: </span>
            <span className={`font-bold ${lowTonerCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {lowTonerCount} 건
            </span>
          </div>
        </div>
      </div>

      {/* Low Toner Alert */}
      {lowTonerCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center gap-3 text-xs text-amber-200 no-print">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p>
            잔량이 15% 미만이거나 예비 토너 재고가 0개인 프린터가 있습니다. 교체 및 재고 신청을 진행해 주세요.
          </p>
        </div>
      )}

      {/* Printers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {printers.map(printer => {
          const toner = printer.tonerInfo;
          const isLow = toner && (toner.remainingPercentage < 15 || toner.stockCount === 0);

          return (
            <div
              key={printer.id}
              className={`glass-panel p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                isLow ? 'border-amber-900/60 bg-amber-950/10' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-amber-400">{printer.id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                    {printer.manufacturer}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-100 mb-1">{printer.name}</h3>
                <p className="text-xs text-slate-400 mb-4">{printer.modelName}</p>

                {/* Location & Role */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>설치 위치:</span>
                    <span className="text-slate-200 font-medium">{printer.actualLocation}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>담당자 (Role):</span>
                    <span className="text-slate-300">{printer.assignedRole}</span>
                  </div>
                </div>

                {/* Toner Info */}
                {toner ? (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Droplet className="w-3.5 h-3.5 text-amber-400" /> 호환 토너 모델:
                      </span>
                      <span className="font-mono font-medium text-amber-300">{toner.model}</span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">토너 잔량</span>
                        <span className={`font-bold ${
                          toner.remainingPercentage < 15 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {toner.remainingPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            toner.remainingPercentage < 15 ? 'bg-rose-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${toner.remainingPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Stock Count */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400 flex items-center gap-1">
                        <PackageCheck className="w-3.5 h-3.5 text-blue-400" /> 예비 토너 재고:
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded-md ${
                        toner.stockCount === 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-200'
                      }`}>
                        {toner.stockCount} 개
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic p-3">토너 정보 미등록</div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end no-print">
                <button
                  onClick={() => handleOpenEditModal(printer)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>토너 교체 / 재고 수정</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Toner Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-amber-400" />
              토너 교체 및 재고 업데이트
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              [{editingAsset.id}] {editingAsset.name} ({editingAsset.tonerInfo?.model})
            </p>

            <form onSubmit={handleSaveToner} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  토너 잔량 퍼센트 (%): {newPercentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newPercentage}
                  onChange={(e) => setNewPercentage(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0% (부족)</span>
                  <span>50%</span>
                  <span>100% (신품 교체)</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  예비 토너 수량 (개)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNewStock(Math.max(0, newStock - 1))}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-bold text-slate-100 w-12 text-center">{newStock}</span>
                  <button
                    type="button"
                    onClick={() => setNewStock(newStock + 1)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/20"
                >
                  저장 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
