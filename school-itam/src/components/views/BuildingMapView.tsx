import { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Tablet,
  Laptop,
  Printer,
  Server,
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
} from 'lucide-react';
import type { Asset, DeviceCategory } from '../../types/asset';

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
}

const BUILDING_CONFIG: FloorConfig[] = [
  {
    floor: 1,
    name: '1층 (행정·교무)',
    description: '교장실, 교감실, 행정실, 교무실',
    rooms: [
      {
        id: 'room-principal',
        name: '교장실',
        floor: 1,
        members: [{ id: 'm-principal', name: '교장', role: '교장' }],
        assetKeywords: ['교장실', '교장'],
      },
      {
        id: 'room-vprincipal',
        name: '교감실',
        floor: 1,
        members: [{ id: 'm-vprincipal', name: '교감', role: '교감' }],
        assetKeywords: ['교감실', '교감'],
      },
      {
        id: 'room-admin',
        name: '행정실',
        floor: 1,
        members: [
          { id: 'm-admin1', name: '행정실장', role: '행정실장' },
          { id: 'm-admin2', name: '행정직원', role: '행정직원' },
        ],
        assetKeywords: ['행정실'],
      },
      {
        id: 'room-teachers',
        name: '교무실',
        floor: 1,
        members: [
          { id: 'm-teacher-office', name: '교무부장', role: '교무부장' },
          { id: 'm-teacher-office2', name: '연구부장', role: '연구부장' },
        ],
        assetKeywords: ['교무실'],
      },
    ],
  },
  {
    floor: 2,
    name: '2층 (1·2학년 교실)',
    description: '1학년 1~3반, 2학년 1~3반, 과학실',
    rooms: [
      {
        id: 'room-1-1',
        name: '1학년 1반',
        floor: 2,
        members: [{ id: 'm-1-1', name: '1학년 1반 담임', role: '1학년 1반 담임' }],
        assetKeywords: ['1학년 1반', '1-1반'],
      },
      {
        id: 'room-1-2',
        name: '1학년 2반',
        floor: 2,
        members: [{ id: 'm-1-2', name: '1학년 2반 담임', role: '1학년 2반 담임' }],
        assetKeywords: ['1학년 2반', '1-2반'],
      },
      {
        id: 'room-1-3',
        name: '1학년 3반',
        floor: 2,
        members: [{ id: 'm-1-3', name: '1학년 3반 담임', role: '1학년 3반 담임' }],
        assetKeywords: ['1학년 3반', '1-3반'],
      },
      {
        id: 'room-2-1',
        name: '2학년 1반',
        floor: 2,
        members: [{ id: 'm-2-1', name: '2학년 1반 담임', role: '2학년 1반 담임' }],
        assetKeywords: ['2학년 1반', '2-1반'],
      },
      {
        id: 'room-2-2',
        name: '2학년 2반',
        floor: 2,
        members: [{ id: 'm-2-2', name: '2학년 2반 담임', role: '2학년 2반 담임' }],
        assetKeywords: ['2학년 2반', '2-2반'],
      },
      {
        id: 'room-2-3',
        name: '2학년 3반',
        floor: 2,
        members: [{ id: 'm-2-3', name: '2학년 3반 담임', role: '2학년 3반 담임' }],
        assetKeywords: ['2학년 3반', '2-3반'],
      },
      {
        id: 'room-science',
        name: '과학실',
        floor: 2,
        members: [{ id: 'm-science', name: '과학부장', role: '과학부장' }],
        assetKeywords: ['과학실'],
      },
    ],
  },
  {
    floor: 3,
    name: '3층 (3·4·5·6학년 교실·특별실)',
    description: '3~6학년 교실, 컴퓨터실, 도서관',
    rooms: [
      {
        id: 'room-3-1',
        name: '3학년 1반',
        floor: 3,
        members: [{ id: 'm-3-1', name: '3학년 1반 담임', role: '3학년 1반 담임' }],
        assetKeywords: ['3학년 1반', '3-1반'],
      },
      {
        id: 'room-3-2',
        name: '3학년 2반',
        floor: 3,
        members: [{ id: 'm-3-2', name: '3학년 2반 담임', role: '3학년 2반 담임' }],
        assetKeywords: ['3학년 2반', '3-2반'],
      },
      {
        id: 'room-4-1',
        name: '4학년 1반',
        floor: 3,
        members: [{ id: 'm-4-1', name: '4학년 1반 담임', role: '4학년 1반 담임' }],
        assetKeywords: ['4학년 1반', '4-1반'],
      },
      {
        id: 'room-4-2',
        name: '4학년 2반',
        floor: 3,
        members: [{ id: 'm-4-2', name: '4학년 2반 담임', role: '4학년 2반 담임' }],
        assetKeywords: ['4학년 2반', '4-2반'],
      },
      {
        id: 'room-5-1',
        name: '5학년 1반',
        floor: 3,
        members: [{ id: 'm-5-1', name: '5학년 1반 담임', role: '5학년 1반 담임' }],
        assetKeywords: ['5학년 1반', '5-1반'],
      },
      {
        id: 'room-5-2',
        name: '5학년 2반',
        floor: 3,
        members: [{ id: 'm-5-2', name: '5학년 2반 담임', role: '5학년 2반 담임' }],
        assetKeywords: ['5학년 2반', '5-2반'],
      },
      {
        id: 'room-6-1',
        name: '6학년 1반',
        floor: 3,
        members: [{ id: 'm-6-1', name: '6학년 1반 담임', role: '6학년 1반 담임' }],
        assetKeywords: ['6학년 1반', '6-1반'],
      },
      {
        id: 'room-6-2',
        name: '6학년 2반',
        floor: 3,
        members: [{ id: 'm-6-2', name: '6학년 2반 담임', role: '6학년 2반 담임' }],
        assetKeywords: ['6학년 2반', '6-2반'],
      },
      {
        id: 'room-computer',
        name: '컴퓨터실',
        floor: 3,
        members: [{ id: 'm-it', name: '정보담당교사', role: '정보담당교사' }],
        assetKeywords: ['컴퓨터실', '정보실'],
      },
      {
        id: 'room-library',
        name: '도서관',
        floor: 3,
        members: [{ id: 'm-library', name: '사서교사', role: '사서교사' }],
        assetKeywords: ['도서관', '도서실'],
      },
    ],
  },
];

