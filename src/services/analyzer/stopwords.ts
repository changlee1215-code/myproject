export const KO_STOPWORDS = new Set([
  '기자', '뉴스', '단독', '종합', '속보', '특보', '포토', '영상', '위해', '대한', '관련', '그리고',
  '있는', '없는', '에서', '으로', '까지', '부터', '오늘', '어제', '내일', '최근', '이번', '올해',
  '지난', '사흘', '이틀', '하루', '만에', '밝혀', '전해', '알려져', '공개', '전격', '포착', '눈길',
  '화제', '충격', '주목', '이유', '사실', '당시', '결국', '다시', '진짜', '직접', '최고', '사태',
  '입장', '공식', '발표', '확인', '소식', '상황', '인터뷰', '보도', '기사', '사진', '현장', '방송',
  '출연', '등장', '모습', '근황', '대박', '역대', '반응', '누리꾼', '네티즌', '온라인', '커뮤니티',
  '연합뉴스', '뉴시스', '뉴스1', '조선일보', '중앙일보', '동아일보', '한겨레', '경향신문', 'sbs', 'kbs',
  'mbc', 'jtbc', 'ytn', '매일경제', '한국경제', '머니투데이', '헤럴드경제', '이데일리', '국민일보',
  '세계일보', '문화일보', '전자신문', '인사이트', '위키트리', '데일리안', '노컷뉴스', '오마이뉴스',
  '스포티비뉴스', 'osen', '엑스포츠뉴스', '마이데일리', '뉴스엔', '스타뉴스', 'tv리포트',
  // 외신 번역 기사에서 빈번한 어미/조사/보조 용언 노이즈 제거
  '밝혔다', '전했다', '알려졌다', '보도했다', '말했다', '주장했다', '것으로', '대해', '통해',
  '따르면', '따라', '했다', '됐다', '있다', '것이다', '이라고', '등을', '등의', '하는', '위한',
  '가운데', '이후', '보다', '매체는', '외신', '외신은', '현지', '현지시간', '오후', '오전', '통한',
  '함께', '이어', '나타났다', '보여준', '알렸다', '가졌다', '나섰다', '가장', '자신의', '그의',
  '그녀의', '모든', '등이', '등에', '하며', '되며', '면서', '위하여', '대하여', '있다고', '없다고'
]);

export const EN_STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'about', 'into', 'over', 'after',
  'of', 'in', 'on', 'at', 'to', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'or', 'but', 'so',
  'if', 'it', 'its', 'they', 'them', 'their', 'theirs', 'he', 'him', 'his', 'she', 'her', 'hers',
  'we', 'us', 'our', 'ours', 'you', 'your', 'yours', 'my', 'me', 'up', 'down', 'out', 'off',
  'than', 'too', 'very', 'can', 'could', 'would', 'will', 'shall', 'should', 'may', 'might', 'must',
  'news', 'daily', 'times', 'post', 'report', 'reports', 'says', 'said', 'latest', 'breaking', 'live',
  'watch', 'video', 'photo', 'photos', 'update', 'updates', 'today', 'yesterday', 'week', 'year', 'month',
  'first', 'just', 'how', 'what', 'why', 'when', 'where', 'who', 'which', 'here', 'more', 'exclusive', 'ahead', 'amid',
  'reuters', 'ap', 'bbc', 'cnn', 'nbc', 'cbs', 'abc', 'fox', 'bloomberg', 'forbes', 'wsj', 'nyt',
  'variety', 'billboard', 'deadline', 'pitchfork', 'rolling', 'stone', 'hollywood', 'reporter',
  'guardian', 'independent', 'telegraph', 'dailymail', 'mirror', 'sun', 'tribune', 'herald',
  'chronicle', 'globe', 'journal', 'inquirer', 'cnbc', 'msnbc', 'vox', 'verge', 'ign', 'polygon',
  'vulture', 'buzzfeed', 'tmz', 'people', 'usatoday', 'associated', 'press', 'afp', 'insider',
  'espn', 'athletic', 'marca', 'skysports', 'bleacher', 'talksport', 'sportingnews',
  'india', 'hindustan', 'brut', 'reelgood', 'upnext', 'ndtv', 'pinkvilla', 'koimoi', 'midday',
  'nods', 'nod', 'full', 'list', 'reaction', 'reacts', 'react', 'see', 'look', 'looks', 'take',
  'takes', 'every', 'everything', 'thing', 'things', 'tell', 'tells', 'all', 'some', 'many', 'much',
  'new', 'top', 'best', 'worst', 'big', 'biggest', 'major', 'star', 'stars', 'fan', 'fans', 'world',
  'time', 'day', 'days', 'hour', 'hours', 'still', 'now', 'then', 'back', 'way', 'part',
  'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'know', 'wants', 'shows', 'shown', 'make', 'makes', 'made', 'come', 'comes', 'came', 'get',
  'gets', 'got', 'give', 'gives', 'gave', 'find', 'finds', 'found', 'read', 'reads',
  'according', 'source', 'sources', 'told', 'noted', 'claimed', 'called', 'named', 'state',
  'following', 'since', 'during', 'against', 'between', 'under'
]);

