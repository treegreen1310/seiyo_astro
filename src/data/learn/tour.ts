// 5ステップ読み解きツアー用の集計と解説文
// 元ネタ: 占星術調査/00_natal_chart_reading_guide.md 8章（全体 → 骨格 → 個人天体 → 社会天体・アスペクト → 細部）
// ここに書く内容は「一般的なルール」。特定の占星術師だけの解釈は入れない
import { Aspect, HouseCusp, Planet } from '../../types/horoscope';
import { ASPECT_LEARN, AspectTarget } from './aspects';
import { findPairLearn } from './aspectPairs';
import { ELEMENT_LEARN, HOUSE_LEARN, HouseLearn, PLANET_LEARN, SIGN_LEARN, SentencePart, SignLearn } from './basics';

export const MAJOR_10_KEYS = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

export interface TourStep {
  id: number;
  title: string;
  short: string;
  idea: string;        // ①考え方の説明
  ready: boolean;      // まだ作っていないステップは false
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    title: '全体のバランスを見る',
    short: '全体',
    idea:
      '細かい意味を読む前に、まずチャート全体の「かたより」を見ます。10天体がどのエレメント（火・地・風・水）や3区分（活動・不動・柔軟）に多く集まっているかで、その人の基本の気質がわかります。天体が集まっている場所（ステリウム）も、人生で力が注がれやすいところです。',
    ready: true,
  },
  {
    id: 2,
    title: '骨格を読む',
    short: '骨格',
    idea:
      '次に、チャートの骨組みになる5つ「ASC・月・太陽・MC・チャートルーラー」を読みます。見られる自分（ASC）、素の自分（月）、目指す自分（太陽）、社会での目標（MC）、そして人生の舵取り役（チャートルーラー）。ここまで読むと、その人の輪郭がつかめます。',
    ready: true,
  },
  {
    id: 3,
    title: '個人天体を読む（水星・金星・火星）',
    short: '個人天体',
    idea:
      '骨格がつかめたら、日々の「自分の使い方」を表す3つの個人天体を読みます。考え方と伝え方（水星）、好きなものと愛し方（金星）、行動力と戦い方（火星）。太陽や月ほど大きなテーマではありませんが、毎日の暮らしや人間関係で一番よく表に出る部分です。',
    ready: true,
  },
  {
    id: 4,
    title: '社会天体とアスペクトを読む',
    short: '社会天体',
    idea:
      '木星と土星は「社会天体」。木星は自然と伸びていく分野、土星は時間をかけて鍛える分野を表します。さらに外側の天王星・海王星・冥王星は、動きがゆっくりで同じ世代に共通する「世代の星」ですが、太陽や月などの個人的な天体とアスペクト（角度）を作っていると、その人だけの強い個性になります。ここでは、あなたの個人的な天体が外側の天体からどんな影響を受けているかを読みます。',
    ready: true,
  },
  {
    id: 5,
    title: '細部を読む（ディグニティ・逆行）',
    short: '細部',
    idea:
      '最後に、天体ひとつひとつの「居心地」と「向き」を見ます。天体には、力を素直に発揮できるサイン（本来の場所・高揚）と、出しにくいサイン（アウェー・力を出しにくい場所）があり、これを「ディグニティ」と呼びます。また、地球から見て後ろ向きに進んでいるように見える天体は「逆行」と呼び、その天体の働きが内側に向かいやすいと読みます。どちらも良い・悪いではなく、出方の違いです。',
    ready: true,
  },
];

// ---------- ステップ1：全体のバランス ----------

export type Element = SignLearn['element'];
export type Modality = SignLearn['modality'];

export const ELEMENT_ORDER: Element[] = ['火', '地', '風', '水'];
export const MODALITY_ORDER: Modality[] = ['活動', '不動', '柔軟'];

// 10天体のうち、この数以上が集まっていたら「多い」とみなす
const MANY_ELEMENT = 4;
const MANY_MODALITY = 5;

const ELEMENT_MANY: Record<Element, string> = {
  火: '火が多いあなたは、思い立ったらすぐ動ける情熱家タイプ。勢いで道を切り開ける反面、飽きっぽさや燃え尽きには注意。',
  地: '地が多いあなたは、現実的でコツコツ積み上げるタイプ。結果を形にする力がある反面、変化には慎重になりがち。',
  風: '風が多いあなたは、頭の回転が速く、人や情報をつなぐタイプ。客観的に考えられる反面、気持ちを置き去りにしがち。',
  水: '水が多いあなたは、感受性が豊かで、人の気持ちに寄り添うタイプ。共感力が強い反面、周りの感情に影響されやすい面も。',
};

