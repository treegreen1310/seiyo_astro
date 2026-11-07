import React, { useEffect } from 'react';
import { ASPECT_LEARN, ASPECT_NATURE_LEARN, AspectTarget } from '../data/learn/aspects';
import { PLANET_LEARN } from '../data/learn/basics';
import { PAIR_NATURE_LABELS, angleToPairNature, findPairLearn } from '../data/learn/aspectPairs';
import { TRANSIT_DURATION, findTransitPair } from '../data/learn/transitPairs';
import { Term } from './Term';

interface Props {
  target: AspectTarget | null;
  onClose: () => void;
  onOpenPlanet: (key: string) => void; // ネイタル天体の解説パネルへ移動
}

const PLANET_COLOR = { fg: '#A86461', bg: '#F7ECEB', border: '#E5CFCB' };
const TRANSIT_COLOR = { fg: '#8C6D32', bg: '#FBF6EC', border: '#E6D5B8' };
const ASPECT_COLOR = { fg: '#7B5E80', bg: '#F3ECF6', border: '#D8C5E0' };
const NATURE_COLORS = { ソフト: '#5E7E69', ハード: '#A86461', 中立: '#8C6D32' };

const Highlight: React.FC<{ color: typeof PLANET_COLOR; children: React.ReactNode }> = ({ color, children }) => (
  <span
    style={{
      color: color.fg,
      backgroundColor: color.bg,
      borderBottom: `2px solid ${color.border}`,
      padding: '1px 3px',
      fontWeight: 600,
    }}
  >
    {children}
  </span>
);

// 組み合わせ別の解説がある場合は、角度の基本の意味を折りたたんで下に置く
const BasicsWrapper: React.FC<{ collapsed: boolean; title: string; children: React.ReactNode }> = ({ collapsed, title, children }) =>
  collapsed ? (
    <details className="learn-details">
      <summary>{title}</summary>
      {children}
    </details>
  ) : (
    <>{children}</>
  );

// 天体の組み合わせ別の解説（ひとことで → テーマ → この角度だと → よくある例 → 活かし方）
// トランジットのときは、テーマの見出し・続く期間・「この時期の過ごし方」に切り替える
const PairLearnSection: React.FC<{
  found: NonNullable<ReturnType<typeof findPairLearn>>;
  aspectName: string;
  angle: number;
  themeTitle: string;
  duration?: string;
}> = ({ found, aspectName, angle, themeTitle, duration }) => (
  <>
    {found.pair.generation && (
      <p className="learn-trivia" style={{ marginTop: 0 }}>
        <strong>世代のアスペクト：</strong>{found.pair.generation}
      </p>
    )}
    {duration && (
      <p className="learn-trivia" style={{ marginTop: 0 }}>
        <strong>続く期間の目安：</strong>{duration}
      </p>
    )}
    <div className="learn-pair-oneline">
      <div style={{ fontSize: '11.5px', color: 'var(--text-sub)', marginBottom: '4px' }}>ひとことで</div>
      <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, lineHeight: 1.7 }}>{found.variant.oneLine}</p>
    </div>

    <section className="learn-section">
      <p className="learn-lead">{themeTitle}</p>
      <p className="learn-text">{found.pair.theme}</p>
    </section>

    <section className="learn-section">
      <p className="learn-lead">
        {aspectName}（{PAIR_NATURE_LABELS[angleToPairNature(angle)]}）だと、こう出やすい
      </p>
      <p className="learn-text">{found.variant.how}</p>
      <p className="learn-lead" style={{ marginTop: '10px' }}>よくある例</p>
      <ul className="learn-list">
        {found.variant.examples.map(ex => (
          <li key={ex}>{ex}</li>
        ))}
      </ul>
    </section>

    <section className="learn-section">
      <p className="learn-lead">{duration ? 'この時期の過ごし方' : '活かし方'}</p>
      <p className="learn-text">{found.variant.tips}</p>
      <p className="learn-trivia" style={{ fontSize: '11.5px' }}>
        ※ 占星術で広く共有されている一般的な解釈をもとにしています。サインやハウス、ほかの配置によって出方は変わります。
      </p>
    </section>
  </>
);

// 天体の「役割」の言い換え（解説データがない感受点は名前だけ）
const describe = (key: string, name: string) => {
  const learn = PLANET_LEARN[key];
  return learn ? `${learn.role}（${name}）` : name;
};