// 흔한 이름/일반 성씨로 인한 오탐 방지용 가드레일 (단독 매칭 금지)
export const COMMON_NAMES = new Set([
  'john', 'david', 'michael', 'chris', 'james', 'robert', 'william', 'mary', 'paul',
  'mark', 'alex', 'sam', 'tom', 'dan', 'ben', 'lee', 'park', 'kim', 'choi', 'smith',
  'brown', 'jones', 'miller', 'davis', 'wilson', 'taylor', 'clark', 'white', 'martin',
  'jackson', 'thomas', 'harris', 'young', 'allen', 'king', 'wright', 'scott', 'green',
  'junior', 'senior', 'boy', 'girl', 'man', 'woman', 'son', 'father', 'mother'
]);

export const cleanKoreanJosa = (w: string): string => {
  return w.replace(/(은|는|이|가|을|를|의|에|와|과|로|으로|에서|까지|부터|보다|처럼|이나|에게)$/, '');
};

export const cleanHeadline = (title: string): string => {
  return title
    .replace(/^\[[^\]]+\]\s*/g, '')
    .replace(/^【[^】]+】\s*/g, '')
    .replace(/\s*[-–—|]\s*[^-–—|]+$/, '')
    .trim();
};

export const escapeRegExp = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const ONE_MONTH_DAYS = 31;
export const ONE_MONTH_MS = ONE_MONTH_DAYS * 24 * 60 * 60 * 1000;

export const isWithinOneMonth = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const time = d.getTime();
  if (isNaN(time)) return false;
  const diff = Date.now() - time;
  // 최근 31일 이내 (클라이언트 타임존 오차 감안하여 미래 1일 허용)
  return diff <= ONE_MONTH_MS && diff >= -24 * 60 * 60 * 1000;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
};

