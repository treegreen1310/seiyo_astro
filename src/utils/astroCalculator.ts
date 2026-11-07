import { createSwissEph, Body, HouseSystem, type SwissEph } from '@kuntay/swisseph';
import { HoroscopeData, Planet, HouseCusp, Aspect } from '../types/horoscope';

// 12サイン定義
const SIGNS = [
  { name: '牡羊座', symbol: '♈' },
  { name: '牡牛座', symbol: '♉' },
  { name: '双子座', symbol: '♊' },
  { name: '蟹座', symbol: '♋' },
  { name: '獅子座', symbol: '♌' },
  { name: '乙女座', symbol: '♍' },
  { name: '天秤座', symbol: '♎' },
  { name: '蠍座', symbol: '♏' },
  { name: '射手座', symbol: '♐' },
  { name: '山羊座', symbol: '♑' },
  { name: '水瓶座', symbol: '♒' },
  { name: '魚座', symbol: '♓' },
];

// サイン支配星（ルーラー）
const SIGN_RULERS = [
  '火星', '金星', '水星', '月', '太陽', '水星',
  '金星', '冥王星', '木星', '土星', '天王星', '海王星'
];

// アスペクト定義（円盤・マトリクス・詳細リスト・右側カードで完全統一）
// 150°（インコンジャンクト）はどの天体の時もオーブ2.0°
const ASPECT_DEFINITIONS = [
  { name: 'コンジャンクション', symbol: '☌', angle: 0, maxOrb: 7.0 },
  { name: 'セクスタイル', symbol: '⚹', angle: 60, maxOrb: 5.0 },
  { name: 'スクエア', symbol: '□', angle: 90, maxOrb: 6.0 },
  { name: 'トライン', symbol: '△', angle: 120, maxOrb: 7.0 },
  { name: 'インコンジャンクト', symbol: '⚻', angle: 150, maxOrb: 2.0 },
  { name: 'オポジション', symbol: '☍', angle: 180, maxOrb: 7.0 },
];

const OUTER_PLANET_KEYS = new Set(['uranus', 'neptune', 'pluto']);

function getNatalMaxOrb(p1Key: string, p2Key: string, angle: number, defaultOrb: number): number {
  if (angle === 150) return 2.0;
  // 天王星・海王星・冥王星同士のオーブは5.0°
  if (OUTER_PLANET_KEYS.has(p1Key) && OUTER_PLANET_KEYS.has(p2Key)) {
    return 5.0;
  }
  return defaultOrb;
}

function degToDegMinStr(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${m.toString().padStart(2, '0')}'`;
}

function getHouseForDeg(deg: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const c1 = cusps[i];
    const c2 = cusps[(i + 1) % 12];
    if (c1 < c2) {
      if (deg >= c1 && deg < c2) return i + 1;
    } else {
      // 魚座から牡羊座への跨ぎ
      if (deg >= c1 || deg < c2) return i + 1;
    }
  }
  return 1;
}

// SwissEph シングルトンインスタンス
let sweInstancePromise: Promise<SwissEph> | null = null;

async function getSweInstance(): Promise<SwissEph> {
  if (!sweInstancePromise) {
    sweInstancePromise = (async () => {
      try {
        const swe = await createSwissEph();
        // 小惑星用seas_18.se1ファイルを読み込んでマウント
        try {
          const res = await fetch('/ephe/seas_18.se1');
          if (res.ok) {
            const buffer = await res.arrayBuffer();
            swe.mountEphemeris({ 'seas_18.se1': buffer });
          }
        } catch (err) {
          console.warn('Could not load /ephe/seas_18.se1 for asteroids:', err);
        }
        return swe;
      } catch (err) {
        sweInstancePromise = null;
        throw err;
      }
    })();
  }
  return sweInstancePromise;
}

export interface CalculateParams {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
  latitude: number;
  longitude: number;
  timezone?: number;
}

/**
 * ブラウザ内完結の高速・高精度ホロスコープ計算関数 (WebAssembly / Swiss Ephemeris)
 * サーバー通信を行わず、クライアントのCPUで瞬時に精密計算を行います。
 */
