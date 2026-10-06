import { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Tablet,
  Laptop,
  Printer,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Filter,
  X,
  Calendar,
  Hash,
  Wifi,
  Shield,
  Info,
  ChevronRight,
  PackageCheck,
  UserPlus,
  PlusCircle,
  Trash2,
  RotateCcw,
  Plus,
  Edit3,
  Tv,
  Copy,
  Presentation,
} from 'lucide-react';
import type { Asset } from '../../types/asset';

interface MemberConfig {
  id: string;
  name: string;
  role: string;
}

interface RoomConfig {
  id: string;
  name: string;
  floor: number;
  members: MemberConfig[];
  assetKeywords: string[];
}

interface FloorConfig {
  floor: number;
  name: string;
  description: string;
  rooms: RoomConfig[];
}

interface BuildingMapViewProps {
  assets: Asset[];
  privacyMode: boolean;
  onRegisterAssetForMember?: (location: string, memberRole: string) => void;
  onEditAsset?: (asset: Asset) => void;
  onDeleteAsset?: (assetId: string) => void;
}

const DEFAULT_BUILDING_CONFIG: FloorConfig[] = [
  {
    floor: 1,
    name: '1층',
    description: '행정실, 유치원, 교장실, 도서관, 급식실, 창조음악관',
    rooms: [
      {
        id: 'room-admin',
        name: '행정실',
        floor: 1,
        members: [
          { id: 'm-adm-1', name: '실장', role: '실장' },
          { id: 'm-adm-2', name: '초등계장', role: '초등계장' },
          { id: 'm-adm-3', name: '중등계장', role: '중등계장' },
          { id: 'm-adm-4', name: '윤주무관', role: '윤주무관' },
          { id: 'm-adm-5', name: '운전주무관', role: '운전주무관' },
        ],
        assetKeywords: ['행정실', '실장', '초등계장', '중등계장', '윤주무관', '운전주무관'],
      },
      {
        id: 'room-kinder',
        name: '유치원',
        floor: 1,
        members: [
          { id: 'm-kin-1', name: '교사', role: '교사' },
          { id: 'm-kin-2', name: '교사실', role: '교사실' },
        ],
        assetKeywords: ['유치원', '유치원교사', '유치원교사실'],
      },
      {
        id: 'room-principal',
        name: '교장실',
        floor: 1,
        members: [
          { id: 'm-principal', name: '교장', role: '교장' },
        ],
        assetKeywords: ['교장실', '교장'],
      },
      {
        id: 'room-library',
        name: '도서관',
        floor: 1,
        members: [
          { id: 'm-lib-1', name: '푸른도서관', role: '푸른도서관' },
          { id: 'm-lib-2', name: '씨알도서관', role: '씨알도서관' },
        ],
        assetKeywords: ['도서관', '푸른도서관', '씨알도서관', '도서실'],
      },
      {
        id: 'room-cafeteria',
        name: '급식실',
        floor: 1,
        members: [
          { id: 'm-caf-1', name: '영양사', role: '영양사' },
          { id: 'm-caf-2', name: '조리사', role: '조리사' },
          { id: 'm-caf-3', name: '휴게실', role: '휴게실' },
        ],
        assetKeywords: ['급식실', '영양사', '조리사', '휴게실'],
      },
      {
        id: 'room-music',
        name: '창조음악관',
        floor: 1,
        members: [
          { id: 'm-mus-1', name: '음악관', role: '음악관' },
        ],
        assetKeywords: ['창조음악관', '음악관', '음악실'],
      },
    ],
  },
  {
    floor: 2,
    name: '2층',
    description: '교무실, 교실(1~6학년), 늘봄, 특별실',
    rooms: [
      {
        id: 'room-staff',
        name: '교무실',
        floor: 2,
        members: [
          { id: 'm-stf-1', name: '교감', role: '교감' },
          { id: 'm-stf-2', name: '교무', role: '교무' },
          { id: 'm-stf-3', name: '행정사', role: '행정사' },
          { id: 'm-stf-4', name: '영어', role: '영어' },
          { id: 'm-stf-5', name: '공용', role: '공용' },
        ],
        assetKeywords: ['교무실', '교감', '교무', '행정사', '항정사'],
      },
      {
        id: 'room-classrooms',
        name: '교실',
        floor: 2,
        members: [
          { id: 'm-cls-1', name: '1학년', role: '1학년' },
          { id: 'm-cls-2', name: '2학년', role: '2학년' },
          { id: 'm-cls-3', name: '3학년', role: '3학년' },
          { id: 'm-cls-4', name: '4학년', role: '4학년' },
          { id: 'm-cls-5', name: '5학년', role: '5학년' },
          { id: 'm-cls-6', name: '6학년', role: '6학년' },
        ],
        assetKeywords: ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '교실'],
      },
      {
        id: 'room-neulbom',
        name: '늘봄',
        floor: 2,
        members: [
          { id: 'm-neul-1', name: '늘봄실장', role: '늘봄실장' },
          { id: 'm-neul-2', name: '늘봄코디', role: '늘봄코디' },
          { id: 'm-neul-3', name: '늘봄교실', role: '늘봄교실' },
        ],
        assetKeywords: ['늘봄', '늘봄실장', '늘봄코디', '늘봄교실'],
      },
      {
        id: 'room-special',
        name: '특별실',
        floor: 2,
        members: [
          { id: 'm-spc-1', name: '영어실', role: '영어실' },
          { id: 'm-spc-2', name: '컴퓨터실', role: '컴퓨터실' },
          { id: 'm-spc-3', name: '정보실', role: '정보실' },
        ],
        assetKeywords: ['특별실', '영어실', '컴퓨터실', '정보실'],
      },
    ],
  },
  {
    floor: 3,
    name: '3층',
    description: '과학실, 우리친구반, 보건실',
    rooms: [
      {
        id: 'room-science',
        name: '과학실',
        floor: 3,
        members: [
          { id: 'm-sci-1', name: '과학실', role: '과학실' },
        ],
        assetKeywords: ['과학실'],
      },
      {
        id: 'room-friend',
        name: '우리친구반',
        floor: 3,
        members: [
          { id: 'm-frd-1', name: '우리친구반', role: '우리친구반' },
        ],
        assetKeywords: ['우리친구반', '특수학급'],
      },
      {
        id: 'room-health',
        name: '보건실',
        floor: 3,
        members: [
          { id: 'm-hlt-1', name: '보건실', role: '보건실' },
        ],
        assetKeywords: ['보건실'],
      },
    ],
  },
];

