import { BookmarkService, type BookmarkItem } from './bookmarkService';
import { TrendLoggerService, type TrendLog } from './trendLogger';

export interface BackupData {
  version: number;
  exportedAt: string;
  bookmarks: BookmarkItem[];
  trendLogs: TrendLog[];
}

export interface MergeResult {
  success: boolean;
  message: string;
  bookmarksCount: number;
  trendLogsCount: number;
  addedBookmarks: number;
  addedTrendLogs: number;
  prioritizedFromIncoming: number;
}

export const BackupService = {
  /**
   * 로컬 스토리지의 모든 데이터(북마크 + 트렌드 로그)를 JSON 구조로 추출
   */
  createBackupData(): BackupData {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      bookmarks: BookmarkService.getBookmarks(),
      trendLogs: TrendLoggerService.getLogs(),
    };
  },

  /**
   * 브라우저에서 백업 JSON 파일 다운로드 트리거
   */
  downloadBackupFile(): void {
    const data = this.createBackupData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `traffic_insight_backup_${todayStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * 백업 JSON을 파싱하고, 기존 데이터와 비교하여
   * "데이터가 더 많은 쪽을 우선시"하면서 지능적으로 병합(Merge)
   */
  importAndMergeBackup(jsonContent: string): MergeResult {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      throw new Error('올바른 JSON 백업 파일 형식이 아닙니다.');
    }

    const incomingBookmarks: BookmarkItem[] = Array.isArray(parsed.bookmarks)
      ? parsed.bookmarks
      : Array.isArray(parsed) // 단순 북마크 배열만 전달된 경우 호환
      ? parsed
      : [];

    const incomingTrendLogs: TrendLog[] = Array.isArray(parsed.trendLogs)
      ? parsed.trendLogs
      : [];

    const currentBookmarks = BookmarkService.getBookmarks();
    const currentTrendLogs = TrendLoggerService.getLogs();

    let addedBookmarks = 0;
    let addedTrendLogs = 0;
    let prioritizedFromIncoming = 0;

    // 1. 북마크 병합 (키워드 기준 비교)
    // - 동일 키워드가 겹칠 경우: 속성 개수(note, type 등 정보량)가 더 많은 쪽을 우선시
    const bookmarkMap = new Map<string, BookmarkItem>();

    // 먼저 기존 로컬 데이터 적재
    currentBookmarks.forEach((b) => {
      bookmarkMap.set(b.keyword.toLowerCase(), b);
    });

    incomingBookmarks.forEach((inc) => {
      if (!inc.keyword) return;
      const key = inc.keyword.toLowerCase();
      const existing = bookmarkMap.get(key);

      if (!existing) {
        // 기존에 없던 새로운 데이터면 그대로 추가
        bookmarkMap.set(key, inc);
        addedBookmarks++;
      } else {
        // 데이터가 겹치는 경우 -> 정보량(필드 수, 메모 유무) 비교
        const existingDataPoints = (existing.note ? 2 : 0) + (existing.type ? 1 : 0);
        const incomingDataPoints = (inc.note ? 2 : 0) + (inc.type ? 1 : 0);

        // 가져온 파일의 정보량이 더 많거나 같고 최신인 경우 우선 적용
        if (incomingDataPoints > existingDataPoints) {
          bookmarkMap.set(key, { ...existing, ...inc });
          prioritizedFromIncoming++;
        }
      }
    });

    const finalBookmarks = Array.from(bookmarkMap.values());
    localStorage.setItem('app_insight_bookmarks', JSON.stringify(finalBookmarks));

    // 2. 트렌드 아카이브 로그 병합 (날짜 + 키워드 복합키 기준 비교)
    const logMap = new Map<string, TrendLog>();

    currentTrendLogs.forEach((l) => {
      const key = `${l.targetDate}_${l.keyword}`;
      logMap.set(key, l);
    });

    incomingTrendLogs.forEach((inc) => {
      if (!inc.targetDate || !inc.keyword) return;
      const key = `${inc.targetDate}_${inc.keyword}`;
      const existing = logMap.get(key);

      if (!existing) {
        logMap.set(key, inc);
        addedTrendLogs++;
      } else {
        // 겹치는 경우 정보량(title 여부, 최신 생성일자 등) 비교하여 더 풍부한 쪽 우선 채택
        const existingScore = (existing.title ? 2 : 0) + (existing.id ? 1 : 0);
        const incomingScore = (inc.title ? 2 : 0) + (inc.id ? 1 : 0);

        if (incomingScore > existingScore) {
          logMap.set(key, inc);
          prioritizedFromIncoming++;
        }
      }
    });

    const finalTrendLogs = Array.from(logMap.values()).sort(
      (a, b) => new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime()
    );
    localStorage.setItem('app_insight_trend_logs', JSON.stringify(finalTrendLogs));

    return {
      success: true,
      message: '성공적으로 백업 데이터를 병합하였습니다.',
      bookmarksCount: finalBookmarks.length,
      trendLogsCount: finalTrendLogs.length,
      addedBookmarks,
      addedTrendLogs,
      prioritizedFromIncoming,
    };
  },
};
