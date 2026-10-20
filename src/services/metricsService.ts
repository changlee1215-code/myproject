export interface MetricPoint {
  date: string;       // e.g. "10/11"
  fullDate: string;   // e.g. "2026-10-11"
  value: number;      // raw daily views or downloads
  growthRate?: number;
  isInterpolated?: boolean; // API 집계 누락(0) 선형 보간 여부
}

export interface KpiSummary {
  currentValue: number;
  prevValue: number;
  dailyChange: number; // percentage
  weeklyTotal: number;
  prevWeeklyTotal: number;
  weeklyChange: number; // percentage
  periodTotal: number;  // total in selected period
  displayDays: number;
  peakValue: number;
  peakDate: string;
  averageValue: number;
}

export interface DataSourcePreset {
  id: string;
  title: string;
  category: 'trending' | 'social' | 'dev' | 'benchmark';
  categoryLabel: string;
  type: 'wiki_ko' | 'wiki_en' | 'npm' | 'crates';
  queryKey: string;
  description: string;
  unit: string;
}

export const PRESET_SOURCES: DataSourcePreset[] = [
  // 실시간 & 메가 트렌드
  {
    id: 'WIKI_KO_TREND_HANKANG',
    title: '한강 (소설가)',
    category: 'trending',
    categoryLabel: '🔥 화제성 트렌드',
    type: 'wiki_ko',
    queryKey: '한강_(작가)',
    description: '노벨문학상 수상 등으로 관심도가 폭발적으로 치솟은 대한민국 메가 이슈 키워드입니다.',
    unit: '회 (일간 조회수)'
  },
  {
    id: 'WIKI_EN_TREND_CHATGPT',
    title: 'ChatGPT',
    category: 'trending',
    categoryLabel: '🔥 화제성 트렌드',
    type: 'wiki_en',
    queryKey: 'ChatGPT',
    description: '생성형 AI 패러다임 전환을 이끈 챗봇 서비스의 글로벌 관심도 트렌드입니다.',
    unit: '회 (글로벌 조회수)'
  },
  {
    id: 'WIKI_EN_TREND_NVIDIA',
    title: 'NVIDIA (엔비디아)',
    category: 'trending',
    categoryLabel: '🔥 화제성 트렌드',
    type: 'wiki_en',
    queryKey: 'Nvidia',
    description: 'AI 반도체 시장을 독점하며 글로벌 경제의 중심이 된 엔비디아의 관심도 곡선입니다.',
    unit: '회 (글로벌 조회수)'
  },
  {
    id: 'WIKI_KO_TREND_THEGLORY',
    title: '더 글로리',
    category: 'trending',
    categoryLabel: '🔥 화제성 트렌드',
    type: 'wiki_ko',
    queryKey: '더_글로리',
    description: '글로벌 신드롬을 일으켰던 K-드라마 콘텐츠의 대중적 파급력을 나타냅니다.',
    unit: '회 (일간 조회수)'
  },
  {
    id: 'WIKI_KO_TREND_SON',
    title: '손흥민 (축구선수)',
    category: 'trending',
    categoryLabel: '🔥 화제성 트렌드',
    type: 'wiki_ko',
    queryKey: '손흥민',
    description: '글로벌 무대에서 활약하는 대표 스포츠 스타의 경기 일정 및 대중 관심도 지표입니다.',
    unit: '회 (일간 조회수)'
  },
  {
    id: 'WIKI_EN_TREND_OPPENHEIMER',
    title: '오펜하이머 (영화)',
    category: 'trending',
    categoryLabel: '🔥 화제성 트렌드',
    type: 'wiki_en',
    queryKey: 'Oppenheimer_(film)',
    description: '개봉 당시 전 세계 문화계를 강타한 대작 영화의 폭발적인 관심도 추이입니다.',
    unit: '회 (글로벌 조회수)'
  },

  // 사회적 과제 & 공익
  {
    id: 'WIKI_KO_BIRTHRATE',
    title: '저출산',
    category: 'social',
    categoryLabel: '🌱 사회/공익 어젠다',
    type: 'wiki_ko',
    queryKey: '저출산',
    description: '대한민국의 핵심 사회적 과제로 정책 발표 및 관련 이슈 시 관심도가 상승하는 키워드입니다.',
    unit: '회 (일간 조회수)'
  },
  {
    id: 'WIKI_KO_AGING',
    title: '고령화 사회',
    category: 'social',
    categoryLabel: '🌱 사회/공익 어젠다',
    type: 'wiki_ko',
    queryKey: '고령화_사회',
    description: '초고령 사회 진입에 따른 보건 복지 및 제도적 논의와 관련된 관심도 트렌드입니다.',
    unit: '회 (일간 조회수)'
  },
  {
    id: 'WIKI_EN_CLIMATE',
    title: '기후 변화 (Climate Change)',
    category: 'social',
    categoryLabel: '🌱 사회/공익 어젠다',
    type: 'wiki_en',
    queryKey: 'Climate_change',
    description: '환경 재난 및 국제 기후 협약 관련 글로벌 관심도를 보여주는 지표입니다.',
    unit: '회 (글로벌 조회수)'
  },

  // 글로벌 & 국내 베이스라인 벤치마크 (실제 대규모 검증 지표)
  {
    id: 'WIKI_KO_MAIN',
    title: '한국어 위키백과 대문',
    category: 'benchmark',
    categoryLabel: '🌐 플랫폼 벤치마크',
    type: 'wiki_ko',
    queryKey: '위키백과:대문',
    description: '국내 대형 정보 포털 수준의 안정적인 일상 베이스라인 트래픽(일평균 2만 회 이상)을 관제합니다.',
    unit: '회 (일간 조회수)'
  },
  {
    id: 'WIKI_EN_MAIN',
    title: '영어 위키백과 Main Page',
    category: 'benchmark',
    categoryLabel: '🌐 플랫폼 벤치마크',
    type: 'wiki_en',
    queryKey: 'Main_Page',
    description: '일일 400만~600만 뷰를 기록하는 글로벌 최상위 웹 서비스 수준의 절대적 트래픽 기준선입니다.',
    unit: '회 (글로벌 조회수)'
  },
  {
    id: 'REACT_BENCH',
    title: 'React 생태계 (NPM)',
    category: 'benchmark',
    categoryLabel: '🌐 플랫폼 벤치마크',
    type: 'npm',
    queryKey: 'react',
    description: '전 세계 웹 개발의 표준이자 일일 350만 회 이상의 실사용 다운로드가 집계되는 글로벌 기술 벤치마크입니다.',
    unit: '회 (일일 다운로드)'
  },
  {
    id: 'TYPESCRIPT_BENCH',
    title: 'TypeScript 생태계 (NPM)',
    category: 'benchmark',
    categoryLabel: '🌐 플랫폼 벤치마크',
    type: 'npm',
    queryKey: 'typescript',
    description: '현대 소프트웨어 개발 표준으로 일일 400만 회급의 압도적 빌드 트래픽을 기록하는 핵심 지표입니다.',
    unit: '회 (일일 다운로드)'
  },

  // 개발자 생태계
  {
    id: 'REACT_NPM',
    title: 'React (NPM)',
    category: 'dev',
    categoryLabel: '💻 개발자/소프트웨어',
    type: 'npm',
    queryKey: 'react',
    description: '글로벌 프론트엔드 웹 개발 표준 라이브러리의 일일 패키지 다운로드 활성도 지표입니다.',
    unit: '회 (일일 다운로드)'
  },
  {
    id: 'TYPESCRIPT_NPM',
    title: 'TypeScript (NPM)',
    category: 'dev',
    categoryLabel: '💻 개발자/소프트웨어',
    type: 'npm',
    queryKey: 'typescript',
    description: '현대 웹/서버 소프트웨어 개발 표준 프로그래밍 언어의 생태계 확장성 지표입니다.',
    unit: '회 (일일 다운로드)'
  },
  {
    id: 'EXPRESS_NPM',
    title: 'Express (NPM)',
    category: 'dev',
    categoryLabel: '💻 개발자/소프트웨어',
    type: 'npm',
    queryKey: 'express',
    description: 'Node.js 백엔드 서버 개발의 전통적인 핵심 프레임워크 다운로드 볼륨입니다.',
    unit: '회 (일일 다운로드)'
  },
  {
    id: 'LODASH_NPM',
    title: 'Lodash (NPM)',
    category: 'dev',
    categoryLabel: '💻 개발자/소프트웨어',
    type: 'npm',
    queryKey: 'lodash',
    description: '전 세계 웹 개발 생태계의 대표 유틸리티 라이브러리로 안정적인 대규모 다운로드 볼륨을 보입니다.',
    unit: '회 (일일 다운로드)'
  },
  {
    id: 'OPENAI_NPM',
    title: 'OpenAI Node SDK (NPM)',
    category: 'dev',
    categoryLabel: '💻 개발자/소프트웨어',
    type: 'npm',
    queryKey: 'openai',
    description: 'LLM 애플리케이션 개발 활성화를 직접적으로 반영하는 OpenAI 공식 SDK 다운로드 수입니다.',
    unit: '회 (일일 다운로드)'
  },
  {
    id: 'CRATES_RUST',
    title: 'Serde (Rust Crates)',
    category: 'dev',
    categoryLabel: '💻 개발자/소프트웨어',
    type: 'crates',
    queryKey: 'serde',
    description: 'Rust 비영리 생태계의 핵심 직렬화 라이브러리로 Rust 언어의 폭발적 성장을 증명합니다.',
    unit: '회 (일일 다운로드)'
  }
];

