import React, { useState, useRef, useEffect } from 'react';
import { Bookmark, Plus, Trash2, ArrowUpRight, Download, Upload, CheckCircle2, AlertCircle, ShieldCheck, Lock } from 'lucide-react';
import { BookmarkService, type BookmarkItem } from '../../services/bookmarkService';
import { BackupService } from '../../services/backupService';
import { AdminService } from '../../services/adminService';
import { AdminModal } from '../AdminModal';
import { useNavigate } from 'react-router-dom';

interface Props {
  bookmarks: BookmarkItem[];
  currentKeyword: string;
  onSelectKeyword: (keyword: string, type: 'wiki_ko' | 'wiki_en' | 'npm') => void;
  onBookmarksChange: () => void;
}

export const DashboardBookmarks: React.FC<Props> = ({
  bookmarks,
  currentKeyword,
  onSelectKeyword,
  onBookmarksChange,
}) => {
  const navigate = useNavigate();
  const [newKeyword, setNewKeyword] = useState('');
  const [newType, setNewType] = useState<'wiki_ko' | 'wiki_en' | 'npm'>('wiki_ko');
  const [isAdding, setIsAdding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return AdminService.subscribe(setIsAdmin);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }
    if (!newKeyword.trim()) return;
    BookmarkService.addBookmark(newKeyword.trim(), newType);
    setNewKeyword('');
    setIsAdding(false);
    onBookmarksChange();
  };

  const handleRemove = (e: React.MouseEvent, keyword: string) => {
    e.stopPropagation();
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }
    BookmarkService.removeBookmark(keyword);
    onBookmarksChange();
  };

  const handleDownloadBackup = () => {
    BackupService.downloadBackupFile();
    setStatusMessage('백업 파일(.json)이 다운로드되었습니다.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleTriggerUpload = () => {
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleTriggerAdd = () => {
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }
    setIsAdding(!isAdding);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const res = BackupService.importAndMergeBackup(content);
        
        let msg = `성공적으로 복원되었습니다. (총 북마크: ${res.bookmarksCount}개, 아카이브 로그: ${res.trendLogsCount}개)`;
        if (res.prioritizedFromIncoming > 0 || res.addedBookmarks > 0) {
          msg += ` - 중복 항목은 데이터가 더 많은 쪽을 우선시하여 안전하게 병합되었습니다.`;
        }
        
        setStatusMessage(msg);
        setErrorMessage(null);
        onBookmarksChange();
      } catch (err: any) {
        setErrorMessage(err.message || '백업 파일을 읽는 중 오류가 발생했습니다.');
        setStatusMessage(null);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">관심 키워드 & 데이터 보관함</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">
            {bookmarks.length}개
          </span>

          {isAdmin ? (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> 관리자 권한 활성
            </span>
          ) : (
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3 text-gray-400" /> 뷰어 모드 (복원/삭제 제한)
            </span>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* 백업 파일 다운로드 */}
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="현재 저장된 모든 북마크 및 아카이브 데이터를 JSON 파일로 다운로드합니다."
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            백업 다운로드
          </button>

          {/* 백업 파일 업로드 (관리자 전용) */}
          <button
            onClick={handleTriggerUpload}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
              isAdmin
                ? 'bg-gray-100 dark:bg-gray-700 border-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-200'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
            }`}
            title={isAdmin ? '기존 백업 JSON 파일을 불러옵니다.' : '관리자 권한이 필요합니다. (클릭 시 인증)'}
          >
            {isAdmin ? <Upload className="w-3.5 h-3.5 text-emerald-500" /> : <Lock className="w-3.5 h-3.5 text-amber-500" />}
            백업 복원(업로드)
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={handleTriggerAdd}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
              isAdmin
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
            }`}
            title={isAdmin ? '새 키워드 등록' : '관리자 권한이 필요합니다.'}
          >
            {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-gray-400" />}
            키워드 추가
          </button>
        </div>
      </div>

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* 상태 안내 메시지 배너 */}
      {statusMessage && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-600 hover:text-emerald-800 font-bold ml-2">×</button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800 font-bold ml-2">×</button>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="등록할 키워드 (예: 인공지능, 리액트)"
            className="flex-1 min-w-[160px] text-xs px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as any)}
            className="text-xs px-2.5 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="wiki_ko">한국어 위키</option>
            <option value="wiki_en">영어 위키</option>
            <option value="npm">NPM 패키지</option>
          </select>
          <button
            type="submit"
            className="text-xs font-semibold px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            저장
          </button>
        </form>
      )}

      {bookmarks.length === 0 ? (
        <p className="text-xs text-gray-400 py-3 text-center">
          등록된 관심 키워드가 없습니다. 자주 모니터링할 키워드를 등록해보세요!
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {bookmarks.map((bm) => {
            const isSelected = currentKeyword.toLowerCase() === bm.keyword.toLowerCase();
            return (
              <div
                key={bm.id}
                onClick={() => onSelectKeyword(bm.keyword, bm.type)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'bg-gray-50 dark:bg-gray-700/60 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{bm.keyword}</span>
                <span className="text-[10px] text-gray-400">
                  {bm.type === 'wiki_ko' ? 'KO' : bm.type === 'wiki_en' ? 'EN' : 'NPM'}
                </span>

                {/* 키워드 추적 바로가기 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/explore?q=${encodeURIComponent(bm.keyword)}`);
                  }}
                  title="키워드 추적 화면으로 이동"
                  className="opacity-0 group-hover:opacity-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-opacity p-0.5"
                >
                  <ArrowUpRight className="w-3 h-3" />
                </button>

                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => handleRemove(e, bm.keyword)}
                  title="북마크 삭제"
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
