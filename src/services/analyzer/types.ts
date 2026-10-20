export interface RankingItemContext {
  rank: number;
  title: string;
  views?: number;
  isPreviousDay?: boolean;
}

export interface RelatedRankingResult {
  rank: number;
  title: string;
  mentionCount: number;
  reasonType:
    | 'character_role'
    | 'death_tribute'
    | 'sports_rivalry'
    | 'incident_scandal'
    | 'general'
    | 'spouse_couple'
    | 'wedding_marriage'
    | 'costar_work'
    | 'tv_competition_tribute';
  reasonText: string;
  isPreviousDay?: boolean;
}

export interface WorkMediaInfo {
  title: string;
  mediaType: 'drama' | 'movie' | 'series' | 'work';
  mediaTypeName: string;
  eventTypeName: string;
  count: number;
  sample?: string;
}

export interface MusicActivityInfo {
  activityType:
    | 'new_release'
    | 'competition'
    | 'variety'
    | 'festival_event'
    | 'concert'
    | 'viral_resurgence';
  activityTypeName: string;
  detailTitle?: string;
  detailType?: 'song' | 'album' | 'show' | 'festival' | 'concert' | 'viral';
  highlight: string;
  count: number;
  sample?: string;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export interface CategoryMatcher {
  id: string;
  categoryKo: string;
  categoryEn: string;
  badgeStyle: string;
  enRegex: RegExp;
  koRegex: RegExp;
  explanationKo: string;
  explanationEn: string;
  minMatchesRequired?: number;
}

export interface AnalysisReport {
  category: string;
  badgeStyle: string;
  explanation: string;
  keyTopics: string[];
  evidenceArticle?: NewsItem;
  isDeferred?: boolean;
  sampleCount: number;
  isSmallSample?: boolean;
  relatedRanking?: RelatedRankingResult | null;
  workMediaInfo?: WorkMediaInfo | null;
  musicActivityInfo?: MusicActivityInfo | null;
}