const ELEMENT_NONE: Record<Element, string> = {
  火: '火の天体がないあなたは、勢いだけで始めるのは少し苦手かも。そのぶん慎重で、周りの熱に刺激されると動き出せます。',
  地: '地の天体がないあなたは、現実的な段取りや継続が後回しになりがち。発想の自由さを、仕組みや習慣で支えるとうまくいきます。',
  風: '風の天体がないあなたは、物事を一歩引いて言葉にするのが少し苦手かも。話したり書いたりして整理すると、視野が広がります。',
  水: '水の天体がないあなたは、気持ちを表に出すのが少し苦手かも。そのぶん冷静で、感情に流されずに判断できます。',
};

const MODALITY_MANY: Record<Modality, string> = {
  活動: '活動宮が多いあなたは、自分からスタートを切る人。新しいことを始めるのが得意ですが、続けるのは課題になりやすいです。',
  不動: '不動宮が多いあなたは、一度決めたらやり抜く人。粘り強さが武器ですが、方向転換は苦手になりやすいです。',
  柔軟: '柔軟宮が多いあなたは、状況に合わせて変われる人。器用で順応力が高い反面、自分の軸がぶれやすい面もあります。',
};

export interface GroupCount<T> {
  key: T;
  planets: Planet[];
}

const majorPlanets = (planets: Planet[]) =>
  MAJOR_10_KEYS.map(k => planets.find(p => p.key === k)).filter((p): p is Planet => !!p);

export const countElements = (planets: Planet[]): GroupCount<Element>[] =>
  ELEMENT_ORDER.map(key => ({
    key,
    planets: majorPlanets(planets).filter(p => SIGN_LEARN[p.sign]?.element === key),
  }));

export const countModalities = (planets: Planet[]): GroupCount<Modality>[] =>
  MODALITY_ORDER.map(key => ({
    key,
    planets: majorPlanets(planets).filter(p => SIGN_LEARN[p.sign]?.modality === key),
  }));

// 半球の偏り：地平線（ASC-DSC）の上下、子午線（MC-IC）の東西
// 下半球＝1〜6ハウス、上半球＝7〜12ハウス、東半球＝10〜3ハウス、西半球＝4〜9ハウス
export interface Hemispheres {
  below: Planet[];
  above: Planet[];
  east: Planet[];
  west: Planet[];
}

export const countHemispheres = (planets: Planet[]): Hemispheres => {
  const list = majorPlanets(planets);
  return {
    below: list.filter(p => p.house >= 1 && p.house <= 6),
    above: list.filter(p => p.house >= 7 && p.house <= 12),
    east: list.filter(p => p.house >= 10 || p.house <= 3),
    west: list.filter(p => p.house >= 4 && p.house <= 9),
  };
};

// 10天体のうち、この数以上が片側にあれば「偏りあり」とみなす
const HEMISPHERE_BIAS = 7;

export const hemisphereNotes = (h: Hemispheres): string[] => {
  const notes: string[] = [];
  if (h.below.length >= HEMISPHERE_BIAS) {
    notes.push('天体の多くが地平線より下（1〜6ハウス）にあります。家庭や身近な暮らし、自分の内面を大切にするタイプです。');
  } else if (h.above.length >= HEMISPHERE_BIAS) {
    notes.push('天体の多くが地平線より上（7〜12ハウス）にあります。人との関わりや社会の中で、自分を表現していくタイプです。');
  }
  if (h.east.length >= HEMISPHERE_BIAS) {
    notes.push('天体の多くが東側（10〜3ハウス）にあります。自分の意思で人生を切り開いていくタイプです。');
  } else if (h.west.length >= HEMISPHERE_BIAS) {
    notes.push('天体の多くが西側（4〜9ハウス）にあります。人との出会いや周りの流れを受けて、道が開けていくタイプです。');
  }
  if (notes.length === 0) {
    notes.push('天体は上下・東西にほどよく散らばっています。特定の方向にかたよらない、バランス型の配置です。');
  }
  return notes;
};

// ステリウム：同じサイン、または同じハウスに3つ以上の天体が集まっている
const STELLIUM_MIN = 3;

export interface Stellium {
  label: string;
  planets: Planet[];
}

export const findStelliums = (planets: Planet[]): Stellium[] => {
  const list = majorPlanets(planets);
  const result: Stellium[] = [];
  const bySign = new Map<string, Planet[]>();
  const byHouse = new Map<number, Planet[]>();
  for (const p of list) {
    bySign.set(p.sign, [...(bySign.get(p.sign) ?? []), p]);
    byHouse.set(p.house, [...(byHouse.get(p.house) ?? []), p]);
  }
  for (const [sign, ps] of bySign) {
    if (ps.length >= STELLIUM_MIN) result.push({ label: sign, planets: ps });
  }
  for (const [house, ps] of byHouse) {
    if (ps.length >= STELLIUM_MIN) result.push({ label: `第${house}ハウス`, planets: ps });
  }
  return result;
};

