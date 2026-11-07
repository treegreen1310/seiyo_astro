// 天体 × サイン／ハウスの配置ごとの解説（アスペクトの組み合わせ別解説と同じ形）
// 占星術で広く共有されている一般的な解釈をもとに書いている
import { SUN_SIGNS } from './signs/sun';
import { MOON_SIGNS } from './signs/moon';
import { MERCURY_SIGNS } from './signs/mercury';
import { VENUS_SIGNS } from './signs/venus';
import { MARS_SIGNS } from './signs/mars';
import { JUPITER_SIGNS } from './signs/jupiter';
import { SATURN_SIGNS } from './signs/saturn';
import { URANUS_SIGNS } from './signs/uranus';
import { NEPTUNE_SIGNS } from './signs/neptune';
import { PLUTO_SIGNS } from './signs/pluto';
import { ASC_SIGNS } from './signs/asc';
import { MC_SIGNS } from './signs/mc';
import { SUN_HOUSES } from './houses/sun';
import { MOON_HOUSES } from './houses/moon';
import { MERCURY_HOUSES } from './houses/mercury';
import { VENUS_HOUSES } from './houses/venus';
import { MARS_HOUSES } from './houses/mars';
import { JUPITER_HOUSES } from './houses/jupiter';
import { SATURN_HOUSES } from './houses/saturn';
import { URANUS_HOUSES } from './houses/uranus';
import { NEPTUNE_HOUSES } from './houses/neptune';
import { PLUTO_HOUSES } from './houses/pluto';
import { HOUSE_LEARN, PLANET_LEARN, SIGN_LEARN } from './basics';

export interface PlacementLearn {
  oneLine: string;     // ひとことで
  how: string;         // この配置だと、こう出やすい
  examples: string[];  // よくある例
  tips: string;        // 活かし方
  simple?: boolean;    // 意味を組み合わせて自動で作った簡易な解説（小惑星・感受点）
}

// 天体のキー → サイン名（牡羊座など）→ 解説
export const SIGN_PLACEMENTS: Record<string, Record<string, PlacementLearn>> = {
  sun: SUN_SIGNS,
  moon: MOON_SIGNS,
  mercury: MERCURY_SIGNS,
  venus: VENUS_SIGNS,
  mars: MARS_SIGNS,
  jupiter: JUPITER_SIGNS,
  saturn: SATURN_SIGNS,
  uranus: URANUS_SIGNS,
  neptune: NEPTUNE_SIGNS,
  pluto: PLUTO_SIGNS,
  asc: ASC_SIGNS,
  mc: MC_SIGNS,
};

// 動きの遅い天体は、同じサインに長くいるため、同じころに生まれた人と共通する
const SLOW_NOTE = 'どのハウスに入っているか、個人天体やASCとアスペクトしているかで、あなた個人への表れ方が変わります。';
export const SIGN_PLACEMENT_NOTES: Record<string, string> = {
  jupiter: `木星は約1年同じサインにいるので、同じ学年くらいの人と共通しやすい配置です。${SLOW_NOTE}`,
  saturn: `土星は約2年半同じサインにいるので、同じ学年くらいの人と共通しやすい配置です。${SLOW_NOTE}`,
  uranus: `天王星は約7年同じサインにいるので、あなた個人の性格というより「世代の空気」として読みます。${SLOW_NOTE}`,
  neptune: `海王星は約14年同じサインにいるので、あなた個人の性格というより「世代の空気」として読みます。${SLOW_NOTE}`,
  pluto: `冥王星は十数年〜30年ほど同じサインにいるので、あなた個人の性格というより「世代の空気」として読みます。${SLOW_NOTE}`,
};

export const findSignPlacement = (planetKey: string, sign: string): PlacementLearn | null =>
  SIGN_PLACEMENTS[planetKey]?.[sign] ?? buildSimpleSign(planetKey, sign);

// 個別の解説がない小惑星・感受点は、天体の意味とサインの性質を組み合わせて簡易な解説を作る
const buildSimpleSign = (planetKey: string, sign: string): PlacementLearn | null => {
  const p = PLANET_LEARN[planetKey];
  const s = SIGN_LEARN[sign];
  if (!p || !s) return null;
  const firstTheme = s.theme.split('・')[0];
  return {
    simple: true,
    oneLine: `${p.role}が、${s.style}スタイルで表れる配置。`,
    how: `${p.name}が表す「${p.keywords.slice(0, 2).join('・')}」というテーマが、${s.name}の「${s.theme}」の性質を帯びて表れます。「${p.keywords[0]}」のテーマに、${s.style}姿勢で向き合いやすい配置です。`,
    examples: [
      `${p.keywords[0]}に関わる場面で、${s.name}らしい「${firstTheme}」の性質が出る`,
      `${p.keywords[1]}の面でも、${s.name}の「${s.theme}」の性質が出やすい`,
    ],
    tips: `${p.name}の基本の意味と、${s.name}のテーマを合わせて読むと、あなたらしい出方がイメージしやすくなります。`,
  };
};

// 天体のキー → ハウス番号（1〜12）→ 解説（ASC・MCはハウスの始まりそのものなので対象外）
export const HOUSE_PLACEMENTS: Record<string, Record<number, PlacementLearn>> = {
  sun: SUN_HOUSES,
  moon: MOON_HOUSES,
  mercury: MERCURY_HOUSES,
  venus: VENUS_HOUSES,
  mars: MARS_HOUSES,
  jupiter: JUPITER_HOUSES,
  saturn: SATURN_HOUSES,
  uranus: URANUS_HOUSES,
  neptune: NEPTUNE_HOUSES,
  pluto: PLUTO_HOUSES,
};

export const findHousePlacement = (planetKey: string, house: number): PlacementLearn | null =>
  HOUSE_PLACEMENTS[planetKey]?.[house] ?? buildSimpleHouse(planetKey, house);

// 個別の解説がない小惑星・感受点は、天体の意味とハウスの分野を組み合わせて簡易な解説を作る
const buildSimpleHouse = (planetKey: string, house: number): PlacementLearn | null => {
  const p = PLANET_LEARN[planetKey];
  const h = HOUSE_LEARN[house];
  if (!p || !h || !p.usesHouse) return null;
  return {
    simple: true,
    oneLine: `${p.role}が、「${h.field}」の場面で表れる配置。`,
    how: `${p.name}が表す「${p.keywords.slice(0, 2).join('・')}」というテーマが、第${h.house}ハウスの「${h.field}」（${h.detail}）の場面で働きます。この分野で${p.name}を意識すると、その働きをよりはっきり感じられます。`,
    examples: [
      `${h.detail.split('、')[0]}に関わる場面で、${p.keywords[0]}のテーマが顔を出す`,
      `${h.field.split('・')[0]}の場面で、${p.keywords[1]}を意識することがある`,
    ],
    tips: `第${h.house}ハウスの分野で、${p.name}のテーマに意識して取り組むと、この配置の力を活かしやすくなります。`,
  };
};
