import React, { useState } from 'react';
import { 
  Tablet, 
  Laptop, 
  BatteryCharging, 
  Lock, 
  Wifi, 
  Key, 
  Eye, 
  EyeOff,
  UserCheck,
  User
} from 'lucide-react';
import type { Asset } from '../../types/asset';
import { maskIP, maskCredential } from '../../utils/privacy';

interface SmartDeviceViewProps {
  assets: Asset[];
  privacyMode: boolean;
}

export const SmartDeviceView: React.FC<SmartDeviceViewProps> = ({
  assets,
  privacyMode
}) => {
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'smart_tablet' | 'smart_laptop' | 'teacher_laptop'>('all');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const smartAssets = assets.filter(
    a => a.category === 'smart_tablet' || a.category === 'smart_laptop' || a.category === 'teacher_laptop'
  );

  const displayAssets = smartAssets.filter(a => {
    if (deviceFilter === 'all') return true;
    return a.category === deviceFilter;
  });

  const tabletCount = smartAssets.filter(a => a.category === 'smart_tablet').length;
  const smartLaptopCount = smartAssets.filter(a => a.category === 'smart_laptop').length;
  const teacherLaptopCount = smartAssets.filter(a => a.category === 'teacher_laptop').length;

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Category Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Tablet className="w-6 h-6 text-indigo-400" />
            단말 관리 (태블릿 51대 / 교육용 44대 / 교원용 25대)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            스마트 교육용 태블릿 및 학생 수업용 노트북과 교직원 업무용 노트북 분리 관리
          </p>
        </div>

        {/* Filter Toggle Buttons (교육용 / 교원용 분리) */}
        <div className="flex flex-wrap items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setDeviceFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              deviceFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            전체 ({smartAssets.length})
          </button>
          <button
            onClick={() => setDeviceFilter('smart_tablet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              deviceFilter === 'smart_tablet'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            태블릿 ({tabletCount})
          </button>
          <button
            onClick={() => setDeviceFilter('smart_laptop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              deviceFilter === 'smart_laptop'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            교육용 노트북 ({smartLaptopCount})
          </button>
          <button
            onClick={() => setDeviceFilter('teacher_laptop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              deviceFilter === 'teacher_laptop'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            교원용 노트북 ({teacherLaptopCount})
          </button>
        </div>
      </div>

      {/* Grid view of Smart Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayAssets.map(device => {
          const isTablet = device.category === 'smart_tablet';
          const isTeacherLaptop = device.category === 'teacher_laptop';
          const isRevealed = !!showPasswordMap[device.id];

          return (
            <div 
              key={device.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${
                      isTablet 
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                        : (isTeacherLaptop 
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20')
                    }`}>
                      {isTablet ? <Tablet className="w-4 h-4" /> : (isTeacherLaptop ? <User className="w-4 h-4" /> : <Laptop className="w-4 h-4" />)}
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-blue-300">{device.id}</span>
                      <p className="text-xs font-semibold text-slate-200">{device.name}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    isTablet 
                      ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' 
                      : (isTeacherLaptop 
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' 
                      : 'bg-blue-500/10 text-blue-300 border-blue-500/30')
                  }`}>
                    {isTablet ? '태블릿' : (isTeacherLaptop ? '교원용 노트북' : '교육용 노트북')}
                  </span>
                </div>

                {/* Charging Cart & Cabinet info */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                      충전함/이동차량:
                    </span>
                    <span className="font-semibold text-emerald-300">
                      {device.chargingCartNo || '미배정'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      보관함 구역:
                    </span>
                    <span className="font-medium text-slate-300">
                      {device.cabinetNo || '기본보관함'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      지정 대상 (Zero-PII):
                    </span>
                    <span className="font-medium text-indigo-300">
                      {device.assignedStudentId || device.assignedRole}
                    </span>
                  </div>
                </div>

                {/* Credentials & Security Area */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-blue-400" /> IP 주소:
                    </span>
                    <span className="font-mono text-slate-200">
                      {maskIP(device.credentials.ipAddress, privacyMode)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-400" /> WiFi/로그인:
                    </span>
                    <span className="font-mono text-slate-300 flex items-center gap-1">
                      {maskCredential(device.credentials.wifiPassword || device.credentials.loginPassword, privacyMode && !isRevealed)}
                      {privacyMode && (
                        <button
                          onClick={() => togglePasswordVisibility(device.id)}
                          className="p-1 hover:text-white text-slate-500"
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>운용위치: {device.actualLocation}</span>
                <span className="text-slate-400">{device.assignedRole}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
