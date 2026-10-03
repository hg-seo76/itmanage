import React from 'react';
import { 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Printer, 
  RotateCcw, 
  AlertOctagon,
  FileSpreadsheet,
  PlusCircle,
  Table2,
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  showMismatchOnly: boolean;
  onToggleMismatchOnly: () => void;
  onResetData: () => void;
  onPrint: () => void;
  onOpenGoogleSheetsModal: () => void;
  onOpenAddAssetModal: () => void;
  onOpenBulkImportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  privacyMode,
  onTogglePrivacy,
  showMismatchOnly,
  onToggleMismatchOnly,
  onResetData,
  onPrint,
  onOpenGoogleSheetsModal,
  onOpenAddAssetModal,
  onOpenBulkImportModal,
}) => {
  return (
    <header className="h-20 bg-slate-900/60 border-b border-slate-800 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 no-print">
      {/* Search Bar */}
      <div className="relative w-96">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="자산번호, 기종명, 위치, 직책 역할명 검색..."
          className="w-full bg-slate-950/70 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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

      {/* Control Actions */}
      <div className="flex items-center gap-2">

        {/* Add Asset Button */}
        <button
          onClick={onOpenAddAssetModal}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>신규 기기 등록</span>
        </button>

        {/* Bulk Import Button */}
        <button
          onClick={onOpenBulkImportModal}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-violet-600/20 text-violet-300 border border-violet-500/40 hover:bg-violet-600 hover:text-white transition-all shadow-sm"
          title="CSV 양식 다운로드 후 일괄 등록"
        >
          <Table2 className="w-4 h-4" />
          <span>일괄 등록</span>
        </button>

        {/* Google Sheets Sync Button */}
        <button
          onClick={onOpenGoogleSheetsModal}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
          title="구글 드라이브 스프레드시트 실시간 동기화"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>구글 시트 연동</span>
        </button>

        {/* Mismatch Filter Toggle */}
        <button
          onClick={onToggleMismatchOnly}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
            showMismatchOnly
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/10'
              : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <AlertOctagon className={`w-4 h-4 ${showMismatchOnly ? 'text-rose-400' : 'text-slate-400'}`} />
          <span>위치 불일치만 보기</span>
        </button>

        {/* Privacy Mode Toggle */}
        <button
          onClick={onTogglePrivacy}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
            privacyMode
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}
          title="개인정보 및 네트워크 IP/암호 마스킹 토글"
        >
          {privacyMode ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>보안 마스킹 ON</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>보안 마스킹 OFF</span>
            </>
          )}
        </button>

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