export const balanceNotes = (planets: Planet[]): string[] => {
  const notes: string[] = [];
  for (const g of countElements(planets)) {
    if (g.planets.length >= MANY_ELEMENT) notes.push(ELEMENT_MANY[g.key]);
  }
  for (const g of countElements(planets)) {
    if (g.planets.length === 0) notes.push(ELEMENT_NONE[g.key]);
  }
  for (const g of countModalities(planets)) {
    if (g.planets.length >= MANY_MODALITY) notes.push(MODALITY_MANY[g.key]);
  }
  if (notes.length === 0) {
    notes.push('エレメントも3区分も、極端なかたよりはありません。いろいろな面をバランスよく持っているタイプです。');
  }
  return notes;
};

// ---------- ステップ2：骨格 ----------

export const SKELETON_ITEMS = [
  { key: 'asc', caption: '見られる自分' },
  { key: 'moon', caption: '素の自分' },
  { key: 'sun', caption: '目指す自分' },
  { key: 'mc', caption: '社会での目標' },
];

// チャートルーラー：ASCのサイン（＝第1ハウスのカスプのサイン）を支配する天体
export interface ChartRuler {
  ascSign: string;
  planet: Planet;
  classical?: string; // 古典で別の支配星を使うサインのとき
}

export const findChartRuler = (planets: Planet[], houses: HouseCusp[]): ChartRuler | null => {
  const first = houses.find(h => h.house === 1);
  if (!first) return null;
  const planet = planets.find(p => p.name === first.ruler);
  if (!planet) return null;
  const classical = SIGN_LEARN[first.sign]?.ruler.match(/古典では(.+?)）/)?.[1];
  return { ascSign: first.sign, planet, classical };
};

// ---------- ステップ2のまとめ：骨格の5つを組み合わせて読む ----------

// ① 5つをつなげた読み解き文
export const buildSkeletonSentence = (planets: Planet[], ruler: ChartRuler | null): SentencePart[] | null => {
  const find = (key: string) => planets.find(p => p.key === key);
  const asc = find('asc');
  const moon = find('moon');
  const sun = find('sun');
  const mc = find('mc');
  if (!asc || !moon || !sun || !mc) return null;
  const s = (p: Planet) => SIGN_LEARN[p.sign];
  if (!s(asc) || !s(moon) || !s(sun) || !s(mc)) return null;

  const parts: SentencePart[] = [
    { text: '人からは' },
    { text: `「${s(asc).style}」人`, kind: 'sign' },
    { text: `に見え（ASC ${asc.sign}）、素顔は` },
    { text: `「${s(moon).style}」人`, kind: 'sign' },
    { text: `（月 ${moon.sign}）。目指すのは` },
    { text: `「${s(sun).style}」生き方`, kind: 'sign' },
    { text: `（太陽 ${sun.sign}）で、社会では` },
    { text: `「${s(mc).theme}」`, kind: 'sign' },
    { text: `をゴールにします（MC ${mc.sign}）。` },
  ];
  const rulerHouse = ruler ? HOUSE_LEARN[ruler.planet.house] : null;
  if (ruler && rulerHouse) {
    parts.push(
      { text: '人生の舵は' },
      { text: `「${rulerHouse.field}」`, kind: 'house' },
      { text: `の方向へ（チャートルーラー ${ruler.planet.name}・第${rulerHouse.house}ハウス）。` }
    );
  }
  return parts;
};

// ② 2つのサインの関係（同じサイン／同じエレメント／相性のよいエレメント／性質の違うエレメント）
type SignRelation = 'same' | 'sameElement' | 'compatible' | 'gap';

// 火と風、地と水は助け合う組み合わせ
const COMPATIBLE_ELEMENTS = new Set(['火風', '風火', '地水', '水地']);

const relateSigns = (a: string, b: string): SignRelation | null => {
  const sa = SIGN_LEARN[a];
  const sb = SIGN_LEARN[b];
  if (!sa || !sb) return null;
  if (a === b) return 'same';
  if (sa.element === sb.element) return 'sameElement';
  if (COMPATIBLE_ELEMENTS.has(sa.element + sb.element)) return 'compatible';
  return 'gap';
};

