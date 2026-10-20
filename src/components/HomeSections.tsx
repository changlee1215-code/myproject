import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Calculator, LineChart, ShieldCheck, KeyRound, CalendarRange, Search } from 'lucide-react';

export const HowItWorks = () => {
  const steps = [
    {
      icon: Database,
      title: '1. 오픈 API로 수집',
      desc: 'Wikimedia, NPM, Crates.io가 공개한 통계 API를 브라우저에서 직접 호출합니다. 별도의 키 발급도, 서버도 필요 없습니다.',
    },
    {
      icon: Calculator,
      title: '2. 프록시 지표로 변환',
      desc: '직접 측정할 수 없는 대중의 관심을 문서 조회수·다운로드 수라는 대체 지표(Proxy Data)로 읽어냅니다. MAU 등 일부 지표는 업계 평균 비율로 추정한 값입니다.',
    },
    {
      icon: LineChart,
      title: '3. 시각화와 해석',
      desc: '기간별 추이, 급등 구간, 기기 비율을 한 화면에 보여주고 변화 패턴을 규칙 기반으로 요약합니다.',
    },
  ];

  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900">앱이 없어도, 센서는 이미 열려 있습니다</h2>
          <p className="mt-4 text-xl text-gray-500">전 세계에 공개된 데이터로 사회의 관심을 읽는 3단계 과정입니다.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.title} className="relative bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <s.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
              <p className="text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const DataSources = () => {
  const sources = [
    {
      name: 'Wikimedia Foundation',
      sub: '위키백과 문서 조회수',
      badge: '비영리',
      badgeStyle: 'bg-green-100 text-green-700',
      period: '2015년 7월~',
      points: ['300개 이상 언어판 지원', '봇·크롤러 트래픽 제외 집계', '모바일/데스크톱 구분 제공'],
    },
    {
      name: 'NPM Registry',
      sub: '오픈소스 패키지 다운로드 수',
      badge: '영리 기업 운영',
      badgeStyle: 'bg-gray-200 text-gray-700',
      period: '2015년 1월~',
      points: ['GitHub(Microsoft) 소유 레지스트리', '공개 통계 API 무료 제공', '글로벌 개발 생태계의 규모 지표'],
    },
    {
      name: 'Crates.io (Rust)',
      sub: 'Rust 패키지 다운로드 수',
      badge: '비영리 오픈소스',
      badgeStyle: 'bg-green-100 text-green-700',
      period: '최근 90일',
      points: ['Rust 프로젝트·재단이 운영', '공개 통계 API 무료 제공', '공공 인프라형 오픈소스 지표'],
    },
  ];

  return (
    <div className="py-24 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900">신뢰할 수 있는 공개 데이터 출처</h2>
          <p className="mt-4 text-xl text-gray-500">모든 데이터는 공식 공개 API에서 실시간으로 가져옵니다.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1">
              <KeyRound className="h-4 w-4 text-indigo-600" /> API 키 불필요
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1">
              <ShieldCheck className="h-4 w-4 text-indigo-600" /> 개인정보 미수집 (집계 데이터만 사용)
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sources.map((s) => (
            <div key={s.name} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.badgeStyle}`}>{s.badge}</span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <CalendarRange className="h-3.5 w-3.5" /> {s.period}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{s.name}</h3>
              <p className="text-gray-500 mb-4">{s.sub}</p>
              <ul className="space-y-2 text-sm text-gray-600">
                {s.points.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-gray-400">
          ※ 위키백과 수치는 '검색량'이 아닌 문서 조회수이며, MAU·일부 기기 비율은 추정(시뮬레이션) 값입니다.
        </p>
      </div>
    </div>
  );
};

export const HeroSearch = () => {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    // 한글이 포함되면 한국어판, 아니면 영어판 위키백과로 추적
    const lang = /[가-힣]/.test(t) ? 'ko' : 'en';
    navigate(`/explore?lang=${lang}&q=${encodeURIComponent(t)}`);
  };

  return (
    <form onSubmit={submit} className="mt-8 w-full max-w-xl">
      <label className="block text-sm font-medium text-gray-600 mb-2">궁금한 키워드의 관심도를 직접 추적해 보세요</label>
      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg shadow-sm pl-4 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
        <Search className="h-5 w-5 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예: 저출산, 기후 변화, ChatGPT"
          className="flex-1 outline-none bg-transparent text-gray-900"
        />
        <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
          추적하기
        </button>
      </div>
    </form>
  );
};
