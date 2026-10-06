import React, { useState, useEffect, useMemo } from 'react';
import type { Asset, ViewTab, DisposalStatus } from './types/asset';
import { INITIAL_ASSETS } from './data/sanitizedAssets';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { AssetFormModal } from './components/AssetFormModal';
import { BuildingMapView } from './components/views/BuildingMapView';
import { RoomPlacementView } from './components/views/RoomPlacementView';
import { SmartDeviceView } from './components/views/SmartDeviceView';
import { PrinterTonerView } from './components/views/PrinterTonerView';
import { DisposalKanbanView } from './components/views/DisposalKanbanView';
import { EduReportView } from './components/views/EduReportView';
import { BulkImportModal } from './components/BulkImportModal';
import { AuthModal } from './components/AuthModal';
import { LoginScreen } from './components/LoginScreen';
import { TagScannerModal } from './components/TagScannerModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { ParsedTagResult } from './utils/tagOcrParser';
import { 
  subscribeToFirestoreAssets, 
  saveAssetToFirestore, 
  deleteAssetFromFirestore, 
  batchSaveAssetsToFirestore 
} from './services/firestoreAssets';

const STORAGE_KEY_ASSETS = 'school_itam_assets_v2';
const STORAGE_KEY_PRIVACY = 'school_itam_privacy_v2';
const STORAGE_KEY_SHEET_URL = 'school_itam_sheet_url_v2';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, isFirebaseConfigured } = useAuth();

  // 1. LocalStorage Assets state initialization
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ASSETS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse saved assets', e);
      }
    }
    return INITIAL_ASSETS;
  });

  const [savedSheetUrl, setSavedSheetUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_SHEET_URL) || '';
  });

  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState<boolean>(false);
  const [isAssetFormModalOpen, setIsAssetFormModalOpen] = useState<boolean>(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isMainTagScannerOpen, setIsMainTagScannerOpen] = useState<boolean>(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
  const [assetModalInitialData, setAssetModalInitialData] = useState<{ location?: string; assignedRole?: string } | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  const handleOpenRegisterModalForMember = (location: string, assignedRole: string) => {
    setAssetToEdit(null);
    setAssetModalInitialData({ location, assignedRole });
    setIsAssetFormModalOpen(true);
  };

  // 2. Privacy Mode (Default: true per strict security rules)
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PRIVACY);
    if (saved !== null) {
      return saved === 'true';
    }
    return true; // Strict zero-PII default
  });

  // 3. UI State
  const [currentTab, setCurrentTab] = useState<ViewTab>('building_map');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showMismatchOnly, setShowMismatchOnly] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Firestore Realtime Subscription (If Firebase is configured & user logged in or active)
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsCloudSynced(false);
      return;
    }

    const unsubscribe = subscribeToFirestoreAssets(
      (firestoreAssets) => {
        if (firestoreAssets.length > 0) {
          setAssets(firestoreAssets);
          setIsCloudSynced(true);
        } else {
          // If Firestore is empty, upload local assets automatically to cloud
          if (assets.length > 0) {
            batchSaveAssetsToFirestore(assets)
              .then(() => setIsCloudSynced(true))
              .catch(err => console.error('Auto upload local assets failed:', err));
          }
        }
      },
      (error) => {
        console.warn('Falling back to local storage due to Firestore error:', error);
        setIsCloudSynced(false);
      }
    );

    return () => unsubscribe();
  }, [isFirebaseConfigured]);

  const handleUploadLocalToCloud = async () => {
    if (!isFirebaseConfigured) {
      alert('Firebase 클라우드가 연동되어 있지 않습니다.');
      return;
    }
    try {
      await batchSaveAssetsToFirestore(assets);
      setIsCloudSynced(true);
      alert(`성공! 현재 로컬 브라우저 자산 ${assets.length}건이 파이어베이스 클라우드로 동기화 업로드되었습니다.`);
    } catch (err: any) {
      console.error(err);
      alert('클라우드 동기화 실패: ' + (err.message || '알 수 없는 오류'));
    }
  };

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRIVACY, String(privacyMode));
  }, [privacyMode]);

  useEffect(() => {
    if (savedSheetUrl) {
      localStorage.setItem(STORAGE_KEY_SHEET_URL, savedSheetUrl);
    }
  }, [savedSheetUrl]);

  // Total mismatch count across all assets
  const totalMismatchCount = useMemo(() => {
    return assets.filter(a => a.isLocationMismatch).length;
  }, [assets]);

  // Filtered Assets based on Search & Mismatch filter
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      // Mismatch Filter
      if (showMismatchOnly && !asset.isLocationMismatch) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = asset.id.toLowerCase().includes(query);
        const matchesName = asset.name.toLowerCase().includes(query);
        const matchesModel = asset.modelName.toLowerCase().includes(query);
        const matchesRole = asset.assignedRole.toLowerCase().includes(query);
        const matchesLoc = asset.actualLocation.toLowerCase().includes(query) || asset.ledgerLocation.toLowerCase().includes(query);
        const matchesSN = asset.serialNumber.toLowerCase().includes(query);

        return matchesId || matchesName || matchesModel || matchesRole || matchesLoc || matchesSN;
      }

      return true;
    });
  }, [assets, searchQuery, showMismatchOnly]);

  // Asset CRUD Handlers with Firestore sync

  const handleOpenEditAssetModal = (asset: Asset) => {
    setAssetToEdit(asset);
    setIsAssetFormModalOpen(true);
  };

  const handleSaveAsset = async (assetData: Partial<Asset>) => {
    let targetAsset: Asset | null = null;
    setAssets(prev => {
      const exists = prev.some(a => a.id === assetData.id);
      if (exists) {
        return prev.map(a => {
          if (a.id === assetData.id) {
            targetAsset = { ...a, ...assetData } as Asset;
            return targetAsset;
          }
          return a;
        });
      } else {
        targetAsset = assetData as Asset;
        return [targetAsset, ...prev];
      }
    });

    if (targetAsset) {
      await saveAssetToFirestore(targetAsset).catch(err => console.error('Firestore save failed:', err));
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
    await deleteAssetFromFirestore(assetId).catch(err => console.error('Firestore delete failed:', err));
  };

  const handleUpdateAssetLocation = async (assetId: string, newActualLocation: string, newRole: string) => {
    let updatedAsset: Asset | null = null;
    setAssets(prev => prev.map(asset => {
      if (asset.id === assetId) {
        const isMismatch = asset.ledgerLocation !== newActualLocation;
        updatedAsset = {
          ...asset,
          actualLocation: newActualLocation,
          assignedRole: newRole,
          isLocationMismatch: isMismatch,
          updatedAt: new Date().toISOString().slice(0, 10)
        };
        return updatedAsset;
      }
      return asset;
    }));

    if (updatedAsset) {
      await saveAssetToFirestore(updatedAsset).catch(err => console.error('Firestore update failed:', err));
    }
  };

  const handleUpdateToner = async (assetId: string, remainingPercentage: number, stockCount: number) => {
    let updatedAsset: Asset | null = null;
    setAssets(prev => prev.map(asset => {
      if (asset.id === assetId && asset.tonerInfo) {
        updatedAsset = {
          ...asset,
          tonerInfo: {
            ...asset.tonerInfo,
            remainingPercentage,
            stockCount
          },
          updatedAt: new Date().toISOString().slice(0, 10)
        };
        return updatedAsset;
      }
      return asset;
    }));

    if (updatedAsset) {
      await saveAssetToFirestore(updatedAsset).catch(err => console.error('Firestore update failed:', err));
    }
  };

  const handleUpdateDisposalStatus = async (assetId: string, status: DisposalStatus, reason?: string) => {
    let updatedAsset: Asset | null = null;
    setAssets(prev => prev.map(asset => {
      if (asset.id === assetId) {
        updatedAsset = {
          ...asset,
          disposalStatus: status,
          status: status !== 'none' ? 'disposal_scheduled' : 'normal',
          disposalReason: reason ?? asset.disposalReason,
          updatedAt: new Date().toISOString().slice(0, 10)
        };
        return updatedAsset;
      }
      return asset;
    }));

    if (updatedAsset) {
      await saveAssetToFirestore(updatedAsset).catch(err => console.error('Firestore update failed:', err));
    }
  };

  const handleResetData = () => {
    localStorage.removeItem(STORAGE_KEY_ASSETS);
    localStorage.removeItem(STORAGE_KEY_SHEET_URL);
    localStorage.removeItem(STORAGE_KEY_PRIVACY);

    setAssets(INITIAL_ASSETS);
    setPrivacyMode(true);
    setShowMismatchOnly(false);
    setSearchQuery('');
    setSavedSheetUrl('');
    setCurrentTab('building_map');
  };

  const handleBulkImport = async (newAssets: Asset[]) => {
    let allCombined: Asset[] = [];
    setAssets(prev => {
      const existingIds = new Set(prev.map(a => a.id));
      const toAdd = newAssets.filter(a => !existingIds.has(a.id));
      const toUpdate = newAssets.filter(a => existingIds.has(a.id));
      const updated = prev.map(a => {
        const match = toUpdate.find(u => u.id === a.id);
        return match ? { ...a, ...match } : a;
      });
      allCombined = [...toAdd, ...updated];
      return allCombined;
    });

    if (newAssets.length > 0) {
      await batchSaveAssetsToFirestore(newAssets).catch(err => console.error('Firestore batch save failed:', err));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleApplyMainTagData = (data: ParsedTagResult) => {
    const draftAsset: Asset = {
      id: data.assetId || `M0000${Math.floor(10000 + Math.random() * 90000)}`,
      serialNumber: `SN-${Math.floor(Math.random() * 89999 + 10000)}`,
      name: data.name,
      category: data.category,
      modelName: data.modelName,
      manufacturer: data.manufacturer,
      acquisitionDate: `${data.acquisitionYear}-${String(data.acquisitionMonth).padStart(2, '0')}-01`,
      usefulLifeYears: 5,
      ledgerLocation: data.location,
      actualLocation: data.location,
      isLocationMismatch: false,
      assignedRole: '실장',
      status: 'normal',
      disposalStatus: 'none',
      credentials: {},
      remarks: data.remarks,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setAssetToEdit(draftAsset);
    setIsAssetFormModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">시스템 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setShowMismatchOnly(false);
        }}
        privacyMode={privacyMode}
        mismatchCount={totalMismatchCount}
        totalAssetsCount={assets.length}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* Main Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          privacyMode={privacyMode}
          onTogglePrivacy={() => setPrivacyMode(prev => !prev)}
          onResetData={handleResetData}
          onPrint={handlePrint}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onUploadLocalToCloud={handleUploadLocalToCloud}
          isCloudSynced={isCloudSynced}
        />

        {/* Content Container */}
        <main className="p-8 flex-1 overflow-y-auto">
          {/* Top 4 KPI Cards */}
          <KpiCards
            assets={assets}
            onFilterDisposal={() => {
              setCurrentTab('disposal');
            }}
          />

          {/* Active View Tab Rendering */}
          <div className="transition-all duration-300">
            {currentTab === 'building_map' && (
              <BuildingMapView
                assets={filteredAssets}
                privacyMode={privacyMode}
                onRegisterAssetForMember={handleOpenRegisterModalForMember}
                onEditAsset={handleOpenEditAssetModal}
              />
            )}

            {currentTab === 'placement' && (
              <RoomPlacementView
                assets={filteredAssets}
                privacyMode={privacyMode}
                onUpdateAssetLocation={handleUpdateAssetLocation}
                onEditAsset={handleOpenEditAssetModal}
              />
            )}

            {currentTab === 'smart_device' && (
              <SmartDeviceView
                assets={filteredAssets}
                privacyMode={privacyMode}
              />
            )}

            {currentTab === 'printer' && (
              <PrinterTonerView
                assets={filteredAssets}
                onUpdateToner={handleUpdateToner}
              />
            )}

            {currentTab === 'disposal' && (
              <DisposalKanbanView
                assets={filteredAssets}
                onUpdateDisposalStatus={handleUpdateDisposalStatus}
              />
            )}

            {currentTab === 'report' && (
              <EduReportView
                assets={assets}
                onPrint={handlePrint}
              />
            )}
          </div>
        </main>
      </div>

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        savedSheetUrl={savedSheetUrl}
        onSaveSheetUrl={setSavedSheetUrl}
        onUpdateAssets={async (newAssets) => {
          setAssets(newAssets);
          await batchSaveAssetsToFirestore(newAssets).catch(err => console.error('Firestore batch save failed:', err));
        }}
      />

      {/* Asset Form Modal (Add / Edit / Delete Asset) */}
      <AssetFormModal
        isOpen={isAssetFormModalOpen}
        onClose={() => {
          setIsAssetFormModalOpen(false);
          setAssetModalInitialData(null);
        }}
        assetToEdit={assetToEdit}
        initialData={assetModalInitialData}
        onSaveAsset={handleSaveAsset}
        onDeleteAsset={handleDeleteAsset}
      />

      {/* Bulk Import Modal */}
      {isBulkImportModalOpen && (
        <BulkImportModal
          onClose={() => setIsBulkImportModalOpen(false)}
          onImport={(newAssets) => {
            handleBulkImport(newAssets);
          }}
        />
      )}

      {/* Firebase Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Main AI Tag Scanner Modal */}
      <TagScannerModal
        isOpen={isMainTagScannerOpen}
        onClose={() => setIsMainTagScannerOpen(false)}
        onApplyParsedData={handleApplyMainTagData}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
