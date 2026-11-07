import React, { useEffect, useRef, useState } from 'react';
import { HoroscopeData, Planet } from '../types/horoscope';
import { HOUSE_LEARN, PLANET_LEARN, SentencePart, buildReadingSentence } from '../data/learn/basics';
import {
  TOUR_STEPS,
  SKELETON_ITEMS,
  countElements,
  countModalities,
  countHemispheres,
  hemisphereNotes,
  findStelliums,
  balanceNotes,
  findChartRuler,
  buildSkeletonSentence,
  skeletonRelations,
  skeletonElementNote,
  chartRulerNotes,
  RELATION_LABELS,
  PERSONAL_ITEMS,
  personalRelations,
  personalElementNote,
  SOCIAL_ITEMS,
  findOuterAspects,
  jupiterSaturnNote,
  outerAspectNotes,
  DIGNITY_LEARN,
  RETRO_LEARN,
  findDignities,
  findRetrogrades,
  detailNotes,
} from '../data/learn/tour';
import { AspectTarget } from '../data/learn/aspects';
import { findDignityDetail } from '../data/learn/dignities';
import { PART_COLORS } from './LearnPanel';

interface Props {
  data: HoroscopeData;
  onLearn: (key: string) => void;
  onLearnAspect: (target: AspectTarget) => void;
}

const ELEMENT_COLORS: Record<string, string> = {
  火: '#C98683',
  地: '#B89146',
  風: '#7E9C88',
  水: '#7A8FB0',
  活動: '#A86461',
  不動: '#8C6D32',
  柔軟: '#5E7E69',
};

// 「自分の言葉で書いてみよう」欄の記入例
const MEMO_EXAMPLES: Record<number, string> = {
  1: '例：火が多いから、思い立ったらすぐ動くところは当たっている気がする',
  2: '例：月が蟹座だから、家でゆっくりする時間がないと疲れてしまう',
  3: '例：金星が双子座だから、話していて楽しい人に惹かれやすい',
  4: '例：月と冥王星がスクエアだから、好きなものにはとことんのめり込んでしまう',
  5: '例：水星が逆行しているから、話す前に頭の中でじっくり考えるのかもしれない',
};

// メモはチャートごとにブラウザへ保存する（保存できない環境でも動くように try/catch）
const memoStorageKey = (data: HoroscopeData) =>
  `astro-tour-memo:${data.chart_info.datetime_str}:${data.chart_info.lat}:${data.chart_info.lon}`;

const loadMemos = (key: string): Record<number, string> => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveMemos = (key: string, memos: Record<number, string>) => {
  try {
    localStorage.setItem(key, JSON.stringify(memos));
  } catch {
    // 保存できなくても画面上のメモはそのまま使える
  }
};

const planetNames = (ps: Planet[]) => ps.map(p => p.name).join('・');

