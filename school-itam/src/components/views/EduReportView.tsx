import React from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  ShieldCheck
} from 'lucide-react';
import type { Asset, DeviceCategory } from '../../types/asset';

interface EduReportViewProps {
  assets: Asset[];
  onPrint: () => void;
}

export const EduReportView: React.FC<EduReportViewProps> = ({
  assets,
  onPrint
}) => {
  // Category Breakdown Aggregation (교육용 노트북 과 교원용 노트북 명확히 분리!)
  const categories: { key: DeviceCategory; label: string }[] = [
    { key: 'smart_tablet', label: '스마트 태블릿 (학생 1인 1디바이스)' },
    { key: 'smart_laptop', label: '스마트 교육용 노트북 (학생 수업/학습용)' },
    { key: 'teacher_laptop', label: '교직원 / 교원 업무용 노트북' },
    { key: 'desktop_pc', label: '교무/행정용 데스크톱 PC' },
    { key: 'printer', label: '프린터 및 복합기' },
    { key: 'monitors', label: '행정/학습용 모니터' },
    { key: 'network_ap', label: '학급 무선 AP (Wi-Fi 6)' },
    { key: 'server', label: '학내망 백업/보안 서버' },
    { key: 'etc', label: '기타 기자재' }
  ];

  const reportRows = categories.map(cat => {
    const catAssets = assets.filter(a => a.category === cat.key);
    const total = catAssets.length;
    const normal = catAssets.filter(a => a.status === 'normal').length;
    const repair = catAssets.filter(a => a.status === 'repair').length;
    const storage = catAssets.filter(a => a.status === 'storage').length;
    const disposal = catAssets.filter(a => a.disposalStatus !== 'none').length;
    const mismatch = catAssets.filter(a => a.isLocationMismatch).length;

    return {
      label: cat.label,
      total,
      normal,
      repair,
      storage,
      disposal,
      mismatch
    };
  });

  const totalAssetsCount = assets.length;
  const totalNormalCount = assets.filter(a => a.status === 'normal').length;
  const totalDisposalCount = assets.filter(a => a.disposalStatus !== 'none').length;
  const totalMismatchCount = assets.filter(a => a.isLocationMismatch).length;

  // CSV Download Export
  const handleExportCSV = () => {
    const headers = ['카테고리명', '총 보유 수량', '정상 운용', '수리 중', '보관 재고', '불용/폐기 예정', '장부 불일치 건수'];
    const rows = reportRows.map(r => [
      `"${r.label}"`,
      r.total,
      r.normal,
      r.repair,
      r.storage,
      r.disposal,
      r.mismatch
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `School_ITAM_Edu_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            시·도 교육청 제출용 정보화기기 현황 통계표
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Zero-PII 개인정보 보호 준수 및 자산 213대의 카테고리별 실태 자동 집계 보고서 (교육용 vs 교원용 노트북 분리)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>엑셀(CSV) 다운로드</span>
          </button>
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>공문 제출용 인쇄</span>
          </button>
        </div>
      </div>

      {/* Official Report Document Area */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 bg-slate-900/90 text-slate-100 shadow-2xl">
        {/* Document Header */}
        <div className="text-center border-b border-slate-700/80 pb-6 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold mb-3 border border-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Zero-PII 비식별화 공문서
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
            학교 정보화기기 보유 및 운용 현황 통계표
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            기준일자: 2026년 10월 03일 현재 | 기관명: ○○초·중·고등학교
          </p>
        </div>

        {/* Report Overview Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-center">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <p className="text-xs text-slate-400 mb-1">총 기기 보유 수량</p>
            <p className="text-xl font-bold text-slate-100">{totalAssetsCount} 대</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <p className="text-xs text-slate-400 mb-1">정상 운용 비율</p>
            <p className="text-xl font-bold text-emerald-400">
              {Math.round((totalNormalCount / totalAssetsCount) * 100)} %
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <p className="text-xs text-slate-400 mb-1">불용/폐기 예정</p>
            <p className="text-xl font-bold text-purple-400">{totalDisposalCount} 건</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <p className="text-xs text-slate-400 mb-1">위치 불일치 점검 대상</p>
            <p className="text-xl font-bold text-rose-400">{totalMismatchCount} 건</p>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/90 text-slate-300 font-bold border-y border-slate-700">
                <th className="p-3.5 border-r border-slate-800">구분 (기종 카테고리)</th>
                <th className="p-3.5 text-right border-r border-slate-800">총 보유(대)</th>
                <th className="p-3.5 text-right border-r border-slate-800 text-emerald-400">정상 운용</th>
                <th className="p-3.5 text-right border-r border-slate-800 text-amber-400">수리 진행</th>
                <th className="p-3.5 text-right border-r border-slate-800 text-slate-400">보관 재고</th>
                <th className="p-3.5 text-right border-r border-slate-800 text-purple-400">불용 예정</th>
                <th className="p-3.5 text-right text-rose-400">장부 불일치</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {reportRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5 font-medium text-slate-200 border-r border-slate-800/60">
                    {row.label}
                  </td>
                  <td className="p-3.5 text-right font-semibold text-slate-100 border-r border-slate-800/60">
                    {row.total}
                  </td>
                  <td className="p-3.5 text-right text-emerald-300 border-r border-slate-800/60">
                    {row.normal}
                  </td>
                  <td className="p-3.5 text-right text-amber-300 border-r border-slate-800/60">
                    {row.repair}
                  </td>
                  <td className="p-3.5 text-right text-slate-400 border-r border-slate-800/60">
                    {row.storage}
                  </td>
                  <td className="p-3.5 text-right text-purple-300 border-r border-slate-800/60">
                    {row.disposal}
                  </td>
                  <td className="p-3.5 text-right font-bold text-rose-400">
                    {row.mismatch > 0 ? `${row.mismatch}건` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 font-extrabold text-slate-100 border-t-2 border-slate-700">
                <td className="p-4 border-r border-slate-800">합계 (Total)</td>
                <td className="p-4 text-right border-r border-slate-800 text-blue-300">{totalAssetsCount}</td>
                <td className="p-4 text-right border-r border-slate-800 text-emerald-400">{totalNormalCount}</td>
                <td className="p-4 text-right border-r border-slate-800 text-amber-400">
                  {reportRows.reduce((a, b) => a + b.repair, 0)}
                </td>
                <td className="p-4 text-right border-r border-slate-800 text-slate-400">
                  {reportRows.reduce((a, b) => a + b.storage, 0)}
                </td>
                <td className="p-4 text-right border-r border-slate-800 text-purple-400">{totalDisposalCount}</td>
                <td className="p-4 text-right text-rose-400">{totalMismatchCount}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Document Footer Signatures */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex justify-between items-end text-xs text-slate-400">
          <div>
            <p>위와 같이 학교 정보화기기 통합 관리 현황을 보고합니다.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              * 본 보고서는 개인정보보호법에 의하여 교직원 실명이 포함되지 않은 Zero-PII 인증 문서입니다.
            </p>
          </div>
          <div className="text-right space-y-1 font-medium">
            <p>작성자: 정보업무 담당교사 (인)</p>
            <p>확인자: 행정실 주무관 / 교감 (인)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
