import React from 'react';
import { 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Printer, 
  RotateCcw, 
  FileSpreadsheet,
  PlusCircle,
  Table2,
  UserCheck,
  Sparkles,
  CloudUpload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  onResetData: () => void;
  onPrint: () => void;
  onOpenGoogleSheetsModal: () => void;
  onOpenAddAssetModal: () => void;
  onOpenBulkImportModal: () => void;
  onOpenAuthModal: () => void;
  onOpenTagScannerModal?: () => void;
  onUploadLocalToCloud?: () => void;
  isCloudSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  privacyMode,
  onTogglePrivacy,
  onResetData,
  onPrint,
  onOpenGoogleSheetsModal,
  onOpenAddAssetModal,
  onOpenBulkImportModal,
  onOpenAuthModal,
  onOpenTagScannerModal,
  onUploadLocalToCloud,
  isCloudSynced = false,
}) => {
  const { userEmail, isAuthenticated } = useAuth();

  return (
    <header className="h-20 bg-slate-900/60 border-b border-slate-800 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 no-print">
      {/* Search Bar */}
      <div className="relative w-80">
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

      {/* Control Actions */}
      <div className="flex items-center gap-2">

        {/* Account Button */}
        <button
          onClick={onOpenAuthModal}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
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

        {/* DB Cloud Upload Sync Button */}
        {onUploadLocalToCloud && (
          <button
            onClick={onUploadLocalToCloud}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            title="현재 브라우저에 저장된 자산 데이터를 파이어베이스 클라우드로 일괄 동기화합니다."
          >
            <CloudUpload className="w-4 h-4 text-emerald-400" />
            <span>DB 클라우드 동기화</span>
          </button>
        )}

        {/* Add Asset Button */}
        <button
          onClick={onOpenAddAssetModal}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>신규 기기 등록</span>
        </button>

        {/* AI Tag Scan Button */}
        {onOpenTagScannerModal && (
          <button
            onClick={onOpenTagScannerModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-200 border border-cyan-500/40 hover:from-cyan-600 hover:to-blue-600 hover:text-white transition-all shadow-sm"
            title="물품 태그(RFID 스티커) 사진 스캔 및 자동 폼 입력"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>태그 사진 AI 스캔</span>
          </button>
        )}

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

