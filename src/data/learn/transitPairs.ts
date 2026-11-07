// ネイタル×トランジットのアスペクト解説（今の空の天体 × あなたの天体）
// ネイタルの組み合わせ解説と同じ形（テーマ＋合/ソフト/ハード別）で、「その時期に起きやすいこと」として書く
// 占星術で広く共有されている一般的な解釈をもとにしている
import { PairLearn, PairVariant, angleToPairNature } from './aspectPairs';
import { TRANSIT_SUN } from './transits/sun';
import { TRANSIT_MOON } from './transits/moon';
import { TRANSIT_MERCURY } from './transits/mercury';
import { TRANSIT_VENUS } from './transits/venus';
import { TRANSIT_MARS } from './transits/mars';
import { TRANSIT_JUPITER } from './transits/jupiter';
import { TRANSIT_SATURN } from './transits/saturn';
import { TRANSIT_URANUS } from './transits/uranus';
import { TRANSIT_NEPTUNE } from './transits/neptune';
import { TRANSIT_PLUTO } from './transits/pluto';

// トランジット天体ごとの「どのくらい続くか」の目安
export const TRANSIT_DURATION: Record<string, string> = {
  moon: '月はとても速く動くため、このアスペクトは数時間ほどで過ぎていきます。その日の気分やちょっとした出来事として表れます。',
  sun: '太陽はおよそ1日に1度動くため、このアスペクトは数日ほど続きます。毎年同じころにめぐってきます。',
  mercury: '水星は速く動くため、このアスペクトはふつう数日ほどです。逆行の時期には、同じ角度を何度かなぞることがあります。',
  venus: '金星は速く動くため、このアスペクトはふつう数日〜1週間ほどです。逆行の時期には長くなることがあります。',
  mars: '火星のアスペクトは、ふつう数日〜2週間ほど続きます。逆行の時期には、数か月にわたることがあります。',
  jupiter: '木星のアスペクトは、数週間〜数か月ほど続きます。逆行によって、同じ角度を最大3回なぞることがあります。',
  saturn: '土星のアスペクトは、数か月〜1年ほど続きます。逆行によって、同じ角度を最大3回なぞることがあり、そのたびにテーマが深まります。',
  uranus: '天王星のアスペクトは、1〜2年ほど続きます。逆行によって、同じ角度を何度かなぞります。',
  neptune: '海王星のアスペクトは、2〜3年ほどかけてゆっくり進みます。気づかないうちに変わっていくことが多い時期です。',
  pluto: '冥王星のアスペクトは、2〜3年以上かけてゆっくり進みます。人生の中でも深い変化の時期になります。',
};

// キーはトランジット天体、その中のキーはネイタル天体
const TRANSIT_PAIRS: Record<string, Record<string, PairLearn>> = {
  sun: TRANSIT_SUN,
  moon: TRANSIT_MOON,
  mercury: TRANSIT_MERCURY,
  venus: TRANSIT_VENUS,
  mars: TRANSIT_MARS,
  jupiter: TRANSIT_JUPITER,
  saturn: TRANSIT_SATURN,
  uranus: TRANSIT_URANUS,
  neptune: TRANSIT_NEPTUNE,
  pluto: TRANSIT_PLUTO,
};

export const findTransitPair = (
  transitKey: string,
  natalKey: string,
  angle: number,
): { pair: PairLearn; variant: PairVariant } | null => {
  const pair = TRANSIT_PAIRS[transitKey]?.[natalKey];
  const variant = pair?.variants[angleToPairNature(angle)];
  return pair && variant ? { pair, variant } : null;
};