interface RelationPair {
  a: string;
  b: string;
  aName: string;
  bName: string;
  x: string;          // a が表すもの
  y: string;          // b が表すもの
  sameNote: string;   // 同じサインのときの「〜一致していて、」の続き
  gapExtra: string;   // 性質の違うエレメントのときに足す一言
}

const SKELETON_PAIRS: RelationPair[] = [
  { a: 'sun', b: 'moon', aName: '太陽', bName: '月', x: '目指す自分', y: '素の自分', sameNote: '迷いの少ない、一貫した印象の人です。', gapExtra: '' },
  { a: 'moon', b: 'asc', aName: '月', bName: 'ASC', x: '素顔', y: '第一印象', sameNote: '迷いの少ない、一貫した印象の人です。', gapExtra: '「第一印象と中身が違うね」と言われることもあるかもしれません。' },
  { a: 'sun', b: 'asc', aName: '太陽', bName: 'ASC', x: '目指す自分', y: '人からの見られ方', sameNote: '迷いの少ない、一貫した印象の人です。', gapExtra: '' },
];

const PERSONAL_PAIRS: RelationPair[] = [
  { a: 'venus', b: 'mars', aName: '金星', bName: '火星', x: '愛し方', y: '行動力', sameNote: '好きなことに向かって、まっすぐ動ける人です。', gapExtra: '恋愛では「好きになるタイプ」と「惹かれるタイプ」が違うと感じることもあります。' },
  { a: 'mercury', b: 'moon', aName: '水星', bName: '月', x: '考え', y: '気持ち', sameNote: '思ったことを素直に言葉にできる人です。', gapExtra: '頭ではわかっていても気持ちがついてこない、ということがあるかもしれません。' },
  { a: 'mercury', b: 'sun', aName: '水星', bName: '太陽', x: '考え方', y: '目指す自分', sameNote: '自分の目標に向かって、迷わず頭を使える人です。', gapExtra: '' },
];

export interface SkeletonRelation {
  title: string;
  relation: SignRelation;
  text: string;
}

export const RELATION_LABELS: Record<SignRelation, string> = {
  same: '同じサイン',
  sameElement: '同じエレメント',
  compatible: '相性のよいエレメント',
  gap: '性質の違うエレメント',
};

export const skeletonRelations = (planets: Planet[]) => relationsFor(planets, SKELETON_PAIRS);
export const personalRelations = (planets: Planet[]) => relationsFor(planets, PERSONAL_PAIRS);

const relationsFor = (planets: Planet[], pairs: RelationPair[]): SkeletonRelation[] => {
  const result: SkeletonRelation[] = [];
  for (const pair of pairs) {
    const pa = planets.find(p => p.key === pair.a);
    const pb = planets.find(p => p.key === pair.b);
    if (!pa || !pb) continue;
    const relation = relateSigns(pa.sign, pb.sign);
    if (!relation) continue;
    const ea = SIGN_LEARN[pa.sign].element;
    const eb = SIGN_LEARN[pb.sign].element;
    const { aName, bName, x, y } = pair;
    let text: string;
    if (relation === 'same') {
      text = `${aName}と${bName}が同じ${pa.sign}にあります。${x}と${y}が一致していて、${pair.sameNote}そのぶん、${pa.sign}の性質が強く出やすい面もあります。`;
    } else if (relation === 'sameElement') {
      text = `${aName}（${pa.sign}）と${bName}（${pb.sign}）は、どちらも${ea}のサインです。${x}と${y}が自然になじみ、無理なくつながっています。`;
    } else if (relation === 'compatible') {
      text = `${aName}（${ea}）と${bName}（${eb}）は、相性のよいエレメントの組み合わせです。${x}と${y}が助け合い、うまく補い合えます。`;
    } else {
      text = `${aName}（${ea}）と${bName}（${eb}）は、性質の違うエレメントです。${x}と${y}にギャップを感じやすいですが、その違いがあなたの奥行きになります。${pair.gapExtra}`;
    }
    result.push({ title: `${aName}と${bName}（${x}と${y}）`, relation, text });
  }
  return result;
};

// ③ 骨格の5つ（ASC・月・太陽・MC・チャートルーラー）に多いエレメント
const SKELETON_ELEMENT_MIN = 3;

