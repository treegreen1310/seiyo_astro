import React, { useEffect } from 'react';
import { Planet } from '../types/horoscope';
import {
  PLANET_LEARN,
  SIGN_LEARN,
  HOUSE_LEARN,
  ELEMENT_LEARN,
  MODALITY_LEARN,
  HOUSE_CATEGORY_LEARN,
  SUN_HOUSE_HINTS,
  buildReadingSentence,
} from '../data/learn/basics';
import { PlacementLearn, SIGN_PLACEMENT_NOTES, findHousePlacement, findSignPlacement } from '../data/learn/placements';
import { findCombinedPlacement } from '../data/learn/combined';

interface Props {
  planet: Planet | null;
  onClose: () => void;
}

// 「天体＝何が」「サイン＝どのように」「ハウス＝どこで」を色で区別する
export const PART_COLORS = {
  planet: { fg: '#A86461', bg: '#F7ECEB', border: '#E5CFCB' },
  sign: { fg: '#8C6D32', bg: '#FBF6EC', border: '#E6D5B8' },
  house: { fg: '#5E7E69', bg: '#EEF4F0', border: '#C9DCCF' },
};

const SectionLabel: React.FC<{ kind: keyof typeof PART_COLORS; label: string; question: string }> = ({ kind, label, question }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
    <span
      style={{
        backgroundColor: PART_COLORS[kind].bg,
        color: PART_COLORS[kind].fg,
        border: `1px solid ${PART_COLORS[kind].border}`,
        borderRadius: '999px',
        padding: '2px 10px',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      {label}
    </span>
    <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>＝ {question}</span>
  </div>
);

// 天体 × サイン／ハウスの配置ごとの解説（ひとことで → この配置だと → よくある例 → 活かし方）
const PLACEMENT_QUESTIONS = {
  planet: 'サインの性質が、ハウスの場面でどう出るか',
  sign: 'どのように出るか',
  house: '人生のどの場面に出るか',
};

const PlacementSection: React.FC<{ placement: PlacementLearn; title: string; kind: keyof typeof PART_COLORS; label: string }> = ({
  placement,
  title,
  kind,
  label,
}) => (
  <>
    <div style={{ marginBottom: '8px' }}>
      <SectionLabel kind={kind} label={label} question={PLACEMENT_QUESTIONS[kind]} />
    </div>
    <div className="learn-pair-oneline">
      <div style={{ fontSize: '11.5px', color: 'var(--text-sub)', marginBottom: '4px' }}>ひとことで</div>
      <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, lineHeight: 1.7 }}>{placement.oneLine}</p>
    </div>

    <section className="learn-section">
      <p className="learn-lead">{title}</p>
      <p className="learn-text">{placement.how}</p>
      <p className="learn-lead" style={{ marginTop: '10px' }}>よくある例</p>
      <ul className="learn-list">
        {placement.examples.map(ex => (
          <li key={ex}>{ex}</li>
        ))}
      </ul>
    </section>

    <section className="learn-section">
      <p className="learn-lead">活かし方</p>
      <p className="learn-text">{placement.tips}</p>
    </section>
  </>
);

// 配置ごとの解説がある場合は、天体・サインの基本の意味を折りたたんで下に置く
const BasicsWrapper: React.FC<{ collapsed: boolean; title: string; children: React.ReactNode }> = ({ collapsed, title, children }) =>
  collapsed ? (
    <details className="learn-details">
      <summary>{title}</summary>
      {children}
    </details>
  ) : (
    <>{children}</>
  );

