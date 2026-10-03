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

const STORAGE_KEY_ASSETS = 'school_itam_assets_v2';
const STORAGE_KEY_PRIVACY = 'school_itam_privacy_v2';
const STORAGE_KEY_SHEET_URL = 'school_itam_sheet_url_v2';

export const App: React.FC = () => {
  // 1. LocalStorage Assets state initialization
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ASSETS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 저장된 데이터가 있으면 그대로 사용
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
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);

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

  // Asset CRUD Handlers
  const handleOpenAddAssetModal = () => {
    setAssetToEdit(null);
    setIsAssetFormModalOpen(true);
  };

  const handleOpenEditAssetModal = (asset: Asset) => {
    setAssetToEdit(asset);
    setIsAssetFormModalOpen(true);
  };

  const handleSaveAsset = (assetData: Partial<Asset>) => {
    setAssets(prev => {
      const exists = prev.some(a => a.id === assetData.id);
      if (exists) {
        // Edit existing asset
        return prev.map(a => a.id === assetData.id ? { ...a, ...assetData } as Asset : a);
      } else {
        // Add new asset
        return [assetData as Asset, ...prev];
      }
    });
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
  };

  const handleUpdateAssetLocation = (assetId: string, newActualLocation: string, newRole: string) => {
    setAssets(prev => prev.map(asset => {
      if (asset.id === assetId) {
        const isMismatch = asset.ledgerLocation !== newActualLocation;
        return {
          ...asset,
          actualLocation: newActualLocation,
          assignedRole: newRole,
          isLocationMismatch: isMismatch,
          updatedAt: new Date().toISOString().slice(0, 10)
        };
      }
      return asset;
    }));
  };

  const handleUpdateToner = (assetId: string, remainingPercentage: number, stockCount: number) => {
    setAssets(prev => prev.map(asset => {
      if (asset.id === assetId && asset.tonerInfo) {
        return {
          ...asset,
          tonerInfo: {
            ...asset.tonerInfo,
            remainingPercentage,
            stockCount
          },
          updatedAt: new Date().toISOString().slice(0, 10)
        };
      }
      return asset;
    }));
  };

  const handleUpdateDisposalStatus = (assetId: string, status: DisposalStatus, reason?: string) => {
    setAssets(prev => prev.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          disposalStatus: status,
          status: status !== 'none' ? 'disposal_scheduled' : 'normal',
          disposalReason: reason ?? asset.disposalReason,
          updatedAt: new Date().toISOString().slice(0, 10)
        };
      }
      return asset;
    }));
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

  const handleBulkImport = (newAssets: Asset[]) => {
    setAssets(prev => {
      const existingIds = new Set(prev.map(a => a.id));
      const toAdd = newAssets.filter(a => !existingIds.has(a.id));
      const toUpdate = newAssets.filter(a => existingIds.has(a.id));
      const updated = prev.map(a => {
        const match = toUpdate.find(u => u.id === a.id);
        return match ? { ...a, ...match } : a;
      });
      return [...toAdd, ...updated];
    });
  };

  const handlePrint = () => {
    window.print();
  };

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
          showMismatchOnly={showMismatchOnly}
          onToggleMismatchOnly={() => setShowMismatchOnly(prev => !prev)}
          onResetData={handleResetData}
          onPrint={handlePrint}
          onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
          onOpenAddAssetModal={handleOpenAddAssetModal}
          onOpenBulkImportModal={() => setIsBulkImportModalOpen(true)}
        />

        {/* Content Container */}
        <main className="p-8 flex-1 overflow-y-auto">
          {/* Top 4 KPI Cards */}
          <KpiCards
            assets={assets}
            onFilterMismatch={() => {
              setCurrentTab('placement');
              setShowMismatchOnly(true);
            }}
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
        onUpdateAssets={(newAssets) => setAssets(newAssets)}
      />

      {/* Asset Form Modal (Add / Edit / Delete Asset) */}
      <AssetFormModal
        isOpen={isAssetFormModalOpen}
        onClose={() => setIsAssetFormModalOpen(false)}
        assetToEdit={assetToEdit}
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
    </div>
  );
};

export default App;
