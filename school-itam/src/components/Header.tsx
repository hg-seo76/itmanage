import React from 'react';
import { 
  Search, 
  Printer, 
  RotateCcw, 
  UserCheck,
  Download,
  Upload,
  Building,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { ViewTab } from '../types/asset';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onResetData: () => void;
  onPrint: () => void;
  onOpenAuthModal: () => void;
  onOpenDbModal?: (tab: 'backup' | 'restore') => void;
  isCloudSynced?: boolean;
  currentTab?: ViewTab;
  onSelectTab?: (tab: ViewTab) => void;
  disposalCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onResetData,
  onPrint,
  onOpenAuthModal,
  onOpenDbModal,
  isCloudSynced = false,
  currentTab,
  onSelectTab,
  disposalCount = 21,
}) => {
  const { userEmail, isAuthenticated } = useAuth();

  return (
    <header className="h-20 bg-slate-900/60 border-b border-slate-800 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 no-print">
      {/* Left: Reorganized Items */}
      <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
        {/* Account Button */}
        <button
          onClick={onOpenAuthModal}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all flex-shrink-0 ${
            isAuthenticated
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title={isAuthenticated ? `접속 계정: ${userEmail}` : '로그인 정보'}
        >
          <UserCheck className="w-4 h-4 text-blue-400" />
          <span className="max-w-[120px] truncate">{userEmail?.split('@')[0] || '사용자'}</span>
          {isCloudSynced && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Firestore 실시간 동기화 중" />
          )}
        </button>

        {/* Search Bar */}
        <div className="relative w-72 flex-shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="자산번호, 기종명, 위치, 직책 역할명 검색..."
            className="w-full bg-slate-950/70 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* 건물별 배치도 */}
        {currentTab && onSelectTab && (
          <button
            onClick={() => onSelectTab('building_map')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex-shrink-0 ${
              currentTab === 'building_map'
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-slate-800'
            }`}
          >
            <Building className="w-4 h-4 text-blue-400" />
            <span>건물별 배치도</span>
          </button>
        )}

        {/* DB Backup Button */}
        {onOpenDbModal && (
          <button
            onClick={() => onOpenDbModal('backup')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex-shrink-0"
            title="데이터베이스 백업 (클라우드/로컬)"
          >
            <Download className="w-4 h-4" />
            <span>백업</span>
          </button>
        )}

        {/* DB Restore Button */}
        {onOpenDbModal && (
          <button
            onClick={() => onOpenDbModal('restore')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600 hover:text-white transition-all shadow-sm flex-shrink-0"
            title="데이터베이스 복원 (클라우드/로컬)"
          >
            <Upload className="w-4 h-4" />
            <span>복원</span>
          </button>
        )}

        {/* 불용 / 폐기 */}
        {currentTab && onSelectTab && (
          <button
            onClick={() => onSelectTab('disposal')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex-shrink-0 ${
              currentTab === 'disposal'
                ? 'bg-purple-600 text-white border-transparent shadow-md shadow-purple-600/20'
                : 'bg-purple-600/20 text-purple-300 border-purple-500/40 hover:bg-purple-600/30 hover:text-white'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>불용</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-900/60 text-purple-200 border border-purple-400/30">
              {disposalCount}
            </span>
          </button>
        )}

        {/* 교육청 통계 제출 */}
        {currentTab && onSelectTab && (
          <button
            onClick={() => onSelectTab('report')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex-shrink-0 ${
              currentTab === 'report'
                ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-600/20'
                : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>교육청 통계 제출</span>
          </button>
        )}
      </div>

      {/* Right: Remaining Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        {/* Print Button */}
        <button
          onClick={onPrint}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>보고서 인쇄</span>
        </button>

        {/* Reset Data */}
        <button
          onClick={onResetData}
          className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
          title="모든 데이터 초기화"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

