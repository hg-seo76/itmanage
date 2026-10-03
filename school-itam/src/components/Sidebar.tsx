import React from 'react';
import { 
  Building,
  Building2, 
  Tablet, 
  Printer, 
  Trash2, 
  FileSpreadsheet, 
  ShieldCheck, 
  Server,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import type { ViewTab } from '../types/asset';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  privacyMode: boolean;
  mismatchCount: number;
  totalAssetsCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  privacyMode,
  mismatchCount,
  totalAssetsCount,
  isCollapsed,
  onToggleCollapse
}) => {
  const navItems = [
    {
      id: 'building_map' as ViewTab,
      label: '건물별 기기 배치도',
      desc: '1층~3층 건물 구역별 배치 맵',
      icon: Building,
      badge: 'NEW',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'placement' as ViewTab,
      label: '교실별 기기 배치 현황',
      desc: '위치 불일치 감지 및 인수인계',
      icon: Building2,
      badge: mismatchCount > 0 ? mismatchCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    },
    {
      id: 'smart_device' as ViewTab,
      label: '스마트단말 (95대)',
      desc: '태블릿 51대 / 노트북 44대',
      icon: Tablet,
      badge: 95,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      id: 'printer' as ViewTab,
      label: '프린터 & 토너 (21대)',
      desc: '잔량/소모품 호환 매칭',
      icon: Printer,
      badge: 21,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    {
      id: 'disposal' as ViewTab,
      label: '불용/폐기 (21건)',
      desc: '내용연수 초과 및 심의 칸반',
      icon: Trash2,
      badge: 21,
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    },
    {
      id: 'report' as ViewTab,
      label: '교육청 제출용 통계',
      desc: '자동 집계 및 엑셀/인쇄',
      icon: FileSpreadsheet
    }
  ];

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-20' : 'w-72'
      } bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 transition-all duration-300 z-30 no-print`}
    >
      {/* Sidebar Header & Toggle Button */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base text-slate-100 leading-tight">School-ITAM</h1>
                <p className="text-[10px] text-slate-400">학교 정보화기기 통합관리</p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl text-white mx-auto">
              <Server className="w-5 h-5" />
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className={`p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 border border-slate-700 transition-all ${
              isCollapsed ? 'mx-auto mt-2' : ''
            }`}
            title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-blue-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Security & Privacy Mode Status Badge */}
        {!isCollapsed ? (
          <div className="mb-6 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${privacyMode ? 'text-emerald-400' : 'text-amber-400'}`} />
              <div>
                <p className="text-xs font-semibold text-slate-200">Zero-PII 보호</p>
                <p className="text-[10px] text-slate-400">
                  {privacyMode ? '개인정보 마스킹 ON' : '원 데이터 표시 (주의)'}
                </p>
              </div>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
              privacyMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {privacyMode ? 'STRICT' : 'DEV'}
            </span>
          </div>
        ) : (
          <div className="mb-6 p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center" title="Zero-PII 보안 보호 ON">
            <ShieldCheck className={`w-5 h-5 ${privacyMode ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full text-left rounded-xl transition-all duration-200 flex items-center group relative ${
                  isCollapsed ? 'p-3 justify-center' : 'p-3 justify-between'
                } ${
                  isActive
                    ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 shadow-sm'
                    : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-colors shrink-0 ${
                    isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`} />
                  
                  {!isCollapsed && (
                    <div>
                      <p className={`text-sm font-medium ${isActive ? 'text-blue-300' : 'text-slate-300'}`}>
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  )}
                </div>

                {/* Badge rendering */}
                {item.badge !== undefined && (
                  !isCollapsed ? (
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {item.badge}
                    </span>
                  ) : (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      {!isCollapsed ? (
        <div className="p-4 m-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>총 자산 수</span>
            <span className="font-bold text-slate-200">{totalAssetsCount} 대</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>위치 불일치</span>
            <span className={`font-bold ${mismatchCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {mismatchCount} 건
            </span>
          </div>
        </div>
      ) : (
        <div className="p-2 mb-4 text-center">
          <span className="text-[10px] font-bold text-slate-500 block">{totalAssetsCount}대</span>
        </div>
      )}
    </aside>
  );
};