const Sentence: React.FC<{ parts: SentencePart[] }> = ({ parts }) => (
  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.9 }}>
    {parts.map((part, i) =>
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
);

// 横棒グラフ1行（エレメント・3区分）
const CountBar: React.FC<{ label: string; planets: Planet[] }> = ({ label, planets }) => (
  <div className="tour-bar-row">
    <span className="tour-bar-label" style={{ color: ELEMENT_COLORS[label] }}>{label}</span>
    <span className="tour-bar-track">
      <span
        className="tour-bar-fill"
        style={{ width: `${planets.length * 10}%`, backgroundColor: ELEMENT_COLORS[label] }}
      />
    </span>
    <span className="tour-bar-count">{planets.length}</span>
    <span className="tour-bar-names">{planetNames(planets) || '—'}</span>
  </div>
);

const StepBalance: React.FC<{ data: HoroscopeData }> = ({ data }) => {
  const hemi = countHemispheres(data.planets);
  const stelliums = findStelliums(data.planets);
  return (
    <>
      <div className="tour-block">
        <div className="tour-block-title">エレメント（4区分）</div>
        {countElements(data.planets).map(g => (
          <CountBar key={g.key} label={g.key} planets={g.planets} />
        ))}
      </div>
      <div className="tour-block">
        <div className="tour-block-title">3区分</div>
        {countModalities(data.planets).map(g => (
          <CountBar key={g.key} label={g.key} planets={g.planets} />
        ))}
      </div>
      <div className="tour-block">
        <div className="tour-block-title">半球のかたより</div>
        <div className="tour-hemi">
          <span>上（7〜12ハウス）：{hemi.above.length}</span>
          <span>下（1〜6ハウス）：{hemi.below.length}</span>
          <span>東（10〜3ハウス）：{hemi.east.length}</span>
          <span>西（4〜9ハウス）：{hemi.west.length}</span>
        </div>
      </div>
      <div className="tour-block">
        <div className="tour-block-title">あなたのチャートの特徴</div>
        <ul className="learn-list">
          {balanceNotes(data.planets).map(n => (
            <li key={n}>{n}</li>
          ))}
          {hemisphereNotes(hemi).map(n => (
            <li key={n}>{n}</li>
          ))}
          {stelliums.map(s => (
            <li key={s.label}>
              <strong>{s.label}に天体が{s.planets.length}つ集まっています（{planetNames(s.planets)}）。</strong>
              これを「ステリウム」と呼び、人生で特に力が注がれやすいテーマになります。
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

// 天体1つ分：配置と読み解き文（ステップ2・3で共通）
const PlacementItems: React.FC<{
  data: HoroscopeData;
  items: { key: string; caption: string }[];
  onLearn: (key: string) => void;
}> = ({ data, items, onLearn }) => (
  <>
    {items.map(({ key, caption }) => {
      const planet = data.planets.find(p => p.key === key);
      const learn = PLANET_LEARN[key];
      if (!planet || !learn) return null;
      const parts = buildReadingSentence(key, planet.sign, planet.house);
      return (
        <div key={key} className="tour-item">
          <div className="tour-item-head">
            <span className="tour-item-caption">{caption}</span>
            <strong>
              {learn.symbol} {learn.name.replace(/（.+）/, '')}
            </strong>
            <span style={{ color: PART_COLORS.sign.fg }}>
              {planet.sign_symbol} {planet.sign}
            </span>
            {learn.usesHouse && <span style={{ color: PART_COLORS.house.fg }}>第{planet.house}ハウス</span>}
            <button type="button" className="learn-link-btn tour-item-more" onClick={() => onLearn(key)}>
              詳しく →
            </button>
          </div>
          {parts && <Sentence parts={parts} />}
        </div>
      );
    })}
  </>
);

// 関係の読み解き（同じサイン・同じエレメントなど）の一覧項目
const RelationItems: React.FC<{ relations: ReturnType<typeof skeletonRelations> }> = ({ relations }) => (
  <>
    {relations.map(r => (
      <li key={r.title}>
        <strong>{r.title}</strong>
        {/* スマホでは札の途中で切れないよう、札ごと次の行に送る */}
        <br className="mobile-only-br" />
        <span className="tour-relation-tag">{RELATION_LABELS[r.relation]}</span>
        <br />
        {r.text}
      </li>
    ))}
  </>
);

const StepPersonal: React.FC<{ data: HoroscopeData; onLearn: (key: string) => void }> = ({ data, onLearn }) => (
  <>
    <PlacementItems data={data} items={PERSONAL_ITEMS} onLearn={onLearn} />

    <div className="tour-block tour-summary">
      <div className="tour-block-title">個人天体のまとめ</div>
      <ul className="learn-list">
        <RelationItems relations={personalRelations(data.planets)} />
        <li>{personalElementNote(data.planets)}</li>
      </ul>
    </div>

    <p className="learn-trivia">
      💡 地球から見ると、水星は太陽から最大28度ほど、金星は最大47度ほどしか離れません。そのため水星は太陽と同じかとなりのサイン、金星は太陽の前後2つのサインまでに必ず入ります。
    </p>
  </>
);

const StepSocial: React.FC<{
  data: HoroscopeData;
  onLearn: (key: string) => void;
  onLearnAspect: (target: AspectTarget) => void;
}> = ({ data, onLearn, onLearnAspect }) => {
  const outerAspects = findOuterAspects(data.planets, data.aspects ?? []);
  const jsNote = jupiterSaturnNote(data.planets);
  return (
    <>
      <PlacementItems data={data} items={SOCIAL_ITEMS} onLearn={onLearn} />

      <div className="tour-block">
        <div className="tour-block-title">個人的な天体と外側の天体のアスペクト</div>
        {outerAspects.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-sub)' }}>目立ったアスペクトはありません。</p>
        ) : (
          outerAspects.map(a => (
            <div key={`${a.inner.key}-${a.outer.key}`} className="tour-aspect-row">
              <div className="tour-aspect-head">
                <strong>
                  {a.inner.name} × {a.outer.name}
                </strong>
                <span style={{ color: 'var(--text-sub)' }}>{a.aspectName}</span>
                {a.strong && <span className="tour-strong-tag">特に強い</span>}
                <button type="button" className="aspect-learn-btn" onClick={() => onLearnAspect(a.target)}>
                  解説
                </button>
                <span className="tour-aspect-orb">orb {a.target.orbStr}</span>
              </div>
              {a.oneLine && <p className="tour-aspect-oneline">{a.oneLine}</p>}
              <p className="tour-aspect-text">{a.text}</p>
            </div>
          ))
        )}
      </div>

      <div className="tour-block tour-summary">
        <div className="tour-block-title">社会天体とアスペクトのまとめ</div>
        <ul className="learn-list">
          {jsNote && <li>{jsNote}</li>}
          {outerAspectNotes(outerAspects).map(n => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>

      <p className="learn-trivia">
        💡 ハードなアスペクト（スクエア・オポジションなど）は「悪い配置」ではありません。緊張がある分、乗り越えたときに大きな力になります。
      </p>
    </>
  );
};

const StepDetail: React.FC<{ data: HoroscopeData; onLearn: (key: string) => void }> = ({ data, onLearn }) => {
  const dignities = findDignities(data.planets);
  const retros = findRetrogrades(data.planets);
  return (
    <>
      <div className="tour-block">
        <div className="tour-block-title">ディグニティ（天体の居心地）</div>
        {dignities.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-sub)' }}>
            本来の場所・高揚・アウェー・力を出しにくい場所にある天体はありません。
          </p>
        ) : (
          dignities.map(d => (
            <div key={d.planet.key} className="tour-aspect-row">
              <div className="tour-aspect-head">
                <strong>
                  {d.planet.symbol} {d.planet.name}
                </strong>
                <span style={{ color: PART_COLORS.sign.fg }}>
                  {d.planet.sign_symbol} {d.planet.sign}
                </span>
                {d.kinds.map(k => (
                  <span key={k} className={DIGNITY_LEARN[k].tone === 'good' ? 'tour-strong-tag' : 'tour-relation-tag'}>
                    {DIGNITY_LEARN[k].label}
                  </span>
                ))}
                {PLANET_LEARN[d.planet.key] && (
                  <button type="button" className="aspect-learn-btn" onClick={() => onLearn(d.planet.key)}>
                    解説
                  </button>
                )}
              </div>
              {(() => {
                const detail = findDignityDetail(d.planet.key, d.planet.sign);
                if (!detail) {
                  return d.kinds.map(k => (
                    <p key={k} className="tour-aspect-text">{DIGNITY_LEARN[k].text}</p>
                  ));
                }
                const good = d.kinds.some(k => DIGNITY_LEARN[k].tone === 'good');
                return (
                  <>
                    <p className="tour-aspect-text">{detail.state}</p>
                    <ul className="learn-list" style={{ margin: '4px 0' }}>
                      {detail.examples.map(ex => (
                        <li key={ex}>{ex}</li>
                      ))}
                    </ul>
                    <p className="tour-aspect-text">
                      <strong>{good ? '気をつけたいこと' : '活かし方'}：</strong>
                      {detail.tip}
                    </p>
                  </>
                );
              })()}
              {d.modern && (
                <p className="tour-aspect-text" style={{ color: 'var(--text-sub)', fontSize: '12px' }}>
                  ※ 天王星・海王星・冥王星の支配サインは、近代の占星術で加えられたものです。
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="tour-block">
        <div className="tour-block-title">逆行している天体</div>
        {retros.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-sub)' }}>逆行している天体はありません。</p>
        ) : (
          retros.map(p => (
            <div key={p.key} className="tour-aspect-row">
              <div className="tour-aspect-head">
                <strong>
                  {p.symbol} {p.name}
                </strong>
                <span style={{ color: 'var(--text-sub)' }}>逆行（R）</span>
              </div>
              <p className="tour-aspect-text">{RETRO_LEARN[p.key]}</p>
            </div>
          ))
        )}
      </div>

      <div className="tour-block tour-summary">
        <div className="tour-block-title">ほかのステップとつなげて読む</div>
        <ul className="learn-list">
          {detailNotes(dignities, retros, data.planets, data.houses).map(n => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>

      <p className="learn-trivia">
        💡 逆行は、地球から見て天体が後ろ向きに進んでいるように見える現象で、実際に逆に進んでいるわけではありません。木星から冥王星までの天体は1年のうち4〜5か月ほど逆行するので、多くの人が持っています。
      </p>
    </>
  );
};

const StepSkeleton: React.FC<{ data: HoroscopeData; onLearn: (key: string) => void }> = ({ data, onLearn }) => {
  const ruler = findChartRuler(data.planets, data.houses);
  const rulerHouse = ruler ? HOUSE_LEARN[ruler.planet.house] : null;
  const skeletonSentence = buildSkeletonSentence(data.planets, ruler);
  return (
    <>
      <PlacementItems data={data} items={SKELETON_ITEMS} onLearn={onLearn} />

      {ruler && (
        <div className="tour-item">
          <div className="tour-item-head">
            <span className="tour-item-caption">人生の舵取り役</span>
            <strong>チャートルーラー：{ruler.planet.symbol} {ruler.planet.name}</strong>
            {PLANET_LEARN[ruler.planet.key] && (
              <button
                type="button"
                className="learn-link-btn tour-item-more"
                onClick={() => onLearn(ruler.planet.key)}
              >
                詳しく →
              </button>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.9 }}>
            ASCが{ruler.ascSign}なので、{ruler.ascSign}の支配星である
            <strong style={{ color: PART_COLORS.planet.fg }}>{ruler.planet.name}</strong>
            があなたのチャートルーラーです。
            {rulerHouse && (
              <>
                {ruler.planet.name}は第{rulerHouse.house}ハウスにあるので、人生の舵は
                <span style={{ color: PART_COLORS.house.fg, fontWeight: 600 }}>「{rulerHouse.field}」</span>
                の方向へ向かいやすいと読みます。
              </>
            )}
          </p>
          {ruler.classical && (
            <p className="learn-trivia">
              💡 古典的な読み方では、{ruler.ascSign}の支配星を{ruler.classical}とします。両方を見比べる占星術師もいます。
            </p>
          )}
        </div>
      )}

      {/* 5つを組み合わせた総合的な読み解き */}
      <div className="tour-block tour-summary">
        <div className="tour-block-title">骨格のまとめ</div>
        {skeletonSentence && (
          <div style={{ marginBottom: '12px' }}>
            <Sentence parts={skeletonSentence} />
          </div>
        )}
        <ul className="learn-list">
          <RelationItems relations={skeletonRelations(data.planets)} />
          <li>{skeletonElementNote(data.planets, ruler)}</li>
          {chartRulerNotes(ruler).map(n => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>

      <p className="learn-trivia">
        💡 太陽・月・ASCのサインがバラバラなのは普通のことです。「目指す自分」「素の自分」「見られる自分」の違いが、あなたの奥行きになります。
      </p>
    </>
  );
};

export const ReadingTour: React.FC<Props> = ({ data, onLearn, onLearnAspect }) => {
  const [started, setStarted] = useState(false);
  const [stepId, setStepId] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  // 「次のステップへ」「前へ」で切り替えたら、ツアーの先頭から読めるようにする
  const goToStep = (id: number) => {
    setStepId(id);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const storageKey = memoStorageKey(data);
  const [memos, setMemos] = useState<Record<number, string>>(() => loadMemos(storageKey));

  // 別のチャートを作ったら、そのチャートのメモに切り替えて最初から
  useEffect(() => {
    setMemos(loadMemos(storageKey));
    setStarted(false);
    setStepId(1);
  }, [storageKey]);

  const step = TOUR_STEPS.find(s => s.id === stepId) ?? TOUR_STEPS[0];
  const readySteps = TOUR_STEPS.filter(s => s.ready);
  const isLastReady = stepId === readySteps[readySteps.length - 1].id;

  const updateMemo = (text: string) => {
    const next = { ...memos, [stepId]: text };
    setMemos(next);
    saveMemos(storageKey, next);
  };

  return (
    <div className="astro-table-container" ref={topRef} style={{ scrollMarginTop: '12px' }}>
      <div className="astro-table-title">5ステップ読み解きツアー</div>
      <div style={{ padding: '16px 18px 18px' }}>
        {!started ? (
          <div style={{ textAlign: 'center' }}>
            <p className="tour-intro-lead">
              「全体 → 細部」の順番で、あなたのチャートを1ステップずつ読んでいきます。
            </p>
            {/* PCは一覧を中央・ボタンを右端に置き、ボタンの下端を一覧の最後の行にそろえる */}
            <div className="tour-intro-row">
              <ol className="tour-overview">
                {TOUR_STEPS.map(s => (
                  <li key={s.id} className={s.ready ? '' : 'is-soon'}>
                    {s.title}
                    {!s.ready && <span className="tour-soon">準備中</span>}
                  </li>
                ))}
              </ol>
              <button type="button" className="btn-primary tour-start-btn" onClick={() => setStarted(true)}>
                読み解きを始める
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ステップの切り替え */}
            <div className="tour-stepper">
              {TOUR_STEPS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  disabled={!s.ready}
                  className={`tour-step-chip${s.id === stepId ? ' is-active' : ''}`}
                  onClick={() => setStepId(s.id)}
                >
                  {s.id}. {s.short}
                </button>
              ))}
            </div>

            <h3 className="tour-title">
              ステップ{step.id}：{step.title}
            </h3>

            {/* ①考え方 */}
            <div className="learn-tip" style={{ marginBottom: '16px' }}>
              <strong>考え方：</strong>
              {step.idea}
            </div>

            {/* ②あなたの配置 */}
            {step.id === 1 && <StepBalance data={data} />}
            {step.id === 2 && <StepSkeleton data={data} onLearn={onLearn} />}
            {step.id === 3 && <StepPersonal data={data} onLearn={onLearn} />}
            {step.id === 4 && <StepSocial data={data} onLearn={onLearn} onLearnAspect={onLearnAspect} />}
            {step.id === 5 && <StepDetail data={data} onLearn={onLearn} />}

            {/* ③自分の言葉で書いてみよう */}
            <div className="tour-block" style={{ marginTop: '16px' }}>
              <div className="tour-block-title">自分の言葉で書いてみよう</div>
              <textarea
                className="tour-memo"
                value={memos[stepId] ?? ''}
                onChange={e => updateMemo(e.target.value)}
                placeholder={MEMO_EXAMPLES[step.id] ?? ''}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                メモはこのブラウザの中だけに保存されます
              </div>
            </div>

            {/* 前へ・次へ */}
            <div className="tour-nav">
              <button
                type="button"
                className="learn-link-btn"
                onClick={() => (stepId === 1 ? setStarted(false) : goToStep(stepId - 1))}
              >
                ← {stepId === 1 ? 'はじめに戻る' : '前のステップ'}
              </button>
              {isLastReady ? (
                <span style={{ fontSize: '12.5px', color: 'var(--text-sub)' }}>これでツアーは終わりです。おつかれさまでした</span>
              ) : (
                <button type="button" className="btn-primary" onClick={() => goToStep(stepId + 1)}>
                  次のステップへ →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
