import React, { useState, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Download, BarChart2, TrendingUp, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { MetricPoint } from '../../services/metricsService';

interface Props {
  data: MetricPoint[];
  title: string;
  unit: string;
  selectedPeriod: number; // in days
  onPeriodChange: (days: number) => void;
}

export const DashboardTrendChart: React.FC<Props> = ({
  data,
  title,
  unit,
  selectedPeriod,
  onPeriodChange,
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [aggMode, setAggMode] = useState<'daily' | 'weekly'>('daily');
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExportPng = async () => {
    if (!chartRef.current || isExporting) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_')}_트래픽_추이.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('PNG export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const periods = [
    { label: '7일', days: 7 },
    { label: '30일', days: 30 },
    { label: '90일', days: 90 },
  ];

  const formatNum = (v: number) => v.toLocaleString('ko-KR');

  // 주간 합계 데이터 생성 (selectedPeriod >= 30일 때 유효)
  const displayData = React.useMemo(() => {
    if (aggMode === 'daily' || selectedPeriod < 30 || data.length < 14) {
      return data;
    }
    const weeklyPoints: any[] = [];
    for (let i = 0; i < data.length; i += 7) {
      const chunk = data.slice(i, i + 7);
      const first = chunk[0].date;
      const last = chunk[chunk.length - 1].date;
      const sumVal = chunk.reduce((acc, p) => acc + p.value, 0);
      weeklyPoints.push({
        date: `${first}~${last}`,
        value: sumVal,
        avgValue: Math.round(sumVal / chunk.length),
        isWeekly: true
      });
    }
    return weeklyPoints;
  }, [data, aggMode, selectedPeriod]);

  return (
    <div
      ref={chartRef}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {title} 추이 분석
          </h2>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              단위:{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {aggMode === 'weekly' && selectedPeriod >= 30 ? '회 (7일 누적 합계)' : unit}
              </span>
            </span>
            {data.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-mono">
                최신 데이터: {data[data.length - 1].fullDate} 기준
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 주간 합계 vs 일별 추이 토글 (30일 이상일 때 활성화) */}
          {selectedPeriod >= 30 && (
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setAggMode('daily')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  aggMode === 'daily'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                }`}
              >
                일별
              </button>
              <button
                onClick={() => setAggMode('weekly')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  aggMode === 'weekly'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                }`}
              >
                주간합계
              </button>
            </div>
          )}

          {/* 차트 형태 토글 */}
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                chartType === 'line'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              선형
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              막대
            </button>
          </div>

          {/* 기간 필터 */}
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {periods.map(p => (
              <button
                key={p.days}
                onClick={() => onPeriodChange(p.days)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedPeriod === p.days
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* PNG 내보내기 */}
          <button
            onClick={handleExportPng}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            PNG 저장
          </button>
        </div>
      </div>

      {/* 차트 렌더링 영역 */}
      <div className="h-80 w-full">
        {displayData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            데이터를 불러오는 중이거나 표시할 트래픽이 없습니다.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={v => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any, item: any) => {
                    const num = Number(val);
                    if (item?.payload?.isWeekly) {
                      return [
                        `${formatNum(num)} ${unit.split(' ')[0]} (주간 총합, 일평균: ${formatNum(item.payload.avgValue)})`,
                        '트래픽'
                      ];
                    }
                    const note = item?.payload?.isInterpolated ? ' (서버 누락 보정치)' : '';
                    return [`${formatNum(num)} ${unit.split(' ')[0]}${note}`, '일간 트래픽'];
                  }}
                  labelFormatter={label => `구간: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#4f46e5' }}
                  activeDot={{ r: 6, stroke: '#818cf8', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={v => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any, item: any) => {
                    const num = Number(val);
                    if (item?.payload?.isWeekly) {
                      return [
                        `${formatNum(num)} ${unit.split(' ')[0]} (주간 총합, 일평균: ${formatNum(item.payload.avgValue)})`,
                        '트래픽'
                      ];
                    }
                    const note = item?.payload?.isInterpolated ? ' (서버 누락 보정치)' : '';
                    return [`${formatNum(num)} ${unit.split(' ')[0]}${note}`, '일간 트래픽'];
                  }}
                  labelFormatter={label => `구간: ${label}`}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