export const KNOWN_TRANSLITERATION_MAP: Record<string, string> = {
  kurt: '커트',
  cobain: '코베인',
  nirvana: '너바나',
  john: '존',
  lennon: '레논',
  paul: '폴',
  mccartney: '매카트니',
  george: '조지',
  harrison: '해리슨',
  ringo: '링고',
  starr: '스타',
  beatles: '비틀즈',
  freddie: '프레디',
  mercury: '머큐리',
  brian: '브라이언',
  may: '메이',
  roger: '로저',
  taylor: '테일러',
  queen: '퀸',
  oasis: '오아시스',
  liam: '리암',
  gallagher: '갤러거',
  noel: '노엘',
  linkin: '린킨',
  park: '파크',
  chester: '체스터',
  bennington: '베닝턴',
  shinoda: '시노다',
  coldplay: '콜드플레이',
  chris: '크리스',
  martin: '마틴',
  foo: '푸',
  fighters: '파이터스',
  grohl: '그롤',
  hawkins: '호킨스',
  metallica: '메탈리카',
  james: '제임스',
  hetfield: '헷필드',
  ulrich: '울리히',
  hammett: '해밋',
  radiohead: '라디오헤드',
  thom: '톰',
  yorke: '요크',
  greenwood: '그린우드',
  led: '레드',
  zeppelin: '제플린',
  robert: '로버트',
  plant: '플랜트',
  page: '페이지',
  rolling: '롤링',
  stones: '스톤스',
  mick: '믹',
  jagger: '재거',
  richards: '리차즈',
  acdc: '에이씨디씨',
  guns: '건즈',
  roses: '로지스',
  axl: '액슬',
  rose: '로즈',
  slash: '슬래시',
  sabbath: '사바스',
  ozzy: '오지',
  osbourne: '오스본',
  bts: '방탄소년단',
  blackpink: '블랙핑크',
  newjeans: '뉴진스',
  elvis: '엘비스',
  presley: '프레슬리',
  michael: '마이클',
  jackson: '잭슨',
  marilyn: '마릴린',
  monroe: '먼로',
  jimi: '지미',
  hendrix: '헨드릭스',
  david: '데이비드',
  bowie: '보위',
  prince: '프린스',
  whitney: '휘트니',
  houston: '휴스턴',
  amy: '에이미',
  winehouse: '와인하우스',
  bob: '밥',
  marley: '말리',
  heath: '히스',
  ledger: '레저',
  tupac: '투팍',
  shakur: '샤커',
  biggie: '비기',
  kobe: '코비',
  bryant: '브라이언트',
  maradona: '마라도나',
  pele: '펠레',
  lite: '라이트',
  soul: '소울',
  novoselic: '노보셀릭',
};

export interface BandMemberInfo {
  bandEn: string;
  bandKo: string;
  role: string;
  genre: string;
}

export interface BandInfo {
  bandKo: string;
  bandEn: string;
  genre: string;
  keyMembers: string[];
}

