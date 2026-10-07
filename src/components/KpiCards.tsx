import React from 'react';
import { 
  Server, 
  Tablet, 
  MapPin, 
  Trash2
} from 'lucide-react';
import type { Asset } from '../types/asset';

interface KpiCardsProps {
  assets: Asset[];
  onFilterDisposal?: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  assets,
  onFilterDisposal
}) => {
  const totalCount = assets.length;
  
  const smartTabletCount = assets.filter(a => a.category === 'smart_tablet').length;
  const smartLaptopCount = assets.filter(a => a.category === 'smart_laptop').length;
  const teacherLaptopCount = assets.filter(a => a.category === 'teacher_laptop').length;
  const totalLaptopCount = smartLaptopCount + teacherLaptopCount;

  const disposalAssets = assets.filter(a => a.disposalStatus !== 'none');
  const disposalCount = disposalAssets.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-0 no-print">
      {/* 1. Total Assets */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
        <div className="absolute right-3 -bottom-3 text-slate-800/40 group-hover:text-slate-700/40 transition-colors">
          <Server className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">전체 관리 자산</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">{totalCount}</span>
            <span className="text-xs text-slate-400 font-medium">대</span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            교원용 PC, 프린터, AP 등 포함
          </p>
        </div>
      </div>

      {/* 2. Smart Devices & Laptop Breakdown */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
        <div className="absolute right-3 -bottom-3 text-slate-800/40 group-hover:text-slate-700/40 transition-colors">
          <Tablet className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">단말기 보유 현황</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Tablet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">{smartTabletCount + totalLaptopCount}</span>
            <span className="text-xs text-slate-400 font-medium">대</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 font-medium">태블릿 {smartTabletCount}</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-blue-300 font-medium">교육용 {smartLaptopCount}</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-medium">교원용 {teacherLaptopCount}</span>
          </div>
        </div>
      </div>

      {/* 3. Total Locations Count */}
      <div 
        className="glass-panel p-4 rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-emerald-950/20 to-slate-900 relative overflow-hidden group hover:border-emerald-700/60 transition-all duration-300"
      >
        <div className="absolute right-3 -bottom-3 text-emerald-950/40 group-hover:text-emerald-900/30 transition-colors">
          <MapPin className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">배치 장소 수</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {Array.from(new Set(assets.map(a => a.actualLocation || a.ledgerLocation))).length}
            </span>
            <span className="text-xs text-emerald-300/70 font-medium">개 실/장소</span>
          </div>
          <p className="text-xs text-emerald-400/80 mt-1.5 font-medium">
            교실, 행정실, 특별실 기기 배치 현황
          </p>
        </div>
      </div>

      {/* 4. Disposal Scheduled */}
      <div 
        onClick={onFilterDisposal}
        className="glass-panel p-4 rounded-2xl border border-purple-900/40 bg-gradient-to-br from-purple-950/20 to-slate-900 relative overflow-hidden group hover:border-purple-700/60 cursor-pointer transition-all duration-300"
      >
        <div className="absolute right-3 -bottom-3 text-purple-950/40 group-hover:text-purple-900/30 transition-colors">
          <Trash2 className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">불용 / 폐기 예정</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Trash2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-300">{disposalCount}</span>
            <span className="text-xs text-purple-300/70 font-medium">건 관리중</span>
          </div>
          <p className="text-xs text-purple-400/80 mt-1.5 font-medium">
            내용연수 초과 및 심의 진행 현황
          </p>
        </div>
      </div>
    </div>
  );
};