export async function calculateHoroscopeLocally(params: CalculateParams): Promise<HoroscopeData> {
  const swe = await getSweInstance();

  const timezone = params.timezone ?? 9.0;
  const second = params.second ?? 0;

  // UTCへの変換
  let totalHoursUtc = params.hour + params.minute / 60.0 + second / 3600.0 - timezone;
  let curY = params.year;
  let curM = params.month;
  let curD = params.day;

  // 日付の繰り越し/繰り下げ
  while (totalHoursUtc < 0) {
    totalHoursUtc += 24;
    const prevDate = new Date(Date.UTC(curY, curM - 1, curD - 1));
    curY = prevDate.getUTCFullYear();
    curM = prevDate.getUTCMonth() + 1;
    curD = prevDate.getUTCDate();
  }
  while (totalHoursUtc >= 24) {
    totalHoursUtc -= 24;
    const nextDate = new Date(Date.UTC(curY, curM - 1, curD + 1));
    curY = nextDate.getUTCFullYear();
    curM = nextDate.getUTCMonth() + 1;
    curD = nextDate.getUTCDate();
  }

  const jd = swe.julianDay(curY, curM, curD, totalHoursUtc);

  // ハウス計算（プラシーダス）
  const housesResult = swe.houses(jd, params.latitude, params.longitude, HouseSystem.Placidus);
  const cusps = housesResult.cusps.slice(0, 12);
  const ascDeg = housesResult.ascendant;
  const mcDeg = housesResult.midheaven ?? cusps[9];
  const vertexDeg = housesResult.vertex ?? 0;

  const houseList: HouseCusp[] = [];
  const houseRulers: Record<number, string> = {};

  for (let i = 0; i < 12; i++) {
    const deg = cusps[i];
    const sIdx = Math.floor(deg / 30) % 12;
    const dInS = deg % 30;
    const ruler = SIGN_RULERS[sIdx];
    houseRulers[i + 1] = ruler;

    houseList.push({
      house: i + 1,
      cusp_deg: deg,
      sign: SIGNS[sIdx].name,
      sign_symbol: SIGNS[sIdx].symbol,
      degree_str: degToDegMinStr(dInS),
      degree_decimal: Number(dInS.toFixed(2)),
      ruler: ruler,
      planets: []
    });
  }

  // 主要10天体
  const major10Config: Array<[string, string, string, number, string]> = [
    ['sun', '太陽', '☉', Body.Sun, 'planet'],
    ['moon', '月', '☽', Body.Moon, 'planet'],
    ['mercury', '水星', '☿', Body.Mercury, 'planet'],
    ['venus', '金星', '♀', Body.Venus, 'planet'],
    ['mars', '火星', '♂', Body.Mars, 'planet'],
    ['jupiter', '木星', '♃', Body.Jupiter, 'planet'],
    ['saturn', '土星', '♄', Body.Saturn, 'planet'],
    ['uranus', '天王星', '♅', Body.Uranus, 'planet'],
    ['neptune', '海王星', '♆', Body.Neptune, 'planet'],
    ['pluto', '冥王星', '♇', Body.Pluto, 'planet'],
  ];

  const planetsData: Planet[] = [];

  for (const [key, name, symbol, bid, category] of major10Config) {
    const calc = swe.calc(jd, bid);
    const deg = calc.longitude;
    const speed = calc.longitudeSpeed;
    const sIdx = Math.floor(deg / 30) % 12;
    const dInS = deg % 30;
    const hIdx = getHouseForDeg(deg, cusps);
    const isRetro = speed < 0;

    const ruled = Object.entries(houseRulers)
      .filter(([_, r]) => r === name)
      .map(([h]) => `${h}ハウス`);
    const ruledStr = ruled.length > 0 ? ruled.join(', ') : '-';

    planetsData.push({
      key,
      name,
      symbol,
      category,
      abs_deg: deg,
      sign: SIGNS[sIdx].name,
      sign_symbol: SIGNS[sIdx].symbol,
      deg_in_sign: degToDegMinStr(dInS),
      deg_decimal: Number(dInS.toFixed(2)),
      house: hIdx,
      ruled_houses: ruledStr,
      is_retrograde: isRetro
    });

    houseList[hIdx - 1].planets.push(name);
  }

  // ユーザー指定の厳密な順序で後続の感受点・小惑星を追加
  // 順序: ASC、MC、ヘッド、テイル、セレス、キロン、ジュノー、パラス、ベスタ、リリス、バーテクス、パートオブフォーチュン

  // 1. ASC
  const ascS = Math.floor(ascDeg / 30) % 12;
  const ascD = ascDeg % 30;
  planetsData.push({
    key: 'asc',
    name: 'ASC',
    symbol: 'ASC',
    category: 'angle',
    abs_deg: ascDeg,
    sign: SIGNS[ascS].name,
    sign_symbol: SIGNS[ascS].symbol,
    deg_in_sign: degToDegMinStr(ascD),
    deg_decimal: Number(ascD.toFixed(2)),
    house: 1,
    ruled_houses: '-',
    is_retrograde: false
  });

  // 2. MC
  const mcS = Math.floor(mcDeg / 30) % 12;
  const mcD = mcDeg % 30;
  planetsData.push({
    key: 'mc',
    name: 'MC',
    symbol: 'MC',
    category: 'angle',
    abs_deg: mcDeg,
    sign: SIGNS[mcS].name,
    sign_symbol: SIGNS[mcS].symbol,
    deg_in_sign: degToDegMinStr(mcD),
    deg_decimal: Number(mcD.toFixed(2)),
    house: 10,
    ruled_houses: '-',
    is_retrograde: false
  });

  // 3. ヘッド (Mean Node)
  const nodeCalc = swe.calc(jd, Body.MeanNode);
  const nodeDeg = nodeCalc.longitude;
  const nodeS = Math.floor(nodeDeg / 30) % 12;
  const nodeD = nodeDeg % 30;
  const nodeH = getHouseForDeg(nodeDeg, cusps);
  planetsData.push({
    key: 'mean_node',
    name: 'ヘッド',
    symbol: '☊',
    category: 'node',
    abs_deg: nodeDeg,
    sign: SIGNS[nodeS].name,
    sign_symbol: SIGNS[nodeS].symbol,
    deg_in_sign: degToDegMinStr(nodeD),
    deg_decimal: Number(nodeD.toFixed(2)),
    house: nodeH,
    ruled_houses: '-',
    is_retrograde: nodeCalc.longitudeSpeed < 0
  });
  houseList[nodeH - 1].planets.push('ヘッド');

  // 4. テイル (ヘッド + 180度)
  const tailDeg = (nodeDeg + 180.0) % 360.0;
  const tailS = Math.floor(tailDeg / 30) % 12;
  const tailD = tailDeg % 30;
  const tailH = getHouseForDeg(tailDeg, cusps);
  planetsData.push({
    key: 'tail',
    name: 'テイル',
    symbol: '☋',
    category: 'node',
    abs_deg: tailDeg,
    sign: SIGNS[tailS].name,
    sign_symbol: SIGNS[tailS].symbol,
    deg_in_sign: degToDegMinStr(tailD),
    deg_decimal: Number(tailD.toFixed(2)),
    house: tailH,
    ruled_houses: '-',
    is_retrograde: true
  });
  houseList[tailH - 1].planets.push('テイル');

  // 小惑星・感受点ヘルパー
  const addAsteroid = (key: string, name: string, symbol: string, bodyId: number, category: string) => {
    try {
      const c = swe.calc(jd, bodyId);
      const d = c.longitude;
      const s = Math.floor(d / 30) % 12;
      const degInS = d % 30;
      const h = getHouseForDeg(d, cusps);
      planetsData.push({
        key,
        name,
        symbol,
        category,
        abs_deg: d,
        sign: SIGNS[s].name,
        sign_symbol: SIGNS[s].symbol,
        deg_in_sign: degToDegMinStr(degInS),
        deg_decimal: Number(degInS.toFixed(2)),
        house: h,
        ruled_houses: '-',
        is_retrograde: c.longitudeSpeed < 0
      });
      houseList[h - 1].planets.push(name);
    } catch (err) {
      console.warn(`Could not calculate body ${name}:`, err);
    }
  };

  // 5. セレス
  addAsteroid('ceres', 'セレス', '⚳', Body.Ceres, 'asteroid');

  // 6. キロン
  addAsteroid('chiron', 'キロン', '⚷', Body.Chiron, 'asteroid');

  // 7. ジュノー
  addAsteroid('juno', 'ジュノー', '⚵', Body.Juno, 'asteroid');

  // 8. パラス
  addAsteroid('pallas', 'パラス', '⚴', Body.Pallas, 'asteroid');

  // 9. ベスタ
  addAsteroid('vesta', 'ベスタ', '⚶', Body.Vesta, 'asteroid');

  // 10. リリス (Mean Apogee)
  addAsteroid('mean_apog', 'リリス', '⚸', Body.BlackMoonLilithMean, 'virtual');

  // 11. バーテクス
  const vtS = Math.floor(vertexDeg / 30) % 12;
  const vtD = vertexDeg % 30;
  const vtH = getHouseForDeg(vertexDeg, cusps);
  planetsData.push({
    key: 'vertex',
    name: 'バーテクス',
    symbol: 'Vt',
    category: 'angle',
    abs_deg: vertexDeg,
    sign: SIGNS[vtS].name,
    sign_symbol: SIGNS[vtS].symbol,
    deg_in_sign: degToDegMinStr(vtD),
    deg_decimal: Number(vtD.toFixed(2)),
    house: vtH,
    ruled_houses: '-',
    is_retrograde: false
  });

  // 12. パート・オブ・フォーチュン (PoF)
  const sunDeg = planetsData.find(p => p.key === 'sun')?.abs_deg ?? 0;
  const moonDeg = planetsData.find(p => p.key === 'moon')?.abs_deg ?? 0;
  const sunH = getHouseForDeg(sunDeg, cusps);
  const isDay = sunH >= 7 && sunH <= 12;
  let pofDeg = isDay
    ? (ascDeg + moonDeg - sunDeg) % 360.0
    : (ascDeg + sunDeg - moonDeg) % 360.0;
  if (pofDeg < 0) pofDeg += 360.0;
  const pofS = Math.floor(pofDeg / 30) % 12;
  const pofD = pofDeg % 30;
  const pofH = getHouseForDeg(pofDeg, cusps);
  planetsData.push({
    key: 'pof',
    name: 'パートオブフォーチュン',
    symbol: 'PoF',
    category: 'lot',
    abs_deg: pofDeg,
    sign: SIGNS[pofS].name,
    sign_symbol: SIGNS[pofS].symbol,
    deg_in_sign: degToDegMinStr(pofD),
    deg_decimal: Number(pofD.toFixed(2)),
    house: pofH,
    ruled_houses: '-',
    is_retrograde: false
  });
  houseList[pofH - 1].planets.push('PoF パートオブフォーチュン');

  // アスペクト計算
  const aspectList: Aspect[] = [];
  const aspectMatrix: Record<string, Record<string, Aspect>> = {};

  for (let i = 0; i < planetsData.length; i++) {
    const p1 = planetsData[i];
    aspectMatrix[p1.key] = {};
    for (let j = 0; j < planetsData.length; j++) {
      if (i >= j) continue;
      const p2 = planetsData[j];
      let diff = Math.abs(p1.abs_deg - p2.abs_deg) % 360.0;
      if (diff > 180.0) diff = 360.0 - diff;

      for (const asp of ASPECT_DEFINITIONS) {
        const orb = Math.abs(diff - asp.angle);
        const allowedOrb = getNatalMaxOrb(p1.key, p2.key, asp.angle, asp.maxOrb);
        if (orb <= allowedOrb) {
          const aspectObj: Aspect = {
            p1_key: p1.key,
            p1_name: p1.name,
            p2_key: p2.key,
            p2_name: p2.name,
            aspect_name: asp.name,
            aspect_symbol: asp.symbol,
            target_angle: asp.angle,
            orb: Number(orb.toFixed(2)),
            orb_str: `${orb.toFixed(2)}°`
          };
          aspectList.push(aspectObj);
          aspectMatrix[p1.key][p2.key] = aspectObj;
          break;
        }
      }
    }
  }

  const dtStr = `${params.year}年${params.month}月${params.day}日 ${params.hour.toString().padStart(2, '0')}:${params.minute.toString().padStart(2, '0')}`;

  return {
    success: true,
    chart_info: {
      year: params.year,
      month: params.month,
      day: params.day,
      hour: params.hour,
      minute: params.minute,
      lat: params.latitude,
      lon: params.longitude,
      timezone: timezone,
      datetime_str: dtStr
    },
    planets: planetsData,
    houses: houseList,
    cusps: cusps,
    aspects: aspectList,
    aspect_matrix: aspectMatrix
  };
}
