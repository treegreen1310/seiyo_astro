import React from 'react';
import { HouseCusp } from '../types/horoscope';
import { Term } from './Term';

interface Props {
  houses: HouseCusp[];
}

export const HouseCuspsTable: React.FC<Props> = ({ houses }) => {
  return (
    <div className="astro-table-container">
      <div className="astro-table-title">
        ネイタルチャート　ハウスカスプ
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="astro-table">
          <thead>
            <tr>
              <th style={{ width: '18%' }}><Term id="ハウス" /></th>
              <th style={{ width: '22%' }}><Term id="カスプ">ハウスカスプ</Term></th>
              <th style={{ width: '18%' }}><Term id="度数" /></th>
              <th style={{ width: '18%' }}><Term id="支配星" /></th>
              <th style={{ width: '24%' }}><Term id="在住星" /></th>
            </tr>
          </thead>
          <tbody>
            {houses.map(h => (
              <tr key={h.house}>
                <td style={{ fontWeight: '600' }}>{h.house}ハウス</td>
                <td>
                  <span style={{ marginRight: '6px', fontSize: '15px', color: '#8C6D32' }}>{h.sign_symbol}</span>
                  <span>{h.sign}</span>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: '500', color: '#5C4D46' }}>{h.degree_str}</td>
                <td>{h.ruler}</td>
                <td>
                  {h.planets.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {h.planets.map((p, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: '#FBF6EC',
                            border: '1px solid #E6D5B8',
                            color: '#8C6D32',
                            padding: '2px 9px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: '#A8988E' }}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
