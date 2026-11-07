import React, { useMemo } from 'react';
import { HoroscopeData } from '../types/horoscope';
import { isLearnable } from '../data/learn/basics';
import { AspectTarget } from '../data/learn/aspects';
import { Term } from './Term';

interface Props {
  data: HoroscopeData;
  isDoubleCircle?: boolean;
  transitData?: HoroscopeData | null;
  selectedPlanetKey: string | null;
  onSelectPlanet: (key: string | null) => void;
  showAsteroids?: boolean;                          // 一重円で小惑星・感受点を描くか
  onToggleAsteroids?: () => void;
  onLearn?: (key: string) => void;                  // 天体の解説パネルを開く
  onLearnAspect?: (target: AspectTarget) => void;   // アスペクトの解説パネルを開く
  size?: number;
}

// 4エレメント（火・地・風・水）に調和する大人フェミニンなニュアンスカラー
const SIGN_COLORS = [
  '#E8B4AE', // 牡羊座 (Fire: テラコッタローズ)
  '#C8D5B9', // 牡牛座 (Earth: セージグリーン)
  '#F2DFB6', // 双子座 (Air: シャンパンベージュ)
  '#BFD3DF', // 蟹座 (Water: ミスティブルー)
  '#E8B4AE', // 獅子座 (Fire)
  '#C8D5B9', // 乙女座 (Earth)
  '#F2DFB6', // 天秤座 (Air)
  '#BFD3DF', // 蠍座 (Water)
  '#E8B4AE', // 射手座 (Fire)
  '#C8D5B9', // 山羊座 (Earth)
  '#F2DFB6', // 水瓶座 (Air)
  '#BFD3DF', // 魚座 (Water)
];

const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

// 二重円時に表示する天体: 主要10天体 ＋ ASC ＋ MC のみ
export const DOUBLE_CIRCLE_KEYS = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'asc', 'mc'
];

// 一重円の小惑星ボタンで表示を切り替える感受点・小惑星（テイル、セレス、キロン、ジュノー、パラス、ベスタ、リリス、バーテクス、パートオブフォーチュン）
const ASTEROID_KEYS = ['tail', 'ceres', 'chiron', 'juno', 'pallas', 'vesta', 'mean_apog', 'vertex', 'pof'];

const OUTER_PLANET_KEYS = new Set(['uranus', 'neptune', 'pluto']);

// 一重円（ネイタル）時の許容オーブ計算
// ・天王星・海王星・冥王星同士は 5.0°
// ・150°（インコンジャンクト）はどの天体の時も 2.0°
export const getNatalMaxOrb = (key1: string, key2: string, angle: number, defaultOrb: number): number => {
  if (angle === 150) return 2.0;
  if (OUTER_PLANET_KEYS.has(key1) && OUTER_PLANET_KEYS.has(key2)) {
    return 5.0;
  }
  return defaultOrb;
};

// 二重円（ネイタル × トランジット）時の天体別許容オーブ基準
// ・太陽・月: 3.0° (2度〜3度)
// ・水星・金星・火星・木星・土星: 2.0° (1度〜2度)
// ・天王星・海王星・冥王星: 1.5° (1度〜1.5度)
// ・ネイタルASC・MC: 1.0°（150°インコンジャンクトは除外）
// ・150°（インコンジャンクト）は最大でも2.0°を超えない
// 2天体のうち、よりタイトな（小さい方の）オーブ基準を優先適用する
export const getDoubleCirclePlanetOrb = (key: string): number => {
  if (key === 'asc' || key === 'mc') return 1.0;
  if (key === 'sun' || key === 'moon') return 3.0;
  if (key === 'uranus' || key === 'neptune' || key === 'pluto') return 1.5;
  return 2.0; // mercury, venus, mars, jupiter, saturn
};

export const getDoubleCirclePairMaxOrb = (key1: string, key2: string, angle: number): number => {
  const pairOrb = Math.min(getDoubleCirclePlanetOrb(key1), getDoubleCirclePlanetOrb(key2));
  return angle === 150 ? Math.min(pairOrb, 2.0) : pairOrb;
};

