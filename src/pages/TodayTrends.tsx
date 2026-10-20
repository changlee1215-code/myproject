import React from 'react';
import TrendingWiki from '../components/TrendingWiki';
import { Flame } from 'lucide-react';

const TodayTrends = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-orange-100 dark:bg-orange-950/50 p-2 rounded-lg">
            <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">오늘의 실시간 급상승</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-lg ml-12">전 세계 대중들이 지금 이 순간 가장 뜨겁게 반응하고 있는 트렌드를 확인하세요.</p>
      </div>
      <TrendingWiki />
    </div>
  );
};

export default TodayTrends;
