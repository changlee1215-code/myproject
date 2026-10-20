import type { CategoryMatcher } from './types';

export const CATEGORIES: CategoryMatcher[] = [
  {
    id: 'accident_casualty',
    categoryKo: '재난 · 참사 · 사상 사고',
    categoryEn: '대형 참사 · 사상자 발생 (외신)',
    badgeStyle: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/70 dark:text-red-200 dark:border-red-800',
    enRegex: /\b(casualty|casualties|fatalities|fatality|deadly accident|fatal crash|plane crash|air crash|helicopter crash|train derailment|train collision|train crash|boat capsize|shipwreck|capsized|building collapse|bridge collapse|massive explosion|blast|plant explosion|gas explosion|massive fire|deadly blaze|crush|stampede|mass casualty|multiple killed|dozens killed|kills? \d+|killed \d+|\d+ killed|\d+ dead|death toll|deadly strike|deadly attack|fatal attack|air strike kills|missile strike kills|drone strike kills|mass shooting|active shooter|terror attack|bombing|suicide blast|rescue operation|search and rescue|trapped underground|mine collapse)\b/i,
    koRegex: /(사상자|사망자|부상자|\b사상\b|인명\s*피해|\d+명\s*사망|\d+명\s*숨져|사상자\s*속출|중상자|참사|대형\s*참사|참변|압사|붕괴\s*사고|건물\s*붕괴|다리\s*붕괴|추락\s*사고|여객기\s*추락|비행기\s*추락|헬기\s*추락|열차\s*탈선|열차\s*충돌|선박\s*침몰|침몰\s*사고|대형\s*화재|공장\s*화재|가스\s*폭발|폭발\s*사고|연쇄\s*추돌|사고로\s*사망|긴급\s*구조|실종자\s*수색|골든타임|참사\s*현장|유가족|총기\s*난사|총기\s*사고|테러\s*공격|폭탄\s*테러|공습으로\s*사망|피습\s*사망|지하\s*매몰|광산\s*매몰)/i,
    explanationKo: '대형 사고, 참사 또는 군사·테러 공격 등으로 다수의 사상자(인명 피해)가 발생했다는 비보가 전해지며, 현장 구조 상황과 피해 규모에 전 국민적인 안타까움과 이목이 집중되었습니다.',
    explanationEn: '대형 참사, 사고 또는 군사·테러 공습으로 다수의 사상자(인명 피해)가 발생했다는 긴급 외신이 타전되며, 글로벌 대중의 깊은 애도와 현장 구조 상황에 대한 관심이 집중되었습니다.'
  },
  {
    id: 'military_conflict',
    categoryKo: '국제 안보 · 군사 분쟁',
    categoryEn: '국제 안보 · 군사 분쟁 (외신)',
    badgeStyle: 'bg-slate-900 text-slate-100 border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-600',
    enRegex: /\b(airstrikes?|air\s*strikes?|missiles?|drone\s*strikes?|drone\s*attacks?|military\s*attacks?|terror\s*attacks?|military\s*strikes?|precision\s*strikes?|strikes?|armed\s*forces|air\s*force|fighter\s*jets?|warplanes?|bombs?|bombing|bunker\s*busters?|bunker-busters?|moab|ordnance|weapon\s*depots?|munitions|pentagon|idf|military\s*action|underground\s*bunkers?|shelling|artillery|invasion|invaded|offensive|counteroffensive|houthi|houthis|militia|security\s*alert|outbreak\s*of\s*war|act\s*of\s*war|war\s*in\s*(ukraine|gaza|middle\s*east|yemen|russia|israel)|civil\s*war|warzone)\b/i,
    koRegex: /(공습|미사일|드론\s*공격|군사\s*공격|테러\s*공격|군사\s*작전|무력충돌|교전|보안\s*경고|후티|반군|민병대|침공|포격|선전포고|공습\s*경보|격전지|영토\s*분쟁|군사\s*분쟁|전시\s*상황|전쟁터|전쟁\s*발발|전쟁\s*위기|중동\s*전쟁|세계\s*대전|러시아.*전쟁|우크라이나.*전쟁|이스라엘.*전쟁)/i,
    explanationKo: '해외 현지의 군사 공습, 무력 충돌, 미사일·드론 피습 등 일촉즉발의 안보 위기 관련 긴급 보도가 집중 타전되며 전 세계의 이목이 집중되었습니다.',
    explanationEn: '해외 현지의 군사 공습, 무력 충돌, 안보 위기 또는 군사 분쟁 관련 보도가 주요 외신을 통해 집중 타전되며 글로벌 이목이 집중되었습니다.'
  },
  {
    id: 'politics_diplomacy',
    categoryKo: '정치 · 선거 · 외교 회담',
    categoryEn: '정치 · 선거 · 정상회담 (외신)',
    badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    enRegex: /\b(president|prime minister|presidential|election|elections|voters|voting|ballot|poll|polls|polling|parliament|congress|senate|senator|white house|summit|treaty|sanctions|ceasefire|truce|diplomat|diplomacy|envoy|foreign minister|policy|bilateral|nato|united nations|state visit|legislation|bill|debate)\b/i,
    koRegex: /(대통령|총리|대선|총선|선거|여론조사|의회|국회|하원|상원|백악관|국방부|정상회담|회담|조약|제재|휴전|외교관|외교부|대사관|외무|안보\s*협정|정책\s*발표|나토|유엔|국제정세|정치\s*토론|국민\s*투표|대선\s*투표|총선\s*투표|출구조사)/i,
    explanationKo: '주요 국가 정상회담, 선거, 여론조사 또는 외교 협상·국가 정책 발표 관련 소식이 언론을 통해 집중 조명되었습니다.',
    explanationEn: '해외 주요 선거, 정상회담, 외교 협상 또는 국가 정책 발표 소식이 주요 외신을 통해 집중 타전되며 글로벌 이목을 끌었습니다.'
  },
  {
    id: 'incident_society',
    categoryKo: '사건 · 범죄 · 사회',
    categoryEn: '사건 · 범죄 · 수사 (외신)',
    badgeStyle: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    enRegex: /\b(stolen|theft|robbery|burglar|burglary|missing|disappeared|vanished|remains|urn|kidnap|kidnapping|abduction|assault|murder|homicide|manslaughter|dead body|corpse|police search|suspect|arrested|hit-and-run|drunk driving|drug bust|scam|fraud|embezzlement|smuggling|extortion|shooters?|mass\s*shooters?|shootings?|mass\s*shootings?|gunmans?|gunmen|active\s*shooters?|death\s*row|death\s*penalty|executions?|executed|sentenced\s*to\s*death|massacre|capital\s*punishment)\b/i,
    koRegex: /(유골함|유골|도난|도둑|절도|실종|행방\s*묘연|사라져|살해|피살|사기|폭행|강도|괴한|의문사|변사|사체|시신|유기|방화|피해자|용의자|피의자|체포|경찰\s*수사|CCTV|추적|제보|밀수|마약|음주운전|뺑소니|흉기|난동|횡령|배임|갈취)/i,
    explanationKo: '도난, 실종, 범죄 수사 또는 사회적 사건 소식이 보도되며 대중의 관심과 진상 규명에 대한 이목이 집중되었습니다.',
    explanationEn: '도난, 실종, 강력 범죄 또는 사회적 사건·수사 소식이 주요 외신을 통해 타전되며 글로벌 대중의 큰 충격과 이목이 집중되었습니다.'
  },
  {
    id: 'sports_award_mvp',
    categoryKo: '스포츠 · MVP · 개인 수상',
    categoryEn: '스포츠 · MVP · 개인 수상 (외신)',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800',
    enRegex: /\b(mvp|nlcs\s+mvp|alcs\s+mvp|world\s+series\s+mvp|finals\s+mvp|super\s+bowl\s+mvp|all-?star\s+(?:game\s+)?mvp|most\s+valuable\s+player|ballon\s*d['’]?or|cy\s+young|rookie\s+of\s+the\s+year|player\s+of\s+the\s+year|manager\s+of\s+the\s+year|coach\s+of\s+the\s+year|golden\s+glove|gold\s+glove|golden\s+boot|golden\s+boy|kopa\s+trophy|yashin\s+trophy|heisman\s+trophy|pfa\s+player\s+of\s+the\s+year|fwa\s+footballer\s+of\s+the\s+year|the\s+best\s+fifa|takes?\s+home\s+mvp|named\s+mvp|wins?\s+mvp|won\s+mvp|awarded\s+mvp|mvp\s+honors?|series\s+mvp|scoring\s+champion|batting\s+champion|silver\s+slugger|hank\s+aaron\s+award)\b/i,
    koRegex: /(MVP|최우수선수|시리즈\s*MVP|NLCS\s*MVP|ALCS\s*MVP|월드시리즈\s*MVP|파이널\s*MVP|슈퍼볼\s*MVP|골든글러브|골든부트|득점왕|신인왕|올해의\s*선수|올해의\s*감독|발롱도르|사이영상|MVP\s*수상|MVP로\s*선정|MVP를\s*차지|MVP\s*영예|수훈선수상|실버스퀘어|골든보이)/i,
    explanationKo: '챔피언십 시리즈 MVP(최우수선수) 선정, 주요 대회 개인 타이틀 수상 또는 공식 시상식 영예를 안으며 스포츠 팬들과 언론의 뜨거운 찬사가 쏟아졌습니다.',
    explanationEn: '챔피언십 시리즈 MVP(최우수선수) 수상 또는 시즌 주요 개인 타이틀·공식 시상식 선정 소식이 전해지며 전 세계 스포츠 팬들의 찬사와 주목을 받았습니다.'
  },
  {
    id: 'sports_victory',
    categoryKo: '스포츠 · 승전보 · 활약',
    categoryEn: '스포츠 · 승리 · 대활약 (외신)',
    badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800',
    enRegex: /\b(victor(?:y|ies|ious)|wins?|won|winner|winners|winning|triumph|crowned\s+champions?|league\s+champions?|title\s+winners?|troph(?:y|ies)|lift(?:s|ed|ing)?\s+trophy|hoist(?:s|ed|ing)?\s+trophy|advanc(?:es?|ed|ing)|clinch(?:es?|ed|ing)?|qualif(?:y|ies|ied|ying)|finalist|world\s+series(?:\s+bound|\s+champions?)?|super\s+bowl(?:\s+bound|\s+champions?)?|champions\s+league\s+winners?|pennant\s+winners?|pennant|hat-?tricks?|brace|home\s*runs?|homers?|homered|multi-homer|grand\s+slams?|walk-?offs?|scored?|goals?\s+scored|assists?|clean\s+sheets?|shutouts?|no-?hitters?|perfect\s+games?|golden\s+boot|dominat(?:e|es|ed|ing)|sweeps?|swept|series\s+sweep|blowouts?|rout|demolish(?:ed)?|hammer(?:ed)?|crush(?:ed)?|overpower(?:ed|s)?|breeze\s+past|cruise\s+past|stuns?|stunned|upsets?|triple-?doubles?|double-?doubles?|buzzer-?beaters?|game-?winners?|record-?(?:breaking|setting)|historic\s+(?:win|season|performance|record|blowout)|50-50|50\/50|40-40|greatest\s+single-game|pennant\s+clinch|comeback\s+win|thrilling\s+win|walk-off\s+win)\b/i,
    koRegex: /(승리|완승|대승|역전승|신승|스윕|싹쓸이|격침|제압|물리치고|꺾고|월드시리즈\s*진출|한국시리즈\s*진출|챔피언십.*진출|결승\s*진출|본선\s*진출|4강\s*진출|8강\s*진출|16강\s*진출|대회\s*우승|리그\s*우승|우승\s*트로피|연승|파죽지세|\d+전\s*전승|골인|결승골|선제골|쐐기골|동점골|만회골|멀티골|해트트릭|\d+골|\d+호골|득점|어시스트|\d+도움|홈런|스리런|투런|솔로포|\d+호\s*홈런|만루\s*홈런|끝내기|클린시트|무실점|완봉승|세이브|승리\s*투수|수훈선수|대활약|맹활약|원맨쇼|하드캐리|기록\s*달성|대기록|환호|짜릿한\s*승리|대역전극)/i,
    explanationKo: '주요 경기 승리(완승·역전승·시리즈 스윕) 및 결승/월드시리즈 진출 확정, 또는 결정적인 득점·홈런 등 압도적인 승전보가 보도되며 팬들의 뜨거운 환호와 찬사가 쏟아졌습니다.',
    explanationEn: '글로벌 주요 경기 승리(시리즈 스윕·챔피언십 진출 확정), 결정적인 득점 및 선수의 압도적 대활약(골, 홈런, 대회 우승 등) 소식이 보도되며 전 세계 팬들의 열띤 찬사가 이어졌습니다.'
  },
  {
    id: 'sports_defeat_crisis',
    categoryKo: '스포츠 · 패배 · 부상 악재',
    categoryEn: '스포츠 · 패배 · 부상 결장 (외신)',
    badgeStyle: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800',
    enRegex: /\b(defeat|defeated|defeats|defeating|loss|losses|loses?|lost|losing|falls?\s+to|fell\s+to|falls?\s+short|crash(?:ed)?\s+out|eliminat(?:ed|ion|es|ing)|knocked\s+out|bows?\s+out|bowed\s+out|miss(?:es)?\s+playoffs?|misses?\s+out\s+on|snubbed?|boycotts?|boycotted|runner-up|finishing\s+second|relegat(?:ed|ion)|drop\s+into\s+relegation|shock\s+defeat|upset\s+loss|rout(?:ed)?|conceded|own\s+goal|red\s+cards?|sent\s+off|suspend(?:ed|sion)|banned?|doping\s+ban|injur(?:y|ies|ed)|hamstring|torn\s+acl|torn\s+achilles|achilles\s+rupture|torn\s+meniscus|concussion|fracture|broken\s+(?:leg|ankle|arm|foot)|dislocated|groin\s+injury|calf\s+strain|sprained?|season-ending|surgery|carted\s+off|stretchered\s+off|misses?\s+match|ruled\s+out|sacked|dismissed|fired|resigned|managerial\s+crisis|benched|blows?\s+lead|blew\s+lead|squanders?\s+lead|slumps?|losing\s+streak)\b/i,
    koRegex: /(패배|완패|대패|충격패|역전패|고배|참패|실점|자책골|수비\s*불안|탈락|조기\s*탈락|예선\s*탈락|강등|퇴장|다이렉트\s*퇴장|경고\s*누적|출전\s*정지|징계|부상|부상\s*결장|시즌\s*아웃|십자인대|햄스트링|골절|수술대|들것|결장\s*위기|이탈|명단\s*제외|벤치\s*대기|방출|계약\s*해지|경질|사퇴|지휘봉\s*내려놔|연패|위기|부진|졸전|혹평|아쉬운\s*패배)/i,
    explanationKo: '뼈아픈 경기 패배(충격패·역전패, 대회 탈락) 또는 주축 선수의 부상 결장(시즌 아웃, 수술), 팀 내 악재(퇴장·경질 등)가 보도되며 팬들의 깊은 탄식과 우려가 집중되었습니다.',
    explanationEn: '글로벌 경기 충격패(대회 탈락) 또는 핵심 선수의 심각한 부상(결장/수술), 감독 경질 등 악재 소식이 주요 외신을 통해 타전되며 팬들의 아쉬움과 우려가 모였습니다.'
  },
  {
    id: 'sports_transfer_general',
    categoryKo: '스포츠 · 이적 · 계약 · 은퇴',
    categoryEn: '스포츠 · 이적 · 계약 · 은퇴 (외신)',
    badgeStyle: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/70 dark:text-sky-200 dark:border-sky-800',
    enRegex: /\b(transfers?|transfer\s+market|transfer\s+fee|transfer\s+window|transfer\s+saga|here\s+we\s+go|contracts?|contract\s+extension|contract\s+talks?|contract\s+dispute|signings?|signed|signs?\s+with|agrees?\s+terms|agreed\s+terms|verbal\s+agreement|free\s+agent|free\s+agency|drafts?|drafted|trades?|traded|swap\s+deal|buyout|release\s+clause|mega-?deal|max\s+contract|roster\s+moves?|loan\s+(?:deal|move)|permanent\s+deal|opt\s+out|exercises?\s+option|declines?\s+option|waived|designated\s+for\s+assignment|\bdfa\b|called\s+up|demoted|re-signs?|commits?\s+to|unveiled\s+as|retires?|retirement|announces?\s+retirement|hangs?\s+up\s+(?:boots|racket|cleats)|steps?\s+away\s+from\s+(?:football|baseball|basketball|tennis|sports)|starting\s+xi|starting\s+lineup|match\s+preview|pre-match)\b/i,
    koRegex: /(이적|이적\s*시장|이적료|선수\s*영입|입단|계약\s*체결|재계약|연장\s*계약|FA\s*계약|FA\s*시장|드래프트|트레이드|바이아웃|선발\s*라인업|선발\s*명단|선발\s*출전|선발\s*등판|선발\s*투수|선수단\s*합류|로스터\s*이동|빅매치\s*앞두고|맞대결\s*앞두고|경기\s*프리뷰|은퇴|현역\s*은퇴|공식\s*은퇴|고별전)/i,
    explanationKo: '주요 선수의 대형 이적 및 계약 체결, 트레이드 소식 또는 은퇴 발표·빅매치 선발 라인업 소식이 언론에 보도되며 스포츠 팬들의 기대감을 모았습니다.',
    explanationEn: '글로벌 스포츠 스타의 대형 이적, 재계약 체결, 은퇴 발표 또는 빅매치 프리뷰·선발 라인업 소식이 전해지며 전 세계 팬들의 관심이 집중되었습니다.'
  },
  {
    id: 'wedding_marriage',
    categoryKo: '결혼식 · 백년가약 · 웨딩',
    categoryEn: '결혼식 · 백년가약 · 웨딩 (외신)',
    badgeStyle: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800',
    enRegex: /\b(wedding|weddings|married|marry|ties the knot|tied the knot|nuptials|walks down the aisle|walked down the aisle|got married|exchange vows|exchanged vows|engagement|engaged|fiance|fiancee)\b/i,
    koRegex: /(결혼|결혼식|웨딩|웨딩마치|백년가약|화촉|품절남|품절녀|예비\s*신랑|예비\s*신부|결혼\s*발표|결혼\s*소식|신혼\s*부부|새신랑|새신부|결혼에\s*골인|부부의\s*연)/i,
    explanationKo: '오랜 연인과의 백년가약(결혼식 거행) 또는 기쁜 결혼 발표 소식이 언론을 통해 전해지며 팬들과 대중의 따뜻한 축하와 축복이 쏟아졌습니다.',
    explanationEn: '글로벌 스타의 성대한 결혼식 거행 또는 공식적인 결혼 발표 소식이 주요 외신을 통해 집중 타전되며 전 세계 팬들의 진심 어린 축하가 이어졌습니다.'
  },
  {
    id: 'spouse_cheer_couple',
    categoryKo: '배우자 응원 · 경기 직관',
    categoryEn: '배우자 응원 · 직관 화제 (외신)',
    badgeStyle: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    enRegex: /\b(cheer(?:s|ing|ed)?\s+on\s+(?:boyfriend|girlfriend|partner|fiance|fiancee|husband|wife)|cheer(?:s|ing|ed)?\s+for\s+(?:boyfriend|girlfriend|partner|fiance|fiancee|husband|wife)|cheer(?:s|ing|ed)?\s+on|supportive\s+(?:spouse|partner|wife|husband|girlfriend|boyfriend)|power\s+couple|couple\s+goals|stadium\s+suite|vip\s+suite|luxury\s+box|courtside|cheers?\s+from\s+stands?|watches?\s+from\s+suite)\b/i,
    koRegex: /(특급\s*응원|동반\s*직관|경기\s*직관|직관\s*응원|직관|남편을\s*응원|아내를\s*응원|경기장\s*응원|부부\s*케미|잉꼬\s*부부|직관하는|경기장\s*찾아)/i,
    explanationKo: '배우자(남편/아내)의 중요한 경기 또는 공식 일정 현장에 직접 참석해 펼친 특급 응원과 다정한 부부 케미가 언론과 팬들의 큰 화제를 모았습니다.',
    explanationEn: '배우자의 빅매치 현장을 직접 찾아 열띤 특급 응원을 보내거나 공식 석상에서 선보인 다정한 부부 케미가 주요 외신들의 뜨거운 스포트라이트를 받았습니다.'
  },
  {
    id: 'dating_romance',
    categoryKo: '열애설 · 핑크빛 연애',
    categoryEn: '열애설 · 핑크빛 연애 (외신)',
    badgeStyle: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:border-fuchsia-800',
    enRegex: /\b(dating|in a relationship|romance|dating rumors?|spotted together|holding hands|romantic getaway|new couple|love interest)\b/i,
    koRegex: /(열애|열애설|핑크빛|열애\s*인정|연애\s*중|남친|여친|연인\s*발전|데이트\s*포착|열애\s*중|교제\s*중|핑크빛\s*기류)/i,
    explanationKo: '스타의 핑크빛 열애설 또는 공식적인 연인 관계 인정 소식이 보도되며 대중의 뜨거운 관심과 환호를 이끌어냈습니다.',
    explanationEn: '글로벌 스타의 핑크빛 열애설 보도 또는 공식적인 연인 관계 소식이 전해지며 전 세계 팬들의 뜨거운 이목과 관심이 쏠렸습니다.'
  },
  {
    id: 'baby_pregnancy',
    categoryKo: '임신 · 출산 · 득남득녀 경사',
    categoryEn: '임신 · 출산 · 득남득녀 경사 (외신)',
    badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    enRegex: /\b(welcomes baby|welcomed baby|gives birth|gave birth|expecting baby|pregnant|pregnancy|baby bump|newborn|first child|second child|baby news)\b/i,
    koRegex: /(임신|출산|득남|득녀|순산|예비\s*아빠|예비\s*엄마|둘째\s*임신|첫째\s*출산|부모가\s*됐다|만삭)/i,
    explanationKo: '새 생명의 탄생을 알리는 득남·득녀(출산) 또는 임신 발표 등 가정의 큰 경사 소식이 팬들과 대중의 따뜻한 축복을 받았습니다.',
    explanationEn: '글로벌 스타의 임신 발표 또는 새 생명의 탄생을 알리는 건강한 출산 소식이 주요 외신을 통해 전해지며 전 세계적인 축하 물결이 일었습니다.'
  },
  {
    id: 'breakup_divorce',
    categoryKo: '결별 · 이혼 · 파경',
    categoryEn: '결별 · 이혼 · 파경 (외신)',
    badgeStyle: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    enRegex: /\b(divorce|divorced|divorcing|split|splits|breakup|broke up|part ways|separated|separation|called off engagement|broken engagement|ended relationship)\b/i,
    koRegex: /(결별|결별설|이혼|이혼\s*소송|이혼\s*조정|파경|각방|별거|파혼|남남으로|연인\s*관계\s*정리|연인에서\s*동료로|결별\s*인정)/i,
    explanationKo: '공개 연인의 안타까운 결별 또는 결혼 생활의 파경(이혼) 소식이 언론을 통해 전해지며 대중의 아쉬움과 이목이 쏠렸습니다.',
    explanationEn: '글로벌 스타 커플의 결별 또는 이혼(파경) 소식이 주요 외신을 통해 집중 타전되며 전 세계 팬들의 안타까움과 이목이 쏠렸습니다.'
  },
  {
    id: 'tech_science',
    categoryKo: '테크 · AI · 신기술',
    categoryEn: '테크 · IT · 과학 (외신)',
    badgeStyle: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    enRegex: /\b(artificial intelligence|\bai\b|chatgpt|openai|gemini|claude|deepmind|nvidia|apple|google|microsoft|meta|spacex|nasa|launch|rocket|spacecraft|astronauts?|space|satellite|orbit|algorithm|semiconductor|microchip|silicon|chips?|quantum|autonomous|robotics?|biotech|cybersecurity|software update|os update|tech|gadget|iphone|pixel|galaxy)\b/i,
    koRegex: /(인공지능|오픈ai|챗gpt|엔비디아|애플|구글|마이크로소프트|스페이스x|나사|우주선|로켓|위성|반도체|칩|알고리즘|양자컴퓨팅|로봇|자율주행|소프트웨어|사이버보안|생성형\s*ai|테크|아이폰|갤럭시)/i,
    explanationKo: '새로운 기술 혁신, 인공지능(AI), 우주 과학 또는 테크 기업의 핵심 업데이트 소식이 대중의 기대를 모았습니다.',
    explanationEn: '최신 인공지능(AI) 혁신, 우주 과학 탐사 또는 글로벌 빅테크 기업의 새로운 기술 발표가 전 세계 네티즌들의 주목을 받았습니다.'
  },
  {
    id: 'concert_tour',
    categoryKo: '공연 · 페스티벌 · 행사 무대',
    categoryEn: '공연 · 페스티벌 · 행사 (외신)',
    badgeStyle: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800',
    enRegex: /\b(tour|tours|world tour|concert|concerts|stadium tour|arena tour|live show|live performance|stage performance|coachella|glastonbury|lollapalooza|music festival|setlist|sold out show|residency|waterbomb|fancam|sing-along|college fest|campus fest)\b/i,
    koRegex: /(월드투어|투어|콘서트|공연|라이브\s*공연|스타디움|아레나|페스티벌|코첼라|글래스톤베리|전석\s*매진|매진|단독\s*콘서트|대학\s*축제|대학축제|캠퍼스\s*축제|대동제|축제\s*무대|축제\s*라인업|축제\s*섭외|축제\s*여신|축제\s*남신|축제\s*직캠|축제\s*떼창|떼창|직캠\s*화제|워터밤|흠뻑쇼|행사\s*무대|행사\s*직캠|팬미팅)/i,
    explanationKo: '단독 콘서트, 월드투어 또는 대학 축제·페스티벌 행사 무대에서의 라이브 직캠과 떼창 소식이 전해지며 팬들의 열띤 호응을 이끌어냈습니다.',
    explanationEn: '글로벌 월드투어, 대형 스타디움 콘서트 또는 페스티벌 무대 소식이 전해지며 전 세계 팬들의 열띤 반응을 모았습니다.'
  },
  {
    id: 'tv_competition_tribute',
    categoryKo: '방송 경연 · 헌정 · 명장면 재현',
    categoryEn: '방송 경연 · 헌정 무대 화제 (외신)',
    badgeStyle: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-950/70 dark:text-fuchsia-200 dark:border-fuchsia-800',
    enRegex: /\b(dedication night|recreates? iconic|recreating iconic|recreated iconic|recreates? .+ moves|recreates? .+ moment|iconic .+ moves|iconic .+ routine|tribute dance|tribute performance|tribute routine|dedication dance|dedication performance|(dancing with the stars|\bdwts\b|american idol|the voice|masked singer|talent show)[\s\S]{0,60}\b(tribute|dedication|honor|honors|honoring|recreates?|reunion|save the last dance|10 things i hate about you)|(tribute|dedication|honor|honors|honoring|recreates?)[\s\S]{0,60}\b(dancing with the stars|\bdwts\b))\b/i,
    koRegex: /(헌정\s*무대|헌정\s*공연|헌정\s*퍼포먼스|헌정\s*댄스|명장면\s*재현|안무\s*재현|오마주\s*무대|경연.*추모|경연.*헌정|불후의\s*명곡.*헌정|댄싱\s*위드\s*더\s*스타.*(헌정|추모|재현)|데디케이션\s*나이트)/i,
    explanationKo: '인기 경연·오디션 프로그램에서 과거 대표작의 명장면(상징적 퍼포먼스)을 재현하거나, 고인이 된 동료·전설적인 인물을 기리는 특별 헌정 무대(Dedication)를 선보이며 시청자들의 뜨거운 감동과 향수를 불러일으켰습니다.',
    explanationEn: '인기 TV 경연·오디션 프로그램에서 과거 대표작의 상징적인 명장면을 재현하거나, 고인이 된 동료 배우·아티스트를 기리는 특별 헌정 무대(Dedication)를 선보이며 글로벌 시청자들의 향수와 뜨거운 호응을 이끌어냈습니다.'
  },
  {
    id: 'broadcast',
    categoryKo: '방송 · 예능 · 경연 화제',
    categoryEn: 'TV 방송 · 경연 화제 (외신)',
    badgeStyle: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    enRegex: /\b(dancing with the stars|\bdwts\b|bachelor|bachelorette|survivor|american idol|the voice|masked singer|rupaul|love island|big brother|talk show|late night|snl|saturday night live|jimmy fallon|jimmy kimmel|james corden|stephen colbert|graham norton|good morning america|\bgma\b|variety show|reality show|reality tv|sitcom|guest star|guest host|cameo|leaderboard|pro partner|celeb cast)\b/i,
    koRegex: /(댄싱\s*위드\s*더\s*스타|불후의\s*명곡|불후|복면가왕|유퀴즈|유\s*퀴즈|런닝맨|나\s*혼자\s*산다|아는\s*형님|라디오스타|전참시|미우새|놀면\s*뭐하니|골때녀|싱어게인|미스터트롯|미스트롯|현역가왕|쇼\s*음악중심|뮤직뱅크|인기가요|엠카|스케치북|심야괴담회|꼬꼬무|뭉찬|벌거벗은|예능|경연\s*프로그램|서바이벌\s*예능|게스트|출연진|고정\s*멤버|가창력|열창|레전드\s*무대|스페셜\s*무대|무대\s*장악|연애전쟁|일상\s*공개|방송\s*출연|입담|촌철살인|미스\s*월드|미스\s*코리아|솔직\s*고백|심경\s*고백)/i,
    explanationKo: '인기 TV 방송 및 경연·예능 프로그램에 출연하여 선보인 무대나 화제성 넘치는 활약상이 방영 직후 대중의 큰 관심을 모았습니다.',
    explanationEn: '인기 TV 방송 및 오디션·경연 프로그램, 토크쇼 또는 리얼리티 예능에서의 화제의 장면과 활약상이 전해지며 시청자들의 큰 주목을 받았습니다.'
  },
  {
    id: 'series_season',
    categoryKo: '드라마 · 시리즈 새 시즌 화제',
    categoryEn: '드라마 · TV 시리즈 새 시즌 (외신)',
    badgeStyle: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    enRegex: /\b(season\s*\d+|s\d+|new\s*season|upcoming\s*season|next\s*season|series\s*premiere|season\s*premiere|season\s*finale|renewed\s+for\s+(?:a\s+)?(?:new\s+)?season|wildcard|evicted|eviction|contestants?|cast\s*(?:members?|revealed|joining)?|joins?\s+(?:cast|show)|enters?\s+(?:show|house)|how\s*to\s*watch|where\s*to\s*watch|air\s*date|airing\s*date|premiere\s*date|streaming\s+date)\b/i,
    koRegex: /(시즌\s*\d+|새\s*시즌|신규\s*시즌|다음\s*시즌|시즌제|와일드카드|참가자|출연진|방영일|첫\s*방송|본방사수|탈락|합류|시청\s*방법|프리미어|라인업|공개일)/i,
    explanationKo: '해당 드라마·시리즈의 새 시즌 관련 소식(출연진 정보, 방영 일정 등)이 전해졌습니다. 자세한 내막보다는 새 시즌과 관련된 일부 소식이 전달되어 화제가 된 것으로 보입니다.',
    explanationEn: '해당 드라마·TV 시리즈의 새 시즌과 관련하여 세부적인 전개보다는 새 출연진 합류, 방영 일정, 시청 방법 등 일부 소식이 전달되어 화제가 된 것으로 보입니다.'
  },
  {
    id: 'award_win',
    categoryKo: '우승 · 수상',
    categoryEn: '시상식 · 공식 수상 (외신)',
    badgeStyle: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    enRegex: /\b(grammy|grammys|oscar|oscars|emmy|emmys|tony|tonys|billboard music award|nobel|pulitzer|golden globe|cannes|bafta|brit awards|hall of fame|academy awards?|lifetime achievement|nomination|nominations|nominee|nominees|nominated|nods|nod|grand prize|gold medal|silver medal|bronze medal|wins award|win award|won award|video vanguard award|vanguard award|vmas?|mtv video music awards?|mtv award|american music awards?|\bama\b|\bamas\b|rock and roll hall of fame|rock & roll hall of fame|accepts?\s+(?:award|trophy|honor|vanguard)|receives?\s+(?:award|trophy|honor|vanguard)|honored\s+with|presented\s+with)\b/i,
    koRegex: /(시상식|그래미|오스카|아카데미상|에미상|골든글로브|빌보드\s*뮤직\s*어워드|노벨상|퓰리처상|백상|청룡|대종상|수상\s*소감|수상자|후보\s*지명|노미네이트|노미네이션|명예의\s*전당|금메달|은메달|동메달|연예대상|연기대상|가요대상|대상을\s*수상|대상\s*영예|최우수상|본상을\s*수상|본상\s*수상|비디오\s*뱅가드|뱅가드상|VMA|MTV\s*어워드|공로상|평생\s*공로상|명예의\s*전당\s*헌액)/i,
    explanationKo: '공식 시상식 수상 또는 주요 대회 우승 소식이 보도되며 대중의 관심이 집중되었습니다.',
    explanationEn: '주요 권위 있는 시상식(오스카, 그래미, 에미상, MTV VMA 비디오 뱅가드상 등) 수상 또는 영예로운 후보 지명 소식이 전해지며 글로벌 대중의 찬사를 받았습니다.'
  },
  {
    id: 'tribute_mourning',
    categoryKo: '비보 추모 · 동료 애도',
    categoryEn: '비보 추모 · 동료 애도 (외신)',
    badgeStyle: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800',
    enRegex: /\b(pays? tribute|paying tribute|paid tribute|tributes? to|tributes? from|mourns?|mourning|mourned|remembers?|remembering|remembered|honors?|honoring|honored|breaks? silence|heartbroken|speaks? out on|reacts? to (the )?(death|passing)|emotional tribute|touching tribute|co-stars?|costars?|castmates?|loss of co-star|condolences?|grieves?|grieving|remembrances?|praises? .+ in tribute|final days before death|before (he|she) died|before death|before suicide|comforts? .+ before (his|her) death|made final appearance with|shares? (final )?memories|opens? up about .+ death|recalls? .+ final|co-star (says|recalls|details|speaks|shares|cries|struggling))\b/i,
    koRegex: /(추모글|추모\s*메시지|애도\s*뜻|애도를\s*표|비보에\s*눈물|비보에\s*먹먹|비보\s*접하고|눈물의\s*추모|故\s*[가-힣]+.*추모|故\s*[가-힣]+.*애도|선배님\s*편히|동료\s*배우.*별세|동료.*비보|비보에\s*비통|비보에\s*충격|애도\s*물결\s*동참|마지막\s*인사|명복을\s*빕니다|가슴이\s*미어져|눈물의\s*조문|조문|빈소\s*찾아|마지막\s*모습|마지막\s*날들|사망\s*전\s*만남|마지막\s*만남|생전\s*인연)/i,
    explanationKo: '동료 배우 또는 지인의 안타까운 비보(사망 소식)가 전해지며, 함께 작품을 했던 인연과 마지막 만남·애도의 뜻(추모 인터뷰)을 전한 소식이 주요 외신을 통해 집중 조명되었습니다. (⚠️ 본인 비보가 아닌 동료 추모 이슈 - 현재 인물은 생존)',
    explanationEn: '동료 배우/지인의 안타까운 비보(사망 소식)가 전해지며, 함께 작품을 했던 인연과 마지막 만남·진심 어린 애도 소식이 주요 외신을 통해 집중 타전되었습니다. (⚠️ 본인 비보가 아닌 동료 추모 이슈 - 현재 인물은 생존)'
  },
  {
    id: 'death',
    categoryKo: '본인 부고 · 별세',
    categoryEn: '본인 부고 · 별세 (외신)',
    badgeStyle: 'bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700',
    enRegex: /\b(dies\s+at\s+\d+|dead\s+at\s+\d+|dies\s+aged\s+\d+|passes?\s+away\s+at\s+\d+|passed\s+away\s+at\s+\d+|dies?\s+peacefully|found\s+dead|pronounced\s+dead|confirmed\s+dead|dead\s+at\s+the\s+age\s+of|has\s+died|passes?\s+away|passed\s+away|cause\s+of\s+death|death\s+by\s+suicide|notable\s+obituaries|obituary|obituaries|star['’]?s\s+death|actor['’]?s\s+death|actress['’]?s\s+death|leading\s+up\s+to\s+(?:his|her)\s+death|days\s+before\s+(?:his|her)\s+death|before\s+(?:his|her)\s+death|after\s+.*?\bdeath|tragic\s+death|death\s+confirmed|dies\s+from|dies\s+of|dies\s+following|dies\s+after)\b/i,
    koRegex: /(별세|타계|공식\s*부고|영결식|발인|향년\s*\d+세로\s*별세|\d+세로\s*사망|자택서\s*사망|투병\s*끝\s*사망|숨진\s*채\s*발견)/i,
    explanationKo: '최근 본인의 안타까운 비보(별세 및 공식 부고 소식)가 언론을 통해 전해지며 전 국민적인 애도와 추모 물결이 이어졌습니다.',
    explanationEn: '최근 본인의 안타까운 비보(별세 및 공식 부고 소식)가 주요 외신을 통해 공식 타전되며 글로벌 대중의 깊은 슬픔과 추모 물결이 이어졌습니다.'
  },
  {
    id: 'family_bereavement',
    categoryKo: '가족상 · 부친상 · 모친상',
    categoryEn: '가족상 · 부친상 · 모친상 (외신)',
    badgeStyle: 'bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700',
    koRegex: /(부친상|모친상|조부상|조모상|외조부상|외조모상|장인상|장모상|시부상|시모상|빙부상|빙모상|상주\s*이름|슬픔\s*속\s*빈소|가족상)/i,
    enRegex: /\b(father\s+pass(?:ed|es)\s+away|mother\s+pass(?:ed|es)\s+away|family\s+bereavement|mourns?\s+loss\s+of\s+(?:father|mother|parent|grandparent))\b/i,
    minMatchesRequired: 1,
    explanationKo: '부친상, 모친상 등 가족의 안타까운 비보(가족상) 소식이 전해지며 팬들과 동료들의 깊은 애도와 따뜻한 위로의 물결이 이어졌습니다.',
    explanationEn: '가족의 안타까운 비보(가족상) 소식이 주요 외신을 통해 전해지며 글로벌 대중과 동료들의 따뜻한 위로와 애도가 이어졌습니다.'
  },
  {
    id: 'rumor_debunking',
    categoryKo: '루머 해명 · 사실무근 · 법적대응',
    categoryEn: '루머 해명 · 사실무근 · 법적대응 (외신)',
    badgeStyle: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-800',
    koRegex: /(사망설\s*(일축|해명|사실무근)|가짜\s*뉴스\s*법적|사실무근\s*공식입장|루머\s*강경\s*대응|열애설\s*(부인|해프닝|일축)|불화설\s*일축|결별설\s*일축|이혼설\s*일축|은퇴설\s*일축|황당\s*루머|피소설\s*부인)/i,
    enRegex: /\b(death\s+hoax|debunks?\s+rumors?|denies?\s+rumors?|false\s+rumors?|dismisses?\s+rumors?|baseless\s+rumors?|slams?\s+rumors?)\b/i,
    minMatchesRequired: 1,
    explanationKo: '최근 온라인 등을 통해 불거진 악성 루머나 가짜뉴스에 대해 소속사 측이 사실무근임을 밝히고 법적 대응 및 적극적인 해명에 나섰습니다.',
    explanationEn: '최근 불거진 허위 루머나 가짜뉴스에 대해 공식적으로 사실무근임을 밝히며 강력한 법적 대응 및 적극적인 해명에 나섰습니다.'
  },
  {
    id: 'boxoffice_hit',
    categoryKo: '흥행 돌풍 · 신기록 달성',
    categoryEn: '흥행 돌풍 · 1위 달성 (외신)',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800',
    enRegex: /\b(box office hit|box office record|tops box office|number one at box office|box office smash|blockbuster|charts? record|all-time record|viewership record|ratings hit|highest-grossing|crosses \$|crosses 100m|surpasses|smash hit)\b/i,
    koRegex: /(박스오피스\s*1위|박스오피스\s*정상|흥행\s*돌풍|흥행\s*1위|천만\s*관객|관객\s*돌파|신기록|역대\s*최고\s*흥행|시청률\s*1위|시청률\s*폭발|음원\s*차트\s*올킬|차트\s*1위|퍼펙트\s*올킬|글로벌\s*1위|넷플릭스\s*1위|빌보드\s*1위|흥행\s*가도|흥행\s*질주)/i,
    explanationKo: '영화 박스오피스 1위, 천만 관객 돌파, 음원 차트 올킬 또는 시청률 신기록 등 압도적인 흥행 질주 소식이 팬들과 대중의 폭발적인 관심을 모았습니다.',
    explanationEn: '글로벌 박스오피스 1위 등극, 음원 차트 정상 석권 또는 역대 흥행 신기록 달성 소식이 전 세계적인 찬사와 이목을 집중시켰습니다.'
  },
  {
    id: 'release_comeback',
    categoryKo: '출시 · 신작 개봉 · 신작 방영',
    categoryEn: '신작 개봉 · 신작 방영 · 신곡 (외신)',
    badgeStyle: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    enRegex: /\b(album|debut\s*album|new\s*single|lead\s*single|debut\s*single|hit\s*single|digital\s*single|drops?\s+single|releases?\s+single|soundtrack|tracklist|title\s*track|\bep\b|music\s*video|\bmv\b|teaser|trailer|premiere|premieres|premiered|sequel|spinoff|franchise|comeback|first\s*look|sneak\s*peek|screening|press\s*conference|new\s*series|new\s*drama|leading\s*role|co-starring|tv\s*series|miniseries|adaptation|remake|reboot|rebooted)\b/i,
    koRegex: /(신곡|음반|앨범|타이틀곡|뮤직비디오|뮤비|신작|신작\s*드라마|새\s*드라마|영화\s*개봉|첫\s*방송|첫방|본방사수|공식\s*티저|트레일러|선공개\s*곡|컴백|쇼케이스|데뷔곡|사운드트랙|시사회|신제품\s*출시|제작발표회|제작보고회|제발회|방영\s*앞두고|방송\s*앞두고|방영\s*예정|로코|남녀주인공|주연\s*발탁|캐스팅\s*확정|스틸컷|포토타임|대본리딩|안방극장)/i,
    explanationKo: '신작 드라마/영화 개봉 및 제작발표회(첫 방송), 신규 음반 발매(신곡 공개) 또는 공식 예고편(트레일러) 공개 소식이 대중의 기대를 모았습니다.',
    explanationEn: '글로벌 신작 영화 개봉, 새 드라마/시리즈 첫 방영, 신규 음반 발매 또는 공식 예고편(트레일러) 공개 소식이 전 세계 팬들의 뜨거운 기대를 모았습니다.'
  },
  {
    id: 'scandal',
    categoryKo: '이슈 · 의혹 · 법적공방',
    categoryEn: '이슈 · 논란 · 법적공방 (외신)',
    badgeStyle: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    enRegex: /\b(scandal|scandals|controversy|controversies|controversial|backlash|criticism|criticized|lawsuit|lawsuits|sued|suing|investigation|investigations|investigated|allegation|allegations|accused|guilty|verdict|indicted|indictment|court|trial|charges|probe|apologize|apology|arrest|arrested|felony|felonies|assault|disturbance|pleads? not guilty|resigns?|resigned|step down)\b/i,
    koRegex: /(논란|의혹|비판|유출|파문|구속영장|기소|재판|고소|고발|피소|폭로|해명|사과문|법정\s*공방|벌금형|입건|징역형|구형|체포|폭행|불기소|무죄\s*주장|사임|사퇴|물러나)/i,
    explanationKo: '최근 불거진 논란, 의혹 또는 사법·사회적 이슈가 대중의 이목을 집중시키며 트래픽 급증을 유발했습니다.',
    explanationEn: '최근 해외 언론을 통해 불거진 논란, 사법 수사 또는 사회적 이슈가 전 세계적인 이목을 집중시키며 트래픽 급증을 유발했습니다.'
  },
  {
    id: 'business_boom',
    categoryKo: '경제 · 주가 급등 · 호실적',
    categoryEn: '경제 · 주가 급등 · 어닝 서프라이즈 (외신)',
    badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800',
    enRegex: /\b(soars?|surges?|skyrockets?|rally|rallies|record profit|record revenue|earnings beat|profit jumps?|beat estimates|all-time high|bullish|market cap record|dividend hike|growth surge)\b/i,
    koRegex: /(주가\s*급등|상한가|신고가|사상\s*최고가|어닝\s*서프라이즈|실적\s*호조|영업익\s*급증|매출\s*신기록|흑자\s*전환|폭등|급반등|투자\s*유치|대규모\s*수주|목표가\s*상향|호실적|실적\s*대박|배당\s*확대)/i,
    explanationKo: '기업 호실적(어닝 서프라이즈), 주가 급등 또는 대규모 수주·투자 유치 등 강력한 경제적 호재가 시장과 대중의 큰 환호를 이끌어냈습니다.',
    explanationEn: '해외 주요 기업의 어닝 서프라이즈(호실적), 주가 급등 또는 신고가 경신 등 강력한 경제 호재가 글로벌 시장의 주목을 받았습니다.'
  },
  {
    id: 'business_crisis',
    categoryKo: '경제 · 주가 폭락 · 실적 쇼크',
    categoryEn: '경제 · 주가 급락 · 실적 쇼크 (외신)',
    badgeStyle: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800',
    enRegex: /\b(plunges?|tumbles?|crashes?|slumps?|earnings miss|profit drops?|loss widens|bearish|layoffs?|job cuts|bankruptcy|bankrupt|insolvent|insolvency|default|defaults|liquidation|recession|downgrade|plummet|plummeted)\b/i,
    koRegex: /(주가\s*폭락|하한가|신저가|어닝\s*쇼크|실적\s*부진|영업익\s*급감|적자\s*전환|적자\s*지속|대규모\s*적자|부도|파산|법정관리|워크아웃|상장폐지|상폐|구조조정|희망퇴직|인원\s*감축|목표가\s*하향|디폴트|채무불이행|유동성\s*위기)/i,
    explanationKo: '주가 폭락, 어닝 쇼크(실적 부진), 대규모 적자 또는 부도·구조조정 위기 등 부정적인 경제 악재가 시장의 큰 우려와 충격을 자아냈습니다.',
    explanationEn: '해외 주요 기업의 주가 급락, 어닝 쇼크 또는 대규모 인원 감축·파산 위기 소식이 글로벌 시장에 큰 충격을 주었습니다.'
  },
  {
    id: 'business_general',
    categoryKo: '경제 · 산업 · M&A',
    categoryEn: '경제 · 증권 · M&A (외신)',
    badgeStyle: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    enRegex: /\b(ipo|acquisition|acquisitions|acquire|acquired|merger|mergers|takeover|stake|shareholder|valuation|quarterly earnings|interest rate|rate cut|rate hike|fed|inflation|central bank|crypto|bitcoin|etf|treasury|bond yields?)\b/i,
    koRegex: /(인수합병|M&A|매각|지분\s*인수|공모주|상장|IPO|기업가치|기준금리|금리\s*인하|금리\s*인상|한국은행|연준|인플레이션|물가상승|환율|가상자산|비트코인|ETF|국채|증시\s*동향)/i,
    explanationKo: '대형 인수합병(M&A), IPO(공모주 상장), 기준금리 변동 또는 거시 경제 정책 발표가 시장의 주목을 받았습니다.',
    explanationEn: '해외 주요 기업의 대형 인수합병(M&A), IPO 상장 또는 기준금리·인플레이션 등 거시 경제 이슈가 글로벌 시장의 주목을 받았습니다.'
  },
  {
    id: 'disaster_crisis',
    categoryKo: '자연재해 · 기상이변',
    categoryEn: '자연재해 · 기상이변 (외신)',
    badgeStyle: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    enRegex: /\b(earthquake|wildfire|storm|hurricane|typhoon|tsunami|flood|flooding|blizzard|natural disaster)\b/i,
    koRegex: /(지진|산불|폭풍|허리케인|태풍|쓰나미|홍수|침수|폭설|가뭄|기상이변|해일)/i,
    explanationKo: '돌발적인 자연재난이나 기상이변 발생 소식이 긴급 보도되며 현장 상황에 대한 대중의 검색이 급증했습니다.',
    explanationEn: '해외 현지의 돌발 자연재난 또는 기상이변 소식이 긴급 타전되며 전 세계의 우려와 정보 검색이 급증했습니다.'
  }
];

export const CATEGORY_PRIORITY_ORDER = [
  'accident_casualty',
  'military_conflict',
  'tv_competition_tribute',
  'death',
  'family_bereavement',
  'tribute_mourning',
  'rumor_debunking',
  'sports_award_mvp',
  'sports_victory',
  'sports_defeat_crisis',
  'sports_transfer_general',
  'business_boom',
  'business_crisis',
  'wedding_marriage',
  'spouse_cheer_couple',
  'baby_pregnancy',
  'dating_romance',
  'breakup_divorce',
  'series_season',
  'boxoffice_hit',
  'release_comeback',
  'broadcast',
  'business_general',
  'politics_diplomacy',
  'scandal',
  'incident_society',
  'disaster_crisis',
  'tech_science',
  'award_win',
  'concert_tour'
];

export const CATEGORY_MATCHERS = CATEGORIES;

