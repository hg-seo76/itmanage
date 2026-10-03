import React, { useState } from 'react';
import { 
  Trash2,
  FileText,
  ChevronRight, 
  ChevronLeft
} from 'lucide-react';
import type { Asset, DisposalStatus } from '../../types/asset';

interface DisposalKanbanViewProps {
  assets: Asset[];
  onUpdateDisposalStatus: (assetId: string, status: DisposalStatus, reason?: string) => void;
}

export const DisposalKanbanView: React.FC<DisposalKanbanViewProps> = ({
  assets,
  onUpdateDisposalStatus
}) => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [reasonInput, setReasonInput] = useState('');

  const disposalAssets = assets.filter(a => a.disposalStatus !== 'none');

  const columns: { id: DisposalStatus; title: string; color: string; bg: string }[] = [
    { id: 'pending', title: '불용 신청 대기', color: 'text-amber-400', bg: 'border-amber-500/30 bg-amber-500/5' },
    { id: 'reviewing', title: '학 학교운영위원회 심의중', color: 'text-blue-400', bg: 'border-blue-500/30 bg-blue-500/5' },
    { id: 'approved', title: '교육청 승인 (폐기 대기)', color: 'text-purple-400', bg: 'border-purple-500/30 bg-purple-500/5' },
    { id: 'disposed', title: '매각 및 폐기 완료', color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-500/5' }
  ];

  const handleMoveStatus = (asset: Asset, direction: 'next' | 'prev') => {
    const order: DisposalStatus[] = ['pending', 'reviewing', 'approved', 'disposed'];
    const currentIndex = order.indexOf(asset.disposalStatus);
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (targetIndex >= 0 && targetIndex < order.length) {
      onUpdateDisposalStatus(asset.id, order[targetIndex], asset.disposalReason);
    }
  };

  const handleOpenReasonModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setReasonInput(asset.disposalReason || '');
  };

  const handleSaveReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAsset) {
      onUpdateDisposalStatus(selectedAsset.id, selectedAsset.disposalStatus, reasonInput);
      setSelectedAsset(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-purple-400" />
            불용 및 폐기 예정 자산 칸반 보드 (21건)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            내용연수(5년) 경과 및 파손 기기의 학교운영위원회 심의, 교육청 승인, 폐기/매각 프로세스 단계별 관리
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            총 {disposalAssets.length} 건 진행 중
          </span>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {columns.map(col => {
          const colAssets = disposalAssets.filter(a => a.disposalStatus === col.id);

          return (
            <div 
              key={col.id} 
              className={`rounded-2xl border p-4 flex flex-col justify-between min-h-[500px] ${col.bg}`}
            >
              <div>
                {/* Column Title */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                    {col.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 text-xs font-semibold border border-slate-800">
                    {colAssets.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3">
                  {colAssets.map(asset => (
                    <div
                      key={asset.id}
                      className="glass-panel p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all text-xs space-y-2 group shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-300">{asset.id}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {asset.acquisitionDate.split('-')[0]}년 취득
                        </span>
                      </div>

                      <h4 className="font-semibold text-slate-200">{asset.name}</h4>
                      <p className="text-[11px] text-slate-400">규격: {asset.modelName}</p>

                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/60 text-[11px] text-slate-300 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{asset.disposalReason || '불용사유 미기재'}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>위치: {asset.actualLocation}</span>
                        <span>담당: {asset.assignedRole}</span>
                      </div>

                      {/* Action buttons inside card */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 no-print">
                        <button
                          onClick={() => handleOpenReasonModal(asset)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                        >
                          사유 수정
                        </button>

                        <div className="flex items-center gap-1">
                          {col.id !== 'pending' && (
                            <button
                              onClick={() => handleMoveStatus(asset, 'prev')}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                              title="이전 단계로 이동"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {col.id !== 'disposed' && (
                            <button
                              onClick={() => handleMoveStatus(asset, 'next')}
                              className="p-1 rounded bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
                              title="다음 단계로 이동"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colAssets.length === 0 && (
                    <div className="py-12 text-center text-xs text-slate-600 border border-dashed border-slate-800 rounded-xl">
                      해당 단계 자산 없음
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Disposal Reason Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              불용 신청 및 심의 사유 수정
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              [{selectedAsset.id}] {selectedAsset.name}
            </p>

            <form onSubmit={handleSaveReason} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  불용 사유 (상세 기록)
                </label>
                <textarea
                  rows={4}
                  required
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="예: 내용연수 5년 경과, 액정 깨짐 및 메인보드 단종으로 수리 불가"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/20"
                >
                  사유 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
