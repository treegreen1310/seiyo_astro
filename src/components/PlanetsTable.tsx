import React from 'react';
import { Planet } from '../types/horoscope';
import { isLearnable } from '../data/learn/basics';
import { Term } from './Term';

interface Props {
  planets: Planet[];
  onLearn?: (key: string) => void;
}

// ユーザー指定の厳密な並び順
// 太陽〜冥王星の後: ASC, MC, ヘッド, テイル, セレス, キロン, ジュノー, パラス, ベスタ, リリス, バーテクス, パートオブフォーチュン
const ORDERED_KEYS = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'asc', 'mc', 'mean_node', 'tail', 'ceres', 'chiron', 'juno', 'pallas', 'vesta', 'mean_apog', 'vertex', 'pof'
];

export const PlanetsTable: React.FC<Props> = ({ planets, onLearn }) => {
  // 指定順にソート
  const sortedPlanets = [...planets].sort((a, b) => {
    const idxA = ORDERED_KEYS.indexOf(a.key);
    const idxB = ORDERED_KEYS.indexOf(b.key);
    return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
  });

  return (
    <div className="astro-table-container">
      <div className="astro-table-title">
        天体・感受点一覧
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="astro-table planets-table">
          <thead>
            <tr>
              <th className="planets-col-name" style={{ width: '24%', whiteSpace: 'nowrap' }}><Term id="天体" /></th>
              <th style={{ width: '18%', whiteSpace: 'nowrap' }}><Term id="サイン" /></th>
              <th style={{ width: '10%', whiteSpace: 'nowrap' }}><Term id="黄経" /></th>
              <th style={{ width: '16%', whiteSpace: 'nowrap' }}><Term id="在住ハウス" /></th>
              <th style={{ width: '22%', whiteSpace: 'nowrap' }}><Term id="支配するハウス" /></th>
              <th style={{ width: '10%', textAlign: 'center', whiteSpace: 'nowrap' }}><Term id="逆行" /></th>
            </tr>
          </thead>
          <tbody>
            {sortedPlanets.map(p => {
              // 解説データがある天体は、行を押すと学習パネルを開く
              const learnable = !!onLearn && isLearnable(p.key);
              return (
              <tr
                key={p.key}
                className={learnable ? 'learnable-row' : undefined}
                onClick={learnable ? () => onLearn!(p.key) : undefined}
              >
                <td className="planets-col-name" style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                  <span className="planet-symbol-cell" style={{ marginRight: '8px', fontSize: '15px', color: '#C27D7A' }}>{p.symbol}</span>
                  {p.key === 'pof' ? (
                    <span>
                      パートオブ<br className="mobile-only-br" />フォーチュン
                    </span>
                  ) : (
                    <span>{p.name}</span>
                  )}
                  {learnable && <span className="learn-badge" title="押すと解説が出ます">解説</span>}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span className="sign-symbol-cell" style={{ marginRight: '6px', fontSize: '15px', color: '#8C6D32' }}>{p.sign_symbol}</span>
                  <span>{p.sign}</span>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: '500', color: '#5C4D46', whiteSpace: 'nowrap' }}>{p.deg_in_sign}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{p.house}ハウス</td>
                <td style={{ color: '#8C7A70', whiteSpace: 'nowrap' }}>{p.ruled_houses}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#B36B68', whiteSpace: 'nowrap' }}>
                  {p.is_retrograde ? 'R' : ''}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
