import React, { useState, useEffect, useRef } from 'react';
import { X, CloudUpload, CloudDownload, Download, Upload, AlertCircle, Database, RefreshCw } from 'lucide-react';
import type { Asset } from '../types/asset';

interface DbBackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: 'backup' | 'restore';
  currentAssetsCount: number;
  onCloudBackup: () => Promise<void>;
  onCloudRestore: () => Promise<void>;
  onFileBackup: () => void;
  onFileRestore: (importedAssets: Asset[]) => void;
  isFirebaseConfigured: boolean;
}

export const DbBackupRestoreModal: React.FC<DbBackupRestoreModalProps> = ({
  isOpen,
  onClose,
  initialTab,
  currentAssetsCount,
  onCloudBackup,
  onCloudRestore,
  onFileBackup,
  onFileRestore,
  isFirebaseConfigured,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleCloudBackup = async () => {
    if (!isFirebaseConfigured) {
      alert('Firebase 클라우드가 연동되어 있지 않습니다.');
      return;
    }
    setIsLoading(true);
    try {
      await onCloudBackup();
      alert(`성공! ${currentAssetsCount}건의 데이터가 클라우드에 백업되었습니다.`);
      onClose();
    } catch (error: any) {
      alert('클라우드 백업 실패: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloudRestore = async () => {
    if (!isFirebaseConfigured) {
      alert('Firebase 클라우드가 연동되어 있지 않습니다.');
      return;
    }
    if (!window.confirm('클라우드에서 데이터를 불러오면 현재 브라우저의 데이터가 모두 덮어씌워집니다. 계속하시겠습니까?')) {
      return;
    }
    setIsLoading(true);
    try {
      await onCloudRestore();
      alert('성공! 클라우드에서 데이터를 성공적으로 복원했습니다.');
      onClose();
    } catch (error: any) {
      alert('클라우드 복원 실패: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileBackup = () => {
    try {
      onFileBackup();
      onClose();
    } catch (error: any) {
      alert('파일 백업 실패: ' + (error.message || '알 수 없는 오류'));
    }
  };

  const handleFileRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const parsed = JSON.parse(json);
        
        if (!Array.isArray(parsed)) {
          throw new Error('데이터 형식이 올바르지 않습니다. 배열 형태의 JSON 파일이어야 합니다.');
        }

        if (!window.confirm(`선택한 백업 파일에서 ${parsed.length}건의 데이터를 복원하시겠습니까? 현재 데이터는 덮어씌워집니다.`)) {
          return;
        }

        onFileRestore(parsed);
        alert('성공! 백업 파일에서 데이터를 복원했습니다.');
        onClose();
      } catch (error: any) {
        alert('백업 파일 복원 실패: ' + (error.message || '잘못된 형식의 파일입니다.'));
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      alert('파일을 읽는 중 오류가 발생했습니다.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">데이터베이스 백업 & 복원</h2>
              <p className="text-xs text-slate-400 mt-0.5">클라우드 서버 또는 로컬 파일로 데이터를 관리하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900">
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'backup'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            DB 백업 (내보내기)
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'restore'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            DB 복원 (불러오기)
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isFirebaseConfigured && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-300">클라우드 연동 알림</h4>
                <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
                  현재 Firebase 클라우드가 연결되어 있지 않아 클라우드 기능은 비활성화됩니다.<br/>
                  하지만 <strong>JSON 파일 백업 및 복원 기능은 정상적으로 사용 가능</strong>합니다.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cloud Backup */}
              <button
                onClick={handleCloudBackup}
                disabled={!isFirebaseConfigured || isLoading}
                className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl border transition-all bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CloudUpload className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-200">클라우드 백업</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    현재 관리 중인 <strong>{currentAssetsCount}건</strong>의 데이터를<br/>
                    클라우드 서버에 안전하게 저장합니다.
                  </p>
                </div>
              </button>

              {/* File Backup */}
              <button
                onClick={handleFileBackup}
                disabled={isLoading}
                className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl border transition-all bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download className="w-6 h-6 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-200">JSON 파일 백업</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    전체 자산 데이터를 <code>.json</code> 파일로 다운로드하여<br/>
                    내 PC나 USB 등에 별도 보관합니다.
                  </p>
                </div>
              </button>
            </div>
          )}

          {activeTab === 'restore' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cloud Restore */}
              <button
                onClick={handleCloudRestore}
                disabled={!isFirebaseConfigured || isLoading}
                className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl border transition-all bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CloudDownload className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-200">클라우드에서 복원</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    클라우드 서버에 저장된 최신 데이터를 불러와<br/>
                    현재 상태를 업데이트합니다.
                  </p>
                </div>
              </button>

              {/* File Restore */}
              <button
                onClick={handleFileRestoreClick}
                disabled={isLoading}
                className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl border transition-all bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-200">JSON 파일에서 복원</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    이전에 백업해둔 <code>.json</code> 파일을 불러와<br/>
                    데이터를 과거 상태로 복구합니다.
                  </p>
                </div>
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {isLoading && (
          <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-center items-center gap-2 text-sm text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>처리 중입니다... 잠시만 기다려주세요.</span>
          </div>
        )}
      </div>
    </div>
  );
};
