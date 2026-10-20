import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Search, TrendingUp, Trophy, Loader2, AlertCircle, Swords, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

const getWikiDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}00`;
};

const BATTLE_PRESETS: Record<'ko' | 'en', Array<{ category: string; label: string; k1: string; k2: string }>> = {
  ko: [
    { category: '🤖 빅테크', label: '삼성전자 vs SK하이닉스', k1: '삼성전자', k2: 'SK하이닉스' },
    { category: '⚽ 스포츠 인물', label: '손흥민 vs 오타니 쇼헤이', k1: '손흥민', k2: '오타니 쇼헤이' },
  ],
  en: [
    { category: '🤖 Big Tech', label: 'ChatGPT vs Gemini', k1: 'ChatGPT', k2: 'Gemini (language model)' },
    { category: '⚾ Sports Star', label: 'Shohei Ohtani vs Aaron Judge', k1: 'Shohei Ohtani', k2: 'Aaron Judge' },
  ],
};

const Report = () => {
  const [searchParams] = useSearchParams();
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [kw1, setKw1] = useState(() => searchParams.get('k1') || searchParams.get('kw1') || '삼성전자');
  const [kw2, setKw2] = useState(() => searchParams.get('k2') || searchParams.get('kw2') || 'SK하이닉스');
  
  const [activeKw1, setActiveKw1] = useState('');
  const [activeKw2, setActiveKw2] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  // URL 파라미터가 있을 경우 자동 실행
  useEffect(() => {
    const p1 = searchParams.get('k1') || searchParams.get('kw1');
    const p2 = searchParams.get('k2') || searchParams.get('kw2');
    if (p1) {
      setKw1(p1);
      if (p2) {
        setKw2(p2);
        handleCompare(p1, p2);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCompare = async (overrideK1?: string, overrideK2?: string, overrideLang?: 'ko' | 'en') => {
    const term1 = (overrideK1 ?? kw1).trim();
    const term2 = (overrideK2 ?? kw2).trim();
    const targetLang = overrideLang ?? lang;
    if (!term1 || !term2) return;
    
    setLoading(true);
    setError('');
    
    setActiveKw1(term1);
    setActiveKw2(term2);

    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30); // 최근 30일 비교

      const fetchWiki = async (term: string) => {
        const formatted = term.replace(/ /g, '_');
        const res = await fetch(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${targetLang}.wikipedia.org/all-access/user/${encodeURIComponent(formatted)}/daily/${getWikiDate(start)}/${getWikiDate(end)}`);
        if (!res.ok) {
          if (res.status === 404) return []; // 문서 없음
          throw new Error('API 에러');
        }
        const json = await res.json();
        return json.items || [];
      };

      const [data1, data2] = await Promise.all([fetchWiki(term1), fetchWiki(term2)]);
      
      if (data1.length === 0 && data2.length === 0) {
        throw new Error('두 키워드 모두 위키백과 문서를 찾을 수 없습니다. (정확한 문서명을 입력해주세요)');
      }

      // 날짜별로 데이터 병합 (Map 사용)
      const dateMap = new Map<string, any>();
      
      let total1 = 0;
      let total2 = 0;
      let max1 = 0;
      let max2 = 0;

      const processData = (data: any[], key: string, isFirst: boolean) => {
        data.forEach((item: any) => {
          const m = parseInt(item.timestamp.substring(4, 6), 10);
          const d = parseInt(item.timestamp.substring(6, 8), 10);
          const dateStr = `${m}/${d}`;
          
          if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, { name: dateStr, val1: 0, val2: 0 });
          }
          const existing = dateMap.get(dateStr);
          if (isFirst) {
            existing.val1 = item.views;
            total1 += item.views;
            if (item.views > max1) max1 = item.views;
          } else {
            existing.val2 = item.views;
            total2 += item.views;
            if (item.views > max2) max2 = item.views;
          }
        });
      };

      processData(data1, 'val1', true);
      processData(data2, 'val2', false);

      const merged = [];
      let currentDate = new Date(start);
      while (currentDate <= end) {
        const m = currentDate.getMonth() + 1;
        const d = currentDate.getDate();
        const dateStr = `${m}/${d}`;
        if (dateMap.has(dateStr)) {
          merged.push(dateMap.get(dateStr));
        } else {
          merged.push({ name: dateStr, val1: 0, val2: 0 });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setChartData(merged);
      setStats({
        total1, total2,
        max1, max2,
        winner: total1 > total2 ? 1 : total2 > total1 ? 2 : 0
      });

    } catch (err: any) {
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 시 한 번 실행
  useEffect(() => {
    handleCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectPreset = (preset: { k1: string; k2: string }) => {
    setKw1(preset.k1);
    setKw2(preset.k2);
    handleCompare(preset.k1, preset.k2, lang);
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="bg-gray-900 px-8 py-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Swords className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-300 mb-4">
              <TrendingUp className="h-5 w-5" />
              <span className="font-bold tracking-wider">TREND BATTLE</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">트렌드 빅매치 (1:1 비교 분석)</h1>
            <p className="mt-3 text-gray-300 max-w-2xl text-sm">
              원하는 두 개의 키워드를 입력하여, 대중의 관심도(위키백과 조회수)가 어느 쪽으로 더 쏠렸는지 30일간의 데이터를 통해 1:1로 비교해 보세요.
            </p>
          </div>
        </div>

        {/* Search Box */}
        <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750/30">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">언어 설정</label>
              <select 
                className="w-full md:w-32 border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm"
                value={lang}
                onChange={(e) => {
                  const nextLang = e.target.value as 'ko' | 'en';
                  setLang(nextLang);
                  const defaultPreset = BATTLE_PRESETS[nextLang][0];
                  setKw1(defaultPreset.k1);
                  setKw2(defaultPreset.k2);
                  handleCompare(defaultPreset.k1, defaultPreset.k2, nextLang);
                }}
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 w-full md:w-1/3">
              <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase ml-1">키워드 A</label>
              <input 
                type="text" 
                value={kw1}
                onChange={e => setKw1(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCompare()}
                className="w-full border-2 border-indigo-200 dark:border-indigo-800 rounded-lg py-3 px-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 font-bold text-gray-900 dark:text-white text-sm"
                placeholder="예: 삼성전자"
              />
            </div>

            <div className="flex items-center justify-center pt-5">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-2 text-gray-500 dark:text-gray-300">
                <Swords className="w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full md:w-1/3">
              <label className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase ml-1">키워드 B</label>
              <input 
                type="text" 
                value={kw2}
                onChange={e => setKw2(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCompare()}
                className="w-full border-2 border-pink-200 dark:border-pink-800 rounded-lg py-3 px-4 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 bg-white dark:bg-gray-700 font-bold text-gray-900 dark:text-white text-sm"
                placeholder="예: SK하이닉스"
              />
            </div>

            <div className="pt-5 w-full md:w-auto shrink-0">
              <button 
                onClick={() => handleCompare()}
                disabled={loading}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-lg font-bold transition-colors disabled:opacity-50 whitespace-nowrap text-sm shadow-sm"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                비교 분석
              </button>
            </div>
          </div>

          {/* 추천 빅매치 예시 프리셋 (빅테크 & 스포츠 인물) */}
          <div className="mt-5 pt-4 border-t border-gray-200/70 dark:border-gray-700/70 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mr-1">
              🔥 추천 빅매치 예시:
            </span>
            {BATTLE_PRESETS[lang].map((preset) => {
              const isSelected = activeKw1 === preset.k1 && activeKw2 === preset.k2;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                    isSelected
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {preset.category}
                  </span>
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg flex items-center gap-2 font-medium text-sm justify-center border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>

        {/* Results Area */}
        {!loading && !error && chartData.length > 0 && stats && (
          <div className="p-8">
            {/* 전체 캡처용 컨테이너 */}
            <div id="trend-battle-card" className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 space-y-6">
              {/* 상단 승자 총평 배너 */}
              <div className={`p-4 rounded-xl flex items-center justify-between gap-4 border ${
                stats.winner === 1
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200'
                  : 'bg-pink-50/80 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800 text-pink-950 dark:text-pink-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-400/20 text-amber-500">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">
                      최근 30일 빅매치 결과: <span className="underline font-black">{stats.winner === 1 ? activeKw1 : activeKw2}</span> 판정승!
                    </h3>
                    <p className="text-xs opacity-80 mt-0.5">
                      30일간 누적 조회수 {formatNumber(Math.max(stats.total1, stats.total2))}회를 기록하여,{' '}
                      상대 키워드 대비 약{' '}
                      <span className="font-bold">
                        {(Math.max(stats.total1, stats.total2) / Math.max(1, Math.min(stats.total1, stats.total2))).toFixed(1)}배
                      </span>{' '}
                      더 높은 대중의 관심을 받았습니다.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const el = document.getElementById('trend-battle-card');
                    if (el) {
                      html2canvas(el, { backgroundColor: '#ffffff', scale: 2 }).then(c => {
                        const a = document.createElement('a');
                        a.href = c.toDataURL('image/png');
                        a.download = `${activeKw1}_vs_${activeKw2}_트렌드_빅매치_리포트.png`;
                        a.click();
                      });
                    }
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  리포트 카드 저장
                </button>
              </div>

              {/* 통계 카드 2단 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stat Card A */}
                <div className={`p-6 rounded-2xl border-2 transition-all ${
                  stats.winner === 1 
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-sm' 
                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold rounded text-xs">키워드 A</div>
                    {stats.winner === 1 && <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">WINNER 🏆</span>}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 truncate">{activeKw1}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                      <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">30일 누적 관심도</span>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatNumber(stats.total1)}회</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">일일 최고 기록</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(stats.max1)}회</span>
                    </div>
                  </div>
                </div>

                {/* Stat Card B */}
                <div className={`p-6 rounded-2xl border-2 transition-all ${
                  stats.winner === 2 
                    ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 shadow-sm' 
                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="inline-block px-3 py-1 bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 font-bold rounded text-xs">키워드 B</div>
                    {stats.winner === 2 && <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">WINNER 🏆</span>}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 truncate">{activeKw2}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                      <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">30일 누적 관심도</span>
                      <span className="text-lg font-bold text-pink-600 dark:text-pink-400">{formatNumber(stats.total2)}회</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">일일 최고 기록</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(stats.max2)}회</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-6 text-center">관심도 변화 추이 (최근 30일)</h4>
                <div className="h-80 w-full bg-white dark:bg-gray-800 p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 12 }} dy={10} minTickGap={20} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--chart-text)', fontSize: 12 }} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--chart-bg)', color: 'var(--chart-tooltip-text)' }}
                        labelStyle={{ color: 'var(--chart-tooltip-text)', fontWeight: 'bold', marginBottom: '4px' }}
                        formatter={(value: any, name: any) => [formatNumber(value), name === 'val1' ? activeKw1 : activeKw2]}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        formatter={(value) => <span className="font-bold text-gray-700 dark:text-gray-300">{value === 'val1' ? activeKw1 : activeKw2}</span>}
                      />
                      <Line type="monotone" dataKey="val1" name="val1" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                      <Line type="monotone" dataKey="val2" name="val2" stroke="#ec4899" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;