export const skeletonElementNote = (planets: Planet[], ruler: ChartRuler | null): string => {
  const points: { label: string; sign: string }[] = [];
  for (const [key, label] of [['asc', 'ASC'], ['moon', '月'], ['sun', '太陽'], ['mc', 'MC']]) {
    const p = planets.find(pl => pl.key === key);
    if (p) points.push({ label, sign: p.sign });
  }
  if (ruler) points.push({ label: `チャートルーラーの${ruler.planet.name}`, sign: ruler.planet.sign });

  for (const el of ELEMENT_ORDER) {
    const hits = points.filter(pt => SIGN_LEARN[pt.sign]?.element === el);
    if (hits.length >= SKELETON_ELEMENT_MIN) {
      return `骨格の${points.length}つのうち${hits.length}つ（${hits.map(h => h.label).join('・')}）が${el}のサインです。${el}は、${ELEMENT_LEARN[el]}エレメント。この性質が、あなたという人の土台になっています。`;
    }
  }
  return `骨格の${points.length}つは、いろいろなエレメントに散らばっています。場面によって違う顔を見せられる、多面的な人です。`;
};

// ④ チャートルーラーの特徴
const RULER_CATEGORY_NOTE: Record<HouseLearn['category'], string> = {
  アンギュラー: 'アンギュラーは力の強い場所なので、人生の方向性がはっきり表に出やすく、自分から道を切り開いていくタイプです。',
  サクシーデント: 'サクシーデントは手に入れたものを育てる場所なので、時間をかけて着実に人生を築いていくタイプです。',
  キャデント: 'キャデントは学び・調整の場所なので、経験から学び、柔軟に方向を変えながら進んでいくタイプです。',
};

export const chartRulerNotes = (ruler: ChartRuler | null): string[] => {
  if (!ruler) return [];
  const h = HOUSE_LEARN[ruler.planet.house];
  const notes: string[] = [];
  if (h) {
    notes.push(`チャートルーラーの${ruler.planet.name}は第${h.house}ハウス（${h.category}）にあります。${RULER_CATEGORY_NOTE[h.category]}`);
  }
  if (ruler.planet.key === 'sun') {
    notes.push('チャートルーラーが太陽なので、「目指す自分」がそのまま人生の舵になります。自分らしさを貫くほど、道が開けます。');
  } else if (ruler.planet.key === 'moon') {
    notes.push('チャートルーラーが月なので、「素の自分」が人生の舵になります。心から安心できる選択をするほど、うまく進めます。');
  }
  return notes;
};

// ---------- ステップ3：個人天体（水星・金星・火星） ----------

export const PERSONAL_ITEMS = [
  { key: 'mercury', caption: '考え方・伝え方' },
  { key: 'venus', caption: '好きなもの・愛し方' },
  { key: 'mars', caption: '行動力・戦い方' },
];

// 3つの個人天体に多いエレメント（2つ以上同じなら、その性質が日常に出やすい）
export const personalElementNote = (planets: Planet[]): string => {
  const list = PERSONAL_ITEMS.map(({ key }) => planets.find(p => p.key === key)).filter((p): p is Planet => !!p);
  let best: { el: Element; hits: Planet[] } | null = null;
  for (const el of ELEMENT_ORDER) {
    const hits = list.filter(p => SIGN_LEARN[p.sign]?.element === el);
    if (hits.length >= 2 && (!best || hits.length > best.hits.length)) best = { el, hits };
  }
  if (!best) {
    return '3つの個人天体は、それぞれ違うエレメントにあります。考える・楽しむ・動くの場面ごとに、違う持ち味を使い分けられる人です。';
  }
  const count = best.hits.length === list.length ? `${list.length}つとも` : `${best.hits.length}つ（${planetNamesOf(best.hits)}）`;
  return `水星・金星・火星のうち${count}が${best.el}のサインです。毎日の考え方・楽しみ方・動き方には、${best.el}の性質がよく表れます。${best.el}は、${ELEMENT_LEARN[best.el]}エレメントです。`;
};

const planetNamesOf = (ps: Planet[]) => ps.map(p => p.name).join('・');

// ---------- ステップ4：社会天体とアスペクト ----------

export const SOCIAL_ITEMS = [
  { key: 'jupiter', caption: '伸びる分野' },
  { key: 'saturn', caption: '鍛える分野' },
];

// 個人的な天体（内側）と、木星より外側の天体
const INNER_KEYS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'asc'];
const OUTER_KEYS = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
// 天王星・海王星・冥王星（トランスサタニアン）
const TRANS_SATURNIAN = new Set(['uranus', 'neptune', 'pluto']);
// トランスサタニアンとの間で「特に強い」とみなす角度（合・スクエア・オポジション）
const STRONG_ANGLES = new Set([0, 90, 180]);

// 外側の天体が、個人的な天体に加える力
const OUTER_EFFECT: Record<string, string> = {
  jupiter: '広げる・のびのびさせる',
  saturn: '引き締める・鍛える',
  uranus: '型を破る・自由にする',
  neptune: '感受性を高める・夢を見させる',
  pluto: '深める・徹底させる',
};

