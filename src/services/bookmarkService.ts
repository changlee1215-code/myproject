export interface BookmarkItem {
  id: string;
  keyword: string;
  type: 'wiki_ko' | 'wiki_en' | 'npm';
  addedAt: string;
  note?: string;
}

const STORAGE_KEY = 'app_insight_bookmarks';

const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  { id: '1', keyword: '인공지능', type: 'wiki_ko', addedAt: new Date().toISOString() },
  { id: '2', keyword: 'ChatGPT', type: 'wiki_en', addedAt: new Date().toISOString() },
  { id: '3', keyword: '기후 변화', type: 'wiki_ko', addedAt: new Date().toISOString() },
];

export const BookmarkService = {
  getBookmarks(): BookmarkItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BOOKMARKS));
        return DEFAULT_BOOKMARKS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_BOOKMARKS;
    }
  },

  addBookmark(keyword: string, type: 'wiki_ko' | 'wiki_en' | 'npm' = 'wiki_ko', note?: string): BookmarkItem[] {
    const list = this.getBookmarks();
    const cleanKw = keyword.trim();
    if (!cleanKw || list.some(item => item.keyword.toLowerCase() === cleanKw.toLowerCase())) {
      return list;
    }
    const newItem: BookmarkItem = {
      id: Date.now().toString(),
      keyword: cleanKw,
      type,
      addedAt: new Date().toISOString(),
      note,
    };
    const updated = [newItem, ...list];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save bookmark', e);
    }
    return updated;
  },

  removeBookmark(keyword: string): BookmarkItem[] {
    const list = this.getBookmarks();
    const updated = list.filter(item => item.keyword.toLowerCase() !== keyword.trim().toLowerCase());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save bookmark', e);
    }
    return updated;
  },

  isBookmarked(keyword: string): boolean {
    const list = this.getBookmarks();
    return list.some(item => item.keyword.toLowerCase() === keyword.trim().toLowerCase());
  },

  toggleBookmark(keyword: string, type: 'wiki_ko' | 'wiki_en' | 'npm' = 'wiki_ko'): boolean {
    if (this.isBookmarked(keyword)) {
      this.removeBookmark(keyword);
      return false;
    } else {
      this.addBookmark(keyword, type);
      return true;
    }
  }
};