export const AspectLearnPanel: React.FC<Props> = ({ target, onClose, onOpenPlanet }) => {
  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [target, onClose]);

  if (!target) return null;
  const a = ASPECT_LEARN[target.angle];
  if (!a) return null;

  const p1 = PLANET_LEARN[target.p1Key];
  const p2 = PLANET_LEARN[target.p2Key];
  // ネイタルは天体どうしの組み合わせ解説、トランジットは「今の空の天体（p2）× あなたの天体（p1）」の時期の解説
  const pairFound = target.isTransit
    ? findTransitPair(target.p2Key, target.p1Key, target.angle)
    : findPairLearn(target.p1Key, target.p2Key, target.angle);
  const themeTitle = target.isTransit
    ? `今の空の${target.p2Name} × あなたの${target.p1Name}のテーマ`
    : `${target.p1Name}×${target.p2Name}のテーマ`;

  return (
    <div className="learn-overlay" onClick={onClose}>
      <div
        className="learn-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${target.p1Name}と${target.p2Name}の${a.name}の解説`}
        onClick={e => e.stopPropagation()}
      >
        <div className="learn-panel-header">
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-sub)', letterSpacing: '0.04em' }}>
              {target.isTransit ? 'あなたの天体 × 今の空の天体' : 'あなたの天体どうしの関係'}
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', fontWeight: 600, color: 'var(--text-main)' }}>
              {target.p1Name}
              <span style={{ color: ASPECT_COLOR.fg, margin: '0 8px' }}>
                {a.symbol} {a.name}
              </span>
              {target.isTransit && <span style={{ color: TRANSIT_COLOR.fg }}>T:</span>}
              {target.p2Name}
            </div>
          </div>
          <button type="button" onClick={onClose} className="learn-close" aria-label="閉じる">
            ×
          </button>
        </div>

        <div className="learn-panel-body">
          {pairFound && (
            <PairLearnSection
              found={pairFound}
              aspectName={a.name}
              angle={target.angle}
              themeTitle={themeTitle}
              duration={target.isTransit ? TRANSIT_DURATION[target.p2Key] : undefined}
            />
          )}

          <BasicsWrapper collapsed={!!pairFound} title={`${a.name}（${a.angle}°）の基本の意味と読み方`}>
          {/* 組み立て文 */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '18px',
            }}
          >
            <div style={{ fontSize: '11.5px', color: 'var(--text-sub)', marginBottom: '6px' }}>読み解き文（自動で組み立て）</div>
            <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.9 }}>
              {target.isTransit ? (
                <>
                  今の空の<Highlight color={TRANSIT_COLOR}>{describe(target.p2Key, target.p2Name)}</Highlight>が、あなたの
                  <Highlight color={PLANET_COLOR}>{describe(target.p1Key, target.p1Name)}</Highlight>と
                  <Highlight color={ASPECT_COLOR}>{a.relation}</Highlight>になっています。
                </>
              ) : (
                <>
                  あなたの<Highlight color={PLANET_COLOR}>{describe(target.p1Key, target.p1Name)}</Highlight>と
                  <Highlight color={PLANET_COLOR}>{describe(target.p2Key, target.p2Name)}</Highlight>は、
                  <Highlight color={ASPECT_COLOR}>{a.relation}</Highlight>です。
                </>
              )}
            </p>
          </div>

          {/* アスペクトの種類 */}
          <section className="learn-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  backgroundColor: ASPECT_COLOR.bg,
                  color: ASPECT_COLOR.fg,
                  border: `1px solid ${ASPECT_COLOR.border}`,
                  borderRadius: '999px',
                  padding: '2px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {a.name}（{a.jpName}・{a.angle}°）
              </span>
              <span style={{ fontSize: '12px', color: NATURE_COLORS[a.nature], fontWeight: 600 }}>{a.nature}</span>
            </div>
            <p className="learn-lead">{a.summary}</p>
            <p className="learn-text">{a.detail}</p>
            <p className="learn-trivia">💡 {ASPECT_NATURE_LEARN[a.nature]}</p>
          </section>

          {/* 読み方 */}
          <section className="learn-section">
            <p className="learn-lead">読み方のコツ</p>
            <p className="learn-text">{a.howToUse}</p>
            {(p1 || p2) && (
              <ul className="learn-list">
                {p1 && (
                  <li>
                    <strong>{target.p1Name}</strong>…{p1.summary}
                  </li>
                )}
                {p2 && (
                  <li>
                    <strong>
                      {target.isTransit ? '今の空の' : ''}
                      {target.p2Name}
                    </strong>
                    …{p2.summary}
                  </li>
                )}
              </ul>
            )}
          </section>
          </BasicsWrapper>

          {/* オーブ */}
          <section className="learn-section">
            <p className="learn-text" style={{ margin: 0 }}>
              <Term id="オーブ">オーブ</Term>（ずれ）は <strong style={{ fontFamily: 'monospace' }}>{target.orbStr}</strong>。
              ずれが小さいほど、このアスペクトは強く働くとされます。
            </p>
          </section>

          {/* 天体の解説へのリンク（ネイタル天体のみ） */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[target.p1Key, target.isTransit ? null : target.p2Key]
              .filter((k): k is string => !!k && !!PLANET_LEARN[k])
              .map(k => (
                <button key={k} type="button" className="learn-link-btn" onClick={() => onOpenPlanet(k)}>
                  あなたの{PLANET_LEARN[k].name.replace(/（.*）/, '')}の解説を見る →
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