export const FAMOUS_BAND_MEMBERS: Record<string, BandMemberInfo> = {
  // Nirvana
  'kurt cobain': { bandEn: 'Nirvana', bandKo: '너바나', role: '프론트맨·보컬', genre: '그런지 록' },
  '커트 코베인': { bandEn: 'Nirvana', bandKo: '너바나', role: '프론트맨·보컬', genre: '그런지 록' },
  'krist novoselic': { bandEn: 'Nirvana', bandKo: '너바나', role: '베이시스트', genre: '그런지 록' },
  '크리스 노보셀릭': { bandEn: 'Nirvana', bandKo: '너바나', role: '베이시스트', genre: '그런지 록' },
  'dave grohl': { bandEn: 'Nirvana / Foo Fighters', bandKo: '너바나 / 푸 파이터스', role: '드러머·프론트맨', genre: '록' },
  '데이브 그롤': { bandEn: 'Nirvana / Foo Fighters', bandKo: '너바나 / 푸 파이터스', role: '드러머·프론트맨', genre: '록' },

  // The Beatles
  'john lennon': { bandEn: 'The Beatles', bandKo: '비틀즈', role: '멤버·보컬', genre: '록' },
  '존 레논': { bandEn: 'The Beatles', bandKo: '비틀즈', role: '멤버·보컬', genre: '록' },
  'paul mccartney': { bandEn: 'The Beatles', bandKo: '비틀즈', role: '멤버·보컬', genre: '록' },
  '폴 매카트니': { bandEn: 'The Beatles', bandKo: '비틀즈', role: '멤버·보컬', genre: '록' },
  'george harrison': { bandEn: 'The Beatles', bandKo: '비틀즈', role: '기타리스트·보컬', genre: '록' },
  '조지 해리슨': { bandEn: 'The Beatles', bandKo: '비틀즈', role: '기타리스트·보컬', genre: '록' },
  'ringo starr': { bandEn: 'The Beatles', bandKo: '비틀즈', role: '드러머', genre: '록' },
  '링고 스타': { bandEn: 'The Beatles', bandKo: '비틀즈', role: '드러머', genre: '록' },

  // Queen
  'freddie mercury': { bandEn: 'Queen', bandKo: '퀸', role: '리드 보컬', genre: '록' },
  '프레디 머큐리': { bandEn: 'Queen', bandKo: '퀸', role: '리드 보컬', genre: '록' },
  'brian may': { bandEn: 'Queen', bandKo: '퀸', role: '기타리스트', genre: '록' },
  '브라이언 메이': { bandEn: 'Queen', bandKo: '퀸', role: '기타리스트', genre: '록' },
  'roger taylor': { bandEn: 'Queen', bandKo: '퀸', role: '드러머', genre: '록' },
  '로저 테일러': { bandEn: 'Queen', bandKo: '퀸', role: '드러머', genre: '록' },

  // Oasis
  'liam gallagher': { bandEn: 'Oasis', bandKo: '오아시스', role: '보컬', genre: '브릿팝' },
  '리암 갤러거': { bandEn: 'Oasis', bandKo: '오아시스', role: '보컬', genre: '브릿팝' },
  'noel gallagher': { bandEn: 'Oasis', bandKo: '오아시스', role: '기타·보컬', genre: '브릿팝' },
  '노엘 갤러거': { bandEn: 'Oasis', bandKo: '오아시스', role: '기타·보컬', genre: '브릿팝' },

  // Linkin Park
  'chester bennington': { bandEn: 'Linkin Park', bandKo: '린킨 파크', role: '보컬', genre: '얼터너티브 록' },
  '체스터 베닝턴': { bandEn: 'Linkin Park', bandKo: '린킨 파크', role: '보컬', genre: '얼터너티브 록' },
  'mike shinoda': { bandEn: 'Linkin Park', bandKo: '린킨 파크', role: '래퍼·프로듀서', genre: '얼터너티브 록' },
  '마이크 시노다': { bandEn: 'Linkin Park', bandKo: '린킨 파크', role: '래퍼·프로듀서', genre: '얼터너티브 록' },

  // Coldplay
  'chris martin': { bandEn: 'Coldplay', bandKo: '콜드플레이', role: '프론트맨·보컬', genre: '록' },
  '크리스 마틴': { bandEn: 'Coldplay', bandKo: '콜드플레이', role: '프론트맨·보컬', genre: '록' },

  // Foo Fighters
  'taylor hawkins': { bandEn: 'Foo Fighters', bandKo: '푸 파이터스', role: '드러머', genre: '록' },
  '테일러 호킨스': { bandEn: 'Foo Fighters', bandKo: '푸 파이터스', role: '드러머', genre: '록' },

  // Metallica
  'james hetfield': { bandEn: 'Metallica', bandKo: '메탈리카', role: '프론트맨·보컬', genre: '헤비메탈' },
  '제임스 헷필드': { bandEn: 'Metallica', bandKo: '메탈리카', role: '프론트맨·보컬', genre: '헤비메탈' },
  'lars ulrich': { bandEn: 'Metallica', bandKo: '메탈리카', role: '드러머', genre: '헤비메탈' },
  '라스 울리히': { bandEn: 'Metallica', bandKo: '메탈리카', role: '드러머', genre: '헤비메탈' },

  // Radiohead
  'thom yorke': { bandEn: 'Radiohead', bandKo: '라디오헤드', role: '프론트맨·보컬', genre: '얼터너티브 록' },
  '톰 요크': { bandEn: 'Radiohead', bandKo: '라디오헤드', role: '프론트맨·보컬', genre: '얼터너티브 록' },

  // Led Zeppelin
  'robert plant': { bandEn: 'Led Zeppelin', bandKo: '레드 제플린', role: '리드 보컬', genre: '하드 록' },
  '로버트 플랜트': { bandEn: 'Led Zeppelin', bandKo: '레드 제플린', role: '리드 보컬', genre: '하드 록' },
  'jimmy page': { bandEn: 'Led Zeppelin', bandKo: '레드 제플린', role: '기타리스트', genre: '하드 록' },
  '지미 페이지': { bandEn: 'Led Zeppelin', bandKo: '레드 제플린', role: '기타리스트', genre: '하드 록' },

  // The Rolling Stones
  'mick jagger': { bandEn: 'The Rolling Stones', bandKo: '롤링 스톤스', role: '리드 보컬', genre: '록' },
  '믹 재거': { bandEn: 'The Rolling Stones', bandKo: '롤링 스톤스', role: '리드 보컬', genre: '록' },
  'keith richards': { bandEn: 'The Rolling Stones', bandKo: '롤링 스톤스', role: '기타리스트', genre: '록' },
  '키스 리차즈': { bandEn: 'The Rolling Stones', bandKo: '롤링 스톤스', role: '기타리스트', genre: '록' },

  // Guns N' Roses
  'axl rose': { bandEn: "Guns N' Roses", bandKo: '건즈 앤 로지스', role: '리드 보컬', genre: '하드 록' },
  '액슬 로즈': { bandEn: "Guns N' Roses", bandKo: '건즈 앤 로지스', role: '리드 보컬', genre: '하드 록' },
  'slash': { bandEn: "Guns N' Roses", bandKo: '건즈 앤 로지스', role: '기타리스트', genre: '하드 록' },
  '슬래시': { bandEn: "Guns N' Roses", bandKo: '건즈 앤 로지스', role: '기타리스트', genre: '하드 록' },

  // BTS (방탄소년단)
  '김남준': { bandEn: 'BTS', bandKo: '방탄소년단', role: '리더·래퍼', genre: 'K-POP' },
  '김석진': { bandEn: 'BTS', bandKo: '방탄소년단', role: '보컬', genre: 'K-POP' },
  '민윤기': { bandEn: 'BTS', bandKo: '방탄소년단', role: '래퍼·프로듀서', genre: 'K-POP' },
  '정호석': { bandEn: 'BTS', bandKo: '방탄소년단', role: '메인댄서·래퍼', genre: 'K-POP' },
  '박지민': { bandEn: 'BTS', bandKo: '방탄소년단', role: '메인댄서·리드보컬', genre: 'K-POP' },
  '김태형': { bandEn: 'BTS', bandKo: '방탄소년단', role: '서브보컬', genre: 'K-POP' },
  '전정국': { bandEn: 'BTS', bandKo: '방탄소년단', role: '메인보컬', genre: 'K-POP' },

  // BLACKPINK (블랙핑크)
  '지수': { bandEn: 'BLACKPINK', bandKo: '블랙핑크', role: '멤버·보컬', genre: 'K-POP' },
  '제니': { bandEn: 'BLACKPINK', bandKo: '블랙핑크', role: '멤버·래퍼·보컬', genre: 'K-POP' },
  '로제': { bandEn: 'BLACKPINK', bandKo: '블랙핑크', role: '멤버·메인보컬', genre: 'K-POP' },
  '리사': { bandEn: 'BLACKPINK', bandKo: '블랙핑크', role: '멤버·메인댄서·래퍼', genre: 'K-POP' },
};

