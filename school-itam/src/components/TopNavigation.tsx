import React from 'react';
import { 
  Building,
  Building2, 
  Tablet, 
  Printer, 
  Trash2, 
  FileSpreadsheet,
} from 'lucide-react';
import type { ViewTab } from '../types/asset';

interface TopNavigationProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  mismatchCount: number;
  totalAssetsCount: number;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  currentTab,
  onSelectTab,
  mismatchCount,
  totalAssetsCount,
}) => {
  const leftNavItems = [
    {
      id: 'building_map' as ViewTab,
      label: '건물별 배치도',
      icon: Building,
      badge: 'NEW',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'placement' as ViewTab,
      label: '교실별 배치 현황',
      icon: Building2,
      badge: mismatchCount > 0 ? mismatchCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    },
    {
      id: 'smart_device' as ViewTab,
      label: '스마트단말',
      icon: Tablet,
      badge: 95,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      id: 'printer' as ViewTab,
      label: '프린터 & 토너',
      icon: Printer,
      badge: 21,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    }
  ];

  const highlightNavItems = [
    {
      id: 'disposal' as ViewTab,
      label: '불용 / 폐기',
      icon: Trash2,
      badge: 21,
      bgColor: 'bg-purple-600/20 hover:bg-purple-600/30',
      activeBgColor: 'bg-purple-600 hover:bg-purple-500',
      textColor: 'text-purple-300 hover:text-white',
      activeTextColor: 'text-white',
      borderColor: 'border-purple-500/40'
    },
    {
      id: 'report' as ViewTab,
      label: '교육청 통계 제출',
      icon: FileSpreadsheet,
      badge: undefined,
      bgColor: 'bg-indigo-600/20 hover:bg-indigo-600/30',
      activeBgColor: 'bg-indigo-600 hover:bg-indigo-500',
      textColor: 'text-indigo-300 hover:text-white',
      activeTextColor: 'text-white',
      borderColor: 'border-indigo-500/40'
    }
  ];

  return (
    <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 sticky top-20 z-10 no-print overflow-x-auto overflow-y-hidden whitespace-nowrap hide-scrollbar">
      {/* Left Navigation (General) */}
      <nav className="flex items-center gap-2 h-full">
        <div className="flex items-center mr-6 gap-3 border-r border-slate-700/50 pr-6 h-8">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Assets</span>
          <span className="text-sm font-bold text-slate-200">{totalAssetsCount} 대</span>
        </div>

        {leftNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Navigation (Highlighted - Requested by user) */}
      <nav className="flex items-center gap-3">
        {highlightNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-medium transition-all border shadow-sm ${
                isActive
                  ? `${item.activeBgColor} ${item.activeTextColor} border-transparent`
                  : `${item.bgColor} ${item.textColor} ${item.borderColor}`
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-black/20 text-white font-bold`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