export interface OuterAspect {
  inner: Planet;
  outer: Planet;
  angle: number;
  aspectName: string;
  orb: number;
  strong: boolean;
  oneLine?: string;    // 組み合わせ別の解説がある場合の「ひとことで」
  text: string;
  target: AspectTarget;
}

export const findOuterAspects = (planets: Planet[], aspects: Aspect[]): OuterAspect[] => {
  const result: OuterAspect[] = [];
  for (const a of aspects) {
    const pair = INNER_KEYS.includes(a.p1_key) && OUTER_KEYS.includes(a.p2_key)
      ? [a.p1_key, a.p2_key]
      : INNER_KEYS.includes(a.p2_key) && OUTER_KEYS.includes(a.p1_key)
        ? [a.p2_key, a.p1_key]
        : null;
    if (!pair) continue;
    const inner = planets.find(p => p.key === pair[0]);
    const outer = planets.find(p => p.key === pair[1]);
    const learn = ASPECT_LEARN[a.target_angle];
    if (!inner || !outer || !learn) continue;
    const role = PLANET_LEARN[inner.key]?.role ?? inner.name;
    // 組み合わせ別の解説があれば、そちらの具体的な文を使う
    const found = findPairLearn(inner.key, outer.key, a.target_angle);
    result.push({
      inner,
      outer,
      angle: a.target_angle,
      aspectName: a.aspect_name,
      orb: a.orb,
      strong: TRANS_SATURNIAN.has(outer.key) && STRONG_ANGLES.has(a.target_angle),
      oneLine: found?.variant.oneLine,
      text: found
        ? found.variant.how
        : `あなたの${role}（${inner.name}）に、${outer.name}の「${OUTER_EFFECT[outer.key]}」力が、${learn.relation}（${learn.name}）で働きます。`,
      target: {
        angle: a.target_angle,
        p1Key: inner.key,
        p1Name: inner.name,
        p2Key: outer.key,
        p2Name: outer.name,
        orbStr: a.orb_str,
        isTransit: false,
      },
    });
  }
  // 特に強いものを先に、その中ではオーブが小さい（ぴったりな）順
  return result.sort((x, y) => Number(y.strong) - Number(x.strong) || x.orb - y.orb);
};

// 木星と土星のハウスから「追い風の分野」と「鍛える分野」をまとめる
export const jupiterSaturnNote = (planets: Planet[]): string | null => {
  const jupiter = planets.find(p => p.key === 'jupiter');
  const saturn = planets.find(p => p.key === 'saturn');
  const hj = jupiter ? HOUSE_LEARN[jupiter.house] : null;
  const hs = saturn ? HOUSE_LEARN[saturn.house] : null;
  if (!hj || !hs) return null;
  let text = `追い風が吹きやすいのは「${hj.field}」の分野（木星・第${hj.house}ハウス）、時間をかけてプロになれるのは「${hs.field}」の分野（土星・第${hs.house}ハウス）です。`;
  if (hj.house === hs.house) {
    text += `木星と土星が同じ第${hj.house}ハウスにあるので、この分野は「伸びやすいけれど責任も大きい」、人生の大きなテーマになります。`;
  }
  return text;
};

// ソフト・ハードのどちらが多いか
export const outerAspectNotes = (list: OuterAspect[]): string[] => {
  if (list.length === 0) {
    return ['個人的な天体と外側の天体のあいだに、目立ったアスペクトはありません。外側の天体は、世代の空気として背景で静かに働きます。'];
  }
  const soft = list.filter(a => ASPECT_LEARN[a.angle]?.nature === 'ソフト').length;
  const hard = list.filter(a => ASPECT_LEARN[a.angle]?.nature === 'ハード').length;
  const notes: string[] = [];
  if (hard > soft) {
    notes.push(`ハードなアスペクトが多めです（ハード${hard}・ソフト${soft}）。外側の天体からの刺激を受けやすく、葛藤をバネにして成長していくタイプです。`);
  } else if (soft > hard) {
    notes.push(`ソフトなアスペクトが多めです（ソフト${soft}・ハード${hard}）。外側の天体の力を自然に取り入れられ、流れに乗るのが上手なタイプです。`);
  } else {
    notes.push(`ソフトとハードがほどよく混ざっています（ソフト${soft}・ハード${hard}）。追い風と試練の両方から学べるタイプです。`);
  }
  const strong = list.filter(a => a.strong);
  if (strong.length > 0) {
    const names = strong.map(a => `${a.inner.name}×${a.outer.name}`).join('、');
    notes.push(`特に強いのは ${names} です。世代の星が個人的な天体と強く結びつくと、その世代の力が、あなた自身の個性としてはっきり表に出ます。`);
  }
  return notes;
};

