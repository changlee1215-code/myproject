// 나중에 백엔드 DB(Node.js + DB)로 포팅하기 쉽도록 
// 외부와 통신하는 API 계층처럼 추상화(Abstraction)해둔 서비스 클래스입니다.

export interface TrendLog {
  id: string;          // 고유 ID (PK 역할)
  targetDate: string;  // 트렌드가 발생한 기준 날짜 (YYYY-MM-DD)
  keyword: string;     // 위키백과 원본 키워드
  title: string;       // 화면 표시용 제목
  createdAt: string;   // 로그가 DB에 저장된 실제 시간 (ISO String)
}

export class TrendLoggerService {
  // 현재는 로컬 스토리지를 DB처럼 사용하지만,
  // 차후 백엔드가 생기면 이 값을 엔드포인트 URL(예: '/api/trends')로 바꾸고
  // 아래 메서드들을 axios나 fetch로 교체하기만 하면 프론트엔드 코드는 수정할 필요가 없습니다.
  private static STORAGE_KEY = 'app_insight_trend_logs';

  // [GET] /api/trends 에 해당하는 역할
  static getLogs(): TrendLog[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // [POST] /api/trends 에 해당하는 역할
  static saveLog(log: Omit<TrendLog, 'id' | 'createdAt'>): void {
    const logs = this.getLogs();
    
    // 이미 해당 날짜에 같은 키워드가 저장되어 있다면 중복 저장 방지 (멱등성 보장)
    const exists = logs.some(l => l.targetDate === log.targetDate && l.keyword === log.keyword);
    if (exists) return;

    const newLog: TrendLog = {
      ...log,
      id: `${log.targetDate}-${log.keyword}`,
      createdAt: new Date().toISOString(),
    };

    // 최신 로그가 앞에 오도록 병합하고, 날짜 기준 내림차순 정렬
    const updatedLogs = [newLog, ...logs].sort((a, b) => 
      new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime()
    );

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedLogs));
  }

  // 날짜별로 그룹화된 로그 반환
  static getGroupedLogs(): Record<string, TrendLog[]> {
    const logs = this.getLogs();
    const grouped: Record<string, TrendLog[]> = {};
    
    logs.forEach(log => {
      if (!grouped[log.targetDate]) {
        grouped[log.targetDate] = [];
      }
      grouped[log.targetDate].push(log);
    });
    
    return grouped;
  }

  // 매일 자동으로 수집된 7일치 트렌드(하루 5개씩) 묶음을 DB와 동기화
  static syncWeeklyTrends(trends: { date: string, keyword: string, title: string }[]): void {
    const currentYear = new Date().getFullYear();
    
    trends.forEach(t => {
      const [month, day] = t.date.split('/');
      const targetDate = `${currentYear}-${month}-${day}`;
      
      this.saveLog({
        targetDate,
        keyword: t.keyword,
        title: t.title
      });
    });
  }
}
