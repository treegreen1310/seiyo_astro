import React from 'react';
import { Planet } from '../types/horoscope';
import { PLANET_LEARN, SIGN_LEARN } from '../data/learn/basics';

interface Props {
  planets: Planet[];
  onLearn: (key: string) => void;
}

// 最初に読む3つ（ビッグスリー）
const BIG_THREE = [
  { key: 'sun', caption: '目指す自分' },
  { key: 'moon', caption: '素の自分' },
  { key: 'asc', caption: '見られる自分' },
];

export const BigThreeCard: React.FC<Props> = ({ planets, onLearn }) => {
  return (
    <div className="astro-table-container">
      <div className="astro-table-title">まずはここから：あなたの基本の3つ</div>
      <div style={{ padding: '16px 18px 18px' }}>
        <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--text-sub)', textAlign: 'center' }}>
          ホロスコープは、まず「太陽・月・ASC」の3つから読むのが定番です。押すと、意味と読み方が出ます。
        </p>
        <div className="big-three-grid">
          {BIG_THREE.map(({ key, caption }) => {
            const planet = planets.find(pl => pl.key === key);
            const learn = PLANET_LEARN[key];
            if (!planet || !learn) return null;
            const sign = SIGN_LEARN[planet.sign];
            return (
              <button key={key} type="button" className="big-three-tile" onClick={() => onLearn(key)}>
                <span style={{ fontSize: '11.5px', color: 'var(--text-sub)' }}>{caption}</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, color: 'var(--accent-rose-dark)' }}>
                  {learn.symbol} {learn.name.replace('（アセンダント）', '')}
                </span>
                <span style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-main)' }}>
                  <span style={{ color: '#8C6D32', marginRight: '4px' }}>{planet.sign_symbol}</span>
                  {planet.sign}
                </span>
                {sign && <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>{sign.theme}</span>}
                <span className="big-three-more">解説を見る →</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