// 度数からネイタルのハウス番号を算出するヘルパー
export const getHouseInNatalCusps = (deg: number, cusps: number[]): number => {
  if (!cusps || cusps.length < 12) return 1;
  const normDeg = ((deg % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const c1 = ((cusps[i] % 360) + 360) % 360;
    const c2 = ((cusps[(i + 1) % 12] % 360) + 360) % 360;
    if (c1 < c2) {
      if (normDeg >= c1 && normDeg < c2) return i + 1;
    } else {
      if (normDeg >= c1 || normDeg < c2) return i + 1;
    }
  }
  return 1;
};

export const HoroscopeWheel: React.FC<Props> = ({
  data,
  isDoubleCircle = false,
  transitData = null,
  selectedPlanetKey,
  onSelectPlanet,
  showAsteroids = true,
  onToggleAsteroids,
  onLearn,
  onLearnAspect,
  size = 530
}) => {
  const [hoveredAspectId, setHoveredAspectId] = React.useState<number | null>(null);
  // クリックで固定表示しているアスペクト線
  const [pinnedAspectId, setPinnedAspectId] = React.useState<number | null>(null);

  const center = size / 2;
  const radius = size * 0.44;
  const signRingWidth = size * 0.054;
  const rOuter = radius;
  const rInnerSign = rOuter - signRingWidth;
  const rCenterHole = size * 0.075;

  const rTransitPlanets = rInnerSign * 0.88;
  const rNatalPlanets = isDoubleCircle ? rInnerSign * 0.62 : rInnerSign * 0.72;

  // ASCの度数
  const ascDeg = useMemo(() => {
    if (!data || !data.planets) return 0;
    const asc = data.planets.find(p => p.key === 'asc');
    return asc ? asc.abs_deg : (data.cusps && data.cusps[0]) || 0;
  }, [data]);

  const degToRad = (deg: number) => {
    const chartAngle = (180 - (deg - ascDeg)) % 360;
    return (chartAngle * Math.PI) / 180;
  };

  const getCoord = (deg: number, r: number) => {
    const rad = degToRad(deg);
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad)
    };
  };

  // サイン帯
  const signArcs = useMemo(() => {
    const arcs = [];
    for (let i = 0; i < 12; i++) {
      const startDeg = i * 30;
      const endDeg = (i + 1) * 30;
      const midDeg = i * 30 + 15;

      const p1 = getCoord(startDeg, rOuter);
      const p2 = getCoord(endDeg, rOuter);
      const p3 = getCoord(endDeg, rInnerSign);
      const p4 = getCoord(startDeg, rInnerSign);

      const path = `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 0 0 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInnerSign} ${rInnerSign} 0 0 1 ${p4.x} ${p4.y} Z`;
      const textCoord = getCoord(midDeg, (rOuter + rInnerSign) / 2);

      arcs.push({
        idx: i,
        path,
        textCoord,
        symbol: SIGN_SYMBOLS[i],
        color: SIGN_COLORS[i]
      });
    }
    return arcs;
  }, [center, rOuter, rInnerSign, ascDeg]);

  // ハウスカスプ線
  const houseLines = useMemo(() => {
    if (!data || !data.cusps) return [];
    return data.cusps.map((cuspDeg, idx) => {
      const p1 = getCoord(cuspDeg, rInnerSign);
      const p2 = getCoord(cuspDeg, rCenterHole);
      const isAngle = idx === 0 || idx === 3 || idx === 6 || idx === 9;
      return {
        houseNum: idx + 1,
        p1,
        p2,
        isAngle,
        deg: cuspDeg
      };
    });
  }, [data?.cusps, rInnerSign, rCenterHole, center, ascDeg]);

  // ハウス番号
  const houseNumbers = useMemo(() => {
    if (!data || !data.cusps) return [];
    return data.cusps.map((cuspDeg, idx) => {
      const nextCusp = data.cusps[(idx + 1) % 12];
      let diff = (nextCusp - cuspDeg) % 360;
      if (diff < 0) diff += 360;
      const midDeg = cuspDeg + diff / 2;
      const coord = getCoord(midDeg, rCenterHole + 15);
      return {
        num: idx + 1,
        coord
      };
    });
  }, [data?.cusps, rCenterHole, center, ascDeg]);

  // ネイタル天体配置
  const positionedNatalPlanets = useMemo(() => {
    if (!data || !data.planets) return [];
    let list = [...data.planets];

    if (isDoubleCircle) {
      list = list.filter(p => DOUBLE_CIRCLE_KEYS.includes(p.key) && p.key !== 'asc' && p.key !== 'mc');
    } else {
      list = list.filter(
        p => p.key !== 'asc' && p.key !== 'mc' && (showAsteroids || !ASTEROID_KEYS.includes(p.key))
      );
    }

    list.sort((a, b) => a.abs_deg - b.abs_deg);

    return list.map((p, idx) => {
      let rOffset = 0;
      if (idx > 0) {
        const prev = list[idx - 1];
        let diff = Math.abs(p.abs_deg - prev.abs_deg) % 360;
        if (diff > 180) diff = 360 - diff;
        if (diff < 6.5) {
          rOffset = idx % 2 === 1 ? 18 : -18;
        }
      }
      const coord = getCoord(p.abs_deg, rNatalPlanets + rOffset);
      return {
        ...p,
        coord
      };
    });
  }, [data?.planets, isDoubleCircle, showAsteroids, rNatalPlanets, center, ascDeg]);

  // トランジット天体配置
  const positionedTransitPlanets = useMemo(() => {
    if (!isDoubleCircle || !transitData || !transitData.planets) return [];
    const list = [...transitData.planets]
      .filter(p => DOUBLE_CIRCLE_KEYS.includes(p.key) && p.key !== 'asc' && p.key !== 'mc')
      .sort((a, b) => a.abs_deg - b.abs_deg);

    return list.map((p, idx) => {
      let rOffset = 0;
      if (idx > 0) {
        const prev = list[idx - 1];
        let diff = Math.abs(p.abs_deg - prev.abs_deg) % 360;
        if (diff > 180) diff = 360 - diff;
        if (diff < 6.5) {
          rOffset = idx % 2 === 1 ? 14 : -14;
        }
      }
      const coord = getCoord(p.abs_deg, rTransitPlanets + rOffset);
      return {
        ...p,
        coord
      };
    });
  }, [isDoubleCircle, transitData, rTransitPlanets, center, ascDeg]);

  // アスペクト線（視認性を維持しつつ上品なトーンに調和）
  const aspectLines = useMemo(() => {
    const list: any[] = [];
    if (!data || !data.planets) return list;

    const ASPECT_DEFS = [
      { name: 'コンジャンクション', angle: 0, orb: 7.0, color: '#5B7DB1', width: 2.0 },
      { name: 'セクスタイル', angle: 60, orb: 5.0, color: '#689F84', width: 1.4 },
      { name: 'スクエア', angle: 90, orb: 6.0, color: '#C86D6A', width: 1.9 },
      { name: 'トライン', angle: 120, orb: 7.0, color: '#5B7DB1', width: 2.0 },
      { name: 'インコンジャンクト', angle: 150, orb: 2.0, color: '#9A7AA0', width: 1.2 },
      { name: 'オポジション', angle: 180, orb: 7.0, color: '#C86D6A', width: 2.0 },
    ];

    if (!isDoubleCircle) {
      // 1重円ネイタル（主要10天体 ＋ ASC）
      const natalTargets = data.planets.filter(p => DOUBLE_CIRCLE_KEYS.includes(p.key) && p.key !== 'mc');
      let idx = 0;
      for (let i = 0; i < natalTargets.length; i++) {
        for (let j = i + 1; j < natalTargets.length; j++) {
          const p1 = natalTargets[i];
          const p2 = natalTargets[j];
          let diff = Math.abs(p1.abs_deg - p2.abs_deg) % 360;
          if (diff > 180) diff = 360 - diff;

          for (const ad of ASPECT_DEFS) {
            const orb = Math.abs(diff - ad.angle);
            const allowedOrb = getNatalMaxOrb(p1.key, p2.key, ad.angle, ad.orb);
            if (orb <= allowedOrb) {
              const p1Coord = getCoord(p1.abs_deg, rNatalPlanets - 18);
              const p2Coord = getCoord(p2.abs_deg, rNatalPlanets - 18);
              list.push({
                id: idx++,
                x1: p1Coord.x,
                y1: p1Coord.y,
                x2: p2Coord.x,
                y2: p2Coord.y,
                color: ad.color,
                strokeWidth: ad.width,
                name: ad.name,
                p1_name: p1.name,
                p2_name: p2.name,
                target_angle: ad.angle,
                orb_str: `${orb.toFixed(2)}°`,
                // 線を選んでから解説パネルを開くときに渡す情報
                target: {
                  angle: ad.angle,
                  p1Key: p1.key,
                  p1Name: p1.name,
                  p2Key: p2.key,
                  p2Name: p2.name,
                  orbStr: `${orb.toFixed(2)}°`,
                  isTransit: false,
                } as AspectTarget,
              });
              break;
            }
          }
        }
      }
    } else if (transitData && transitData.planets) {
      // 2重円: ネイタル（主要10天体+ASC+MC） × トランジット（主要10天体のみ、ASC/MCは除外）
      // 2天体のうち、よりオーブをタイトに設定すべき天体の基準を優先適用
      const natalTargets = data.planets.filter(p => DOUBLE_CIRCLE_KEYS.includes(p.key));
      const transitTargets = transitData.planets.filter(
        p => DOUBLE_CIRCLE_KEYS.includes(p.key) && p.key !== 'asc' && p.key !== 'mc'
      );

      let idx = 0;
      for (const np of natalTargets) {
        for (const tp of transitTargets) {
          let diff = Math.abs(np.abs_deg - tp.abs_deg) % 360;
          if (diff > 180) diff = 360 - diff;

          const isNatalAngle = np.key === 'asc' || np.key === 'mc';

          for (const ad of ASPECT_DEFS) {
            // ネイタルASC・MCの時は150°（インコンジャンクト）を見ない
            if (isNatalAngle && ad.angle === 150) continue;

            const maxOrb = getDoubleCirclePairMaxOrb(np.key, tp.key, ad.angle);
            const orb = Math.abs(diff - ad.angle);
            if (orb <= maxOrb) {
              const npCoord = getCoord(np.abs_deg, rNatalPlanets - 18);
              const tpCoord = getCoord(tp.abs_deg, rTransitPlanets - 16);
              list.push({
                id: idx++,
                x1: npCoord.x,
                y1: npCoord.y,
                x2: tpCoord.x,
                y2: tpCoord.y,
                color: ad.color,
                strokeWidth: ad.width,
                name: ad.name,
                p1_name: `N:${np.name}`,
                p2_name: `T:${tp.name}`,
                target_angle: ad.angle,
                orb_str: `${orb.toFixed(2)}°`,
                target: {
                  angle: ad.angle,
                  p1Key: np.key,
                  p1Name: np.name,
                  p2Key: tp.key,
                  p2Name: tp.name,
                  orbStr: `${orb.toFixed(2)}°`,
                  isTransit: true,
                } as AspectTarget,
              });
              break;
            }
          }
        }
      }
    }

    return list;
  }, [data, transitData, isDoubleCircle, rNatalPlanets, rTransitPlanets, center, ascDeg]);

  // チャートが変わったら固定表示中のアスペクトを外す（線の番号が変わるため）
  React.useEffect(() => {
    setPinnedAspectId(null);
  }, [aspectLines]);

  // 触れている線を優先し、なければクリックで固定した線を表示
  const shownAspectId = hoveredAspectId ?? pinnedAspectId;
  const activeAspect = useMemo(() => {
    if (shownAspectId === null) return null;
    return aspectLines.find(al => al.id === shownAspectId) || null;
  }, [shownAspectId, aspectLines]);

  // 選択された天体情報（ネイタル天体 または トランジット天体）
  const activePlanetInfo = useMemo(() => {
    if (!data || !data.planets || !selectedPlanetKey) return null;

    const isTransit = selectedPlanetKey.startsWith('transit:');
    const rawKey = isTransit ? selectedPlanetKey.replace('transit:', '') : selectedPlanetKey;

    const ASPECT_DEFS = [
      { name: 'コンジャンクション', angle: 0, symbol: '☌' },
      { name: 'セクスタイル', angle: 60, symbol: '⚹' },
      { name: 'スクエア', angle: 90, symbol: '□' },
      { name: 'トライン', angle: 120, symbol: '△' },
      { name: 'インコンジャンクト', angle: 150, symbol: '⚻' },
      { name: 'オポジション', angle: 180, symbol: '☍' },
    ];

    if (isTransit) {
      if (!isDoubleCircle || !transitData || !transitData.planets) return null;
      const tPlanet = transitData.planets.find(p => p.key === rawKey);
      if (!tPlanet) return null;

      // ネイタルのハウスカスプ基準でどのハウスに入っているかを計算
      const natalHouse = getHouseInNatalCusps(tPlanet.abs_deg, data.cusps);
      // ネイタルチャートでその天体が支配するハウスを取得
      const correspondingNatal = data.planets.find(p => p.key === rawKey);
      const ruledHouses = correspondingNatal ? correspondingNatal.ruled_houses : '-';

      const relatedAspects: { label: string; target: AspectTarget }[] = [];
      const natalTargets = data.planets.filter(p => DOUBLE_CIRCLE_KEYS.includes(p.key));

      for (const np of natalTargets) {
        let diff = Math.abs(np.abs_deg - tPlanet.abs_deg) % 360;
        if (diff > 180) diff = 360 - diff;
        const isNatalAngle = np.key === 'asc' || np.key === 'mc';

        for (const ad of ASPECT_DEFS) {
          if (isNatalAngle && ad.angle === 150) continue;
          const maxOrb = getDoubleCirclePairMaxOrb(np.key, tPlanet.key, ad.angle);
          const orb = Math.abs(diff - ad.angle);
          if (orb <= maxOrb) {
            relatedAspects.push({
              label: `${ad.symbol} N:${np.name} (${ad.name} ${ad.angle}°, orb ${orb.toFixed(2)}°)`,
              target: {
                angle: ad.angle,
                p1Key: np.key,
                p1Name: np.name,
                p2Key: tPlanet.key,
                p2Name: tPlanet.name,
                orbStr: `${orb.toFixed(2)}°`,
                isTransit: true,
              },
            });
            break;
          }
        }
      }

      return {
        planet: {
          ...tPlanet,
          house: natalHouse,
          ruled_houses: ruledHouses,
        },
        isTransit: true,
        relatedAspects,
      };
    }

    // ネイタル天体が選択された場合
    const planet = data.planets.find(p => p.key === rawKey);
    if (!planet) return null;

    let relatedAspects: { label: string; target: AspectTarget }[] = [];

    if (!isDoubleCircle) {
      relatedAspects = (data.aspects || [])
        .filter(
          a =>
            (a.p1_key === rawKey || a.p2_key === rawKey) &&
            DOUBLE_CIRCLE_KEYS.includes(a.p1_key) &&
            DOUBLE_CIRCLE_KEYS.includes(a.p2_key)
        )
        .map(a => {
          const isP1 = a.p1_key === rawKey;
          const otherName = isP1 ? a.p2_name : a.p1_name;
          const sym = a.aspect_name === 'スクエア' ? '□' : a.aspect_symbol;
          return {
            label: `${sym} ${otherName} (${a.aspect_name} ${a.target_angle}°, orb ${a.orb_str})`,
            // 選択中の天体を先に置く
            target: {
              angle: a.target_angle,
              p1Key: rawKey,
              p1Name: isP1 ? a.p1_name : a.p2_name,
              p2Key: isP1 ? a.p2_key : a.p1_key,
              p2Name: otherName,
              orbStr: a.orb_str,
              isTransit: false,
            },
          };
        });
    } else if (transitData && transitData.planets) {
      const transitTargets = transitData.planets.filter(
        p => DOUBLE_CIRCLE_KEYS.includes(p.key) && p.key !== 'asc' && p.key !== 'mc'
      );
      const isNatalAngle = planet.key === 'asc' || planet.key === 'mc';
      for (const tp of transitTargets) {
        let diff = Math.abs(planet.abs_deg - tp.abs_deg) % 360;
        if (diff > 180) diff = 360 - diff;
        for (const ad of ASPECT_DEFS) {
          // ネイタルASC・MCの時は150°（インコンジャンクト）を見ない
          if (isNatalAngle && ad.angle === 150) continue;

          const maxOrb = getDoubleCirclePairMaxOrb(planet.key, tp.key, ad.angle);
          const orb = Math.abs(diff - ad.angle);
          if (orb <= maxOrb) {
            relatedAspects.push({
              label: `${ad.symbol} T:${tp.name} (${ad.name} ${ad.angle}°, orb ${orb.toFixed(2)}°)`,
              target: {
                angle: ad.angle,
                p1Key: planet.key,
                p1Name: planet.name,
                p2Key: tp.key,
                p2Name: tp.name,
                orbStr: `${orb.toFixed(2)}°`,
                isTransit: true,
              },
            });
            break;
          }
        }
      }
    }

    return {
      planet,
      isTransit: false,
      relatedAspects
    };
  }, [data, transitData, isDoubleCircle, selectedPlanetKey]);

  // 選択中のネイタル天体に解説がある場合、そのキー（トランジット天体は対象外）
  const learnKey =
    onLearn && activePlanetInfo && !activePlanetInfo.isTransit && isLearnable(activePlanetInfo.planet.key)
      ? activePlanetInfo.planet.key
      : null;

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%', flexWrap: 'wrap' }}>
      {/* ホロスコープ円盤本体カード */}
      <div className="astro-table-container" style={{ flex: '1 1 320px', maxWidth: '570px', width: '100%' }}>
        <div className="astro-table-title">
          {/* スマホでは「ホロスコープチャート」の後で改行する */}
          ホロスコープチャート<span className="desktop-only-inline">　</span>
          <br className="mobile-only-br" />
          （{isDoubleCircle ? 'ネイタル×トランジット' : 'ネイタル'}）
        </div>

        <div
          style={{
            padding: '18px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            position: 'relative'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '16px',
                fontWeight: 600,
                color: '#4A3F3A',
                letterSpacing: '0.04em'
              }}
            >
              ネイタルチャート
            </div>
            <div style={{ fontSize: '12.5px', color: '#8C7A70', marginTop: '2px' }}>
              {data?.chart_info?.datetime_str || ''}
            </div>
            {isDoubleCircle && transitData && (
              <div style={{ fontSize: '12.5px', color: '#A86461', fontWeight: 500, marginTop: '3px' }}>
                外円（トランジット）: {transitData.chart_info?.datetime_str || ''}
              </div>
            )}
          </div>

          {/* 円盤ラッパー（左上の余白に選択天体バッジを配置） */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: `${size}px`,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            {/* 一重円のみ：右上の小惑星表示切り替えボタン */}
            {!isDoubleCircle && onToggleAsteroids && (
              <button
                type="button"
                className={`wheel-asteroid-toggle${showAsteroids ? ' is-on' : ''}`}
                onClick={onToggleAsteroids}
                aria-pressed={showAsteroids}
              >
                {showAsteroids ? '小惑星 ON' : '小惑星 OFF'}
              </button>
            )}

            {/* 選択天体の左上ラベルバッジ（ホロスコープの円の外側左上あたりの余白） */}
            {activePlanetInfo && (
              <div
                className="wheel-planet-badge"
                // スマホでは詳細カードが出ないので、バッジを押して解説を開けるようにする
                role={learnKey ? 'button' : undefined}
                onClick={learnKey ? () => onLearn!(learnKey) : undefined}
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  zIndex: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: 'rgba(253, 251, 248, 0.96)',
                  border: activePlanetInfo.isTransit ? '1.5px solid #B89146' : '1.5px solid #C5A059',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  boxShadow: '0 4px 14px rgba(74, 63, 58, 0.12)',
                  pointerEvents: learnKey ? 'auto' : 'none',
                  cursor: learnKey ? 'pointer' : 'default'
                }}
              >
                <span
                  className="wheel-planet-badge-symbol"
                  style={{
                    fontSize: '17px',
                    lineHeight: 1,
                    color: activePlanetInfo.isTransit ? '#8C6D32' : '#C27D7A',
                    fontWeight: 'bold'
                  }}
                >
                  {activePlanetInfo.isTransit ? `Ｔ${activePlanetInfo.planet.symbol}` : activePlanetInfo.planet.symbol}
                </span>
                <span
                  className="wheel-planet-badge-name"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#4A3F3A',
                    letterSpacing: '0.03em'
                  }}
                >
                  {activePlanetInfo.planet.name}
                </span>
                {learnKey && <span className="learn-badge">解説</span>}
              </div>
            )}

            <svg
              viewBox={`0 0 ${size} ${size}`}
              style={{ width: '100%', maxWidth: `${size}px`, height: 'auto', overflow: 'visible', cursor: 'default' }}
              onClick={() => {
                // 天体・線以外のクリックで選択解除！
                onSelectPlanet(null);
                setPinnedAspectId(null);
                setHoveredAspectId(null);
              }}
            >
              {/* 外周の繊細なゴールドリングと背景円盤 */}
              <circle cx={center} cy={center} r={rOuter + 3} fill="none" stroke="#E6D5B8" strokeWidth="1" />
              <circle cx={center} cy={center} r={rOuter} fill="#FDFBF8" stroke="#C5A059" strokeWidth="1.4" />
              <circle cx={center} cy={center} r={rInnerSign} fill="#FAF7F2" stroke="#D8C8B8" strokeWidth="1.1" />

              {/* 二重円境界 */}
              {isDoubleCircle && (
                <circle
                  cx={center}
                  cy={center}
                  r={rInnerSign * 0.76}
                  fill="none"
                  stroke="#C27D7A"
                  strokeWidth="1.3"
                  strokeDasharray="4,4"
                />
              )}

              <circle cx={center} cy={center} r={rCenterHole} fill="#FFFFFF" stroke="#C5A059" strokeWidth="1.3" />

              {/* 12サイン帯 */}
              <g id="signs-ring">
                {signArcs.map(s => (
                  <g key={s.idx}>
                    <path d={s.path} fill={s.color} fillOpacity="0.42" stroke="#C5A059" strokeWidth="0.9" />
                    <text
                      x={s.textCoord.x}
                      y={s.textCoord.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={size * 0.027}
                      fontWeight="bold"
                      fill="#5C4D46"
                    >
                      {s.symbol}
                    </text>
                  </g>
                ))}
              </g>

              {/* ハウスカスプ線 */}
              <g id="house-lines">
                {houseLines.map(hl => (
                  <line
                    key={hl.houseNum}
                    x1={hl.p1.x}
                    y1={hl.p1.y}
                    x2={hl.p2.x}
                    y2={hl.p2.y}
                    stroke={hl.isAngle ? '#7D685E' : '#DED3C8'}
                    strokeWidth={hl.isAngle ? 2.2 : 1}
                    strokeDasharray={hl.isAngle ? undefined : '2.5,2.5'}
                  />
                ))}
              </g>

              {/* ハウス番号 */}
              <g id="house-numbers">
                {houseNumbers.map(hn => (
                  <text
                    key={hn.num}
                    x={hn.coord.x}
                    y={hn.coord.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11}
                    fontFamily="var(--font-serif)"
                    fontWeight="600"
                    fill="#9E8B82"
                  >
                    {hn.num}
                  </text>
                ))}
              </g>

              {/* アスペクト線 */}
              <g id="aspect-lines">
                {aspectLines.map(al => (
                  <g key={al.id}>
                    <line
                      x1={al.x1}
                      y1={al.y1}
                      x2={al.x2}
                      y2={al.y2}
                      stroke={shownAspectId === al.id ? '#C5A059' : al.color}
                      strokeWidth={shownAspectId === al.id ? al.strokeWidth + 2.4 : al.strokeWidth}
                      opacity={shownAspectId !== null && shownAspectId !== al.id ? 0.2 : 0.78}
                      style={{ pointerEvents: 'none', transition: 'stroke-width 0.15s, opacity 0.15s' }}
                    />
                    {/* 細い線でもクリック・タップしやすいよう、透明な太い線で当たり判定を広げる */}
                    <line
                      x1={al.x1}
                      y1={al.y1}
                      x2={al.x2}
                      y2={al.y2}
                      stroke="transparent"
                      strokeWidth={10}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredAspectId(al.id)}
                      onMouseLeave={() => setHoveredAspectId(null)}
                      onClick={e => {
                        e.stopPropagation();
                        if (pinnedAspectId === al.id) {
                          // もう一度押したら固定を外す
                          setPinnedAspectId(null);
                          setHoveredAspectId(null);
                        } else {
                          setPinnedAspectId(al.id);
                        }
                      }}
                    />
                  </g>
                ))}
              </g>

              {/* ASC & MC */}
              <g id="angles-label">
                {(() => {
                  const ascCoord = getCoord(ascDeg, rInnerSign - 18);
                  const mc = data?.planets?.find(p => p.key === 'mc');
                  const mcCoord = mc ? getCoord(mc.abs_deg, rInnerSign - 18) : null;
                  const isAscSelected = selectedPlanetKey === 'asc';
                  const isMcSelected = selectedPlanetKey === 'mc';
                  return (
                    <>
                      <g
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlanet('asc');
                        }}
                      >
                        {isAscSelected && (
                          <circle
                            cx={ascCoord.x}
                            cy={ascCoord.y}
                            r={15}
                            fill="#F7ECEB"
                            stroke="#C27D7A"
                            strokeWidth={1.8}
                          />
                        )}
                        <text
                          x={ascCoord.x}
                          y={ascCoord.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={12}
                          fontFamily="var(--font-serif)"
                          fontWeight="bold"
                          fill={isAscSelected ? '#A86461' : '#8A625E'}
                        >
                          ASC
                        </text>
                      </g>
                      {mcCoord && (
                        <g
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPlanet('mc');
                          }}
                        >
                          {isMcSelected && (
                            <circle
                              cx={mcCoord.x}
                              cy={mcCoord.y}
                              r={15}
                              fill="#F7ECEB"
                              stroke="#C27D7A"
                              strokeWidth={1.8}
                            />
                          )}
                          <text
                            x={mcCoord.x}
                            y={mcCoord.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={12}
                            fontFamily="var(--font-serif)"
                            fontWeight="bold"
                            fill={isMcSelected ? '#A86461' : '#8A625E'}
                          >
                            MC
                          </text>
                        </g>
                      )}
                    </>
                  );
                })()}
              </g>

              {/* ネイタル天体シンボル（内側） */}
              <g id="natal-planets">
                {positionedNatalPlanets.map(p => {
                  const isSelected = selectedPlanetKey === p.key;
                  return (
                    <g
                      key={p.key}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation(); // 背景クリックへの伝播防止
                        onSelectPlanet(p.key);
                      }}
                    >
                      <circle
                        cx={p.coord.x}
                        cy={p.coord.y}
                        r={isSelected ? 13.5 : 11}
                        fill={isSelected ? '#F7ECEB' : '#FFFFFF'}
                        stroke={isSelected ? '#C27D7A' : '#D8C8B8'}
                        strokeWidth={isSelected ? 2.4 : 1}
                      />
                      <text
                        x={p.coord.x}
                        y={p.coord.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={isSelected ? 14.5 : 13}
                        fontWeight="bold"
                        fill={isSelected ? '#A86461' : '#4A3F3A'}
                      >
                        {p.symbol}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* トランジット天体シンボル（外側・クリック可能） */}
              {isDoubleCircle && (
                <g id="transit-planets">
                  {positionedTransitPlanets.map(p => {
                    const transitKey = `transit:${p.key}`;
                    const isSelected = selectedPlanetKey === transitKey;
                    return (
                      <g
                        key={`transit-${p.key}`}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlanet(transitKey);
                        }}
                      >
                        <circle
                          cx={p.coord.x}
                          cy={p.coord.y}
                          r={isSelected ? 13 : 10.5}
                          fill={isSelected ? '#F5E6C8' : '#FBF6EC'}
                          stroke={isSelected ? '#9E7425' : '#C5A059'}
                          strokeWidth={isSelected ? 2.4 : 1.2}
                        />
                        <text
                          x={p.coord.x}
                          y={p.coord.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={isSelected ? 13.5 : 11.5}
                          fontWeight="bold"
                          fill={isSelected ? '#6E4E14' : '#8C6D32'}
                        >
                          {p.symbol}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>
          </div>

          {/* アスペクト線の表示（触れている間、またはクリックで固定。押すと解説パネルを開く） */}
          <div style={{ minHeight: '26px', marginTop: '8px', fontSize: '13px', fontWeight: 500, textAlign: 'center' }}>
            {activeAspect ? (
              <button
                type="button"
                className="wheel-aspect-pill"
                disabled={!onLearnAspect}
                onClick={() => onLearnAspect?.(activeAspect.target)}
              >
                ✦ {activeAspect.p1_name} × {activeAspect.p2_name}（{activeAspect.name} {activeAspect.target_angle}° / orb {activeAspect.orb_str}）
                {onLearnAspect && <span className="wheel-aspect-pill-more">解説 →</span>}
              </button>
            ) : (
              <span style={{ color: '#A8988E', fontSize: '12px' }}>
                天体マークやアスペクト線をタップすると情報が表示され、余白をタップすると閉じます
              </span>
            )}
          </div>
        </div>

        {/* 凡例ガイド */}
        <div
          style={{
            backgroundColor: '#FAF7F2',
            borderTop: '1px solid #E8DFD5',
            padding: '12px 18px',
            fontSize: '12px',
            lineHeight: 1.5,
            color: '#8C7A70'
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px', color: '#4A3F3A' }}>
            {isDoubleCircle ? '二重円アスペクト線の凡例（ネイタル × トランジット）:' : 'アスペクト線の凡例（主要10天体 ＋ ASC）:'}
          </div>
          {/* 縦の間隔は狭く、横の間隔は今までどおり */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '16px', height: '3px', backgroundColor: '#5B7DB1', borderRadius: '2px' }} />
              <strong>ブルー</strong>: コンジャンクション(0°) / トライン(120°)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '16px', height: '3px', backgroundColor: '#C86D6A', borderRadius: '2px' }} />
              <strong>ローズ</strong>: スクエア(90°) / オポジション(180°)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '16px', height: '3px', backgroundColor: '#689F84', borderRadius: '2px' }} />
              <strong>セージ</strong>: セクスタイル(60°)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '16px', height: '3px', backgroundColor: '#9A7AA0', borderRadius: '2px' }} />
              <strong>モーヴ</strong>: インコンジャンクト(150°)
            </span>
          </div>
          {isDoubleCircle ? (
            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #E8DFD5', fontSize: '11.5px', color: '#8C7A70' }}>
              ※二重円オーブ基準（タイトな方を優先）: 太陽・月 3.0° / 水星〜土星 2.0° (150°も2.0°) / 天王星〜冥王星 1.5° / ネイタルASC・MC 1.0°（150°は除外）
            </div>
          ) : (
            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #E8DFD5', fontSize: '11.5px', color: '#8C7A70' }}>
              ※ネイタルオーブ基準: 0°/120°/180°=7.0°、90°=6.0°、60°=5.0°（天王星・海王星・冥王星同士はすべて5.0°）、150°=全天体2.0°
            </div>
          )}
        </div>
      </div>

      {/* 天体詳細情報カード（スマホでは非表示とし円盤左上の天体名バッジのみ表示） */}
      {activePlanetInfo ? (
        <div
          className="astro-table-container desktop-only-planet-card"
          style={{
            flex: '0 1 320px',
            maxWidth: '320px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #D8C8B8',
            alignSelf: 'flex-start'
          }}
        >
          <div
            style={{
              background: activePlanetInfo.isTransit
                ? 'linear-gradient(135deg, #B89146 0%, #9A7632 100%)'
                : 'linear-gradient(135deg, #C98683 0%, #B36B68 100%)',
              color: '#FFFFFF',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div
              role={learnKey ? 'button' : undefined}
              onClick={learnKey ? () => onLearn!(learnKey) : undefined}
              title={learnKey ? '押すと解説が出ます' : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', cursor: learnKey ? 'pointer' : 'default' }}
            >
              <span style={{ fontSize: '21px' }}>{activePlanetInfo.planet.symbol}</span>
              <strong
                style={{
                  fontSize: '16px',
                  fontFamily: 'var(--font-serif)',
                  letterSpacing: '0.04em',
                  textDecoration: learnKey ? 'underline dotted' : 'none',
                  textUnderlineOffset: '4px'
                }}
              >
                {activePlanetInfo.planet.name}{activePlanetInfo.isTransit ? '　（トランジット）' : ''}
              </strong>
              {learnKey && <span style={{ fontSize: '11px', opacity: 0.9 }}>解説 →</span>}
            </div>
            {activePlanetInfo.planet.is_retrograde && (
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  color: '#FFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <Term id="逆行">逆行 R</Term>
              </span>
            )}
          </div>

          <div style={{ padding: '16px 18px', fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '126px 1fr',
                alignItems: 'center',
                borderBottom: '1px solid #F2EBE3',
                paddingBottom: '7px'
              }}
            >
              <span style={{ color: '#8C7A70' }}><Term id="サイン">星座</Term>:</span>
              {learnKey ? (
                <button type="button" className="card-learn-link" onClick={() => onLearn!(learnKey)}>
                  {activePlanetInfo.planet.sign_symbol} {activePlanetInfo.planet.sign}
                </button>
              ) : (
                <strong style={{ color: '#4A3F3A' }}>{activePlanetInfo.planet.sign_symbol} {activePlanetInfo.planet.sign}</strong>
              )}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '126px 1fr',
                alignItems: 'center',
                borderBottom: '1px solid #F2EBE3',
                paddingBottom: '7px'
              }}
            >
              <span style={{ color: '#8C7A70' }}><Term id="度数" />:</span>
              <strong style={{ fontFamily: 'monospace', color: '#4A3F3A' }}>{activePlanetInfo.planet.deg_in_sign}</strong>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '126px 1fr',
                alignItems: 'center',
                borderBottom: '1px solid #F2EBE3',
                paddingBottom: '7px'
              }}
            >
              <span style={{ color: '#8C7A70' }}><Term id="在住ハウス">ハウス</Term>:</span>
              {learnKey ? (
                <button type="button" className="card-learn-link" onClick={() => onLearn!(learnKey)}>
                  {activePlanetInfo.planet.house}ハウス
                </button>
              ) : (
                <strong style={{ color: '#4A3F3A' }}>{activePlanetInfo.planet.house}ハウス</strong>
              )}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '126px 1fr',
                alignItems: 'center',
                borderBottom: '1px solid #F2EBE3',
                paddingBottom: '7px'
              }}
            >
              <span style={{ color: '#8C7A70' }}><Term id="支配するハウス">支配ハウス</Term>:</span>
              <span style={{ color: '#4A3F3A' }}>{activePlanetInfo.planet.ruled_houses}</span>
            </div>

            {/* 主要アスペクト */}
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#8C7A70', marginBottom: '8px' }}>
                {!isDoubleCircle
                  ? <>ネイタル主要<Term id="アスペクト" />:</>
                  : activePlanetInfo.isTransit
                  ? <>ネイタルとの<Term id="アスペクト" />:</>
                  : <>トランジットとの<Term id="アスペクト" />:</>}
              </div>
              {activePlanetInfo.relatedAspects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activePlanetInfo.relatedAspects.map((asp, idx) => (
                    <div
                      key={idx}
                      role={onLearnAspect ? 'button' : undefined}
                      className={onLearnAspect ? 'card-aspect-item' : undefined}
                      onClick={onLearnAspect ? () => onLearnAspect(asp.target) : undefined}
                      style={{
                        backgroundColor: '#FAF7F2',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#4A3F3A',
                        border: '1px solid #E8DFD5',
                        lineHeight: '1.3'
                      }}
                    >
                      {asp.label}
                      {onLearnAspect && <span className="card-aspect-more">解説 →</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ color: '#A8988E', fontSize: '12px' }}>アスペクトなし</span>
              )}
            </div>

            <button
              onClick={() => onSelectPlanet(null)}
              style={{
                marginTop: '10px',
                padding: '6px',
                fontSize: '11.5px',
                color: '#8C7A70',
                background: '#FAF7F2',
                border: '1px dashed #D8C8B8',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              閉じる (背景クリックでも閉じます)
            </button>
          </div>
        </div>
      ) : (
        <div
          className="desktop-only-planet-card"
          style={{
            flex: '0 0 250px',
            backgroundColor: '#FFFFFF',
            border: '1px dashed #D8C8B8',
            borderRadius: '16px',
            padding: '28px 18px',
            textAlign: 'center',
            color: '#8C7A70',
            fontSize: '13px',
            alignSelf: 'flex-start',
            boxShadow: '0 4px 16px rgba(74, 63, 58, 0.02)'
          }}
        >
          <div style={{ fontSize: '22px', marginBottom: '8px', color: '#C5A059' }}>✦</div>
          円盤上の天体マークをクリックすると、円盤の左上とこちらに詳細情報が表示されます。
        </div>
      )}

    </div>
  );
};
