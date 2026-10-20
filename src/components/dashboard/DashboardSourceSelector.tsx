import React, { useState } from 'react';
import { Search, Sparkles, Check, Info } from 'lucide-react';
import { PRESET_SOURCES, type DataSourcePreset } from '../../services/metricsService';

interface Props {
  selectedPresetId: string;
  onSelectPreset: (preset: DataSourcePreset) => void;
  onCustomSearch: (keyword: string, type: 'wiki_ko' | 'wiki_en' | 'npm') => void;
}

export const DashboardSourceSelector: React.FC<Props> = ({
  selectedPresetId,
  onSelectPreset,
  onCustomSearch,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customKeyword, setCustomKeyword] = useState('');
  const [customType, setCustomType] = useState<'wiki_ko' | 'wiki_en' | 'npm'>('wiki_ko');

  const categories = [
    { id: 'all', label: '전체' },
    { id: 'benchmark', label: '🌐 벤치마크' },
    { id: 'trending', label: '🔥 화제성 트렌드' },
    { id: 'social', label: '🌱 사회/공익' },
    { id: 'dev', label: '💻 개발 생태계' },
  ];

  const filteredPresets = selectedCategory === 'all'
    ? PRESET_SOURCES
    : PRESET_SOURCES.filter(p => p.category === selectedCategory);

  const activePreset = PRESET_SOURCES.find(p => p.id === selectedPresetId);

  const getTypeBadge = (type: DataSourcePreset['type']) => {
    switch (type) {
      case 'wiki_ko':
        return { label: 'KO 위키', bg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
      case 'wiki_en':
        return { label: 'EN 위키', bg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
      case 'npm':
        return { label: 'NPM', bg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
      case 'crates':
        return { label: 'RUST', bg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKeyword.trim()) return;
    onCustomSearch(customKeyword.trim(), customType);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            관제 데이터 소스 선택
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            대표 벤치마크 사이트 및 키워드를 선택하거나 직접 키워드를 검색해 관제 지표를 분석하세요.
          </p>
        </div>

        {/* 직접 키워드 검색 폼 */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <select
            value={customType}
            onChange={(e) => setCustomType(e.target.value as any)}
            className="text-xs px-2.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="wiki_ko">KO 위키</option>
            <option value="wiki_en">EN 위키</option>
            <option value="npm">NPM 패키지</option>
          </select>
          <div className="relative">
            <input
              type="text"
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              placeholder="직접 검색 (예: 손흥민)"
              className="text-xs pl-8 pr-3 py-2 w-44 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="text-xs font-semibold px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            조회
          </button>
        </form>
      </div>

      {/* 현재 관제 대상 안내 배너 (설명 표시) */}
      {activePreset && (
        <div className="mb-5 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5 shadow-sm">
            <Info className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                현재 관제 지표: {activePreset.title}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getTypeBadge(activePreset.type).bg}`}>
                {getTypeBadge(activePreset.type).label}
              </span>
              <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                쿼리 키: {activePreset.queryKey}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
              {activePreset.description}
            </p>
          </div>
        </div>
      )}

      {/* 카테고리 탭 */}
      <div className="flex flex-wrap gap-1.5 mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
        {categories.map((cat) => {
          const count = cat.id === 'all'
            ? PRESET_SOURCES.length
            : PRESET_SOURCES.filter(p => p.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat.id
                  ? 'bg-indigo-700/60 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 프리셋 버튼 그리드 (키워드 카드 + 간단한 설명 렌더링) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredPresets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          const badge = getTypeBadge(preset.type);
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`group text-left p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-gray-750'
              }`}
            >
              <div>
                {/* 상단: 소스 타입 배지 & 선택 상태 */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg}`}>
                    {badge.label}
                  </span>
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      관제 중
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 truncate max-w-[110px]" title={preset.queryKey}>
                      {preset.queryKey}
                    </span>
                  )}
                </div>

                {/* 중앙: 키워드 제목 */}
                <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {preset.title}
                </h4>

                {/* 키워드 간단 설명 (요청 기능 복원 및 강조) */}
                <p
                  className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed"
                  title={preset.description}
                >
                  {preset.description}
                </p>
              </div>

              {/* 하단: 단위 및 액션 안내 */}
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                <span className="truncate max-w-[130px]">{preset.unit}</span>
                <span className="text-[10px] font-medium text-indigo-500/80 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0">
                  {isSelected ? '선택됨' : '선택하기 →'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
