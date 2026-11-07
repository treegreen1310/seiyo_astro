// 天体の組み合わせごとのアスペクト解説（ネイタル用）
// 手元のリサーチ資料には組み合わせ別の解説がないため、占星術で広く共有されている一般的な解釈をもとに書いている
// 特定の占星術師だけの解釈は入れない
import { SUN_PAIRS } from './pairs/sun';
import { MOON_PAIRS } from './pairs/moon';
import { MERCURY_PAIRS } from './pairs/mercury';
import { VENUS_PAIRS } from './pairs/venus';
import { MARS_PAIRS } from './pairs/mars';
import { ASC_PAIRS } from './pairs/asc';
import { GENERATION_PAIRS } from './pairs/generation';
import { CHIRON_PAIRS } from './pairs/chiron';
import { HEAD_PAIRS, TAIL_PAIRS } from './pairs/nodes';
import { PLANET_LEARN } from './basics';

export type PairNature = 'merge' | 'soft' | 'hard';

export interface PairVariant {
  oneLine: string;     // ひとことで
  how: string;         // この角度だと、こう出やすい
  examples: string[];  // よくある例
  tips: string;        // 活かし方
}

export interface PairLearn {
  theme: string;                                  // 組み合わせそのもののテーマ（角度によらない）
  variants: Partial<Record<PairNature, PairVariant>>; // 角度上ありえない組み合わせは省略
  generation?: string;                            // 世代・時代に共通するアスペクトの注記（動きの遅い天体同士）
  simple?: boolean;                               // 2つの意味を組み合わせて自動で作った簡易な解説
}

export const PAIR_NATURE_LABELS: Record<PairNature, string> = {
  merge: '合（重なる）',
  soft: 'ソフト（調和する）',
  hard: 'ハード（ぶつかる）',
};

// 合 → merge、トライン・セクスタイル → soft、スクエア・オポジション・インコンジャンクト → hard
export const angleToPairNature = (angle: number): PairNature =>
  angle === 0 ? 'merge' : angle === 60 || angle === 120 ? 'soft' : 'hard';

// 組み合わせのキーは、この順番で前にある天体を先にする（例: venus|uranus）
const PAIR_ORDER = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'asc', 'mc',
  'mean_node', 'tail', 'chiron', 'ceres', 'pallas', 'juno', 'vesta', 'mean_apog', 'vertex', 'pof',
];

export const pairKey = (a: string, b: string): string => {
  const ia = PAIR_ORDER.indexOf(a);
  const ib = PAIR_ORDER.indexOf(b);
  return ia <= ib ? `${a}|${b}` : `${b}|${a}`;
};

export const findPairLearn = (a: string, b: string, angle: number): { pair: PairLearn; variant: PairVariant } | null => {
  const pair = PAIR_LEARN[pairKey(a, b)] ?? buildSimplePair(a, b);
  const variant = pair?.variants[angleToPairNature(angle)];
  return pair && variant ? { pair, variant } : null;
};

// 小惑星・感受点（ヘッド以降）が関わる組で、個別の解説がないものは、2つの意味を組み合わせて簡易な解説を作る
const EXTRA_START = PAIR_ORDER.indexOf('mean_node');

const buildSimplePair = (a: string, b: string): PairLearn | null => {
  const [k1, k2] = pairKey(a, b).split('|');
  if (PAIR_ORDER.indexOf(k2) < EXTRA_START) return null;
  const p = PLANET_LEARN[k1]; // 先の天体
  const q = PLANET_LEARN[k2]; // 小惑星・感受点
  if (!p || !q) return null;
  const pk = `${p.name}のテーマ（${p.keywords.slice(0, 2).join('・')}）`;
  const qk = `${q.name}のテーマ（${q.keywords.slice(0, 2).join('・')}）`;
  return {
    simple: true,
    theme: `${p.role}（${p.name}）と、${q.role}（${q.name}）の組み合わせ。${q.name}は、${q.summary}`,
    variants: {
      merge: {
        oneLine: `${p.role}に、${q.role}が強く結びついている配置。`,
        how: `${q.name}が${p.name}に重なると、${qk}が、${pk}と一体になって働きます。${p.name}を使う場面で、${q.name}らしさが自然と表に出やすい配置です。`,
        examples: [
          `${p.keywords[0]}に関わる場面で、${q.keywords[0]}のテーマが顔を出す`,
          `${q.name}の性質が、${p.name}の表れ方に色をつけている`,
        ],
        tips: `${q.name}の解説と${p.name}の解説を続けて読むと、2つがどう結びついているかイメージしやすくなります。`,
      },
      soft: {
        oneLine: `${p.role}と、${q.role}が、うまく協力し合う配置。`,
        how: `${p.name}と${q.name}が調和する角度です。${qk}が、${pk}を自然に助けます。意識しなくても、2つの力を合わせて使いやすい配置です。`,
        examples: [
          `${q.keywords[0]}の力が、${p.keywords[0]}の場面で助けになる`,
          '2つのテーマを、無理なく両立できる',
        ],
        tips: `うまく働いている部分は、自分では気づきにくいものです。${q.name}のテーマを意識して使うと、才能としてはっきり育ちます。`,
      },
      hard: {
        oneLine: `${p.role}と、${q.role}が、ぶつかりながら育っていく配置。`,
        how: `${p.name}と${q.name}が緊張する角度です。${qk}と、${pk}が、ときどき食い違うように感じやすくなります。その引っぱり合いが、2つのテーマを深く考えるきっかけになります。`,
        examples: [
          `${p.keywords[0]}と${q.keywords[0]}の間で、迷うことがある`,
          'どちらか一方に偏ると、もう一方が気になり出す',
        ],
        tips: 'どちらかを選ぶより、「両方を活かすにはどうするか」を考えると、緊張が成長の力に変わります。',
      },
    },
  };
};

// 天体ごとのファイルをまとめたもの（個人天体・ASC が関わる45組 ＋ 世代・時代のアスペクト10組）
export const PAIR_LEARN: Record<string, PairLearn> = {
  ...SUN_PAIRS,
  ...MOON_PAIRS,
  ...MERCURY_PAIRS,
  ...VENUS_PAIRS,
  ...MARS_PAIRS,
  ...ASC_PAIRS,
  ...GENERATION_PAIRS,
  ...CHIRON_PAIRS,
  ...HEAD_PAIRS,
  ...TAIL_PAIRS,
};
