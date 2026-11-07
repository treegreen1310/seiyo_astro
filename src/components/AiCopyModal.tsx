import React, { useMemo, useState } from 'react';
import { HoroscopeData, Planet } from '../types/horoscope';
import { DOUBLE_CIRCLE_KEYS, getDoubleCirclePairMaxOrb, getHouseInNatalCusps } from './HoroscopeWheel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: HoroscopeData;
  isDoubleCircle: boolean;
  transitData: HoroscopeData | null;
  isSecretUnlocked: boolean;
}

const MAJOR_10_KEYS = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'
];

const NATAL_DISPLAY_KEYS = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'mean_node'
];

// 秘密の鍵で追加表示される感受点・小惑星（テイル、セレス、キロン、ジュノー、パラス、ベスタ、リリス、バーテクス、パートオブフォーチュン）
const ASTEROID_KEYS = [
  'tail', 'ceres', 'chiron', 'juno', 'pallas', 'vesta', 'mean_apog', 'vertex', 'pof'
];

// ドラゴンヘッド・ドラゴンテイル
const NODE_KEYS = ['mean_node', 'tail'];

// 秘密の鍵で追加判定する8つの感受点・小惑星（セレス、キロン、ジュノー、パラス、ベスタ、リリス、バーテクス、パートオブフォーチュン）
const MINOR_8_KEYS = [
  'ceres', 'chiron', 'juno', 'pallas', 'vesta', 'mean_apog', 'vertex', 'pof'
];

const EXTRA_ASPECT_KEYS = [...NODE_KEYS, ...MINOR_8_KEYS];

const NATAL_ASPECT_KEYS = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'asc'
];

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

// 2区分（ポラリティ）
const MASCULINE_SIGNS = new Set(['牡羊座', '双子座', '獅子座', '天秤座', '射手座', '水瓶座']);
// 3区分（クオリティ）
const CARDINAL_SIGNS = new Set(['牡羊座', '蟹座', '天秤座', '山羊座']);
const FIXED_SIGNS = new Set(['牡牛座', '獅子座', '蠍座', '水瓶座']);
// 4区分（エレメント）
const FIRE_SIGNS = new Set(['牡羊座', '獅子座', '射手座']);
const EARTH_SIGNS = new Set(['牡牛座', '乙女座', '山羊座']);
const AIR_SIGNS = new Set(['双子座', '天秤座', '水瓶座']);

const ASPECT_NAME_MAP: Record<number, string> = {
  0: 'コンジャンクション',
  60: 'セクスタイル',
  90: 'スクエア',
  120: 'トライン',
  150: 'インコンジャンクト',
  180: 'オポジション',
};

const formatGroupCount = (label: string, list: string[]) => {
  if (list.length === 0) return `${label} 0`;
  return `${label} ${list.length}（${list.join(', ')}）`;
};