// ---------- ステップ5：細部（ディグニティ・逆行） ----------

export type DignityKind = 'domicile' | 'exaltation' | 'detriment' | 'fall';

// 本来の場所（支配するサイン）。天王星・海王星・冥王星は近代の占星術で加えられたもの
const DOMICILE: Record<string, string[]> = {
  sun: ['獅子座'],
  moon: ['蟹座'],
  mercury: ['双子座', '乙女座'],
  venus: ['牡牛座', '天秤座'],
  mars: ['牡羊座', '蠍座'],
  jupiter: ['射手座', '魚座'],
  saturn: ['山羊座', '水瓶座'],
  uranus: ['水瓶座'],
  neptune: ['魚座'],
  pluto: ['蠍座'],
};

// 高揚のサイン（古典の7天体のみ。天王星〜冥王星の高揚は占星術師によって意見が分かれるので入れない）
const EXALTATION: Record<string, string> = {
  sun: '牡羊座',
  moon: '牡牛座',
  mercury: '乙女座',
  venus: '魚座',
  mars: '山羊座',
  jupiter: '蟹座',
  saturn: '天秤座',
};

const MODERN_RULERS = ['uranus', 'neptune', 'pluto'];

const ZODIAC = ['牡羊座', '牡牛座', '双子座', '蟹座', '獅子座', '乙女座', '天秤座', '蠍座', '射手座', '山羊座', '水瓶座', '魚座'];
const oppositeSign = (sign: string) => ZODIAC[(ZODIAC.indexOf(sign) + 6) % 12];

export const DIGNITY_LEARN: Record<DignityKind, { label: string; tone: 'good' | 'care'; text: string }> = {
  domicile: {
    label: '本来の場所（ドミサイル）',
    tone: 'good',
    text: '自分の家にいるような状態です。この天体の性質を、無理なく素直に発揮できます。',
  },
  exaltation: {
    label: '高揚（エグザルテーション）',
    tone: 'good',
    text: '大切なお客さんとして歓迎されているような状態です。この天体の力が高まり、良い形で表れやすくなります。',
  },
  detriment: {
    label: 'アウェー（デトリメント）',
    tone: 'care',
    text: '本来の場所の反対側で、アウェーにいるような状態です。性質を素直に出しにくいぶん、工夫や独自のやり方が育ちます。',
  },
  fall: {
    label: '力を出しにくい場所（フォール）',
    tone: 'care',
    text: '高揚の反対側で、力を出しにくい状態です。苦手意識を感じやすい一方、努力を重ねることで、かえって深い強みに変わります。',
  },
};

export interface DignityItem {
  planet: Planet;
  kinds: DignityKind[];  // 水星×乙女座のように、本来の場所と高揚を兼ねることがある
  modern: boolean;       // 近代の支配星による判定
}

export const findDignities = (planets: Planet[]): DignityItem[] => {
  const items: DignityItem[] = [];
  for (const key of MAJOR_10_KEYS) {
    const planet = planets.find(p => p.key === key);
    if (!planet) continue;
    const kinds: DignityKind[] = [];
    const homes = DOMICILE[key] ?? [];
    if (homes.includes(planet.sign)) kinds.push('domicile');
    if (EXALTATION[key] === planet.sign) kinds.push('exaltation');
    if (homes.map(oppositeSign).includes(planet.sign)) kinds.push('detriment');
    if (EXALTATION[key] && oppositeSign(EXALTATION[key]) === planet.sign) kinds.push('fall');
    if (kinds.length > 0) items.push({ planet, kinds, modern: MODERN_RULERS.includes(key) });
  }
  return items;
};

// 逆行しているときの読み方（太陽・月は逆行しない）
export const RETRO_LEARN: Record<string, string> = {
  mercury: '考えを外に出す前に、頭の中でじっくり練るタイプです。言葉を選ぶのに時間がかかる一方、深く考え抜いた独自の視点を持てます。',
  venus: '好きなものや愛し方が、流行や人の基準に流されず、自分だけの価値観になりやすいタイプです。愛情表現は控えめでも、深く一途です。',
  mars: 'やる気や怒りが、すぐ外に出ずに内側で燃えるタイプです。動き出すまで慎重ですが、そのぶん狙いを定めた行動ができます。',
  jupiter: '成長や幸運が、外の成功より、心の豊かさや自分なりの信念として育つタイプです。',
  saturn: '人から課されるルールより、自分で自分に課す厳しさが強いタイプです。自分なりの規律や責任の形を、時間をかけて見つけます。',
  uranus: '変化や自由を求める気持ちが、外への反発より、内面の目覚めとして表れやすいとされます。',
  neptune: '夢や理想が、外の世界より、心の中の豊かな想像として育ちやすいとされます。',
  pluto: '深く作り変える力が、外の出来事より、自分の内面を変えていく力として働きやすいとされます。',
};