export const FAMOUS_BANDS: Record<string, BandInfo> = {
  'nirvana': {
    bandKo: '너바나',
    bandEn: 'Nirvana',
    genre: '그런지 록',
    keyMembers: ['커트 코베인', 'Kurt Cobain', '크리스 노보셀릭', 'Krist Novoselic', '데이브 그롤', 'Dave Grohl']
  },
  '너바나': {
    bandKo: '너바나',
    bandEn: 'Nirvana',
    genre: '그런지 록',
    keyMembers: ['커트 코베인', 'Kurt Cobain', '크리스 노보셀릭', 'Krist Novoselic', '데이브 그롤', 'Dave Grohl']
  },
  'the beatles': {
    bandKo: '비틀즈',
    bandEn: 'The Beatles',
    genre: '록',
    keyMembers: ['존 레논', '폴 매카트니', '조지 해리슨', '링고 스타']
  },
  'beatles': {
    bandKo: '비틀즈',
    bandEn: 'The Beatles',
    genre: '록',
    keyMembers: ['존 레논', '폴 매카트니', '조지 해리슨', '링고 스타']
  },
  '비틀즈': {
    bandKo: '비틀즈',
    bandEn: 'The Beatles',
    genre: '록',
    keyMembers: ['존 레논', '폴 매카트니', '조지 해리슨', '링고 스타']
  },
  'queen': {
    bandKo: '퀸',
    bandEn: 'Queen',
    genre: '록',
    keyMembers: ['프레디 머큐리', '브라이언 메이', '로저 테일러', '존 디콘']
  },
  '퀸': {
    bandKo: '퀸',
    bandEn: 'Queen',
    genre: '록',
    keyMembers: ['프레디 머큐리', '브라이언 메이', '로저 테일러', '존 디콘']
  },
  'oasis': {
    bandKo: '오아시스',
    bandEn: 'Oasis',
    genre: '브릿팝',
    keyMembers: ['노엘 갤러거', '리암 갤러거']
  },
  '오아시스': {
    bandKo: '오아시스',
    bandEn: 'Oasis',
    genre: '브릿팝',
    keyMembers: ['노엘 갤러거', '리암 갤러거']
  },
  'linkin park': {
    bandKo: '린킨 파크',
    bandEn: 'Linkin Park',
    genre: '얼터너티브 록',
    keyMembers: ['체스터 베닝턴', '마이크 시노다']
  },
  '린킨 파크': {
    bandKo: '린킨 파크',
    bandEn: 'Linkin Park',
    genre: '얼터너티브 록',
    keyMembers: ['체스터 베닝턴', '마이크 시노다']
  },
  '린킨파크': {
    bandKo: '린킨 파크',
    bandEn: 'Linkin Park',
    genre: '얼터너티브 록',
    keyMembers: ['체스터 베닝턴', '마이크 시노다']
  },
  'coldplay': {
    bandKo: '콜드플레이',
    bandEn: 'Coldplay',
    genre: '록',
    keyMembers: ['크리스 마틴', 'Chris Martin']
  },
  '콜드플레이': {
    bandKo: '콜드플레이',
    bandEn: 'Coldplay',
    genre: '록',
    keyMembers: ['크리스 마틴', 'Chris Martin']
  },
  'foo fighters': {
    bandKo: '푸 파이터스',
    bandEn: 'Foo Fighters',
    genre: '록',
    keyMembers: ['데이브 그롤', 'Dave Grohl', '테일러 호킨스', 'Taylor Hawkins']
  },
  '푸 파이터스': {
    bandKo: '푸 파이터스',
    bandEn: 'Foo Fighters',
    genre: '록',
    keyMembers: ['데이브 그롤', 'Dave Grohl', '테일러 호킨스', 'Taylor Hawkins']
  },
  'metallica': {
    bandKo: '메탈리카',
    bandEn: 'Metallica',
    genre: '헤비메탈',
    keyMembers: ['제임스 헷필드', 'James Hetfield', '라스 울리히', 'Lars Ulrich']
  },
  '메탈리카': {
    bandKo: '메탈리카',
    bandEn: 'Metallica',
    genre: '헤비메탈',
    keyMembers: ['제임스 헷필드', 'James Hetfield', '라스 울리히', 'Lars Ulrich']
  },
  'radiohead': {
    bandKo: '라디오헤드',
    bandEn: 'Radiohead',
    genre: '얼터너티브 록',
    keyMembers: ['톰 요크', 'Thom Yorke', '조니 그린우드']
  },
  '라디오헤드': {
    bandKo: '라디오헤드',
    bandEn: 'Radiohead',
    genre: '얼터너티브 록',
    keyMembers: ['톰 요크', 'Thom Yorke', '조니 그린우드']
  },
  'led zeppelin': {
    bandKo: '레드 제플린',
    bandEn: 'Led Zeppelin',
    genre: '하드 록',
    keyMembers: ['로버트 플랜트', 'Robert Plant', '지미 페이지', 'Jimmy Page']
  },
  '레드 제플린': {
    bandKo: '레드 제플린',
    bandEn: 'Led Zeppelin',
    genre: '하드 록',
    keyMembers: ['로버트 플랜트', 'Robert Plant', '지미 페이지', 'Jimmy Page']
  },
  'rolling stones': {
    bandKo: '롤링 스톤스',
    bandEn: 'The Rolling Stones',
    genre: '록',
    keyMembers: ['믹 재거', 'Mick Jagger', '키스 리차즈', 'Keith Richards']
  },
  'the rolling stones': {
    bandKo: '롤링 스톤스',
    bandEn: 'The Rolling Stones',
    genre: '록',
    keyMembers: ['믹 재거', 'Mick Jagger', '키스 리차즈', 'Keith Richards']
  },
  '롤링 스톤스': {
    bandKo: '롤링 스톤스',
    bandEn: 'The Rolling Stones',
    genre: '록',
    keyMembers: ['믹 재거', 'Mick Jagger', '키스 리차즈', 'Keith Richards']
  },
  'guns n roses': {
    bandKo: '건즈 앤 로지스',
    bandEn: "Guns N' Roses",
    genre: '하드 록',
    keyMembers: ['액슬 로즈', 'Axl Rose', '슬래시', 'Slash']
  },
  "guns n' roses": {
    bandKo: '건즈 앤 로지스',
    bandEn: "Guns N' Roses",
    genre: '하드 록',
    keyMembers: ['액슬 로즈', 'Axl Rose', '슬래시', 'Slash']
  },
  '건즈 앤 로지스': {
    bandKo: '건즈 앤 로지스',
    bandEn: "Guns N' Roses",
    genre: '하드 록',
    keyMembers: ['액슬 로즈', 'Axl Rose', '슬래시', 'Slash']
  },
  'bts': {
    bandKo: '방탄소년단',
    bandEn: 'BTS',
    genre: 'K-POP',
    keyMembers: ['RM', '진', '슈가', '제이홉', '지민', '뷔', '정국']
  },
  '방탄소년단': {
    bandKo: '방탄소년단',
    bandEn: 'BTS',
    genre: 'K-POP',
    keyMembers: ['RM', '진', '슈가', '제이홉', '지민', '뷔', '정국']
  },
  'blackpink': {
    bandKo: '블랙핑크',
    bandEn: 'BLACKPINK',
    genre: 'K-POP',
    keyMembers: ['지수', '제니', '로제', '리사']
  },
  '블랙핑크': {
    bandKo: '블랙핑크',
    bandEn: 'BLACKPINK',
    genre: 'K-POP',
    keyMembers: ['지수', '제니', '로제', '리사']
  },
};

