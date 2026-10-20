import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bookmark,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  MetricsService,
  PRESET_SOURCES,
  type DataSourcePreset,
  type MetricPoint,
  type KpiSummary,
} from '../services/metricsService';
import { BookmarkService, type BookmarkItem } from '../services/bookmarkService';
import { fetchRelatedQueries } from '../services/googleSuggest';
import { DashboardKpiCards } from '../components/dashboard/DashboardKpiCards';
import { DashboardTrendChart } from '../components/dashboard/DashboardTrendChart';
import { DashboardBookmarks } from '../components/dashboard/DashboardBookmarks';
import { DashboardSourceSelector } from '../components/dashboard/DashboardSourceSelector';

const Dashboard = () => {
  const navigate = useNavigate();

  // 현재 선택된 프리셋 혹은 커스텀 설정
  const [activePreset, setActivePreset] = useState<DataSourcePreset>(PRESET_SOURCES[0]);
  const [activeKeyword, setActiveKeyword] = useState<string>(PRESET_SOURCES[0].queryKey);
  const [activeType, setActiveType] = useState<'wiki_ko' | 'wiki_en' | 'npm' | 'crates'>(PRESET_SOURCES[0].type);
  const [activeTitle, setActiveTitle] = useState<string>(PRESET_SOURCES[0].title);
  const [activeUnit, setActiveUnit] = useState<string>(PRESET_SOURCES[0].unit);
  const [activeDesc, setActiveDesc] = useState<string>(PRESET_SOURCES[0].description);

  // 기간 (기본 30일)
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);

  // 데이터 & 상태
  const [chartData, setChartData] = useState<MetricPoint[]>([]);
  const [kpis, setKpis] = useState<KpiSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 연관 검색어
  const [relatedQueries, setRelatedQueries] = useState<string[]>([]);

  // 북마크 상태
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => BookmarkService.getBookmarks());
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() =>
    BookmarkService.isBookmarked(PRESET_SOURCES[0].title)
  );

  // 데이터 조회 Effect
  useEffect(() => {
    let alive = true;
    const loadMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const end = new Date();
        const start = new Date();
        // 기간 변경 시에도 전주 대비 증감율과 일평균이 항상 정확하도록 최소 30일(또는 선택기간+14일) 버퍼 조회
        const fetchDays = Math.max(selectedPeriod + 14, 30);
        start.setDate(end.getDate() - fetchDays);

        let points: MetricPoint[] = [];

        if (activeType === 'wiki_ko') {
          points = await MetricsService.fetchWikiTraffic('ko', activeKeyword, start, end);
        } else if (activeType === 'wiki_en') {
          points = await MetricsService.fetchWikiTraffic('en', activeKeyword, start, end);
        } else if (activeType === 'npm') {
          points = await MetricsService.fetchNpmTraffic(activeKeyword, start, end);
        } else if (activeType === 'crates') {
          points = await MetricsService.fetchCratesTraffic(activeKeyword, start);
        }

        if (!alive) return;

        if (points.length === 0) {
          setError(`'${activeKeyword}'에 대한 트래픽 데이터를 찾을 수 없습니다. (문서명/패키지명을 확인해주세요)`);
          setChartData([]);
          setKpis(null);
        } else {
          // 화면 표시용 차트는 사용자가 고른 기간만큼만 깔끔하게 잘라서 표시
          setChartData(points.slice(-selectedPeriod));
          // KPI 계산은 전체 버퍼를 기반으로 기간별 총합/변화율 정밀 계산
          setKpis(MetricsService.calculateKpis(points, selectedPeriod));
        }
      } catch (err: any) {
        if (!alive) return;
        setError(err.message || '데이터를 가져오는 중 오류가 발생했습니다.');
        setChartData([]);
        setKpis(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadMetrics();

    // 연관 검색어 비동기 조회
    fetchRelatedQueries(activeTitle).then((res) => {
      if (alive) {
        setRelatedQueries(res.filter((q) => q.toLowerCase() !== activeTitle.toLowerCase()).slice(0, 6));
      }
    });

    return () => {
      alive = false;
    };
  }, [activeKeyword, activeType, selectedPeriod, activeTitle]);

  // 북마크 상태 동기화
  useEffect(() => {
    setIsBookmarked(BookmarkService.isBookmarked(activeTitle));
  }, [activeTitle, bookmarks]);

  // 프리셋 선택 핸들러
  const handleSelectPreset = (preset: DataSourcePreset) => {
    setActivePreset(preset);
    setActiveKeyword(preset.queryKey);
    setActiveType(preset.type);
    setActiveTitle(preset.title);
    setActiveUnit(preset.unit);
    setActiveDesc(preset.description);
  };

  // 커스텀 검색 핸들러
  const handleCustomSearch = (keyword: string, type: 'wiki_ko' | 'wiki_en' | 'npm') => {
    const unitLabel = type === 'npm' ? '회 (일일 다운로드)' : type === 'wiki_en' ? '회 (글로벌 조회수)' : '회 (일간 조회수)';
    setActiveKeyword(keyword);
    setActiveType(type);
    setActiveTitle(keyword);
    setActiveUnit(unitLabel);
    setActiveDesc(`'${keyword}'에 대한 ${type === 'npm' ? 'NPM 다운로드' : '위키백과 열람'} 실시간 지표입니다.`);
  };

  // 북마크 토글
  const handleToggleBookmark = () => {
    const updated = BookmarkService.toggleBookmark(
      activeTitle,
      activeType === 'crates' ? 'wiki_ko' : activeType
    );
    setIsBookmarked(updated);
    setBookmarks(BookmarkService.getBookmarks());
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 상단 타이틀 & 헤더 액션 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                  {activeTitle}
                  <button
                    onClick={handleToggleBookmark}
                    className={`p-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
                      isBookmarked
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-600 text-amber-600 dark:text-amber-400'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:text-amber-500'
                    }`}
                    title={isBookmarked ? '관심 키워드 해제' : '관심 키워드 등록'}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span className="hidden sm:inline">{isBookmarked ? '관심등록됨' : '관심등록'}</span>
                  </button>
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">{activeDesc}</p>
              </div>
            </div>
          </div>

          {/* 원클릭 연동 버튼들 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/explore?q=${encodeURIComponent(activeTitle)}`)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
              키워드 심층 추적
            </button>
            <button
              onClick={() => navigate(`/report?k1=${encodeURIComponent(activeTitle)}`)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              타 키워드와 맞대결
            </button>
          </div>
        </div>

        {/* 1. 관심 키워드 보관함 */}
        <DashboardBookmarks
          bookmarks={bookmarks}
          currentKeyword={activeTitle}
          onSelectKeyword={(kw, type) => handleCustomSearch(kw, type)}
          onBookmarksChange={() => setBookmarks(BookmarkService.getBookmarks())}
        />

        {/* 2. 관제 데이터 소스 선택기 */}
        <DashboardSourceSelector
          selectedPresetId={activePreset.id}
          onSelectPreset={handleSelectPreset}
          onCustomSearch={handleCustomSearch}
        />

        {/* 에러 또는 로딩 안내 */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-16 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700 mb-6">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              '{activeTitle}' 트래픽 데이터를 분석하는 중입니다...
            </p>
          </div>
        ) : (
          kpis && (
            <>
              {/* 3. KPI 요약 카드들 */}
              <DashboardKpiCards kpis={kpis} unit={activeUnit} />

              {/* 4. 메인 트래픽 추이 차트 */}
              <DashboardTrendChart
                data={chartData}
                title={activeTitle}
                unit={activeUnit}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
            </>
          )
        )}

        {/* 5. 연관 키워드 추천 칩 */}
        {relatedQueries.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              '{activeTitle}'와 함께 많이 찾아보는 검색어
            </h3>
            <div className="flex flex-wrap gap-2">
              {relatedQueries.map((rq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCustomSearch(rq, 'wiki_ko')}
                  className="px-3 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 transition-colors"
                >
                  #{rq}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
