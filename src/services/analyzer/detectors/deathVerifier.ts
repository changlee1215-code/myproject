import type { NewsItem } from '../types';
import { COMMON_NAMES, escapeRegExp, HISTORICAL_DECEASED_ICONS } from '../stopwords';

export const verifySelfDeath = (
  targetKeyword: string,
  newsList: NewsItem[],
  translations: Record<string, string>,
  isMemorialDirectory: boolean,
  isSubjectTvOrMedia: boolean
): boolean => {
  const normKey = targetKeyword.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').trim();
  const keyTokens = normKey.split(/\s+/).filter((t) => t.length >= 2 && !COMMON_NAMES.has(t));
  if (keyTokens.length === 0) return false;
  if (isMemorialDirectory || isSubjectTvOrMedia) return false;
  if (HISTORICAL_DECEASED_ICONS.has(normKey) || HISTORICAL_DECEASED_ICONS.has(normKey.replace(/\s+/g, ''))) {
    return false;
  }

  const escapedKeyTokens = keyTokens.map(escapeRegExp);

  let selfDeathHits = 0;
  let speakingOrLivingHits = 0;

  newsList.forEach((n) => {
    const orig = n.title.toLowerCase();
    const trans = (translations[n.title] || '').toLowerCase();
    const combined = `${orig} ${trans}`;

    const hasKey =
      combined.includes(normKey) ||
      escapedKeyTokens.some((t) => {
        const rx = new RegExp(`(^|[^a-zA-Z0-9가-힣])${t}([^a-zA-Z0-9가-힣]|$)`, 'i');
        return rx.test(combined);
      });
    if (!hasKey) return;

    // 본인이 직접 사망의 주어이거나 본인의 사망/추모가 핵심인 헤드라인
    const selfDeathRxEn = new RegExp(
      `(?:\\b(${escapedKeyTokens.join('|')})['’]?s?\\b[\\s\\S]{0,85}\\b(dies at \\d+|died at \\d+|dead at \\d+|dead at the age of|passes? away|passed away|has died|found dead|pronounced dead|confirmed dead|cause of death|death by suicide|star['’]?s death|actor['’]?s death|actress['’]?s death|notable obituaries|obituary|obituaries|leading up to (?:his|her) death|days before (?:his|her) death|before (?:his|her) death|after .*?\\bdeath|tragic death|death at \\d+ confirmed|dies aged \\d+|dies|died|dead|death)\\b|\\b(dies|died|dead|death|passed away|passes away|has died|found dead|pronounced dead|obituary|obituaries|suicide|tragic loss)\\b[\\s\\S]{0,60}\\b(${escapedKeyTokens.join('|')})\\b|\\b(remembers?|remembering|mourns?|mourning|tributes? to|honors?|honoring|loss of)\\b[\\s\\S]{0,50}\\b(?:co-star|friend|actor)?\\s*(${escapedKeyTokens.join('|')})\\b)`,
      'i'
    );
    const selfDeathRxKo = new RegExp(
      `(${escapedKeyTokens.join('|')})[\\s\\S]{0,35}(별세|타계|사망\\s*확인|숨진\\s*채|향년\\s*\\d+세|비보|추모|애도)`,
      'i'
    );

    const isDirectSelfDeathHeadline = selfDeathRxEn.test(orig) || selfDeathRxKo.test(combined);
    if (isDirectSelfDeathHeadline) {
      selfDeathHits++;
    }

    // 가족/대변인/동료가 발언하는 기사이거나 사망 소식 관련 헤드라인이면 본인의 생존 활동 지표에서 제외
    const hasFamilyOrCostarSpeaker = new RegExp(
      `\\b(${escapedKeyTokens.join('|')})['’]s\\s+(?:(?:['"‘“][^'"’”]+['"’”]|\\w+)\\s+){0,3}(mother|father|mom|dad|parent|parents|costar|co-star|castmate|friend|rep|representative|family|wife|husband|brother|sister|widow|attorney|lawyer)`,
      'i'
    ).test(orig);
    const isDeathContext = /\b(death|dies|died|dead|suicide|passing|funeral|obituary|obituaries|mourn|mourns|remembers|tribute)\b/i.test(orig);

    // 본인이 살아서 직접 인터뷰/추모/헌정 무대/발언/활동을 하고 있는 경우 (생존자 확정 지표)
    const livingRxEn = new RegExp(
      `\\b(${escapedKeyTokens.join('|')})\\b(?!['’]s)\\s*(?:,\\s*[^,]{1,25},\\s*)?\\b(says?|speaks? out|reacts?|breaks? silence|recalls?|pleads? not guilty|arrested|charged|attends?|cheers?|resigns?|to pay tribute|pays? tribute|recreates?)\\b`,
      'i'
    );
    const livingRxKo = new RegExp(
      `(${escapedKeyTokens.join('|')})(?!\\s*의)\\s*(측은|은|는|이|가)\\s*[\\s\\S]{0,15}(밝혔다|전했다|추모했다|애도했다|말했다|호소했다|응원했다|직관했다|사임했다|헌정)`,
      'i'
    );

    if (
      !isDirectSelfDeathHeadline &&
      !hasFamilyOrCostarSpeaker &&
      !isDeathContext &&
      (livingRxEn.test(orig) || livingRxKo.test(combined))
    ) {
      speakingOrLivingHits++;
    }
  });

  // 본인 직접 사망 헤드라인이 2건 이상 명확히 확인되고 생존 활동 기사보다 많거나 같으면 본인 사망으로 인정
  if (selfDeathHits >= 2 && selfDeathHits >= speakingOrLivingHits) return true;
  if (speakingOrLivingHits >= 1) return false;
  return selfDeathHits >= (newsList.length <= 3 ? 1 : 2);
};
