import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Search, X, Loader2, Smartphone, Monitor, Lightbulb } from 'lucide-react';

type Lang = 'ko' | 'en';
type Point = { date: string; views: number };
type KwData = { series: Point[]; mobile: number; desktop: number; error?: string };

const COLORS = ['#4f46e5', '#ef4444', '#10b981'];
const MAX_KEYWORDS = 3;
const PERIODS = [
  { label: '7일', days: 7 },
  { label: '30일', days: 30 },
  { label: '3개월', days: 90 },
  { label: '6개월', days: 180 },
  { label: '1년', days: 365 },
];
const PRESETS: Record<Lang, string[]> = {
  ko: ['저출산', '기후 변화', '인공지능', '고령화'],
  en: ['Climate change', 'Artificial intelligence', 'ChatGPT', 'Human rights'],
};

const ymd = (d: Date) =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
const compact = (v: number) => new Intl.NumberFormat('en', { notation: 'compact' }).format(v);
const sum = (arr: Point[]) => arr.reduce((s, p) => s + p.views, 0);

const fetchViews = async (lang: Lang, title: string, access: string, start: Date, end: Date): Promise<Point[]> => {
  const t = encodeURIComponent(title.replace(/ /g, '_'));
  const res = await fetch(
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lang}.wikipedia.org/${access}/user/${t}/daily/${ymd(start)}00/${ymd(end)}00`
  );
  if (res.status === 404) return []; // 해당 기간 데이터 없음 (존재하지 않는 제목이거나 조회수 0)
  if (!res.ok) throw new Error('위키미디어 API 호출에 실패했습니다.');
  const json = await res.json();
  return json.items.map((i: any) => ({ date: i.timestamp.substring(0, 8), views: i.views }));
};

const Explore = () => {
  const [params] = useSearchParams();
  const [lang, setLang] = useState<Lang>(params.get('lang') === 'en' ? 'en' : 'ko');
  const [keywords, setKeywords] = useState<string[]>(() => {
    const q = params.get('q');
    return q ? [q.replace(/_/g, ' ')] : [];
  });
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Record<string, KwData>>({});
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // 자동완성: 위키백과 opensearch로 실제 존재하는 문서 제목을 제안 (제목 불일치 문제 방지)
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&namespace=0&format=json&origin=*`,
          { signal: ctrl.signal }
        );
        const json = await res.json();
        setSuggestions(json[1] ?? []);
      } catch {
        /* 입력이 바뀌어 취소된 요청은 무시 */
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, lang]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // 데이터 조회: 전체 + 기기별(모바일 웹/앱, 데스크톱) 실제 집계
  useEffect(() => {
    if (keywords.length === 0) {
      setResults({});
      return;
    }
    let alive = true;
    setLoading(true);
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - days);

    Promise.all(
      keywords.map(async (kw): Promise<[string, KwData]> => {
        try {
          const [all, mWeb, mApp, desk] = await Promise.all([
            fetchViews(lang, kw, 'all-access', start, end),
            fetchViews(lang, kw, 'mobile-web', start, end),
            fetchViews(lang, kw, 'mobile-app', start, end),
            fetchViews(lang, kw, 'desktop', start, end),
          ]);
          return [kw, { series: all, mobile: sum(mWeb) + sum(mApp), desktop: sum(desk) }];
        } catch (e: any) {
          return [kw, { series: [], mobile: 0, desktop: 0, error: e.message }];
        }
      })
    ).then((entries) => {
      if (!alive) return;
      setResults(Object.fromEntries(entries));
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [keywords, lang, days]);

  const addKeyword = (title: string) => {
    const t = title.trim();
    if (!t || keywords.includes(t) || keywords.length >= MAX_KEYWORDS) return;
    setKeywords([...keywords, t]);
    setQuery('');
    setSuggestions([]);
    setOpen(false);
  };

  const changeLang = (l: Lang) => {
    if (l === lang) return;
    setLang(l);
    setKeywords([]);
    setQuery('');
  };

  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  // 차트 데이터: 일별 조회수 또는 주간 합계(7일 묶음) 선택 가능
  const chartData = useMemo(() => {
    const map = new Map<string, any>();
    keywords.forEach((kw, i) =>
      results[kw]?.series.forEach((p) => {
        const row = map.get(p.date) ?? { date: p.date };
        row[`k${i}`] = p.views;
        map.set(p.date, row);
      })
    );
    const rows = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    
    // 일별 보기 (30일 이하이거나 사용자가 '일별' 선택 시)
    if (days <= 30 || viewMode === 'daily') {
      return rows.map((r) => ({ ...r, name: `${+r.date.slice(4, 6)}/${+r.date.slice(6, 8)}` }));
    }

    // 주간 합계 보기 (30일 초과 시 7일씩 합산)
    const weekly: any[] = [];
    for (let i = 0; i < rows.length; i += 7) {
      const chunk = rows.slice(i, i + 7);
      const first = chunk[0].date;
      const last = chunk[chunk.length - 1].date;
      const out: any = { 
        name: `${+first.slice(4, 6)}/${+first.slice(6, 8)}~${+last.slice(4, 6)}/${+last.slice(6, 8)}`,
        isWeekly: true
      };
      keywords.forEach((_, k) => {
        const vals = chunk.map((r) => r[`k${k}`]).filter((v) => v !== undefined);
        if (vals.length) {
          // 주간 총 발생 조회수 합계
          out[`k${k}`] = vals.reduce((s: number, v: number) => s + v, 0);
        }
      });
      weekly.push(out);
    }
    return weekly;
  }, [keywords, results, days, viewMode]);

  const stats = keywords.map((kw, i) => {
    const s = results[kw]?.series ?? [];
    const total = sum(s);
    const avg = s.length ? total / s.length : 0;
    const peak = s.reduce((m, p) => (p.views > m.views ? p : m), { date: '', views: 0 });
    const last7 = sum(s.slice(-7));
    const prev7 = sum(s.slice(-14, -7));
    const change = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : null;
    return { kw, color: COLORS[i], total, avg, peak, change, count: s.length };
  });

  const insight = (st: (typeof stats)[number]) => {
    if (st.count === 0) return null;
    const ratio = st.avg > 0 ? st.peak.views / st.avg : 0;
    const d = `${+st.peak.date.slice(4, 6)}월 ${+st.peak.date.slice(6, 8)}일`;
    if (ratio >= 3)
      return `'${st.kw}'는 ${d}에 일평균(${Math.round(st.avg).toLocaleString()}회)의 ${ratio.toFixed(1)}배인 ${st.peak.views.toLocaleString()}회까지 치솟았습니다. 특정 사건·뉴스에 반응하는 이벤트성 관심 패턴입니다.`;
    if (st.change !== null && st.change >= 20)
      return `'${st.kw}'는 최근 7일간 직전 7일보다 ${st.change.toFixed(0)}% 늘어 관심이 커지는 중입니다.`;
    if (st.change !== null && st.change <= -20)
      return `'${st.kw}'는 최근 7일간 직전 7일보다 ${Math.abs(st.change).toFixed(0)}% 줄어 관심이 식고 있습니다.`;
    return `'${st.kw}'는 큰 급등락 없이 일정한 수준(일평균 ${Math.round(st.avg).toLocaleString()}회)의 꾸준한 관심을 유지하고 있습니다.`;
  };

  const hasData = stats.some((s) => s.count > 0);
  const seg = (active: boolean) =>
    `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">키워드 추적</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
          위키백과 문서를 검색해 조회수 추이를 직접 확인하세요. 최대 {MAX_KEYWORDS}개까지 한 그래프에서 비교할 수 있습니다.
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-4 transition-colors">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button className={seg(lang === 'ko')} onClick={() => changeLang('ko')}>한국어</button>
            <button className={seg(lang === 'en')} onClick={() => changeLang('en')}>English</button>
          </div>

          <div className="relative flex-1" ref={boxRef}>
            <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 focus-within:ring-2 focus-within:ring-indigo-500 bg-white dark:bg-gray-700">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={query}
                disabled={keywords.length >= MAX_KEYWORDS}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addKeyword(suggestions[0] ?? query);
                }}
                placeholder={
                  keywords.length >= MAX_KEYWORDS
                    ? `최대 ${MAX_KEYWORDS}개까지 비교할 수 있습니다`
                    : lang === 'ko' ? '추적할 문서 제목 (예: 저출산)' : 'Article title (e.g. Climate change)'
                }
                className="flex-1 py-2 outline-none bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 disabled:cursor-not-allowed"
              />
            </div>
            {open && suggestions.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-72 overflow-auto">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addKeyword(s)}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-1 flex-wrap bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            {PERIODS.map((p) => (
              <button key={p.days} className={seg(days === p.days)} onClick={() => setDays(p.days)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 min-h-[2rem]">
          {keywords.map((kw, i) => (
            <span
              key={kw}
              className="inline-flex items-center gap-2 pl-3 pr-2 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: COLORS[i] }}
            >
              {kw}
              <button onClick={() => setKeywords(keywords.filter((k) => k !== kw))} aria-label={`${kw} 제거`}>
                <X className="h-4 w-4" />
              </button>
            </span>
          ))}
          {keywords.length === 0 && (
            <>
              <span className="text-sm text-gray-400">추천:</span>
              {PRESETS[lang].map((p) => (
                <button
                  key={p}
                  onClick={() => addKeyword(p)}
                  className="px-3 py-1 rounded-full text-sm border border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                >
                  {p}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" /> 데이터를 불러오는 중...
        </div>
      )}

      {!loading && keywords.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          위에서 키워드를 검색하거나 추천 키워드를 눌러 시작하세요.
        </div>
      )}

      {!loading && keywords.length > 0 && (
        <>
          {stats.filter((s) => s.count === 0).map((s) => (
            <div key={s.kw} className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm rounded-lg px-4 py-3">
              '{s.kw}' 문서의 조회 데이터를 찾지 못했습니다. 제목이 정확한지 확인하고, 자동완성 목록에서 선택해 주세요.
              {results[s.kw]?.error && ` (${results[s.kw].error})`}
            </div>
          ))}

          {hasData && (
            <>
              {/* 요약 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.filter((s) => s.count > 0).map((s) => (
                  <div key={s.kw} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-bold text-gray-900 dark:text-white truncate">{s.kw}</span>
                    </div>
                    <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{s.total.toLocaleString()}회</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">기간 내 총 조회수</div>
                    <dl className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                      <div className="flex justify-between"><dt>일평균</dt><dd className="font-medium text-gray-900 dark:text-white">{Math.round(s.avg).toLocaleString()}회</dd></div>
                      <div className="flex justify-between">
                        <dt>최고치</dt>
                        <dd className="font-medium text-gray-900 dark:text-white">{s.peak.views.toLocaleString()}회 ({+s.peak.date.slice(4, 6)}/{+s.peak.date.slice(6, 8)})</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>최근 7일 변화</dt>
                        <dd className={`font-semibold ${s.change === null ? '' : s.change >= 0 ? 'text-rose-500 dark:text-rose-400' : 'text-blue-500 dark:text-blue-400'}`}>
                          {s.change === null ? '-' : `${s.change >= 0 ? '▲' : '▼'} ${Math.abs(s.change).toFixed(1)}%`}
                        </dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>

              {/* 추이 차트 */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">조회수 추이</h2>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {days > 30 && viewMode === 'weekly' ? '7일 단위 주간 총 조회수 합계' : '일별 조회수'} · 봇·크롤러 트래픽 제외
                    </span>
                  </div>

                  {days > 30 && (
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg self-start sm:self-auto">
                      <button
                        onClick={() => setViewMode('daily')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                          viewMode === 'daily'
                            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                        }`}
                      >
                        일별 추이
                      </button>
                      <button
                        onClick={() => setViewMode('weekly')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                          viewMode === 'weekly'
                            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                        }`}
                      >
                        주간 합계 (7일 누적)
                      </button>
                    </div>
                  )}
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} minTickGap={days > 30 ? 40 : 24} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={compact} width={50} />
                      <Tooltip 
                        formatter={(v: any) => {
                          const num = Number(v);
                          if (days > 30 && viewMode === 'weekly') {
                            return [`${num.toLocaleString()}회 (주간 총합, 일평균 약 ${Math.round(num / 7).toLocaleString()}회)`, '조회수'];
                          }
                          return [`${num.toLocaleString()}회 (일간 조회수)`, '조회수'];
                        }} 
                      />
                      <Legend />
                      {keywords.map((kw, i) => (
                        <Line
                          key={kw}
                          type="monotone"
                          dataKey={`k${i}`}
                          name={kw}
                          stroke={COLORS[i]}
                          strokeWidth={2.5}
                          dot={false}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 기기별 실제 비율 */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">접속 기기 비율</h2>
                  <p className="text-xs text-gray-500 mb-4">위키미디어가 집계한 실제 데이터입니다. (모바일 = 모바일 웹 + 앱)</p>
                  <div className="space-y-5">
                    {stats.filter((s) => s.count > 0).map((s) => {
                      const r = results[s.kw];
                      const t = r.mobile + r.desktop;
                      const mp = t > 0 ? (r.mobile / t) * 100 : 0;
                      return (
                        <div key={s.kw}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-800">{s.kw}</span>
                            <span className="text-gray-500">
                              <Smartphone className="inline h-3.5 w-3.5 mr-0.5" />{mp.toFixed(1)}%
                              <Monitor className="inline h-3.5 w-3.5 ml-3 mr-0.5" />{(100 - mp).toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-gray-200 overflow-hidden flex">
                            <div className="h-full" style={{ width: `${mp}%`, backgroundColor: s.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 자동 분석 */}
                <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6">
                  <h2 className="text-lg font-bold text-indigo-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-indigo-600" /> 자동 분석
                  </h2>
                  <ul className="space-y-3 text-indigo-900 text-sm leading-relaxed">
                    {stats.map((s) => insight(s)).filter(Boolean).map((t, i) => (
                      <li key={i}>• {t}</li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-indigo-400">조회수 변화를 규칙 기반으로 요약한 결과이며, 원인을 단정하지 않습니다.</p>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