const SLOW_RETRO = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

export const findRetrogrades = (planets: Planet[]): Planet[] =>
  MAJOR_10_KEYS.map(k => planets.find(p => p.key === k)).filter((p): p is Planet => !!p && p.is_retrograde && !!RETRO_LEARN[p.key]);

const isGood = (d: DignityItem) => d.kinds.some(k => DIGNITY_LEARN[k].tone === 'good');

// 骨格の天体が居心地のいい／出しにくいサインにあるとき、ステップ2の読みにどう足されるか
const SKELETON_DIGNITY_NOTES: Record<string, { good: string; care: string }> = {
  sun: {
    good: '「目指す自分」を、迷わずまっすぐ生きやすい',
    care: '「目指す自分」の形を、時間をかけて自分なりに見つけていく',
  },
  moon: {
    good: '素の気持ちを素直に出しやすく、心が安定しやすい',
    care: '素の気持ちを出しにくいぶん、自分の心をいたわる時間が大切になる',
  },
  ruler: {
    good: '人生の舵取りを、自分らしく迷わず進めやすい',
    care: '人生の舵取りは、決まったやり方より、自分なりの工夫で進める形になりやすい',
  },
};

// 逆行している個人天体が、内側でどう働くか
const RETRO_SHORT: Record<string, string> = {
  mercury: '考えを外に出す前に、内側でじっくり練る',
  venus: '好きなものや愛し方を、自分だけの価値観で育てる',
  mars: 'やる気を内側で燃やし、狙いを定めてから動く',
};

// ステップ5だけでは見えない、ほかのステップ（ハウス・骨格）とつなげた読み
export const detailNotes = (
  dignities: DignityItem[],
  retros: Planet[],
  planets: Planet[],
  houses: HouseCusp[],
): string[] => {
  const notes: string[] = [];

  // 1. 居心地のいい天体・出しにくい天体は、人生のどの場面にあるか
  for (const d of dignities) {
    const h = HOUSE_LEARN[d.planet.house];
    if (!h) continue;
    notes.push(
      isGood(d)
        ? `居心地のいい${d.planet.name}は第${h.house}ハウスにあるので、「${h.field}」の場面が、あなたが自然に力を出せる得意分野です。`
        : `出しにくいサインにある${d.planet.name}は第${h.house}ハウスにあるので、「${h.field}」の場面は、工夫を重ねるほど強みに変わる分野です。`,
    );
  }

  // 2. 骨格の天体（太陽・月・チャートルーラー）がどの状態か
  const ruler = findChartRuler(planets, houses);
  const skeleton: { role: string; label: string; key: string }[] = [
    { role: 'sun', label: '太陽', key: 'sun' },
    { role: 'moon', label: '月', key: 'moon' },
    ...(ruler ? [{ role: 'ruler', label: `チャートルーラーの${ruler.planet.name}`, key: ruler.planet.key }] : []),
  ];
  let skeletonHit = false;
  for (const s of skeleton) {
    const d = dignities.find(x => x.planet.key === s.key);
    if (!d) continue;
    skeletonHit = true;
    const n = SKELETON_DIGNITY_NOTES[s.role];
    notes.push(`骨格の天体のうち、${s.label}が${isGood(d) ? '居心地のいい' : '出しにくい'}サインにあります。ステップ2で読んだ内容に加えて、${isGood(d) ? n.good : n.care}と読めます。`);
  }
  if (!skeletonHit) {
    notes.push('骨格の天体（太陽・月・チャートルーラー）は、どれも特別な状態ではありません。ステップ2で読んだ内容が、そのまま素直に表れます。');
  }

  // 3. 逆行している個人天体は、どの場面で内側に向かうか
  const personal = retros.filter(p => !SLOW_RETRO.includes(p.key));
  for (const p of personal) {
    const h = HOUSE_LEARN[p.house];
    if (!h || !RETRO_SHORT[p.key]) continue;
    notes.push(`逆行している${p.name}は第${h.house}ハウスにあるので、「${h.field}」の場面で、${RETRO_SHORT[p.key]}タイプです。`);
  }
  if (personal.length === 0) {
    notes.push('水星・金星・火星は逆行していないので、ステップ3で読んだ考え方・愛し方・行動の仕方は、外に向かって素直に表れます。');
  }
  return notes;
};
