import React, { useState } from 'react';
import { 
  Building2, 
  AlertTriangle, 
  ArrowRightLeft, 
  UserCheck, 
  MapPin
} from 'lucide-react';
import type { Asset } from '../../types/asset';
import { maskIP } from '../../utils/privacy';

interface RoomPlacementViewProps {
  assets: Asset[];
  privacyMode: boolean;
  onUpdateAssetLocation: (assetId: string, newActualLocation: string, newRole: string) => void;
  onEditAsset?: (asset: Asset) => void;
}

export const RoomPlacementView: React.FC<RoomPlacementViewProps> = ({
  assets,
  privacyMode,
  onUpdateAssetLocation,
  onEditAsset
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [transferModalAsset, setTransferModalAsset] = useState<Asset | null>(null);
  const [newActualLoc, setNewActualLoc] = useState('');
  const [newRole, setNewRole] = useState('');

  // unique locations list
  const allLocations = Array.from(new Set(assets.map(a => a.ledgerLocation))).sort();

  const filteredAssets = assets.filter(asset => {
    if (selectedLocation === 'all') return true;
    return asset.ledgerLocation === selectedLocation || asset.actualLocation === selectedLocation;
  });

  const mismatchCount = filteredAssets.filter(a => a.isLocationMismatch).length;

  const handleOpenTransferModal = (asset: Asset) => {
    setTransferModalAsset(asset);
    setNewActualLoc(asset.actualLocation);
    setNewRole(asset.assignedRole);
  };

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferModalAsset && newActualLoc.trim() && newRole.trim()) {
      onUpdateAssetLocation(transferModalAsset.id, newActualLoc.trim(), newRole.trim());
      setTransferModalAsset(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            교실별 기기 배치 및 인수인계 현황
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            장부상 운용부서와 실제 기기 설치 위치의 불일치 건을 감지하고 이력 수정을 진행합니다.
          </p>
        </div>

        {/* Location Select Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">위치 선택:</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">전체 장소 보기 ({assets.length}대)</option>
            {allLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Warning Alert Banner */}
      {mismatchCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
            <div>
              <p className="text-sm font-semibold text-rose-200">
                장부 위치 불일치 경고 ({mismatchCount}건 발견)
              </p>
              <p className="text-xs text-rose-300/80">
                실제 기기 설치위치(actualLocation)와 RFID 스티커 등록장소(ledgerLocation)가 다릅니다. 인수인계 수정을 진행하세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Asset Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-4">자산번호 / S/N</th>
                <th className="p-4">기종명 / 카테고리</th>
                <th className="p-4">장부상 위치 (Ledger)</th>
                <th className="p-4">실제 설치위치 (Actual)</th>
                <th className="p-4">담당자 (Zero-PII Role)</th>
                <th className="p-4">네트워크 IP</th>
                <th className="p-4 text-center">인수인계 수정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAssets.map(asset => (
                <tr 
                  key={asset.id} 
                  className={`hover:bg-slate-800/40 transition-colors ${
                    asset.isLocationMismatch ? 'bg-rose-950/15' : ''
                  }`}
                >
                  {/* Asset ID & SN */}
                  <td className="p-4">
                    <span className="font-mono font-semibold text-blue-300 block">{asset.id}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{asset.serialNumber}</span>
                  </td>

                  {/* Name & Category */}
                  <td className="p-4">
                    <p className="font-medium text-slate-200">{asset.name}</p>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md inline-block mt-0.5">
                      {asset.modelName}
                    </span>
                  </td>

                  {/* Ledger Location */}
                  <td className="p-4 text-slate-300 font-medium">
                    {asset.ledgerLocation}
                  </td>

                  {/* Actual Location */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className={`font-medium ${asset.isLocationMismatch ? 'text-rose-300 font-bold' : 'text-slate-200'}`}>
                        {asset.actualLocation}
                      </span>
                    </div>
                    {asset.isLocationMismatch && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" /> ! 장부위치 불일치
                      </span>
                    )}
                  </td>

                  {/* Assigned Role (Zero-PII) */}
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-medium">{asset.assignedRole}</span>
                    </div>
                    {asset.assignedStudentId && (
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {asset.assignedStudentId}
                      </span>
                    )}
                  </td>

                  {/* Network IP */}
                  <td className="p-4 font-mono text-slate-400">
                    {maskIP(asset.credentials.ipAddress, privacyMode)}
                  </td>

                  {/* Transfer & Edit Action Buttons */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 no-print">
                      <button
                        onClick={() => handleOpenTransferModal(asset)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700 hover:border-blue-500 text-xs font-medium transition-all inline-flex items-center gap-1"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>위치 변경</span>
                      </button>
                      <button
                        onClick={() => onEditAsset && onEditAsset(asset)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all"
                        title="기기 정보 상세 수정 및 삭제"
                      >
                        수정
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Location Transfer Modal */}
      {transferModalAsset && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-400" />
              기기 설치위치 및 인수인계 수정
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              [{transferModalAsset.id}] {transferModalAsset.name}
            </p>

            <form onSubmit={handleSaveTransfer} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">장부상 운용부서 (변경불가)</label>
                <input
                  type="text"
                  disabled
                  value={transferModalAsset.ledgerLocation}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  실제 설치/위치 (actualLocation)
                </label>
                <input
                  type="text"
                  required
                  value={newActualLoc}
                  onChange={(e) => setNewActualLoc(e.target.value)}
                  placeholder="예: 1학년 1반 교실, 컴퓨터실 1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  담당자 직책/역할명 (Zero-PII Role)
                </label>
                <input
                  type="text"
                  required
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="예: 1학년 1반 담임교사, 정보업무 담당교사"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-amber-400 mt-1 block">
                  * 실명 입력 절대 금지 (교직원 직책명으로만 기록)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTransferModalAsset(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20"
                >
                  인수인계 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
