import React, { useMemo } from 'react';
import { Aspect, HoroscopeData, Planet } from '../types/horoscope';
import { DOUBLE_CIRCLE_KEYS, getDoubleCirclePairMaxOrb } from './HoroscopeWheel';
import { ASPECT_LEARN, AspectTarget } from '../data/learn/aspects';
import { Term } from './Term';

interface Props {
  planets: Planet[];
  aspectMatrix?: Record<string, Record<string, Aspect>>;
  aspects: Aspect[];
  isDoubleCircle?: boolean;
  transitData?: HoroscopeData | null;
  includeAsteroids?: boolean;
  onLearnAspect?: (target: AspectTarget) => void; // 行を押すとアスペクトの解説を開く
}

// 一重円（ネイタル）時の対象：主要10天体 ＋ ASC
const NATAL_ASPECT_KEYS = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'asc'
];

const MAJOR_10_KEYS = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'
];

// ドラゴンヘッド・ドラゴンテイル
const NODE_KEYS = ['mean_node', 'tail'];

// 秘密の鍵で追加判定する8つの感受点・小惑星（セレス、キロン、ジュノー、パラス、ベスタ、リリス、バーテクス、パートオブフォーチュン）
const MINOR_8_KEYS = [
  'ceres', 'chiron', 'juno', 'pallas', 'vesta', 'mean_apog', 'vertex', 'pof'
];

const EXTRA_ASPECT_KEYS = [...NODE_KEYS, ...MINOR_8_KEYS];

// 感受点・小惑星アスペクトの許容オーブ定義（対 10天体・ASC・MC）
// コンジャンクション(0°): 3°, オポジション(180°): 2°, スクエア(90°): 2°, トライン(120°): 2°, セクスタイル(60°): 1°, インコンジャンクト(150°): 1°
const ASTEROID_ORB_MAP: Record<number, number> = {
  0: 3.0,
  180: 2.0,
  90: 2.0,
  120: 2.0,
  60: 1.0,
  150: 1.0,
};

// ドラゴンヘッド・ドラゴンテイルとのアスペクトは全角度オーブ1°
const NODE_MINOR_MAX_ORB = 1.0;

const ASPECT_ANGLES = [0, 60, 90, 120, 150, 180];

interface DisplayAspectItem {
  p1Key: string;
  p2Key: string;
  p1Label: string;
  p1Symbol: string;
  p2Label: string;
  p2Symbol: string;
  target_angle: number;
  orb_str: string;
  isTransitMode: boolean;
}