const LAYOUT_STORAGE_KEY = 'school_itam_custom_building_layout';

export function BuildingMapView({ assets, privacyMode, onRegisterAssetForMember, onEditAsset, onDeleteAsset }: BuildingMapViewProps) {
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // 층별/실별 구성원 커스텀 관리 상태
  const [buildingConfig, setBuildingConfig] = useState<FloorConfig[]>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse custom layout:', e);
    }
    return DEFAULT_BUILDING_CONFIG;
  });

  // 구성원 추가 모달 상태
  const [addMemberModal, setAddMemberModal] = useState<{
    isOpen: boolean;
    floor: number;
    roomId: string;
    roomName: string;
  }>({ isOpen: false, floor: 1, roomId: '', roomName: '' });

  const [newMemberNameInput, setNewMemberNameInput] = useState('');

  // 층/구성원 설정 저장
  const saveLayout = (newConfig: FloorConfig[]) => {
    setBuildingConfig(newConfig);
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newConfig));
  };

  // 초기 상태로 리셋
  const handleResetLayout = () => {
    if (window.confirm('모든 실의 구성원 설정을 초기 기본 배치로 재설정하시겠습니까?')) {
      saveLayout(DEFAULT_BUILDING_CONFIG);
    }
  };

  // 새 구성원 추가 제출
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMemberNameInput.trim();
    if (!name) return;

    const newConfig = buildingConfig.map(f => {
      if (f.floor !== addMemberModal.floor) return f;
      return {
        ...f,
        rooms: f.rooms.map(r => {
          if (r.id !== addMemberModal.roomId) return r;
          const newMember: MemberConfig = {
            id: `m_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name,
            role: name
          };
          const updatedKeywords = r.assetKeywords.includes(name)
            ? r.assetKeywords
            : [...r.assetKeywords, name];
          return {
            ...r,
            members: [...r.members, newMember],
            assetKeywords: updatedKeywords
          };
        })
      };
    });

    saveLayout(newConfig);
    setNewMemberNameInput('');
    setAddMemberModal({ isOpen: false, floor: 1, roomId: '', roomName: '' });
  };

  // 구성원 삭제
  const handleDeleteMember = (floorNum: number, roomId: string, memberId: string, memberName: string) => {
    if (!window.confirm(`'${memberName}' 구성원을 이 실에서 삭제하시겠습니까?`)) return;

    const newConfig = buildingConfig.map(f => {
      if (f.floor !== floorNum) return f;
      return {
        ...f,
        rooms: f.rooms.map(r => {
          if (r.id !== roomId) return r;
          return {
            ...r,
            members: r.members.filter(m => m.id !== memberId)
          };
        })
      };
    });

    saveLayout(newConfig);
  };


  // ─────────────────────────────────────────────
  // 기기 정렬 순위: 컴퓨터(1) > 모니터(2) > 노트북(3) > 태블릿(4) > 프린터(5) > 복사기(6) > 전자칠판(7) > TV(8) > 기타(99)
  // ─────────────────────────────────────────────
  const getDeviceSortRank = (asset: Asset): number => {
    const cat = asset.category || '';
    const name = (asset.name || '').toLowerCase();
    const model = (asset.modelName || '').toLowerCase();
    const combined = `${name} ${model} ${cat}`;

    // 1. 컴퓨터 (데스크톱, PC 본체 - 모니터, 노트북, 복사기, 프린터는 제외)
    if (
      cat === 'desktop_pc' ||
      combined.includes('데스크톱') ||
      combined.includes('데스크탑') ||
      combined.includes('본체') ||
      (combined.includes('컴퓨터') && !combined.includes('노트북') && !combined.includes('모니터') && !combined.includes('lcd'))
    ) {
      return 1;
    }

    // 2. 모니터
    if (
      cat === 'monitors' ||
      combined.includes('모니터') ||
      combined.includes('monitor') ||
      combined.includes('lcd')
    ) {
      return 2;
    }

    // 3. 노트북
    if (
      cat === 'smart_laptop' ||
      cat === 'teacher_laptop' ||
      combined.includes('노트북') ||
      combined.includes('laptop') ||
      combined.includes('씽크패드') ||
      combined.includes('thinkpad') ||
      combined.includes('그램')
    ) {
      return 3;
    }

    // 4. 태블릿
    if (
      cat === 'smart_tablet' ||
      combined.includes('태블릿') ||
      combined.includes('tablet') ||
      combined.includes('아이패드') ||
      combined.includes('ipad') ||
      combined.includes('갤럭시탭') ||
      combined.includes('패드')
    ) {
      return 4;
    }

    // 5. 프린터 (복사기/복합기 제외)
    if (
      (cat === 'printer' || combined.includes('프린터') || combined.includes('printer')) &&
      !combined.includes('복사기') && !combined.includes('복합기') && !combined.includes('복사')
    ) {
      return 5;
    }

    // 6. 복사기 (복사기 / 전자복사기 / 복합기)
    if (
      combined.includes('복사기') ||
      combined.includes('복합기') ||
      combined.includes('전자복사기') ||
      combined.includes('복사') ||
      combined.includes('copier') ||
      combined.includes('스캐너')
    ) {
      return 6;
    }

    // 7. 전자칠판
    if (
      combined.includes('전자칠판') ||
      combined.includes('스마트보드') ||
      combined.includes('전자보드') ||
      combined.includes('칠판')
    ) {
      return 7;
    }

    // 8. TV
    if (
      combined.includes('tv') ||
      combined.includes('텔레비전') ||
      combined.includes('티비') ||
      combined.includes('디스플레이')
    ) {
      return 8;
    }

    return 99;
  };

  const sortAssetsByCustomOrder = (a: Asset, b: Asset): number => {
    const rankA = getDeviceSortRank(a);
    const rankB = getDeviceSortRank(b);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return (a.name || '').localeCompare(b.name || '', 'ko');
  };

  const filteredAssets = useMemo(() => {
    if (categoryFilter === 'all') return assets;
    return assets.filter(a => {
      const rank = getDeviceSortRank(a);
      if (categoryFilter === 'computer') return rank === 1;
      if (categoryFilter === 'monitor') return rank === 2;
      if (categoryFilter === 'laptop') return rank === 3;
      if (categoryFilter === 'tablet') return rank === 4;
      if (categoryFilter === 'printer') return rank === 5;
      if (categoryFilter === 'copier') return rank === 6;
      if (categoryFilter === 'board') return rank === 7;
      if (categoryFilter === 'tv') return rank === 8;
      return a.category === categoryFilter;
    });
  }, [assets, categoryFilter]);

  const totalCount = filteredAssets.length;
  const computerCount = assets.filter(a => getDeviceSortRank(a) === 1).length;
  const monitorCount = assets.filter(a => getDeviceSortRank(a) === 2).length;
  const laptopCount = assets.filter(a => getDeviceSortRank(a) === 3).length;
  const tabletCount = assets.filter(a => getDeviceSortRank(a) === 4).length;
  const printerCount = assets.filter(a => getDeviceSortRank(a) === 5).length;
  const copierCount = assets.filter(a => getDeviceSortRank(a) === 6).length;
  const boardCount = assets.filter(a => getDeviceSortRank(a) === 7).length;
  const tvCount = assets.filter(a => getDeviceSortRank(a) === 8).length;

  const getAssetsForRoom = (room: RoomConfig): Asset[] => {
    return filteredAssets.filter(asset => {
      const loc = (asset.actualLocation || asset.ledgerLocation || '').toLowerCase();
      const role = (asset.assignedRole || '').toLowerCase();
      return room.assetKeywords.some(kw => {
        const kwLower = kw.toLowerCase();
        return loc.includes(kwLower) || role.includes(kwLower);
      });
    });
  };

  const getGroupedAssetsByMember = (room: RoomConfig) => {
    const roomAssets = getAssetsForRoom(room);
    const groups: { member: MemberConfig; assets: Asset[] }[] = [];

    room.members.forEach(member => {
      const memberAssets = roomAssets.filter(asset => {
        const role = asset.assignedRole.toLowerCase();
        const memName = member.name.toLowerCase();
        return role.includes(memName) || memName.includes(role);
      });
      // 컴퓨터 > 모니터 > 노트북 > 태블릿 > 프린터 > 복사기 > 전자칠판 > TV 순 정렬
      memberAssets.sort(sortAssetsByCustomOrder);
      groups.push({ member, assets: memberAssets });
    });

    // 특정 구성원에 매칭되지 않은 잔여 기기 → 첫 번째 구성원 그룹에 편입
    const assignedIds = new Set(groups.flatMap(g => g.assets.map(a => a.id)));
    const unmatched = roomAssets.filter(a => !assignedIds.has(a.id));
    if (unmatched.length > 0 && groups.length > 0) {
      unmatched.sort(sortAssetsByCustomOrder);
      groups[0].assets.push(...unmatched);
      groups[0].assets.sort(sortAssetsByCustomOrder);
    }

    return { groups, totalCount: roomAssets.length };
  };

  const getDeviceIcon = (asset: Asset) => {
    const rank = getDeviceSortRank(asset);
    switch (rank) {
      case 1: return <Monitor className="w-3.5 h-3.5 text-emerald-400" />;
      case 2: return <Monitor className="w-3.5 h-3.5 text-teal-400" />;
      case 3: return <Laptop className="w-3.5 h-3.5 text-blue-400" />;
      case 4: return <Tablet className="w-3.5 h-3.5 text-indigo-400" />;
      case 5: return <Printer className="w-3.5 h-3.5 text-amber-400" />;
      case 6: return <Copy className="w-3.5 h-3.5 text-orange-400" />;
      case 7: return <Presentation className="w-3.5 h-3.5 text-purple-400" />;
      case 8: return <Tv className="w-3.5 h-3.5 text-pink-400" />;
      default: return <Monitor className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getDeviceCategoryBadge = (asset: Asset) => {
    const rank = getDeviceSortRank(asset);
    switch (rank) {
      case 1: return <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/20 text-emerald-300">컴퓨터</span>;
      case 2: return <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-teal-500/20 text-teal-300">모니터</span>;
      case 3: return <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-blue-500/20 text-blue-300">노트북</span>;
      case 4: return <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-indigo-500/20 text-indigo-300">태블릿</span>;
      case 5: return <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-500/20 text-amber-300">프린터</span>;
      case 6: return <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-orange-500/20 text-orange-300">복사기</span>;
      case 7: return <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-purple-500/20 text-purple-300">전자칠판</span>;
      case 8: return <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-pink-500/20 text-pink-300">TV</span>;
      default: return null;
    }
  };

  const visibleFloors = selectedFloor === 'all'
    ? buildingConfig
    : buildingConfig.filter(f => f.floor === selectedFloor);

  return (
    <div className="space-y-6">
      {/* Header Banner & Filter Controls */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-100 flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                <Building2 className="w-6 h-6" />
              </div>
              정보화 기기 배치도
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              실별 구성원을 자유롭게 추가/삭제하고, 담당자별 맞춤 기기를 즉시 등록 관리하세요.
            </p>
          </div>

          {/* Floor Tabs & Reset Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetLayout}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="초기 학교 건물 배치로 리셋"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              초기화
            </button>

            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setSelectedFloor('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedFloor === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                전체 층
              </button>
              {[1, 2, 3].map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFloor(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedFloor === f
                      ? f === 1 ? 'bg-amber-600 text-white shadow-md'
                      : f === 2 ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}층
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            기기 종류 선택 필터:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5 no-print">
            {/* 전체 */}
            <button
              onClick={() => setCategoryFilter('all')}
              className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'all'
                  ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">전체 기기</p>
                <p className="text-xs font-bold text-slate-100">{totalCount}대</p>
              </div>
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* 1. 컴퓨터 */}
            <button
              onClick={() => setCategoryFilter('computer')}
              className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'computer'
                  ? 'bg-emerald-600/20 border-emerald-500 text-white ring-2 ring-emerald-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">컴퓨터</p>
                <p className="text-xs font-bold text-emerald-300">{computerCount}대</p>
              </div>
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Monitor className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* 2. 모니터 */}
            <button
              onClick={() => setCategoryFilter('monitor')}
              className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'monitor'
                  ? 'bg-teal-600/20 border-teal-500 text-white ring-2 ring-teal-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">모니터</p>
                <p className="text-xs font-bold text-teal-300">{monitorCount}대</p>
              </div>
              <div className="p-1 rounded-lg bg-teal-500/10 text-teal-400">
                <Monitor className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* 3. 노트북 */}
            <button
              onClick={() => setCategoryFilter('laptop')}
              className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'laptop'
                  ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">노트북</p>
                <p className="text-xs font-bold text-blue-300">{laptopCount}대</p>
              </div>
              <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400">
                <Laptop className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* 4. 태블릿 */}
            <button
              onClick={() => setCategoryFilter('tablet')}
              className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'tablet'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white ring-2 ring-indigo-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">태블릿</p>
                <p className="text-xs font-bold text-indigo-300">{tabletCount}대</p>
              </div>
              <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Tablet className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* 5. 프린터 */}
            <button
              onClick={() => setCategoryFilter('printer')}
              className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'printer'
                  ? 'bg-amber-600/20 border-amber-500 text-white ring-2 ring-amber-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">프린터</p>
                <p className="text-xs font-bold text-amber-300">{printerCount}대</p>
              </div>
              <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                <Printer className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* 6. 복사기 */}
            <button
              onClick={() => setCategoryFilter('copier')}
              className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'copier'
                  ? 'bg-orange-600/20 border-orange-500 text-white ring-2 ring-orange-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">복사기</p>
                <p className="text-xs font-bold text-orange-300">{copierCount}대</p>
              </div>
              <div className="p-1 rounded-lg bg-orange-500/10 text-orange-400">
                <Copy className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* 7. 전자칠판 */}
            <button
              onClick={() => setCategoryFilter('board')}
              className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'board'
                  ? 'bg-purple-600/20 border-purple-500 text-white ring-2 ring-purple-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">전자칠판</p>
                <p className="text-xs font-bold text-purple-300">{boardCount}대</p>
              </div>
              <div className="p-1 rounded-lg bg-purple-500/10 text-purple-400">
                <Presentation className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* 8. TV */}
            <button
              onClick={() => setCategoryFilter('tv')}
              className={`p-2.5 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'tv'
                  ? 'bg-pink-600/20 border-pink-500 text-white ring-2 ring-pink-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">TV</p>
                <p className="text-xs font-bold text-pink-300">{tvCount}대</p>
              </div>
              <div className="p-1 rounded-lg bg-pink-500/10 text-pink-400">
                <Tv className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Floor Sections */}
      <div className="space-y-8">
        {visibleFloors.map(floor => {
          const is1F = floor.floor === 1;
          const is2F = floor.floor === 2;

          const floorHeaderBg = is1F
            ? 'from-amber-900/50 to-slate-900 border-amber-800/60 text-amber-300'
            : is2F
            ? 'from-blue-900/50 to-slate-900 border-blue-800/60 text-blue-300'
            : 'from-purple-900/50 to-slate-900 border-purple-800/60 text-purple-300';

          return (
            <div
              key={floor.floor}
              className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl transition-all"
            >
              {/* Floor Header Banner */}
              <div className={`p-4 bg-gradient-to-r ${floorHeaderBg} border-b flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-white font-black text-xs border border-slate-700">
                    {floor.floor}F
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-100">{floor.name}</h3>
                    <p className="text-[11px] text-slate-400">{floor.description}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  구역 {floor.rooms.length}개
                </span>
              </div>

              {/* Room Cards Grid */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {floor.rooms.map(room => {
                  const { groups, totalCount: roomAssetTotal } = getGroupedAssetsByMember(room);
                  const roomAssets = getAssetsForRoom(room);
                  const roomMismatchCount = roomAssets.filter(a => a.isLocationMismatch).length;


                  return (
                    <div
                      key={room.id}
                      className={`rounded-2xl border p-4 transition-all duration-300 flex flex-col justify-between group hover:shadow-xl ${
                        roomMismatchCount > 0
                          ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-700'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Room Header */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <MapPin className={`w-4 h-4 ${roomMismatchCount > 0 ? 'text-rose-400' : 'text-blue-400'}`} />
                            <h4 className="font-bold text-sm text-slate-100 group-hover:text-blue-300 transition-colors">
                              {room.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/* 구성원 추가 버튼 */}
                            <button
                              onClick={() => {
                                setNewMemberNameInput('');
                                setAddMemberModal({
                                  isOpen: true,
                                  floor: floor.floor,
                                  roomId: room.id,
                                  roomName: room.name
                                });
                              }}
                              className="px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                              title={`${room.name}에 구성원 추가`}
                            >
                              <UserPlus className="w-3 h-3" />
                              +구성원
                            </button>

                            {roomMismatchCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-rose-400 text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                {roomMismatchCount}건
                              </span>
                            )}
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                              {roomAssetTotal}대
                            </span>
                          </div>
                        </div>

                        {/* Members & Assets */}
                        <div className="space-y-2">
                          {groups.map(({ member, assets: memAssets }) => (
                            <div
                              key={member.id}
                              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-1.5 group/member"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                                  <UserCheck className="w-3 h-3 text-indigo-400" />
                                  {privacyMode ? member.role : member.name}
                                </span>

                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-500 mr-1">{memAssets.length}대</span>
                                  
                                  {/* 기기 등록 버튼 (구성원별 직접 기기 등록) */}
                                  {onRegisterAssetForMember && (
                                    <button
                                      onClick={() => onRegisterAssetForMember(room.name, member.name)}
                                      className="px-2 py-0.5 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                                      title={`${room.name} ${member.name} 님에게 새 기기 등록`}
                                    >
                                      <PlusCircle className="w-3 h-3" />
                                      기기 등록
                                    </button>
                                  )}

                                  {/* 구성원 삭제 버튼 */}
                                  <button
                                    onClick={() => handleDeleteMember(floor.floor, room.id, member.id, member.name)}
                                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition-all opacity-60 group-hover/member:opacity-100"
                                    title="구성원 삭제"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                {memAssets.slice().sort(sortAssetsByCustomOrder).map(asset => (
                                  <div
                                    key={asset.id}
                                    onClick={() => setSelectedAsset(asset)}
                                    className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/60 flex items-center justify-between text-[11px] cursor-pointer hover:bg-blue-950/40 hover:border-blue-700/50 transition-all group/asset"
                                    title="클릭하여 기기 상세 정보 보기"
                                  >
                                    <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 mr-1">
                                      {getDeviceIcon(asset)}
                                      <span className="font-mono text-blue-300 font-bold shrink-0">{asset.id}</span>
                                      <span className="truncate text-slate-300 group-hover/asset:text-slate-100 font-medium">{asset.name}</span>
                                      <span className="font-mono text-emerald-400 text-[10px] bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40 shrink-0">
                                        {asset.credentials?.ipAddress || (asset as any).ipAddress || 'IP미지정'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {getDeviceCategoryBadge(asset)}
                                      {asset.isLocationMismatch && (
                                        <span className="text-[9px] px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                                          !불일치
                                        </span>
                                      )}
                                      {onDeleteAsset && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`[${asset.name} (${asset.id})]\n해당 기기를 정말 삭제하시겠습니까?`)) {
                                              onDeleteAsset(asset.id);
                                            }
                                          }}
                                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition-all opacity-0 group-hover/asset:opacity-100"
                                          title={`${asset.name} 기기 삭제`}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover/asset:text-blue-400 transition-colors" />
                                    </div>
                                  </div>
                                ))}

                                {memAssets.length === 0 && (
                                  <p className="text-[10px] text-slate-600 italic pl-1">
                                    할당 기기 없음
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Room Card Footer */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs mt-3">
                        {roomMismatchCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[11px] animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" /> 불일치 {roomMismatchCount}건
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">정치 배치 완료</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────
          기기 상세 정보 드로어 (오른쪽 슬라이드인)
      ────────────────────────────────────────── */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30">
                  {getDeviceIcon(selectedAsset)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-400">{selectedAsset.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedAsset.status === 'normal'             ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      selectedAsset.status === 'repair'             ? 'bg-amber-500/20  text-amber-300  border border-amber-500/30'  :
                      selectedAsset.status === 'storage'            ? 'bg-slate-700     text-slate-300  border border-slate-600'      :
                                                                      'bg-rose-500/20   text-rose-300   border border-rose-500/30'
                    }`}>
                      {selectedAsset.status === 'normal' ? '정상' :
                       selectedAsset.status === 'repair' ? '수리중' :
                       selectedAsset.status === 'storage' ? '보관중' : '불용예정'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 leading-tight mt-0.5">{selectedAsset.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 바디 (스크롤) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* 기기 기본 정보 */}
              <section>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> 기기 기본 정보
                </h4>
                <div className="bg-slate-950/60 rounded-xl border border-slate-800 divide-y divide-slate-800">
                  {[
                    { label: '기기 종류', value:
                      selectedAsset.category === 'smart_tablet'  ? '스마트 태블릿' :
                      selectedAsset.category === 'smart_laptop'  ? '교육용 노트북' :
                      selectedAsset.category === 'teacher_laptop'? '교원용 노트북' :
                      selectedAsset.category === 'desktop_pc'    ? '데스크탑 PC'   :
                      selectedAsset.category === 'printer'       ? '프린터 / 복합기' :
                      selectedAsset.category === 'monitors'      ? '모니터'        :
                      selectedAsset.category === 'network_ap'    ? '네트워크 AP'   :
                      selectedAsset.category === 'server'        ? '서버'          : '기타' },
                    { label: '모델명',   value: selectedAsset.modelName || '-' },
                    { label: '제조사',   value: selectedAsset.manufacturer || '-' },
                    { label: '일련번호', value: selectedAsset.serialNumber || '-', mono: true },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-[11px] text-slate-400">{row.label}</span>
                      <span className={`text-[12px] font-semibold text-slate-200 ${(row as any).mono ? 'font-mono text-blue-300' : ''}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 취득 및 위치 정보 */}
              <section>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> 취득 · 위치 정보
                </h4>
                <div className="bg-slate-950/60 rounded-xl border border-slate-800 divide-y divide-slate-800">
                  {[
                    { label: '도입 날짜', value: selectedAsset.acquisitionDate ? selectedAsset.acquisitionDate.slice(0, 7).replace('-', '년 ') + '월' : '-' },
                    { label: '내용연수', value: selectedAsset.usefulLifeYears ? `${selectedAsset.usefulLifeYears}년` : '-' },
                    { label: '설치 위치', value: selectedAsset.actualLocation || selectedAsset.ledgerLocation || '-' },
                    { label: '담당 직책', value: selectedAsset.assignedRole || '-' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-[11px] text-slate-400">{row.label}</span>
                      <span className={`text-[12px] font-semibold ${
                        (row as any).highlight ? 'text-rose-300' : 'text-slate-200'
                      }`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 네트워크 (보안 마스킹 적용) */}
              <section>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" /> 네트워크 · 보안
                </h4>
                <div className="bg-slate-950/60 rounded-xl border border-slate-800 divide-y divide-slate-800">
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-[11px] text-slate-400">IP 주소</span>
                    <span className="text-[12px] font-mono font-semibold text-emerald-300">
                      {selectedAsset.credentials?.ipAddress ?? '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-[11px] text-slate-400">CMOS 암호</span>
                    <span className="text-[12px] font-mono font-semibold text-slate-400">
                      {privacyMode ? '••••••••' : (selectedAsset.credentials?.cmosPassword ?? '-')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-[11px] text-slate-400">WiFi 암호</span>
                    <span className="text-[12px] font-mono font-semibold text-slate-400">
                      {privacyMode ? '••••••••' : (selectedAsset.credentials?.wifiPassword ?? '-')}
                    </span>
                  </div>
                  {selectedAsset.credentials?.lockerKeyNo && (
                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-[11px] text-slate-400">사물함 열쇠 번호</span>
                      <span className="text-[12px] font-semibold text-slate-200">{selectedAsset.credentials.lockerKeyNo}</span>
                    </div>
                  )}
                  {privacyMode && (
                    <div className="px-3.5 py-2 flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400/70">보안 마스킹 ON — 민감 정보 숨김 처리</span>
                    </div>
                  )}
                </div>
              </section>

              {/* 충전함 / 보관함 */}
              {(selectedAsset.chargingCartNo || selectedAsset.cabinetNo) && (
                <section>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5" /> 충전함 · 보관함
                  </h4>
                  <div className="bg-slate-950/60 rounded-xl border border-slate-800 divide-y divide-slate-800">
                    {selectedAsset.chargingCartNo && (
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-[11px] text-slate-400">충전함 번호</span>
                        <span className="text-[12px] font-semibold text-violet-300">{selectedAsset.chargingCartNo}</span>
                      </div>
                    )}
                    {selectedAsset.cabinetNo && (
                      <div className="flex items-center justify-between px-3.5 py-2.5">
                        <span className="text-[11px] text-slate-400">보관함 번호</span>
                        <span className="text-[12px] font-semibold text-violet-300">{selectedAsset.cabinetNo}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* 토너 정보 (프린터만) */}
              {selectedAsset.tonerInfo && (
                <section>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> 토너 정보
                  </h4>
                  <div className="bg-slate-950/60 rounded-xl border border-slate-800 divide-y divide-slate-800">
                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-[11px] text-slate-400">토너 모델</span>
                      <span className="text-[12px] font-semibold text-amber-300">{selectedAsset.tonerInfo.model}</span>
                    </div>
                    <div className="px-3.5 py-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-slate-400">잔량</span>
                        <span className={`text-[12px] font-bold ${
                          selectedAsset.tonerInfo.remainingPercentage <= 15 ? 'text-rose-400' :
                          selectedAsset.tonerInfo.remainingPercentage <= 30 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>{selectedAsset.tonerInfo.remainingPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            selectedAsset.tonerInfo.remainingPercentage <= 15 ? 'bg-rose-500' :
                            selectedAsset.tonerInfo.remainingPercentage <= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${selectedAsset.tonerInfo.remainingPercentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-[11px] text-slate-400">재고 수량</span>
                      <span className="text-[12px] font-semibold text-slate-200">{selectedAsset.tonerInfo.stockCount}개</span>
                    </div>
                  </div>
                </section>
              )}

              {/* 비고 */}
              {selectedAsset.remarks && (
                <section>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">📝 비고</h4>
                  <div className="bg-slate-950/60 rounded-xl border border-slate-800 px-3.5 py-3">
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedAsset.remarks}</p>
                  </div>
                </section>
              )}

            </div>

            {/* 모달 푸터 (닫기, 기기 삭제, 수정 버튼) */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                닫기
              </button>

              <div className="flex items-center gap-2">
                {onDeleteAsset && (
                  <button
                    onClick={() => {
                      if (window.confirm(`[${selectedAsset.name} (${selectedAsset.id})]\n해당 기기를 정말 삭제하시겠습니까?`)) {
                        onDeleteAsset(selectedAsset.id);
                        setSelectedAsset(null);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    기기 삭제
                  </button>
                )}

                {onEditAsset && (
                  <button
                    onClick={() => {
                      const target = selectedAsset;
                      setSelectedAsset(null);
                      onEditAsset(target);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    기기 정보 수정하기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────
          구성원 추가 모달
      ────────────────────────────────────────── */}
      {addMemberModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  [{addMemberModal.roomName}] 새 구성원 추가
                </h3>
              </div>
              <button
                onClick={() => setAddMemberModal({ isOpen: false, floor: 1, roomId: '', roomName: '' })}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  구성원 명칭 (역할 / 담당 직책)
                </label>
                <input
                  type="text"
                  value={newMemberNameInput}
                  onChange={(e) => setNewMemberNameInput(e.target.value)}
                  placeholder="예: 초등 보조교사, 늘봄강사, 윤주무관B, 실습생 등"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-2">
                  * 구성원을 추가하면 해당 실에 새로 배치된 담당자의 기기를 즉시 등록하고 관리할 수 있습니다.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddMemberModal({ isOpen: false, floor: 1, roomId: '', roomName: '' })}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  구성원 추가하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
