import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  ChevronRight,
  Loader2,
  Bookmark,
  Swords,
  Calendar,
  RotateCcw,
  History,
} from 'lucide-react';
import { NewsAnalyzer } from './NewsAnalyzer';
import { BookmarkService } from '../services/bookmarkService';

type Lang = 'ko' | 'en';
type Mode = 'rising' | 'popular';

interface Row {
  article: string;
  views: number;
  rank: number;
  growth: number | null; // 전일 대비 증감률(%)
  isNew: boolean;        // 전일 상위권 목록에 없던 문서
}

interface LangData {
  date: string;
  actualDate: Date;
  previousDate?: Date;
  rising: Row[];
  popular: Row[];
  hasCompare: boolean;
  previousDayRankings?: { rank: number; title: string; views: number }[];
}

// 대문/특수문서/네임스페이스(:)는 제외하고, 성인물 등 공익 대시보드에 부적절한 문서는 걸러냅니다.
const BLOCKLIST = /porn|xnxx|xvideos|xhamster|xxx|onlyfans|hentai|sex|nude|av_|성인|야동/i;
const isArticle = (title: string) =>
  !title.includes(':') && title !== 'Main_Page' && title !== '-' && !BLOCKLIST.test(title);

const MAX_DATE_ISO = new Date().toISOString().split('T')[0];

const fmtPath = (d: Date) =>
  `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}`;

const TOP_CACHE = new Map<string, any[]>();

