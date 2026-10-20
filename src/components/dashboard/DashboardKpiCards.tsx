import React from 'react';
import { ArrowUp, ArrowDown, Activity, Calendar, Trophy, BarChart3 } from 'lucide-react';
import type { KpiSummary } from '../../services/metricsService';

interface Props {
  kpis: KpiSummary;
  unit: string;
}

export const DashboardKpiCards: React.FC<Props> = ({ kpis, unit }) => {
  const formatNum = (n: number) => n.toLocaleString('ko-KR');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. 최신 일간 트래픽 */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">최신 일간 트래픽</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {formatNum(kpis.currentValue)}
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1.5">{unit.split(' ')[0]}</span>
            </h3>
          </div>
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-center text-xs">
          <span className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded ${
            kpis.dailyChange >= 0 
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60' 
              : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60'
          }`}>
            {kpis.dailyChange >= 0 ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
            {Math.abs(kpis.dailyChange)}%
          </span>
          <span className="text-gray-400 dark:text-gray-500 ml-2">전일 ({formatNum(kpis.prevValue)}) 대비</span>
        </div>
      </div>

      {/* 2. 주간 누적 트래픽 */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">최근 7일 누적</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {formatNum(kpis.weeklyTotal)}
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1.5">{unit.split(' ')[0]}</span>
            </h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-center text-xs">
          <span className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded ${
            kpis.weeklyChange >= 0 
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60' 
              : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60'
          }`}>
            {kpis.weeklyChange >= 0 ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
            {Math.abs(kpis.weeklyChange)}%
          </span>
          <span className="text-gray-400 dark:text-gray-500 ml-2">직전 7일 대비</span>
        </div>
      </div>

      {/* 3. 최고 피크 트래픽 */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">기간 내 최고치 (Peak)</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {formatNum(kpis.peakValue)}
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1.5">{unit.split(' ')[0]}</span>
            </h3>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          기록일: <span className="font-semibold text-gray-800 dark:text-gray-200">{kpis.peakDate}</span>
          <span className="text-[11px] text-gray-400 ml-1">({kpis.displayDays}일 중)</span>
        </div>
      </div>

      {/* 4. 기간 내 일평균 트래픽 */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpis.displayDays}일간 일평균 트래픽</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {formatNum(kpis.averageValue)}
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1.5">{unit.split(' ')[0]}</span>
            </h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {kpis.displayDays}일 누적 합계: <span className="font-semibold text-gray-800 dark:text-gray-200">{formatNum(kpis.periodTotal)}</span> {unit.split(' ')[0]}
        </div>
      </div>
    </div>
  );
};
