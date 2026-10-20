type AdminChangeListener = (isAdmin: boolean) => void;

const SESSION_KEY = 'app_insight_admin_session';
const PASSWORD_KEY = 'app_insight_admin_pw';
const DEFAULT_PASSWORD = 'admin';

const listeners: Set<AdminChangeListener> = new Set();

export const AdminService = {
  /**
   * 현재 관리자 인증 상태 확인
   */
  isAdmin(): boolean {
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  },

  /**
   * 관리자 로그인 시도 (기본 비번: 'admin')
   */
  login(password: string): boolean {
    const correctPassword = localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
    if (password === correctPassword) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      this.notifyListeners(true);
      return true;
    }
    return false;
  },

  /**
   * 관리자 로그아웃
   */
  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.notifyListeners(false);
  },

  /**
   * 관리자 비밀번호 변경
   */
  changePassword(oldPw: string, newPw: string): boolean {
    const current = localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
    if (oldPw === current && newPw.trim().length >= 4) {
      localStorage.setItem(PASSWORD_KEY, newPw.trim());
      return true;
    }
    return false;
  },

  /**
   * 상태 변경 구독
   */
  subscribe(listener: AdminChangeListener): () => void {
    listeners.add(listener);
    listener(this.isAdmin());
    return () => {
      listeners.delete(listener);
    };
  },

  notifyListeners(isAdmin: boolean): void {
    listeners.forEach((fn) => fn(isAdmin));
  },
};