export function BuildingMapView({ assets, privacyMode }: BuildingMapViewProps) {
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<DeviceCategory | 'all'>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);


  const filteredAssets = useMemo(() => {
    if (categoryFilter === 'all') return assets;
    return assets.filter(a => a.category === categoryFilter);
  }, [assets, categoryFilter]);

  const totalCount = filteredAssets.length;
  const tabletCount = assets.filter(a => a.category === 'smart_tablet').length;
  const smartLaptopCount = assets.filter(a => a.category === 'smart_laptop').length;
  const teacherLaptopCount = assets.filter(a => a.category === 'teacher_laptop').length;
  const printerCount = assets.filter(a => a.category === 'printer').length;
  const desktopCount = assets.filter(a => a.category === 'desktop_pc').length;

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
      groups.push({ member, assets: [...memberAssets] });
    });

    // 특정 구성원에 매칭되지 않은 잔여 기기 → 첫 번째 구성원 그룹에 편입
    const assignedIds = new Set(groups.flatMap(g => g.assets.map(a => a.id)));
    const unmatched = roomAssets.filter(a => !assignedIds.has(a.id));
    if (unmatched.length > 0 && groups.length > 0) {
      groups[0].assets.push(...unmatched);
    }

    return { groups, totalCount: roomAssets.length };
  };

  const getDeviceIcon = (category: DeviceCategory) => {
    switch (category) {
      case 'smart_tablet': return <Tablet className="w-3.5 h-3.5 text-indigo-400" />;
      case 'smart_laptop': return <Laptop className="w-3.5 h-3.5 text-blue-400" />;
      case 'teacher_laptop': return <Laptop className="w-3.5 h-3.5 text-cyan-400" />;
      case 'printer': return <Printer className="w-3.5 h-3.5 text-amber-400" />;
      case 'server': return <Server className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Monitor className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const visibleFloors = selectedFloor === 'all'
    ? BUILDING_CONFIG
    : BUILDING_CONFIG.filter(f => f.floor === selectedFloor);

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
              정보화기기 건물 배치도 (1층 → 2층 → 3층)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              교육용 노트북과 교원용 노트북이 명확히 구분된 실별/구성원별 배치 현황
            </p>
          </div>

          {/* Floor Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedFloor('all')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
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
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
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

        {/* Category Filter Buttons */}
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            기기 종류 선택 필터:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 no-print">
            {/* 전체 */}
            <button
              onClick={() => setCategoryFilter('all')}
              className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'all'
                  ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">전체 기기</p>
                <p className="text-xs font-bold text-slate-100">{totalCount}대</p>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </button>

            {/* 스마트 태블릿 */}
            <button
              onClick={() => setCategoryFilter('smart_tablet')}
              className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'smart_tablet'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white ring-2 ring-indigo-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">스마트 태블릿</p>
                <p className="text-xs font-bold text-indigo-300">{tabletCount}대</p>
              </div>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Tablet className="w-4 h-4" />
              </div>
            </button>

            {/* 교육용 노트북 */}
            <button
              onClick={() => setCategoryFilter('smart_laptop')}
              className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'smart_laptop'
                  ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">교육용 노트북</p>
                <p className="text-xs font-bold text-blue-300">{smartLaptopCount}대</p>
              </div>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Laptop className="w-4 h-4" />
              </div>
            </button>

            {/* 교원용 노트북 */}
            <button
              onClick={() => setCategoryFilter('teacher_laptop')}
              className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'teacher_laptop'
                  ? 'bg-cyan-600/20 border-cyan-500 text-white ring-2 ring-cyan-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">교원용 노트북</p>
                <p className="text-xs font-bold text-cyan-300">{teacherLaptopCount}대</p>
              </div>
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Laptop className="w-4 h-4" />
              </div>
            </button>

            {/* 데스크탑 PC */}
            <button
              onClick={() => setCategoryFilter('desktop_pc')}
              className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'desktop_pc'
                  ? 'bg-emerald-600/20 border-emerald-500 text-white ring-2 ring-emerald-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">데스크탑 PC</p>
                <p className="text-xs font-bold text-emerald-300">{desktopCount}대</p>
              </div>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Monitor className="w-4 h-4" />
              </div>
            </button>

            {/* 프린터 */}
            <button
              onClick={() => setCategoryFilter('printer')}
              className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between ${
                categoryFilter === 'printer'
                  ? 'bg-amber-600/20 border-amber-500 text-white ring-2 ring-amber-500/40 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-[11px] font-medium">프린터</p>
                <p className="text-xs font-bold text-amber-300">{printerCount}대</p>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Printer className="w-4 h-4" />
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
                              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                                  <UserCheck className="w-3 h-3 text-indigo-400" />
                                  {privacyMode ? member.role : member.name}
                                </span>
                                <span className="text-[10px] text-slate-500">{memAssets.length}대</span>
                              </div>

                              <div className="space-y-1">
                                {memAssets.map(asset => (
                                  <div
                                    key={asset.id}
                                    onClick={() => setSelectedAsset(asset)}
                                    className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/60 flex items-center justify-between text-[11px] cursor-pointer hover:bg-blue-950/40 hover:border-blue-700/50 transition-all group/asset"
                                    title="클릭하여 기기 상세 정보 보기"
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      {getDeviceIcon(asset.category)}
                                      <span className="font-mono text-blue-300 font-bold">{asset.id}</span>
                                      <span className="truncate text-slate-300 group-hover/asset:text-slate-100">{asset.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                        asset.category === 'teacher_laptop' ? 'bg-cyan-500/20 text-cyan-300' :
                                        asset.category === 'smart_laptop' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-400'
                                      }`}>
                                        {asset.category === 'teacher_laptop' ? '교원용' :
                                         asset.category === 'smart_laptop' ? '교육용' : ''}
                                      </span>
                                      {asset.isLocationMismatch && (
                                        <span className="text-[9px] px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                                          !불일치
                                        </span>
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
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 no-print"
            onClick={() => setSelectedAsset(null)}
          />
          {/* 드로어 패널 */}
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col no-print animate-slide-in-right">

            {/* 드로어 헤더 */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30">
                  {getDeviceIcon(selectedAsset.category)}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono">{selectedAsset.id}</p>
                  <h3 className="text-sm font-bold text-slate-100 leading-tight">{selectedAsset.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 상태 배지 바 */}
            <div className="flex items-center gap-2 px-5 py-3 bg-slate-950/60 border-b border-slate-800">
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                selectedAsset.status === 'normal'             ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                selectedAsset.status === 'repair'             ? 'bg-amber-500/20  text-amber-300  border border-amber-500/30'  :
                selectedAsset.status === 'storage'            ? 'bg-slate-700     text-slate-300  border border-slate-600'      :
                                                                'bg-rose-500/20   text-rose-300   border border-rose-500/30'
              }`}>
                {selectedAsset.status === 'normal' ? '✅ 정상 사용중' :
                 selectedAsset.status === 'repair' ? '🔧 수리중' :
                 selectedAsset.status === 'storage' ? '📦 보관중' : '⚠️ 불용 예정'}
              </span>
              {selectedAsset.isLocationMismatch && (
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> 위치 불일치
                </span>
              )}
            </div>

            {/* 드로어 바디 (스크롤) */}
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
                    { label: '장부 위치', value: selectedAsset.ledgerLocation || '-' },
                    { label: '실제 위치', value: selectedAsset.actualLocation || '-',
                      highlight: selectedAsset.isLocationMismatch },
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
                      {privacyMode
                        ? (selectedAsset.credentials?.ipAddress?.replace(/\.\d+$/, '.***') ?? '-')
                        : (selectedAsset.credentials?.ipAddress ?? '-')}
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

            {/* 드로어 푸터 */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/80">
              <p className="text-[10px] text-slate-500 text-center">
                마지막 업데이트: {selectedAsset.updatedAt || '-'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