export const LearnPanel: React.FC<Props> = ({ planet, onClose }) => {
  // Escキーで閉じる
  useEffect(() => {
    if (!planet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [planet, onClose]);

  if (!planet) return null;
  const p = PLANET_LEARN[planet.key];
  const s = SIGN_LEARN[planet.sign];
  if (!p || !s) return null;
  const h = p.usesHouse ? HOUSE_LEARN[planet.house] : null;
  const sentence = buildReadingSentence(planet.key, planet.sign, planet.house);
  const sunHint = planet.key === 'sun' ? SUN_HOUSE_HINTS[planet.house] : null;
  const placement = findSignPlacement(planet.key, planet.sign);
  const housePlacement = h ? findHousePlacement(planet.key, h.house) : null;
  const combined = h ? findCombinedPlacement(planet.key, planet.sign, h.house) : null;

  return (
    <div className="learn-overlay" onClick={onClose}>
      <div
        className="learn-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${p.name}の解説`}
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー：あなたの配置 */}
        <div className="learn-panel-header">
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-sub)', letterSpacing: '0.04em' }}>あなたの配置</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', fontWeight: 600, color: 'var(--text-main)' }}>
              <span style={{ color: PART_COLORS.planet.fg, marginRight: '6px' }}>{p.symbol}</span>
              {p.name}
              <span style={{ color: PART_COLORS.sign.fg, margin: '0 4px 0 10px' }}>{s.symbol}</span>
              {s.name}
              {h && <span style={{ color: PART_COLORS.house.fg, marginLeft: '10px' }}>第{h.house}ハウス</span>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="learn-close" aria-label="閉じる">
            ×
          </button>
        </div>

        <div className="learn-panel-body">
          {placement && SIGN_PLACEMENT_NOTES[planet.key] && (
            <p className="learn-trivia" style={{ marginTop: 0 }}>
              <strong>{planet.key === 'jupiter' || planet.key === 'saturn' ? '同学年に共通しやすい配置' : '世代の配置'}：</strong>
              {SIGN_PLACEMENT_NOTES[planet.key]}
            </p>
          )}
          {placement && (
            <PlacementSection
              placement={placement}
              kind="sign"
              label={`サインから見ると：${s.name}`}
              title={`${p.name}が${s.name}だと、こう出やすい`}
            />
          )}
          {housePlacement && h && (
            <PlacementSection
              placement={housePlacement}
              kind="house"
              label={`ハウスから見ると：第${h.house}ハウス`}
              title={`${p.name}が第${h.house}ハウスだと、こう出やすい`}
            />
          )}
          {combined && h && (
            <PlacementSection
              placement={combined}
              kind="planet"
              label={`まとめ：${s.name} × 第${h.house}ハウス`}
              title={`${p.name}が${s.name}・第${h.house}ハウスだと、こう出やすい`}
            />
          )}
          {(placement || housePlacement) && (
            <p className="learn-trivia" style={{ fontSize: '11.5px', marginTop: 0, marginBottom: '16px' }}>
              ※ 占星術で広く共有されている一般的な解釈をもとにしています。アスペクトやほかの配置によって出方は変わります。
            </p>
          )}

          <BasicsWrapper collapsed={!!placement} title={`${p.name}・${s.name}${h ? `・第${h.house}ハウス` : ''}の基本の意味と読み方`}>
          {/* 組み立て文 */}
          {sentence && (
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
                {sentence.map((part, i) =>
                  part.kind ? (
                    <span
                      key={i}
                      style={{
                        color: PART_COLORS[part.kind].fg,
                        backgroundColor: PART_COLORS[part.kind].bg,
                        borderBottom: `2px solid ${PART_COLORS[part.kind].border}`,
                        padding: '1px 3px',
                        fontWeight: 600,
                      }}
                    >
                      {part.text}
                    </span>
                  ) : (
                    <span key={i}>{part.text}</span>
                  )
                )}
              </p>
            </div>
          )}

          {/* 天体 */}
          <section className="learn-section">
            <SectionLabel kind="planet" label={`天体：${p.name}`} question="何が（あなたの中のどんな欲求か）" />
            <p className="learn-lead">{p.summary}</p>
            <p className="learn-text">{p.detail}</p>
            <div className="learn-keywords">
              {p.keywords.map(k => (
                <span key={k}>{k}</span>
              ))}
            </div>
            {p.trivia && <p className="learn-trivia">💡 {p.trivia}</p>}
          </section>

          {/* サイン */}
          <section className="learn-section">
            <SectionLabel kind="sign" label={`サイン：${s.name}`} question="どのように（どんなスタイルで）" />
            <p className="learn-lead">テーマ：{s.theme}</p>
            <ul className="learn-list">
              <li>
                <strong>{s.element}のサイン</strong>…{ELEMENT_LEARN[s.element]}
              </li>
              <li>
                <strong>{s.modality}宮</strong>…{MODALITY_LEARN[s.modality]}
              </li>
              <li>
                <strong>支配星は{s.ruler}</strong>…このサインの「持ち主」にあたる天体
              </li>
            </ul>
          </section>

          {/* ハウス（ASCはハウスの始まりそのものなので別の説明） */}
          {h ? (
            <section className="learn-section">
              <SectionLabel kind="house" label={`ハウス：第${h.house}ハウス`} question="どこで（人生のどの場面で）" />
              <p className="learn-lead">{h.field}</p>
              <p className="learn-text">{h.detail}</p>
              <p className="learn-trivia">
                💡 第{h.house}ハウスは「{h.category}」。{HOUSE_CATEGORY_LEARN[h.category]}。
              </p>
              {sunHint && (
                <div className="learn-hint">
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>太陽が第{h.house}ハウスにある人の傾向</div>
                  <div>◎ 長所：{sunHint.good}</div>
                  <div>△ 注意点：{sunHint.care}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    ※ 複数の占星術師の解説で共通している内容をまとめたものです
                  </div>
                </div>
              )}
            </section>
          ) : (
            p.houseNote && (
              <section className="learn-section">
                <SectionLabel kind="house" label="ハウスとの関係" question={p.houseNote.label} />
                <p className="learn-text">{p.houseNote.text}</p>
              </section>
            )
          )}
          </BasicsWrapper>

          {/* 読み方のコツ */}
          <div className="learn-tip">
            <strong>読み方の基本：</strong>
            <span style={{ color: PART_COLORS.planet.fg, fontWeight: 600 }}>天体（何が）</span>が、
            <span style={{ color: PART_COLORS.sign.fg, fontWeight: 600 }}>サイン（どのように）</span>、
            <span style={{ color: PART_COLORS.house.fg, fontWeight: 600 }}>ハウス（どこで）</span>
            発揮されるか。この3つを組み合わせるだけで、どの天体も同じように読めます。
          </div>
        </div>
      </div>
    </div>
  );
};