export const AspectMatrix: React.FC<Props> = ({
  planets,
  aspects,
  isDoubleCircle = false,
  transitData = null,
  includeAsteroids = false,
  onLearnAspect
}) => {
  const displayItems = useMemo<DisplayAspectItem[]>(() => {
    const planetMap: Record<string, Planet> = {};
    const planetSymbolMap: Record<string, string> = {};
    for (const p of planets) {
      planetMap[p.key] = p;
      planetSymbolMap[p.key] = p.symbol;
    }

    if (!isDoubleCircle) {
      const baseList: DisplayAspectItem[] = aspects
        .filter(a => NATAL_ASPECT_KEYS.includes(a.p1_key) && NATAL_ASPECT_KEYS.includes(a.p2_key))
        .map(a => ({
          p1Key: a.p1_key,
          p2Key: a.p2_key,
          p1Label: a.p1_name,
          p1Symbol: planetSymbolMap[a.p1_key] || '',
          p2Label: a.p2_name,
          p2Symbol: planetSymbolMap[a.p2_key] || '',
          target_angle: a.target_angle,
          orb_str: a.orb_str,
          isTransitMode: false,
        }));

      if (!includeAsteroids) {
        return baseList;
      }

      // 小惑星リストには、通常のアスペクトリストと重なる主要天体同士のアスペクトは載せない
      const asteroidList: DisplayAspectItem[] = [];

      // 1. 主要10天体・ASC・MC ×（ヘッド・テイル・8感受点/小惑星）のアスペクト（ASTEROID_ORB_MAP適用）
      const baseTargets = [
        ...NATAL_ASPECT_KEYS.map(k => planetMap[k]).filter(Boolean),
        ...(planetMap['mc'] ? [planetMap['mc']] : []),
      ];
      const extraBodies = EXTRA_ASPECT_KEYS.map(k => planetMap[k]).filter(Boolean);

      for (const bp of baseTargets) {
        for (const ap of extraBodies) {
          let diff = Math.abs(bp.abs_deg - ap.abs_deg) % 360;
          if (diff > 180) diff = 360 - diff;

          for (const angle of ASPECT_ANGLES) {
            const maxOrb = ASTEROID_ORB_MAP[angle] ?? 1.0;
            const orb = Math.abs(diff - angle);
            if (orb <= maxOrb) {
              asteroidList.push({
                p1Key: bp.key,
                p2Key: ap.key,
                p1Label: bp.name,
                p1Symbol: bp.symbol,
                p2Label: ap.name,
                p2Symbol: ap.symbol,
                target_angle: angle,
                orb_str: `${orb.toFixed(2)}°`,
                isTransitMode: false,
              });
              break;
            }
          }
        }
      }

      // 2. ドラゴンヘッド・ドラゴンテイル × 8感受点/小惑星 のアスペクト（全てオーブ1°）
      // ※8感受点/小惑星同士のアスペクトは見ない
      const nodeBodies = NODE_KEYS.map(k => planetMap[k]).filter(Boolean);
      const minorBodies = MINOR_8_KEYS.map(k => planetMap[k]).filter(Boolean);

      for (const nb of nodeBodies) {
        for (const mb of minorBodies) {
          let diff = Math.abs(nb.abs_deg - mb.abs_deg) % 360;
          if (diff > 180) diff = 360 - diff;

          for (const angle of ASPECT_ANGLES) {
            const orb = Math.abs(diff - angle);
            if (orb <= NODE_MINOR_MAX_ORB) {
              asteroidList.push({
                p1Key: nb.key,
                p2Key: mb.key,
                p1Label: nb.name,
                p1Symbol: nb.symbol,
                p2Label: mb.name,
                p2Symbol: mb.symbol,
                target_angle: angle,
                orb_str: `${orb.toFixed(2)}°`,
                isTransitMode: false,
              });
              break;
            }
          }
        }
      }

      return asteroidList;
    }

    // 二重円（ネイタル × トランジット）時のアスペクト計算
    if (!transitData || !transitData.planets) return [];

    const natalTargetKeys = includeAsteroids
      ? [...DOUBLE_CIRCLE_KEYS, 'tail', ...MINOR_8_KEYS]
      : DOUBLE_CIRCLE_KEYS;
    const transitTargetKeys = includeAsteroids
      ? [...MAJOR_10_KEYS, ...NODE_KEYS, ...MINOR_8_KEYS]
      : MAJOR_10_KEYS;

    const natalTargets = natalTargetKeys.map(k => planetMap[k]).filter(Boolean);
    const transitMap: Record<string, Planet> = {};
    for (const tp of transitData.planets) {
      transitMap[tp.key] = tp;
    }
    const transitTargets = transitTargetKeys.map(k => transitMap[k]).filter(Boolean);

    const list: DisplayAspectItem[] = [];

    for (const np of natalTargets) {
      for (const tp of transitTargets) {
        const isNatalMinor = MINOR_8_KEYS.includes(np.key);
        const isTransitMinor = MINOR_8_KEYS.includes(tp.key);

        // 8感受点・小惑星同士のアスペクトは見ない
        if (isNatalMinor && isTransitMinor) continue;

        const isNatalNode = NODE_KEYS.includes(np.key);
        const isTransitNode = NODE_KEYS.includes(tp.key);

        let diff = Math.abs(np.abs_deg - tp.abs_deg) % 360;
        if (diff > 180) diff = 360 - diff;

        const isNatalAngle = np.key === 'asc' || np.key === 'mc';
        const involvesMinorWithNode =
          (isNatalMinor && isTransitNode) || (isTransitMinor && isNatalNode);
        const involvesExtra =
          EXTRA_ASPECT_KEYS.includes(np.key) || EXTRA_ASPECT_KEYS.includes(tp.key);

        for (const angle of ASPECT_ANGLES) {
          // ネイタルASC・MCの時は150°を見ない（ただし8感受点・小惑星との判定時はASTEROID_ORB_MAP基準）
          if (isNatalAngle && !isTransitMinor && angle === 150) continue;

          let maxOrb: number;
          if (involvesMinorWithNode || (isNatalNode && isTransitNode)) {
            maxOrb = NODE_MINOR_MAX_ORB;
          } else if (involvesExtra) {
            maxOrb = ASTEROID_ORB_MAP[angle] ?? 1.0;
          } else {
            maxOrb = getDoubleCirclePairMaxOrb(np.key, tp.key, angle);
          }

          const orb = Math.abs(diff - angle);
          if (orb <= maxOrb) {
            list.push({
              p1Key: np.key,
              p2Key: tp.key,
              p1Label: np.name,
              p1Symbol: np.symbol,
              p2Label: tp.name,
              p2Symbol: tp.symbol,
              target_angle: angle,
              orb_str: `${orb.toFixed(2)}°`,
              isTransitMode: true,
            });
            break;
          }
        }
      }
    }

    return list;
  }, [planets, aspects, isDoubleCircle, transitData, includeAsteroids]);

  const aspectsByType = {
    'コンジャンクション : 0度': displayItems.filter(a => a.target_angle === 0),
    'セクスタイル : 60度': displayItems.filter(a => a.target_angle === 60),
    'スクエア : 90度': displayItems.filter(a => a.target_angle === 90),
    'トライン : 120度': displayItems.filter(a => a.target_angle === 120),
    'インコンジャンクト : 150度': displayItems.filter(a => a.target_angle === 150),
    'オポジション : 180度': displayItems.filter(a => a.target_angle === 180),
  };

  return (
    <div className={`astro-table-container${includeAsteroids ? ' secret-table-container' : ''}`}>
      <div className="astro-table-title">
        {isDoubleCircle ? (
          <>
            ネイタル×トランジット<span className="desktop-only-inline">　</span>
            <br className="mobile-only-br" />
<Term id="アスペクト" />リスト{includeAsteroids ? '（小惑星）' : ''}
          </>
        ) : (
          <>
            ネイタル　<Term id="アスペクト" />リスト
            {includeAsteroids && '（小惑星）'}
          </>
        )}
      </div>
      {Object.entries(aspectsByType).map(([title, list]) => (
        <div key={title} style={{ borderBottom: includeAsteroids ? '1px solid #EDE3F2' : '1px solid #EFE8E0' }}>
          <div
            style={{
              backgroundColor: includeAsteroids ? '#F1E8F6' : '#F5EFE8',
              padding: '8px 18px',
              fontWeight: 600,
              fontSize: '13px',
              color: includeAsteroids ? '#523B5A' : '#5C4D46',
              borderBottom: includeAsteroids ? '1px solid #DECFE6' : '1px solid #E8DFD5',
              letterSpacing: '0.02em'
            }}
          >
            ✦ {title}
          </div>
          <div
            className="aspect-list-body"
            style={{
              padding: '10px 18px',
              backgroundColor: includeAsteroids ? '#FCF9FD' : '#FDFBF8',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {list.length > 0 ? (
              list.map((item, idx) => {
                const isP1Pof = item.isTransitMode && item.p1Label.includes('パートオブフォーチュン');
                const isP2Pof = item.isTransitMode && item.p2Label.includes('パートオブフォーチュン');
                const hasPof = isP1Pof || isP2Pof;
                // 解説データがある角度のアスペクトだけ「解説」ボタンを出す
                const learnable = !!onLearnAspect && !!ASPECT_LEARN[item.target_angle];
                const openLearn = () =>
                  onLearnAspect?.({
                    angle: item.target_angle,
                    p1Key: item.p1Key,
                    p1Name: item.p1Label,
                    p2Key: item.p2Key,
                    p2Name: item.p2Label,
                    orbStr: item.orb_str,
                    isTransit: item.isTransitMode,
                  });
                // 天体一覧と同じく、名前（○×○）のすぐ後ろに置く
                const learnButton = learnable && (
                  <button
                    type="button"
                    className="aspect-learn-btn"
                    onClick={e => {
                      e.stopPropagation();
                      openLearn();
                    }}
                  >
                    解説
                  </button>
                );

                return (
                  <div
                    key={idx}
                    className={`aspect-item-row${hasPof ? ' aspect-item-has-pof' : ''}${learnable ? ' aspect-item-learnable' : ''}`}
                    role={learnable ? 'button' : undefined}
                    title={learnable ? '押すと解説が出ます' : undefined}
                    onClick={learnable ? openLearn : undefined}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      maxWidth: item.isTransitMode ? '520px' : '440px',
                      fontSize: '13px',
                      color: includeAsteroids ? '#433447' : '#4A3F3A',
                      borderBottom: includeAsteroids ? '1px dashed #D8C5E0' : '1px dashed #E6D5B8',
                      paddingBottom: '4px',
                      gap: '12px'
                    }}
                  >
                    {item.isTransitMode ? (
                      <span
                        className="aspect-transit-pair"
                        style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', gap: '5px', fontWeight: 500 }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            backgroundColor: '#F7ECEB',
                            border: '1px solid #E5CFCB',
                            color: '#8A524F',
                            padding: '1px 7px',
                            borderRadius: '6px',
                            fontSize: '11.5px'
                          }}
                        >
                          N<span className="desktop-only-inline"> (ネイタル)</span>
                        </span>
                        <span className={isP1Pof ? 'aspect-pof-text' : undefined}>
                          {item.p1Symbol !== item.p1Label ? `${item.p1Symbol}` : ''}{item.p1Label}
                        </span>
                        <span style={{ color: includeAsteroids ? '#785E80' : '#8C7A70', margin: '0 2px' }}>×</span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            backgroundColor: '#FBF6EC',
                            border: '1px solid #E6D5B8',
                            color: '#8C6D32',
                            padding: '1px 7px',
                            borderRadius: '6px',
                            fontSize: '11.5px'
                          }}
                        >
                          T<span className="desktop-only-inline"> (トランジット)</span>
                        </span>
                        <span className={isP2Pof ? 'aspect-pof-text' : undefined}>
                          {item.p2Symbol !== item.p2Label ? `${item.p2Symbol}` : ''}{item.p2Label}
                        </span>
                        {learnButton}
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        {item.p1Label} × {item.p2Label}
                        {learnButton}
                      </span>
                    )}
                    <span
                      className="aspect-orb-text"
                      style={{ fontFamily: 'monospace', color: includeAsteroids ? '#785E80' : '#8C7A70', whiteSpace: 'nowrap' }}
                    >
                      <Term id="オーブ">orb</Term> {item.orb_str}
                    </span>
                  </div>
                );
              })
            ) : (
              <span style={{ color: includeAsteroids ? '#A593AC' : '#A8988E', fontSize: '13px' }}>なし</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