export const AiCopyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  data,
  isDoubleCircle,
  transitData,
  isSecretUnlocked,
}) => {
  const [copied, setCopied] = useState(false);

  const generatedText = useMemo(() => {
    if (!data || !data.planets) return '';

    const planetMap: Record<string, Planet> = {};
    for (const p of data.planets) {
      planetMap[p.key] = p;
    }

    const lines: string[] = [];

    // 1. アングル
    const asc = planetMap['asc'];
    const mc = planetMap['mc'];
    lines.push('## アングル');
    if (asc) {
      lines.push(`- ASC（第1ハウス）：${asc.sign} ${asc.deg_in_sign}`);
    }
    if (mc) {
      lines.push(`- MC（第10ハウス）：${mc.sign} ${mc.deg_in_sign}`);
    }
    lines.push('');

    // 2. ネイタル天体・感受点（太陽〜冥王星 ＋ ドラゴンヘッド ＋ 秘密解除時は小惑星）
    const displayKeys = isSecretUnlocked
      ? [...NATAL_DISPLAY_KEYS, ...ASTEROID_KEYS]
      : NATAL_DISPLAY_KEYS;

    lines.push(isSecretUnlocked ? '## ネイタル天体・感受点・小惑星' : '## ネイタル天体・感受点');
    for (const key of displayKeys) {
      const p = planetMap[key];
      if (!p) continue;
      const retroStr = p.is_retrograde ? ' [逆行]' : '';
      const isMajor10 = MAJOR_10_KEYS.includes(key);
      const ruledStr =
        isMajor10 && p.ruled_houses && p.ruled_houses !== '-'
          ? `（支配：${p.ruled_houses}）`
          : '';
      lines.push(
        `- ${p.name}：${p.sign} ${p.deg_in_sign}${retroStr} / 第${p.house}ハウス${ruledStr}`
      );
    }
    lines.push('');

    // 3. 区分・エレメント集計（主要10天体）
    const masculine: string[] = [];
    const feminine: string[] = [];
    const cardinal: string[] = [];
    const fixed: string[] = [];
    const mutable: string[] = [];
    const fire: string[] = [];
    const earth: string[] = [];
    const air: string[] = [];
    const water: string[] = [];

    for (const key of MAJOR_10_KEYS) {
      const p = planetMap[key];
      if (!p) continue;
      if (MASCULINE_SIGNS.has(p.sign)) {
        masculine.push(p.name);
      } else {
        feminine.push(p.name);
      }
      if (CARDINAL_SIGNS.has(p.sign)) {
        cardinal.push(p.name);
      } else if (FIXED_SIGNS.has(p.sign)) {
        fixed.push(p.name);
      } else {
        mutable.push(p.name);
      }
      if (FIRE_SIGNS.has(p.sign)) {
        fire.push(p.name);
      } else if (EARTH_SIGNS.has(p.sign)) {
        earth.push(p.name);
      } else if (AIR_SIGNS.has(p.sign)) {
        air.push(p.name);
      } else {
        water.push(p.name);
      }
    }

    lines.push('## 区分・エレメント集計（主要10天体）');
    lines.push(
      `- 2区分（ポラリティ）：${formatGroupCount('男性宮', masculine)} / ${formatGroupCount('女性宮', feminine)}`
    );
    lines.push(
      `- 3区分（クオリティ）：${formatGroupCount('活動宮', cardinal)} / ${formatGroupCount('不動宮', fixed)} / ${formatGroupCount('柔軟宮', mutable)}`
    );
    lines.push(
      `- 4区分（エレメント）：${formatGroupCount('火', fire)} / ${formatGroupCount('地', earth)} / ${formatGroupCount('風', air)} / ${formatGroupCount('水', water)}`
    );
    lines.push('');

    // 4. 1重円（ネイタル）または 2重円（ネイタル×トランジット）
    if (!isDoubleCircle) {
      lines.push(isSecretUnlocked ? '## ネイタル アスペクト一覧（小惑星含む）' : '## ネイタル アスペクト一覧');
      const aspectLines: string[] = [];

      // 主要10天体＋ASC同士のアスペクト
      const natalAspects = (data.aspects || []).filter(
        a => NATAL_ASPECT_KEYS.includes(a.p1_key) && NATAL_ASPECT_KEYS.includes(a.p2_key)
      );
      for (const a of natalAspects) {
        const p1Sign = planetMap[a.p1_key]?.sign || '';
        const p2Sign = planetMap[a.p2_key]?.sign || '';
        aspectLines.push(
          `- ${a.p1_name}(${p1Sign}) × ${a.p2_name}(${p2Sign})：${a.aspect_name}(${a.target_angle}°) [orb ${a.orb_str}]`
        );
      }

      // 秘密解除時：感受点・小惑星とのアスペクトを追加
      if (isSecretUnlocked) {
        const baseTargets = [
          ...NATAL_ASPECT_KEYS.map(k => planetMap[k]).filter(Boolean),
          ...(planetMap['mc'] ? [planetMap['mc']] : []),
        ];
        const extraBodies = EXTRA_ASPECT_KEYS.map(k => planetMap[k]).filter(Boolean);

        // 1. 主要10天体・アングル(ASC/MC) ×（ヘッド・テイル・8感受点/小惑星）（ASTEROID_ORB_MAP適用）
        for (const bp of baseTargets) {
          for (const ap of extraBodies) {
            let diff = Math.abs(bp.abs_deg - ap.abs_deg) % 360;
            if (diff > 180) diff = 360 - diff;

            for (const angle of ASPECT_ANGLES) {
              const maxOrb = ASTEROID_ORB_MAP[angle] ?? 1.0;
              const orb = Math.abs(diff - angle);
              if (orb <= maxOrb) {
                const aspectName = ASPECT_NAME_MAP[angle] || `${angle}度`;
                aspectLines.push(
                  `- ${bp.name}(${bp.sign}) × ${ap.name}(${ap.sign})：${aspectName}(${angle}°) [orb ${orb.toFixed(2)}°]`
                );
                break;
              }
            }
          }
        }

        // 2. ドラゴンヘッド・ドラゴンテイル × 8感受点/小惑星（全てオーブ1°）
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
                const aspectName = ASPECT_NAME_MAP[angle] || `${angle}度`;
                aspectLines.push(
                  `- ${nb.name}(${nb.sign}) × ${mb.name}(${mb.sign})：${aspectName}(${angle}°) [orb ${orb.toFixed(2)}°]`
                );
                break;
              }
            }
          }
        }
      }

      if (aspectLines.length > 0) {
        lines.push(...aspectLines);
      } else {
        lines.push('- なし');
      }
    } else {
      // 2重円：トランジット天体
      const transitDisplayKeys = isSecretUnlocked
        ? [...MAJOR_10_KEYS, ...EXTRA_ASPECT_KEYS]
        : MAJOR_10_KEYS;

      lines.push(
        isSecretUnlocked
          ? '## トランジット天体（主要10天体＋感受点・小惑星）'
          : '## トランジット天体（主要10天体）'
      );
      if (transitData && transitData.planets) {
        const transitMap: Record<string, Planet> = {};
        for (const tp of transitData.planets) {
          transitMap[tp.key] = tp;
        }
        for (const key of transitDisplayKeys) {
          const tp = transitMap[key];
          if (!tp) continue;
          const natalHouse = getHouseInNatalCusps(tp.abs_deg, data.cusps);
          const natalPlanet = planetMap[key];
          const isMajor10 = MAJOR_10_KEYS.includes(key);
          const ruledStr =
            isMajor10 && natalPlanet && natalPlanet.ruled_houses && natalPlanet.ruled_houses !== '-'
              ? `（ネイタル支配：${natalPlanet.ruled_houses}）`
              : '';
          const retroStr = tp.is_retrograde ? ' [逆行]' : '';
          lines.push(
            `- T${tp.name}：${tp.sign} ${tp.deg_in_sign}${retroStr} / ネイタル第${natalHouse}ハウス通過中${ruledStr}`
          );
        }
      } else {
        lines.push('- トランジットデータなし');
      }
      lines.push('');

      // 2重円：ネイタル×トランジット アスペクト一覧
      lines.push(
        isSecretUnlocked
          ? '## ネイタル×トランジット アスペクト一覧（感受点・小惑星含む）'
          : '## ネイタル×トランジット アスペクト一覧'
      );
      if (transitData && transitData.planets) {
        const natalTargetKeys = isSecretUnlocked
          ? [...DOUBLE_CIRCLE_KEYS, 'tail', ...MINOR_8_KEYS]
          : DOUBLE_CIRCLE_KEYS;
        const transitTargetKeys = isSecretUnlocked
          ? [...MAJOR_10_KEYS, ...NODE_KEYS, ...MINOR_8_KEYS]
          : MAJOR_10_KEYS;

        const natalTargets = natalTargetKeys.map(k => planetMap[k]).filter(Boolean);
        const transitMap: Record<string, Planet> = {};
        for (const tp of transitData.planets) {
          transitMap[tp.key] = tp;
        }
        const transitTargets = transitTargetKeys.map(k => transitMap[k]).filter(Boolean);

        const ntAspectLines: string[] = [];
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
                const aspectName = ASPECT_NAME_MAP[angle] || `${angle}度`;
                ntAspectLines.push(
                  `- N(ネイタル)${np.name}(${np.sign}) × T(トランジット)${tp.name}(${tp.sign})：${aspectName}(${angle}°) [orb ${orb.toFixed(2)}°]`
                );
                break;
              }
            }
          }
        }

        if (ntAspectLines.length > 0) {
          lines.push(...ntAspectLines);
        } else {
          lines.push('- なし');
        }
      } else {
        lines.push('- なし');
      }
    }

    return lines.join('\n');
  }, [data, isDoubleCircle, transitData, isSecretUnlocked]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = generatedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(74, 63, 58, 0.42)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8DFD5',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 18px 48px rgba(74, 63, 58, 0.18)',
          overflow: 'hidden',
        }}
      >
        {/* ポップアップヘッダー */}
        <div
          style={{
            background: 'linear-gradient(180deg, #FAF6F0 0%, #F5EFE6 100%)',
            padding: '16px 22px',
            borderBottom: '1px solid #E8DFD5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ color: '#C5A059', fontSize: '18px', marginTop: '2px' }}>✧</span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-serif)',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#4A3F3A',
                  letterSpacing: '0.04em',
                }}
              >
                AI相談用 ホロスコープデータ
              </h3>
              {isSecretUnlocked && (
                <div style={{ marginTop: '4px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      whiteSpace: 'nowrap',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: '#8C6D32',
                      backgroundColor: '#FBF6EC',
                      border: '1px solid #DEC89E',
                      padding: '2px 9px',
                      borderRadius: '999px',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    🗝 詳細版（小惑星あり）
                  </span>
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#8C7A70', marginTop: '3px' }}>
                {isDoubleCircle ? '二重円（ネイタル × トランジット）' : '一重円（ネイタル）'}
              </div>
            </div>
          </div>
        </div>

        {/* プレビュー領域 */}
        <div
          style={{
            padding: '18px 22px',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: '#FAF7F2',
          }}
        >
          <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#7D6E65' }}>
            以下の内容がコピーされます。
          </p>
          <pre
            style={{
              margin: 0,
              padding: '16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E6DCD2',
              borderRadius: '12px',
              fontSize: '12.5px',
              lineHeight: 1.7,
              color: '#4A3F3A',
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '48vh',
              overflowY: 'auto',
            }}
          >
            {generatedText}
          </pre>
        </div>

        {/* フッターボタン */}
        <div
          style={{
            padding: '14px 22px',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E8DFD5',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#F5EFE8',
              color: '#6E5D54',
              border: '1px solid #E2D6C8',
              padding: '9px 20px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            閉じる
          </button>

          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: copied
                ? 'linear-gradient(135deg, #689F84 0%, #52876D 100%)'
                : 'linear-gradient(135deg, #C8827E 0%, #B36B67 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '9px 24px',
              borderRadius: '999px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: copied
                ? '0 4px 12px rgba(104, 159, 132, 0.3)'
                : '0 4px 14px rgba(184, 110, 106, 0.3)',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{copied ? '✓ コピーしました！' : '📋 クリップボードにコピー'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
