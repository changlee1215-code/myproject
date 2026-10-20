import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Heart, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { HowItWorks, DataSources, HeroSearch } from '../components/HomeSections';

const Home = () => {
  const features = [
    {
      title: '글로벌 플랫폼 관제',
      description: '위키백과, NPM, Rust 등 전 세계 수천만 명이 접속하는 초거대 디지털 인프라의 베이스라인 트래픽을 관제합니다.',
      icon: Globe,
    },
    {
      title: '사회적 어젠다 추적',
      description: '기후 변화, 저출산, SDGs 등 공익적 이슈에 대한 대중의 관심도 변화를 정량적인 트래픽 수치로 분석합니다.',
      icon: Heart,
    },
    {
      title: '급상승 트렌드 감지',
      description: '신제품 출시나 주요 사회적 이벤트 직후 폭증하는 유동량의 스파이크(Spike)를 즉각적으로 시각화합니다.',
      icon: TrendingUp,
    },
    {
      title: '인공지능 지표 요약',
      description: '복잡한 트래픽 변동 추이와 DAU/MAU 활성도를 AI가 실시간으로 분석하여 직관적인 인사이트 문장으로 요약합니다.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 flex flex-col items-start text-left">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 rounded-full text-indigo-700 dark:text-indigo-300 text-sm font-bold shadow-sm">
              <Globe className="w-4 h-4" />
              <span>오픈 공공 데이터 기반 비영리 포트폴리오 프로젝트</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-gray-300 tracking-tight leading-tight">
              디지털 세계의 흐름을 <br/><span className="text-indigo-600 dark:text-indigo-400">한눈에 읽다.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
              단순한 방문자 수 분석을 넘어, 전 세계 거대 플랫폼 트래픽부터 공익적 사회 이슈까지 거대한 디지털 유동량의 맥락을 추적하세요.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/dashboard"
                className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
              >
                대시보드 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
              >
                주요 기능 알아보기
              </a>
            </div>
            <HeroSearch />
          </div>
          
          <div className="lg:w-1/2 w-full relative">
            <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-950/40 rounded-3xl transform rotate-3 scale-105 opacity-50"></div>
            <img 
              src="/global_traffic_hero.jpg" 
              alt="Traffic Analytics Dashboard Illustration" 
              className="relative w-full h-auto rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transform translate-y-4 hover:-translate-y-1 transition-transform duration-500"
            />
          </div>
        </div>
      </div>

      {/* How it works */}
      <HowItWorks />

      {/* Features Section */}
      <div id="features" className="py-24 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">거대한 데이터 속에서 인사이트를 발견하세요</h2>
            <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">TRAFFIC INSIGHT가 제공하는 4가지 핵심 분석 솔루션입니다.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-900 hover:-translate-y-1 transition-all duration-300 cursor-default">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <DataSources />
    </div>
  );
};

export default Home;
