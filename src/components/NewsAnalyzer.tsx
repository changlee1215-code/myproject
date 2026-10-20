import React, { useState } from 'react';
import {
  Newspaper,
  Loader2,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Languages,
  Link2,
  Film,
  Music,
  History,
} from 'lucide-react';
import { fetchRelatedQueries } from '../services/googleSuggest';
import { translateBatch } from '../services/translateService';
import {
  type RankingItemContext,
  type NewsItem,
  type AnalysisReport,
  parseSmartKeyword,
  fetchNewsArticles,
  runNewsAnalysis,
  formatDate,
} from '../services/analyzer';

export type { RankingItemContext, RelatedRankingResult, WorkMediaInfo, MusicActivityInfo } from '../services/analyzer';

interface NewsAnalyzerProps {
  keyword: string;
  lang: 'ko' | 'en';
  rankingContext?: RankingItemContext[];
  previousDayContext?: RankingItemContext[];
  currentRank?: number;
  onSelectPreviousDay?: () => void;
}

export const NewsAnalyzer: React.FC<NewsAnalyzerProps> = ({
  keyword,
  lang,
  rankingContext,
  previousDayContext,
  currentRank,
  onSelectPreviousDay,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAllNews, setShowAllNews] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [related, setRelated] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // 동음이의어 분리 및 스마트 쿼리 파싱
  const smartInfo = parseSmartKeyword(keyword, lang);
  const { cleanKeyword, isAcademicOrCatalogList } = smartInfo;

  const analyzeNews = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    if (news.length > 0) return;

    setLoading(true);
    setError('');

    // 구글 연관 검색어 비동기 조회
    fetchRelatedQueries(smartInfo.smartQuery)
      .then((rqs) => {
        setRelated(
          rqs
            .filter((rq) => {
              const lower = rq.toLowerCase();
              return (
                lower !== keyword.toLowerCase() &&
                lower !== smartInfo.smartQuery.toLowerCase() &&
                lower !== cleanKeyword.toLowerCase() &&
                lower !== smartInfo.baseKeyword.toLowerCase()
              );
            })
            .slice(0, 5)
        );
      })
      .catch(() => {});

    try {
      const items = await fetchNewsArticles(keyword, lang, smartInfo);
      setNews(items);

      // 영문 뉴스인 경우 자동으로 한국어 번역 수행
      if (lang === 'en' && items.length > 0) {
        setIsTranslating(true);
        const titlesToTranslate = items.map((it) => it.title);
        translateBatch(titlesToTranslate, 'en', 'ko')
          .then((transMap) => {
            setTranslations((prev) => ({ ...prev, ...transMap }));
          })
          .catch(() => {})
          .finally(() => {
            setIsTranslating(false);
          });
      }
    } catch (e: any) {
      setError(e.message || '뉴스 수집 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const analysis: AnalysisReport | null = (() => {
    try {
      return runNewsAnalysis({
        keyword,
        lang,
        news,
        translations,
        smartInfo,
        rankingContext,
        previousDayContext,
        currentRank,
      });
    } catch (err) {
      console.error('News analysis summary error:', err);
      if (news.length === 0) return null;
      return {
        category: lang === 'ko' ? '언론 집중 보도' : '외신 집중 보도',
        badgeStyle:
          'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
        explanation:
          lang === 'ko'
            ? '최근 언론과 미디어를 통해 확산된 화제성 보도 및 관련 인터뷰가 대중의 검색 유입을 이끈 것으로 분석됩니다.'
            : '최근 글로벌 커뮤니티 및 주요 외신들을 통해 확산된 화제성 보도가 전 세계적인 검색 트래픽을 견인한 것으로 분석됩니다.',
        keyTopics: [],
        evidenceArticle: news[0],
        isDeferred: false,
        sampleCount: news.length,
        isSmallSample: news.length <= 5,
        relatedRanking: null,
        workMediaInfo: null,
        musicActivityInfo: null,
      };
    }
  })();

  const displayedNews = showAllNews ? news : news.slice(0, 5);

  return (
    <div className="mt-3">
      <button
        onClick={analyzeNews}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-full transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI 뉴스 원인 분석 {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {isOpen && (
        <div className="mt-3 bg-white dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              실시간 뉴스 크롤링 및 원인 분석 중 (최대 25건 수집)...
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between text-sm text-red-500 py-2 bg-red-50 dark:bg-red-950/40 px-3 rounded-lg border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  setNews([]);
                  analyzeNews();
                }}
                className="text-xs font-bold text-red-600 hover:text-red-800 underline ml-2 shrink-0"
              >
                다시 시도
              </button>
            </div>
          )}

          {!loading && !error && news.length === 0 && (
            <div className="flex gap-3 items-start bg-gray-50 dark:bg-gray-750 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
              <Sparkles className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-semibold">
                      해당 키워드와 직접적으로 일치하는 최근 언론 보도를 찾을 수 없습니다.
                    </p>
                    {isAcademicOrCatalogList ? (
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        '{cleanKeyword}'와 같은 대규모 학술·수식 색인 문서는 실제 뉴스 이슈보다는{' '}
                        <strong>
                          AI 모델의 과학 데이터 학습용 웹 크롤링(스크래핑), 자동화 봇의 인덱스 수집, 또는 시스템 수식
                          렌더링 벤치마크
                        </strong>
                        로 인한 기계적 트래픽('고스트 트래픽')이 집중 유입되어 실검에 올랐을 가능성이 높습니다.
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        뉴스 기사보다는{' '}
                        <strong>커뮤니티 입소문, 소셜 미디어 바이럴, 방송/유튜브 노출</strong>이거나, 특히 글로벌
                        위키/학술·사전형 문서의 경우{' '}
                        <strong>AI 모델 학습을 위한 데이터 크롤링(스크래핑) 및 자동화 봇 트래픽</strong>으로 인해
                        유입이 발생했을 가능성이 높습니다.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setNews([]);
                      analyzeNews();
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                  >
                    재검색
                  </button>
                </div>
                {related.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mr-2">
                      🔍 구글 연관 검색어:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {related.map((r, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && !error && news.length > 0 && analysis && (
            <div className="space-y-4">
              {/* AI 원인 분석 리포트 카드 */}
              <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 dark:from-gray-850 dark:via-gray-800 dark:to-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-gray-700 shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${analysis.badgeStyle}`}>
                      {analysis.category}
                    </span>
                    {analysis.relatedRanking && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-xs">
                        <Link2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        {analysis.relatedRanking.rank}위 [{analysis.relatedRanking.title}] 연계
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {analysis.isDeferred
                        ? 'AI 원인 분석 리포트 (최근 1달 이내 보도 없음)'
                        : analysis.isSmallSample
                        ? `AI 원인 분석 리포트 (표본 ${analysis.sampleCount}건 소수 표본 분석)`
                        : `AI 원인 분석 리포트 (표본 ${analysis.sampleCount}건 정밀 분석)`}
                    </span>
                  </div>
                  {analysis.keyTopics.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">핵심 토픽:</span>
                      {analysis.keyTopics.map((k, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded text-[11px] font-medium"
                        >
                          #{k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 표본 부족 또는 판단 보류 안내 메시지 */}
                {analysis.isDeferred && (
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                      <span className="font-semibold">최근 1달 이내 보도 없음 (원인 단정 보류)</span>
                    </div>
                    <p className="leading-relaxed">
                      구글 뉴스에서 수집된 기사들이 모두 과거 시점에 머물러 있어, 최근 트래픽 급증을 유발한 결정적 단일
                      뉴스가 확인되지 않았습니다. 특정 SNS·유튜브 영상의 뒤늦은 알고리즘 바이럴, 계절·기념일 등 미디어
                      외적 요인일 가능성이 높습니다.
                    </p>
                  </div>
                )}

                {/* 소수 표본(5건 이하) 분석 신뢰성 주의 안내 배너 */}
                {analysis.isSmallSample && !analysis.isDeferred && (
                  <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>소수 표본 분석 안내 (신뢰성 유의)</span>
                    </div>
                    <p className="leading-relaxed text-amber-950 dark:text-amber-100">
                      최근 크롤링된 관련 기사가 {analysis.sampleCount}건으로 표본이 다소 부족하여, AI 분석 결과의 신뢰성이나 대표성이 다소 떨어질 수 있습니다. 향후 추가 보도나 언론사 후속 보도를 함께 참고하시기 바랍니다.
                    </p>
                  </div>
                )}

                {/* 랭킹 상호 참조 연계 사유 배너 */}
                {analysis.relatedRanking && (
                  <div className="p-3 bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-xl text-xs text-purple-900 dark:text-purple-200 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2 font-bold text-purple-800 dark:text-purple-300">
                      <div className="flex items-center gap-1.5">
                        <Link2 className="h-3.5 w-3.5" />
                        <span>
                          {analysis.relatedRanking.isPreviousDay
                            ? `어제(전날) 실검 순위 ${analysis.relatedRanking.rank}위 [${analysis.relatedRanking.title}] 연계 감지`
                            : `급상승 순위 ${analysis.relatedRanking.rank}위 [${analysis.relatedRanking.title}]와의 동반 급상승 연관성 감지`}
                        </span>
                      </div>
                      {analysis.relatedRanking.isPreviousDay && onSelectPreviousDay && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPreviousDay();
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-200/80 dark:bg-purple-800/80 text-purple-900 dark:text-purple-100 hover:bg-purple-300 dark:hover:bg-purple-700 font-semibold transition-colors text-[11px]"
                          title="전날 트래픽 아카이브로 이동"
                        >
                          <History className="w-3 h-3" />
                          전날 아카이브 열람하기 &rarr;
                        </button>
                      )}
                    </div>
                    <p className="leading-relaxed text-purple-950 dark:text-purple-100">
                      {analysis.relatedRanking.reasonText}
                    </p>
                  </div>
                )}

                {/* 신작 매체(드라마/영화/시리즈) 감지 시 배너 */}
                {analysis.workMediaInfo && (
                  <div className="p-3 bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 rounded-xl text-xs text-teal-900 dark:text-teal-200 space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-300">
                      <Film className="h-3.5 w-3.5" />
                      <span>
                        신작 {analysis.workMediaInfo.mediaTypeName} 《{analysis.workMediaInfo.title}》 관련{' '}
                        {analysis.workMediaInfo.eventTypeName} 확인
                      </span>
                    </div>
                    <p className="leading-relaxed text-teal-950 dark:text-teal-150">
                      배우 '{cleanKeyword}'의 차기작/신작인 {analysis.workMediaInfo.mediaTypeName} 《
                      {analysis.workMediaInfo.title}》의 공식 소식이 다수의 기사에서 집중 조명되어 대중의 기대감과 함께
                      검색량이 급증했습니다.
                    </p>
                  </div>
                )}

                {/* 음악/아티스트 다각화 활동 감지 시 배너 */}
                {analysis.musicActivityInfo && (
                  <div className="p-3 bg-violet-50/90 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/80 rounded-xl text-xs text-violet-900 dark:text-violet-200 space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5 font-bold text-violet-800 dark:text-violet-300">
                      <Music className="h-3.5 w-3.5" />
                      <span>
                        아티스트 활동: {analysis.musicActivityInfo.activityTypeName}
                        {analysis.musicActivityInfo.detailTitle ? ` (${analysis.musicActivityInfo.detailTitle})` : ''}
                      </span>
                    </div>
                    <p className="leading-relaxed text-violet-950 dark:text-violet-150">
                      {analysis.musicActivityInfo.highlight}
                    </p>
                  </div>
                )}

                {/* 원인 분석 핵심 설명 */}
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  {analysis.explanation}
                </p>

                {/* 트래픽 급증 유발 핵심 헤드라인 인용 */}
                {analysis.evidenceArticle && (
                  <div className="pt-2 border-t border-indigo-100 dark:border-gray-700 flex items-start gap-2">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                      📰 핵심 헤드라인 근거:
                    </span>
                    <a
                      href={analysis.evidenceArticle.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold underline decoration-indigo-300 underline-offset-2 inline-flex items-center gap-1"
                    >
                      {lang === 'en' && showTranslation && translations[analysis.evidenceArticle.title]
                        ? translations[analysis.evidenceArticle.title]
                        : analysis.evidenceArticle.title}
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                    </a>
                  </div>
                )}

                {/* 구글 연관 검색어 */}
                {related.length > 0 && (
                  <div className="pt-2 border-t border-indigo-100 dark:border-gray-700 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">🔍 구글 연관 검색어:</span>
                    {related.map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-[11px] text-gray-600 dark:text-gray-300 font-medium"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 수집된 뉴스 목록 헤더 & 외신 번역 토글 */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Newspaper className="h-3.5 w-3.5 text-gray-500" />
                  수집된 최신 뉴스 ({news.length}건)
                </span>
                {lang === 'en' && (
                  <button
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Languages className="h-3 w-3" />
                    {showTranslation ? '영문 원문으로 보기' : '한국어 번역으로 보기'}
                    {isTranslating && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                  </button>
                )}
              </div>

              {/* 뉴스 목록 리스트 */}
              <div className="space-y-2">
                {displayedNews.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 leading-snug">
                          {lang === 'en' && showTranslation && translations[item.title]
                            ? translations[item.title]
                            : item.title}
                        </p>
                        {lang === 'en' && showTranslation && translations[item.title] && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1 italic">
                            {item.title}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="h-3 w-3 text-gray-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                      <span className="font-medium text-gray-600 dark:text-gray-400">{item.source}</span>
                      {item.pubDate && (
                        <>
                          <span>•</span>
                          <span>{formatDate(item.pubDate)}</span>
                        </>
                      )}
                    </div>
                  </a>
                ))}
              </div>

              {news.length > 5 && (
                <button
                  onClick={() => setShowAllNews(!showAllNews)}
                  className="w-full py-1.5 text-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                >
                  {showAllNews ? '간략히 보기' : `뉴스 전체 보기 (${news.length}건)`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