export const HISTORICAL_DECEASED_ICONS = new Set([
  // 음악계 레전드
  'kurt cobain', '커트 코베인', 'kurt_cobain', 'kurtcobain',
  'john lennon', '존 레논',
  'freddie mercury', '프레디 머큐리',
  'elvis presley', '엘비스 프레슬리',
  'michael jackson', '마이클 잭슨',
  'marilyn monroe', '마릴린 먼로',
  'jimi hendrix', '지미 헨드릭스',
  'david bowie', '데이비드 보위',
  'prince', '프린스',
  'whitney houston', '휘트니 휴스턴',
  'amy winehouse', '에이미 와인하우스',
  'bob marley', '밥 말리',
  'chester bennington', '체스터 베닝턴',
  'taylor hawkins', '테일러 호킨스',
  'tupac', 'tupac shakur', '투팍', '투팍 샤커',
  'the notorious b.i.g.', 'biggie', '노토리어스 비아이지', '비기',
  // 영화·문화계 레전드
  'heath ledger', '히스 레저',
  'robin williams', '로빈 윌리엄스',
  'paul walker', '폴 워커',
  'chadwick boseman', '채드윅 보스만',
  'bruce lee', '이소룡', '브루스 리',
  // 스포츠 레전드 (과거 고인 회고 기사 사망 오탐 방지)
  'kobe bryant', '코비 브라이언트',
  'diego maradona', '디에고 마라도나',
  'pele', '펠레',
  'muhammad ali', '무하마드 알리',
  'ayrton senna', '아일톤 세나',
  // 국내 문화예술계 역사적 고인
  '신해철', 'shin hae chul',
  '김광석', 'kim kwang seok',
  '유재하', 'yoo jae ha',
  '이선균', 'lee sun kyun',
  '문빈', 'moonbin',
  '설리', 'sulli',
  '구하라', 'goo hara',
]);
