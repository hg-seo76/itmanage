import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Link, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Lock
} from 'lucide-react';
import { fetchGoogleSheetAssets } from '../utils/googleSheets';
import type { Asset } from '../types/asset';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSheetUrl: string;
  onSaveSheetUrl: (url: string) => void;
  onUpdateAssets: (newAssets: Asset[]) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  savedSheetUrl,
  onSaveSheetUrl,
  onUpdateAssets
}) => {
  const [urlInput, setUrlInput] = useState<string>(savedSheetUrl || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setStatusMessage({ type: 'error', text: '구글 시트 URL 또는 웹 게시 링크를 입력해 주세요.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const assets = await fetchGoogleSheetAssets(urlInput.trim());
      onSaveSheetUrl(urlInput.trim());
      onUpdateAssets(assets);
      setStatusMessage({ 
        type: 'success', 
        text: `성공적으로 구글 시트에서 총 ${assets.length}대의 자산 데이터를 분석하여 반영했습니다!` 
      });
    } catch (err: any) {
      console.error('Google Sheet Sync Error', err);
      setStatusMessage({ 
        type: 'error', 
        text: err.message || '구글 시트를 가져오는 중 오류가 발생했습니다. 구글 시트 공유 설정을 확인해 주세요.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['자산번호', '기명', '카테고리', '모델명', '제조사', '도입연도', '위치', '담당자(Role)', 'IP주소'];
    const sampleRows = [
      ['M000005496', '행정실 메인 PC', '데스크톱 PC', 'LG Z70 EV', 'LG전자', '2024', '행정실', '실장', '10.41.10.101'],
      ['M000005497', '1학년 수업용 태블릿 #01', '스마트 태블릿', 'Galaxy Tab S8', '삼성전자', '2024', '1학년 교실', '1학년 담임', '10.41.10.102'],
      ['M000005498', '교무실 복합기', '프린터', 'HP LaserJet Pro M404dn', 'HP', '2023', '교무실', '교무', '10.41.10.103'],
      ['M000005499', '과학실 스마트 노트북 #01', '스마트 노트북', 'ThinkPad L15', 'Lenovo', '2024', '과학실', '과학실 담당교사', '10.41.10.104']
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'School_ITAM_GoogleSheet_Template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">구글 스프레드시트 연동</h3>
              <p className="text-xs text-slate-400">Google Drive Sheets 자산 수량 및 위치 정보 실시간 연결</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs"
          >
            닫기
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSync} className="space-y-4">
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
              <Link className="w-4 h-4 text-emerald-400" />
              구글 시트 URL 입력
            </label>
            <input
              type="url"
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="예: https://docs.google.com/spreadsheets/d/1JFg_3HKERzJmj6pVGrp7Mo-Hz1rNcXrmME_Zlcpvjq4/edit"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Sync status message */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <p className="leading-relaxed">{statusMessage.text}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>양식 템플릿 다운로드</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? '분석 및 연동 중...' : '시트 내용 분석 & 반영하기'}</span>
            </button>
          </div>
        </form>

        {/* ⚠️ Important Notice for Google Sheet Permissions */}
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-2 text-xs text-amber-200">
          <p className="font-bold flex items-center gap-1.5 text-amber-300">
            <Lock className="w-4 h-4 text-amber-400" />
            구글 시트 연동이 안 될 때 (공유 권한 1초 해결법):
          </p>
          <div className="space-y-1 text-[11px] text-amber-200/90 leading-relaxed">
            <p>보내주신 구글 시트 링크가 현재 <strong>[비공개 (나만 보기)]</strong> 권한 설정이 되어 있어 외부에서 데이터를 가져오지 못하고 있습니다.</p>
            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-amber-900/50 mt-1.5 space-y-1 font-medium">
              <p className="text-amber-300 font-bold">방법 A (웹에 게시 - 추천):</p>
              <p className="text-slate-300">구글 시트 메뉴 ➔ <strong>[파일] ➔ [공유] ➔ [웹에 게시]</strong> ➔ 형식: <strong>[쉼표로 구분된 값 .csv]</strong> 클릭</p>
              
              <p className="text-amber-300 font-bold mt-2">방법 B (링크 공유 설정):</p>
              <p className="text-slate-300">구글 시트 우측 상단 <strong>[공유]</strong> ➔ 일반 액세스를 <strong>[링크가 있는 모든 사용자 - 뷰어]</strong>로 변경</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