const pad = (n: number) => String(n).padStart(2, '0');

export const formatWikiDate = (d: Date): string => {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}00`;
};

// API 서버 CDN 로그 누락 등으로 인한 중간 비정상 결측치(0)를 선형 보간(Linear Interpolation)하는 헬퍼
export const interpolateMissingPoints = (points: MetricPoint[]): MetricPoint[] => {
  return points.map((pt, idx, arr) => {
    if (pt.value === 0) {
      let prevVal = 0;
      for (let i = idx - 1; i >= 0; i--) {
        if (arr[i].value > 0) {
          prevVal = arr[i].value;
          break;
        }
      }
      let nextVal = 0;
      for (let i = idx + 1; i < arr.length; i++) {
        if (arr[i].value > 0) {
          nextVal = arr[i].value;
          break;
        }
      }

      if (prevVal > 0 && nextVal > 0) {
        return {
          ...pt,
          value: Math.round((prevVal + nextVal) / 2),
          isInterpolated: true,
        };
      } else if (prevVal > 0 || nextVal > 0) {
        return {
          ...pt,
          value: prevVal || nextVal,
          isInterpolated: true,
        };
      }
    }
    return pt;
  });
};

export const MetricsService = {
  async fetchWikiTraffic(lang: 'ko' | 'en', articleTitle: string, startDate: Date, endDate: Date): Promise<MetricPoint[]> {
    const formattedTitle = encodeURIComponent(articleTitle.trim().replace(/ /g, '_'));
    const startStr = formatWikiDate(startDate);
    const endStr = formatWikiDate(endDate);

    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lang}.wikipedia.org/all-access/user/${formattedTitle}/daily/${startStr}/${endStr}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`위키백과 API 호출 실패 (${res.status})`);
    }

    const data = await res.json();
    if (!data.items) return [];

    const rawPoints = data.items.map((item: any) => {
      const y = item.timestamp.substring(0, 4);
      const m = item.timestamp.substring(4, 6);
      const d = item.timestamp.substring(6, 8);
      return {
        date: `${parseInt(m, 10)}/${parseInt(d, 10)}`,
        fullDate: `${y}-${m}-${d}`,
        value: Number(item.views) || 0
      };
    });

    return interpolateMissingPoints(rawPoints);
  },

  async fetchNpmTraffic(pkgName: string, startDate: Date, endDate: Date): Promise<MetricPoint[]> {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const url = `https://api.npmjs.org/downloads/range/${startStr}:${endStr}/${encodeURIComponent(pkgName)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`NPM API 호출 실패 (${res.status})`);
    }

    const data = await res.json();
    if (!data.downloads) return [];

    // NPM API는 배치 집계 파이프라인 특성상 당일/전일 등 아직 정산되지 않은 최신 일자를 downloads: 0으로 채워 반환합니다.
    // 배열 후미의 미집계(0) 일자들을 안전하게 제거하여 실제 확정 집계된 최신 일자까지만 정상 표시합니다.
    let list: any[] = [...data.downloads];
    while (list.length > 0 && Number(list[list.length - 1].downloads) === 0) {
      list.pop();
    }

    const rawPoints = list.map((item: any) => {
      const parts = item.day.split('-');
      return {
        date: `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`,
        fullDate: item.day,
        value: Number(item.downloads) || 0
      };
    });

    // 중간 일자에 발생하는 NPM 서버측 CDN 로그 누락(0) 결측치를 인접 정상일의 평균값으로 선형 보간
    return interpolateMissingPoints(rawPoints);
  },

  async fetchCratesTraffic(crateName = 'serde', startDate: Date): Promise<MetricPoint[]> {
    const url = `https://crates.io/api/v1/crates/${encodeURIComponent(crateName)}/downloads`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Crates API 호출 실패 (${res.status})`);
    }

    const data = await res.json();
    const extraDownloads = data.meta?.extra_downloads || [];
    const minTimestamp = startDate.getTime();

    const filtered = extraDownloads.filter((d: any) => new Date(d.date).getTime() >= minTimestamp);

    return filtered.map((item: any) => {
      const parts = item.date.split('-');
      return {
        date: `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`,
        fullDate: item.date,
        value: Number(item.downloads) || 0
      };
    });
  },

  calculateKpis(allPoints: MetricPoint[], displayDays = 30): KpiSummary {
    if (allPoints.length === 0) {
      return {
        currentValue: 0,
        prevValue: 0,
        dailyChange: 0,
        weeklyTotal: 0,
        prevWeeklyTotal: 0,
        weeklyChange: 0,
        periodTotal: 0,
        displayDays,
        peakValue: 0,
        peakDate: '-',
        averageValue: 0
      };
    }

    const n = allPoints.length;
    const current = allPoints[n - 1].value;
    const prev = n >= 2 ? allPoints[n - 2].value : current;
    const dailyChange = prev > 0 ? Number((((current - prev) / prev) * 100).toFixed(1)) : 0;

    // 최근 7일 vs 직전 7일 (전체 버퍼에서 계산하여 기간 필터와 무관하게 항상 정확함)
    const last7 = allPoints.slice(Math.max(0, n - 7));
    const prev7 = allPoints.slice(Math.max(0, n - 14), Math.max(0, n - 7));
    
    const weeklyTotal = last7.reduce((acc, p) => acc + p.value, 0);
    const prevWeeklyTotal = prev7.reduce((acc, p) => acc + p.value, 0);
    const weeklyChange = prevWeeklyTotal > 0 
      ? Number((((weeklyTotal - prevWeeklyTotal) / prevWeeklyTotal) * 100).toFixed(1)) 
      : 0;

    // 선택된 화면 표시 기간 (7일, 30일, 90일 등)에 맞춘 누적 및 평균
    const visiblePoints = allPoints.slice(Math.max(0, n - displayDays));
    const periodTotal = visiblePoints.reduce((acc, p) => acc + p.value, 0);

    let peakValue = 0;
    let peakDate = '-';
    visiblePoints.forEach(p => {
      if (p.value > peakValue) {
        peakValue = p.value;
        peakDate = p.date;
      }
    });

    const averageValue = visiblePoints.length > 0 ? Math.round(periodTotal / visiblePoints.length) : 0;

    return {
      currentValue: current,
      prevValue: prev,
      dailyChange,
      weeklyTotal,
      prevWeeklyTotal,
      weeklyChange,
      periodTotal,
      displayDays,
      peakValue,
      peakDate,
      averageValue
    };
  }
};