const fetchTop = async (lang: Lang, date: Date): Promise<any[] | null> => {
  const cacheKey = `${lang}:${fmtPath(date)}`;
  if (TOP_CACHE.has(cacheKey)) {
    return TOP_CACHE.get(cacheKey) ?? null;
  }
  try {
    const res = await fetch(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${lang}.wikipedia.org/all-access/${fmtPath(date)}`
    );
    if (!res.ok) return null; // 아직 집계되지 않은 날짜는 404
    const json = await res.json();
    const articles = json.items?.[0]?.articles ?? null;
    if (articles) {
      TOP_CACHE.set(cacheKey, articles);
    }
    return articles;
  } catch {
    return null;
  }
};

const loadLang = async (lang: Lang, targetDate?: Date): Promise<LangData> => {
  if (targetDate) {
    let day = targetDate;
    let latest = await fetchTop(lang, day);
    if (!latest) {
      // 선택한 일자의 데이터가 404일 경우(집계 지연 등), 최대 4일 전까지 유효한 집계 일자 자동 탐색
      for (let bOffset = 1; bOffset <= 4; bOffset++) {
        const fallbackDay = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() - bOffset));
        const found = await fetchTop(lang, fallbackDay);
        if (found) {
          latest = found;
          day = fallbackDay;
          break;
        }
      }
    }
    if (!latest) {
      throw new Error(
        `${fmtPath(day)} 날짜의 집계 데이터가 위키미디어 서버에 아직 준비되지 않았습니다. 다른 날짜를 선택하시거나 최신 버튼을 눌러주세요.`
      );
    }

    // 전일 데이터 탐색 (최근 집계 누락 대비 최대 4일 전까지 탐색)
    let prev: any[] | null = null;
    let prevActualDate: Date | null = null;
    for (let pOffset = 1; pOffset <= 4; pOffset++) {
      const prevDay = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() - pOffset));
      const found = await fetchTop(lang, prevDay);
      if (found) {
        prev = found;
        prevActualDate = prevDay;
        break;
      }
    }

    const prevMap = new Map<string, number>();
    prev?.forEach((a: any) => prevMap.set(a.article, a.views));
    const prevFloor = prev && prev.length > 0 ? prev[prev.length - 1].views : 1;

    const rows: Row[] = latest
      .filter((a: any) => isArticle(a.article))
      .map((a: any) => {
        const pv = prevMap.get(a.article);
        const base = pv ?? prevFloor;
        return {
          article: a.article,
          views: a.views,
          rank: a.rank,
          growth: prev ? ((a.views - base) / base) * 100 : null,
          isNew: !!prev && pv === undefined,
        };
      });

    const popular = rows.slice(0, 10);
    const rising = prev
      ? [...rows.slice(0, 200)].sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0)).slice(0, 10)
      : popular;

    const previousDayRankings = prev
      ? prev
          .filter((a: any) => isArticle(a.article))
          .slice(0, 50)
          .map((a: any) => ({
            rank: a.rank,
            title: a.article.replace(/_/g, ' '),
            views: a.views,
          }))
      : [];

    return {
      date: `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}-${String(day.getUTCDate()).padStart(2, '0')}`,
      actualDate: day,
      previousDate: prevActualDate ?? undefined,
      rising,
      popular,
      hasCompare: !!prev,
      previousDayRankings,
    };
  }

  // 위키미디어 집계는 UTC 기준이며 최근 며칠간 데이터 지연이 발생할 수 있어 최대 10일 전까지 최신 데이터 자동 탐색
  const now = new Date();
  for (let offset = 1; offset <= 10; offset++) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
    const latest = await fetchTop(lang, day);
    if (!latest) continue;

    // 전일 데이터 탐색 (최근 집계 누락 대비 최대 4일 전까지 탐색)
    let prev: any[] | null = null;
    let prevActualDate: Date | null = null;
    for (let pOffset = 1; pOffset <= 4; pOffset++) {
      const prevDay = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() - pOffset));
      const found = await fetchTop(lang, prevDay);
      if (found) {
        prev = found;
        prevActualDate = prevDay;
        break;
      }
    }

    const prevMap = new Map<string, number>();
    prev?.forEach((a: any) => prevMap.set(a.article, a.views));
    const prevFloor = prev && prev.length > 0 ? prev[prev.length - 1].views : 1; // 상위 1000위 컷오프 조회수

    const rows: Row[] = latest
      .filter((a: any) => isArticle(a.article))
      .map((a: any) => {
        const pv = prevMap.get(a.article);
        const base = pv ?? prevFloor;
        return {
          article: a.article,
          views: a.views,
          rank: a.rank,
          growth: prev ? ((a.views - base) / base) * 100 : null,
          isNew: !!prev && pv === undefined,
        };
      });

    const popular = rows.slice(0, 10);
    const rising = prev
      ? [...rows.slice(0, 200)].sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0)).slice(0, 10)
      : popular;

    const previousDayRankings = prev
      ? prev
          .filter((a: any) => isArticle(a.article))
          .slice(0, 50)
          .map((a: any) => ({
            rank: a.rank,
            title: a.article.replace(/_/g, ' '),
            views: a.views,
          }))
      : [];

    return {
      date: `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}-${String(day.getUTCDate()).padStart(2, '0')}`,
      actualDate: day,
      previousDate: prevActualDate ?? undefined,
      rising,
      popular,
      hasCompare: !!prev,
      previousDayRankings,
    };
  }
  throw new Error('위키미디어 서버에서 최근 집계 데이터를 불러오지 못했습니다.');
};

const TrendingWiki = () => {
  const [lang, setLang] = useState<Lang>('ko');
  const [mode, setMode] = useState<Mode>('rising');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [data, setData] = useState<Partial<Record<Lang, LangData>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = (date: Date | null) => {
    setLoading(true);
    setError('');
    Promise.allSettled([loadLang('ko', date || undefined), loadLang('en', date || undefined)])
      .then(([koRes, enRes]) => {
        const newData: Partial<Record<Lang, LangData>> = {};
        if (koRes.status === 'fulfilled') {
          newData.ko = koRes.value;
        }
        if (enRes.status === 'fulfilled') {
          newData.en = enRes.value;
        }

        if (!newData.ko && !newData.en) {
          const errMsg =
            koRes.status === 'rejected'
              ? koRes.reason?.message
              : enRes.status === 'rejected'
              ? enRes.reason?.message
              : '위키미디어 데이터를 불러오지 못했습니다.';
          setError(errMsg);
        } else {
          setData(newData);
          // 선택된 언어 데이터가 없으면 사용 가능한 언어로 전환
          if (!newData[lang]) {
            if (newData.ko) setLang('ko');
            else if (newData.en) setLang('en');
          }
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData(targetDate);
  }, [targetDate]);

  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(() => {
    const bms = BookmarkService.getBookmarks();
    return new Set(bms.map(b => b.keyword.toLowerCase()));
  });

  const toggleBookmark = (keyword: string) => {
    BookmarkService.toggleBookmark(keyword, lang === 'en' ? 'wiki_en' : 'wiki_ko');
    const bms = BookmarkService.getBookmarks();
    setBookmarkedSet(new Set(bms.map(b => b.keyword.toLowerCase())));
  };

  const [showYesterdayArchive, setShowYesterdayArchive] = useState(false);

  const current = data[lang];
  const list = current ? current[mode] : [];

  const handleSelectPreviousDay = () => {
    if (current?.previousDate) {
      setTargetDate(new Date(current.previousDate));
    } else {
      handleSelectDaysAgo(1);
    }
  };

  const handleSelectDaysAgo = (days: number) => {
    const base = current?.actualDate ? new Date(current.actualDate) : new Date();
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - days));
    setTargetDate(d);
  };

  const Badge = ({ row }: { row: Row }) => {
    if (row.growth === null) return null;
    if (row.isNew) return <span className="text-xs font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full">NEW</span>;
    const up = row.growth >= 0;
    return (
      <span className={`text-xs font-semibold ${up ? 'text-rose-500 dark:text-rose-400' : 'text-blue-500 dark:text-blue-400'}`}>
        {up ? '▲' : '▼'} {Math.abs(row.growth).toFixed(0)}%
      </span>
    );
  };

  const tab = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`;

  return (
    <div className="py-12 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-rose-500 dark:text-rose-400 font-semibold mb-3 text-sm">
            <Flame className="h-4 w-4" />
            LIVE FROM WIKIPEDIA
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">위키백과 급상승 TOP 10</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
            전 세계 사용자들이 지금 가장 많이 찾아본 문서입니다. 관심사가 어디로 쏠리는지 한눈에 확인하세요.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
          {/* 과거 날짜 아카이브 선택 바 */}
          <div className="p-4 bg-gray-50/80 dark:bg-gray-750/50 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-gray-700 dark:text-gray-200">날짜별 트렌드 아카이브:</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setTargetDate(null)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  targetDate === null
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                ⚡️ 최신 (오늘 기준)
              </button>
              <button
                onClick={handleSelectPreviousDay}
                className="px-2.5 py-1 rounded-md font-semibold bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                title="전날 데이터로 이동"
              >
                <History className="w-3 h-3 text-indigo-500" />
                📅 전날 트래픽 열람 (1일 전)
              </button>
              <button
                onClick={() => handleSelectDaysAgo(2)}
                className="px-2.5 py-1 rounded-md font-semibold bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                2일 전
              </button>
              <button
                onClick={() => handleSelectDaysAgo(3)}
                className="px-2.5 py-1 rounded-md font-semibold bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                3일 전
              </button>
              <button
                onClick={() => handleSelectDaysAgo(7)}
                className="px-2.5 py-1 rounded-md font-semibold bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                1주일 전
              </button>
              
              {/* 직접 날짜 선택 */}
              <div className="flex items-center gap-1 ml-1 bg-white dark:bg-gray-700 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-600">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <input
                  type="date"
                  max={current?.date || MAX_DATE_ISO}
                  value={
                    targetDate
                      ? `${targetDate.getUTCFullYear()}-${String(targetDate.getUTCMonth() + 1).padStart(2, '0')}-${String(targetDate.getUTCDate()).padStart(2, '0')}`
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setTargetDate(new Date(Date.UTC(y, m - 1, d)));
                    }
                  }}
                  className="bg-transparent text-xs text-gray-700 dark:text-gray-200 outline-none"
                />
              </div>

              {targetDate && (
                <button
                  onClick={() => setTargetDate(null)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
                  title="최신으로 복귀"
                >
                  <RotateCcw className="w-3 h-3" />
                  최신으로
                </button>
              )}
            </div>
          </div>

          {/* 과거 아카이브 열람 중 알림 배너 */}
          {targetDate !== null && current && (
            <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <History className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  현재 <strong>{current.date}</strong> 과거 트렌드 아카이브를 열람 중입니다.
                </span>
              </div>
              <button
                onClick={() => setTargetDate(null)}
                className="shrink-0 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                ⚡️ 최신(오늘 기준)으로 돌아가기
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-3 p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button className={tab(lang === 'ko')} onClick={() => setLang('ko')}>한국어</button>
              <button className={tab(lang === 'en')} onClick={() => setLang('en')}>English</button>
            </div>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button className={tab(mode === 'rising')} onClick={() => setMode('rising')}>급상승</button>
              <button className={tab(mode === 'popular')} onClick={() => setMode('popular')}>인기순</button>
            </div>
          </div>
          
          <div className="px-5 py-3 bg-gray-50/80 dark:bg-gray-750/50 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
            {mode === 'rising' ? (
              <p>🚀 <strong>급상승 (Rising):</strong> 전일 대비 <strong>조회수 증가율(%)</strong>이 가장 높은 순위입니다. 오늘 터진 이슈나 화제의 키워드를 포착합니다.</p>
            ) : (
              <p>👑 <strong>인기순 (Popular):</strong> 하루 동안 발생한 <strong>총 조회수</strong> 순위입니다. 대중이 꾸준히 가장 많이 찾는 대표 문서를 보여줍니다.</p>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-500 dark:text-gray-400 text-sm">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> 실시간 데이터를 불러오는 중...
            </div>
          )}
          {error && (
            <div className="py-12 px-6 text-center">
              <div className="inline-flex p-3 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mb-3">
                <Flame className="w-6 h-6" />
              </div>
              <p className="text-gray-900 dark:text-gray-100 font-bold mb-1">실시간 급상승 데이터를 불러올 수 없습니다</p>
              <p className="text-rose-600 dark:text-rose-400 text-sm mb-4 max-w-md mx-auto">{error}</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => {
                    setTargetDate(null);
                    loadData(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  최신 집계 데이터로 불러오기
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <ol className="divide-y divide-gray-100 dark:divide-gray-700">
              {(() => {
                const rankingContext = list.map((r, idx) => ({
                  rank: idx + 1,
                  title: r.article.replace(/_/g, ' '),
                  views: r.views,
                }));

                return list.map((row, i) => {
                  const cleanTitle = row.article.replace(/_/g, ' ');
                  const isSaved = bookmarkedSet.has(cleanTitle.toLowerCase());
                  return (
                    <li key={row.article} className="px-6 py-4 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 text-center text-base font-extrabold ${i < 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                          {i + 1}
                        </span>

                        {/* 관심 키워드 북마크 버튼 */}
                        <button
                          onClick={() => toggleBookmark(cleanTitle)}
                          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            isSaved ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600 hover:text-amber-500'
                          }`}
                          title={isSaved ? '북마크 해제' : '북마크 추가'}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
                        </button>

                        <Link
                          to={`/explore?lang=${lang}&q=${encodeURIComponent(row.article)}`}
                          className="flex-1 font-semibold text-gray-900 dark:text-gray-100 truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
                          title={cleanTitle}
                        >
                          {cleanTitle}
                        </Link>

                        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                          {row.views.toLocaleString()}회
                        </span>
                        <span className="w-16 text-right"><Badge row={row} /></span>

                        {/* 빠른 맞대결 링크 */}
                        <Link
                          to={`/report?k1=${encodeURIComponent(cleanTitle)}`}
                          className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                          title="다른 키워드와 맞대결"
                        >
                          <Swords className="w-3 h-3" />
                          맞대결
                        </Link>

                        <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-500" />
                      </div>
                      <div className="pl-14 mt-1">
                        <NewsAnalyzer
                          keyword={cleanTitle}
                          lang={lang}
                          rankingContext={rankingContext}
                          previousDayContext={current?.previousDayRankings}
                          currentRank={i + 1}
                          onSelectPreviousDay={handleSelectPreviousDay}
                        />
                      </div>
                    </li>
                  );
                });
              })()}
            </ol>
          )}

          {/* 전날 상위 트래픽 요약 아카이브 드로어 */}
          {current?.previousDayRankings && current.previousDayRankings.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setShowYesterdayArchive(!showYesterdayArchive)}
                  className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <History className="w-4 h-4 text-indigo-500" />
                  <span>
                    📅 전날({current.previousDate ? fmtPath(current.previousDate).replace(/\//g, '-') : '어제'}) 상위 트래픽 요약 아카이브 ({current.previousDayRankings.length}건)
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showYesterdayArchive ? 'rotate-90' : ''}`} />
                </button>

                <button
                  onClick={handleSelectPreviousDay}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  전날 데이터 전체로 열람하기 →
                </button>
              </div>

              {showYesterdayArchive && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                  {current.previousDayRankings.slice(0, 15).map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-750 border border-gray-100 dark:border-gray-700 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <span className={`w-4 text-center font-bold ${item.rank <= 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                          {item.rank}
                        </span>
                        <Link
                          to={`/explore?lang=${lang}&q=${encodeURIComponent(item.title)}`}
                          className="font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600 truncate"
                          title={item.title}
                        >
                          {item.title}
                        </Link>
                      </div>
                      <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
                        {item.views.toLocaleString()}회
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {current && (
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              기준일 {current.date} (UTC) · 출처: Wikimedia Foundation Pageviews API
              {current.hasCompare
                ? ' · 증감률은 전일 대비이며, 급상승은 상위 200위 문서 중 증가율 기준입니다.'
                : ' · 전일 데이터가 없어 인기순으로 표시됩니다.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendingWiki;
