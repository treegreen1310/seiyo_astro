import React, { Suspense, lazy, useState } from 'react';
import { HoroscopeWheel } from './components/HoroscopeWheel';
import { PlanetsTable } from './components/PlanetsTable';
import { HouseCuspsTable } from './components/HouseCuspsTable';
import { AspectMatrix } from './components/AspectMatrix';
import { HoroscopeForm } from './components/HoroscopeForm';
import { HoroscopeData } from './types/horoscope';
import { calculateHoroscopeLocally } from './utils/astroCalculator';
import { ComboInput } from './components/ComboInput';
// 解説データが大きいため、ツアーと解説パネルはチャート表示後に別ファイルとして読み込む
const ReadingTour = lazy(() => import('./components/ReadingTour').then(m => ({ default: m.ReadingTour })));
const LearnPanel = lazy(() => import('./components/LearnPanel').then(m => ({ default: m.LearnPanel })));
const AspectLearnPanel = lazy(() =>
  import('./components/AspectLearnPanel').then(m => ({ default: m.AspectLearnPanel })),
);
import { AspectTarget } from './data/learn/aspects';
import AboutSite from './components/AboutSite';

// 候補生成
const YEAR_OPTIONS: number[] = [];
for (let y = 2030; y >= 1920; y--) {
  YEAR_OPTIONS.push(y);
}
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

export const App: React.FC = () => {
  // 初期表示はまっさら（null）
  const [data, setData] = useState<HoroscopeData | null>(null);
  const [isDoubleCircle, setIsDoubleCircle] = useState<boolean>(false);
  const [transitData, setTransitData] = useState<HoroscopeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedPlanetKey, setSelectedPlanetKey] = useState<string | null>(null);
  // 一重円の図に小惑星・感受点を描くか（最初は非表示）
  const [showAsteroids, setShowAsteroids] = useState<boolean>(false);
  const [formResetKey, setFormResetKey] = useState<number>(0);
  // 画面下の「このサイトについて」を開いているか
  const [showAbout, setShowAbout] = useState<boolean>(false);
  // 学習パネルで解説を表示中の天体キー（null なら閉じている）
  const [learnKey, setLearnKey] = useState<string | null>(null);
  // アスペクトの解説パネルで表示中のアスペクト（null なら閉じている）
  const [learnAspect, setLearnAspect] = useState<AspectTarget | null>(null);

  // トランジット日時用ステート（出生データ入力と同じ方式のコンボ入力用文字列）
  const now = new Date();
  const [transitYearStr, setTransitYearStr] = useState<string>(now.getFullYear().toString());
  const [transitMonthStr, setTransitMonthStr] = useState<string>((now.getMonth() + 1).toString());
  const [transitDayStr, setTransitDayStr] = useState<string>(now.getDate().toString());
  const [transitHourStr, setTransitHourStr] = useState<string>(now.getHours().toString());
  const [transitMinuteStr, setTransitMinuteStr] = useState<string>(now.getMinutes().toString());

  // トップのタイトルクリック時：出生データ入力・チャート・鍵をすべて初期状態にリセット
  const handleResetAll = () => {
    setData(null);
    setTransitData(null);
    setIsDoubleCircle(false);
    setSelectedPlanetKey(null);
    setShowAsteroids(false);
    setLearnKey(null);
    setLearnAspect(null);
    setFormResetKey(prev => prev + 1);
    const current = new Date();
    setTransitYearStr(current.getFullYear().toString());
    setTransitMonthStr((current.getMonth() + 1).toString());
    setTransitDayStr(current.getDate().toString());
    setTransitHourStr(current.getHours().toString());
    setTransitMinuteStr(current.getMinutes().toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ネイタルホロスコープ計算（ブラウザ内WebAssembly完結、サーバー不要）
  const fetchHoroscope = async (params: any) => {
    setSelectedPlanetKey(null); // ホロスコープ作成時に天体選択をリセット
    setLearnKey(null);
    setLearnAspect(null);
    setIsLoading(true);
    try {
      // 1. まずブラウザ内完結の高速Wasmエンジンで直接計算
      const result = await calculateHoroscopeLocally(params);
      setData(result);
    } catch (localErr) {
      console.warn('Local Wasm calculation failed, falling back to backend API:', localErr);
      // 2. 万が一の場合はバックエンドAPIにフォールバック
      try {
        const res = await fetch('http://127.0.0.1:8000/api/horoscope', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.warn('Backend server also not responding:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // トランジット計算実行関数（ブラウザ内WebAssembly完結、サーバー不要）
  const fetchTransitChart = async (y: number, m: number, d: number, h: number, min: number) => {
    const transitParams = {
      year: y,
      month: m,
      day: d,
      hour: h,
      minute: min,
      latitude: data?.chart_info?.lat || 35.6895,
      longitude: data?.chart_info?.lon || 139.6917,
      timezone: 9.0
    };

    try {
      // 1. まずブラウザ内完結の高速Wasmエンジンで直接計算
      const result = await calculateHoroscopeLocally(transitParams);
      setTransitData(result);
    } catch (localErr) {
      console.warn('Local transit calculation failed, falling back to backend API:', localErr);
      // 2. バックエンドAPIフォールバック
      try {
        const res = await fetch('http://127.0.0.1:8000/api/horoscope', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transitParams),
        });
        if (res.ok) {
          const json = await res.json();
          setTransitData(json);
        }
      } catch (e) {
        console.warn('Failed to fetch transit data from backend:', e);
      }
    }
  };

  // 二重円モード切り替え
  const handleToggleDoubleCircle = (enable: boolean) => {
    setSelectedPlanetKey(null); // モード切り替え時に天体選択をリセット
    setIsDoubleCircle(enable);
    if (enable && !transitData) {
      fetchTransitChart(
        parseInt(transitYearStr, 10) || now.getFullYear(),
        parseInt(transitMonthStr, 10) || now.getMonth() + 1,
        parseInt(transitDayStr, 10) || now.getDate(),
        parseInt(transitHourStr, 10) || now.getHours(),
        parseInt(transitMinuteStr, 10) || now.getMinutes()
      );
    }
  };

  // トランジット日時の更新ハンドラ
  const handleTransitUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedPlanetKey(null); // トランジット更新時に天体選択をリセット
    fetchTransitChart(
      parseInt(transitYearStr, 10) || now.getFullYear(),
      parseInt(transitMonthStr, 10) || now.getMonth() + 1,
      parseInt(transitDayStr, 10) || now.getDate(),
      parseInt(transitHourStr, 10) || now.getHours(),
      parseInt(transitMinuteStr, 10) || now.getMinutes()
    );
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%' }}>
      {/* ヘッダーバー（大人フェミニンなウォームサロン風） */}
      <header
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF6F0 100%)',
          color: '#4A3F3A',
          borderBottom: '1px solid #E8DFD5',
          boxShadow: '0 2px 14px rgba(74, 63, 58, 0.04)',
          padding: '18px 0'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div
            onClick={handleResetAll}
            title="クリックして初期状態に戻す"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FBF6EC 0%, #F5E8D3 100%)',
                border: '1px solid #DEC89E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#B89146',
                fontSize: '20px',
                boxShadow: '0 2px 8px rgba(197, 160, 89, 0.15)'
              }}
            >
              ✧
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-serif)',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#4A3F3A',
                  letterSpacing: '0.05em'
                }}
              >
                星よみホロスコープ
              </h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#8C7A70', letterSpacing: '0.02em' }}>
                ― 使うほど詳しくなる
              </p>
            </div>
          </div>

          {/* 1重円 / 2重円 切り替えスイッチ（ピル型カプセルトグル） */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F2EBE3',
              padding: '4px',
              borderRadius: '999px',
              border: '1px solid #E2D6C8'
            }}
          >
            <button
              onClick={() => handleToggleDoubleCircle(false)}
              style={{
                backgroundColor: !isDoubleCircle ? '#FFFFFF' : 'transparent',
                color: !isDoubleCircle ? '#A86461' : '#8C7A70',
                border: 'none',
                padding: '7px 18px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: !isDoubleCircle ? 600 : 500,
                cursor: 'pointer',
                boxShadow: !isDoubleCircle ? '0 2px 8px rgba(74, 63, 58, 0.08)' : 'none',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
            >
              一重円 (ネイタル)
            </button>
            <button
              onClick={() => handleToggleDoubleCircle(true)}
              style={{
                backgroundColor: isDoubleCircle ? '#FFFFFF' : 'transparent',
                color: isDoubleCircle ? '#A86461' : '#8C7A70',
                border: 'none',
                padding: '7px 18px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: isDoubleCircle ? 600 : 500,
                cursor: 'pointer',
                boxShadow: isDoubleCircle ? '0 2px 8px rgba(74, 63, 58, 0.08)' : 'none',
                transition: 'all 0.2s',
                fontFamily: 'inherit'
              }}
            >
              二重円 (トランジット)
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="app-container">
        {/* ネイタル出生データ入力フォーム */}
        <HoroscopeForm key={formResetKey} onCalculate={fetchHoroscope} isLoading={isLoading} />

        {/* 二重円時のトランジット日時設定フォーム */}
        {isDoubleCircle && (
          <div
            style={{
              backgroundColor: '#FDF8F7',
              border: '1px solid #E5CFCB',
              borderRadius: '14px',
              padding: '16px 22px',
              marginBottom: '28px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              boxShadow: '0 4px 16px rgba(194, 125, 122, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#F7ECEB',
                  color: '#C27D7A',
                  fontSize: '14px'
                }}
              >
                ✧
              </span>
              <div>
                <strong style={{ fontSize: '14px', color: '#4A3F3A', fontFamily: 'var(--font-serif)' }}>
                  二重円 外側（トランジット）の日時指定:
                </strong>
              </div>
            </div>

            <form onSubmit={handleTransitUpdate} style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <ComboInput
                value={transitYearStr}
                onChange={setTransitYearStr}
                options={YEAR_OPTIONS}
                width="58px"
                menuWidth="88px"
                unit="年"
              />
              <ComboInput
                value={transitMonthStr}
                onChange={setTransitMonthStr}
                options={MONTH_OPTIONS}
                width="40px"
                menuWidth="68px"
                unit="月"
              />
              <ComboInput
                value={transitDayStr}
                onChange={setTransitDayStr}
                options={DAY_OPTIONS}
                width="40px"
                menuWidth="68px"
                unit="日"
              />
              <ComboInput
                value={transitHourStr}
                onChange={setTransitHourStr}
                options={HOUR_OPTIONS}
                width="40px"
                menuWidth="68px"
                unit="時"
              />
              <ComboInput
                value={transitMinuteStr}
                onChange={setTransitMinuteStr}
                options={MINUTE_OPTIONS}
                width="40px"
                menuWidth="68px"
                unit="分"
              />

              <button
                type="submit"
                style={{
                  backgroundColor: '#A86461',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontWeight: 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginLeft: '6px',
                  fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(168, 100, 97, 0.25)'
                }}
              >
                トランジット更新
              </button>
            </form>
          </div>
        )}

        {/* チャートレイアウト表示（データがある場合のみ展開、初期状態は案内表示） */}
        {data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
              {/* ホロスコープ円盤 ＋ 横の天体情報カード */}
              <HoroscopeWheel
                data={data}
                isDoubleCircle={isDoubleCircle}
                transitData={transitData}
                selectedPlanetKey={selectedPlanetKey}
                onSelectPlanet={setSelectedPlanetKey}
                showAsteroids={showAsteroids}
                onToggleAsteroids={() => {
                  // 非表示にする小惑星が選択中だった場合に備えて選択を外す
                  setSelectedPlanetKey(null);
                  setShowAsteroids(prev => !prev);
                }}
                onLearn={setLearnKey}
                onLearnAspect={setLearnAspect}
                size={530}
              />
            </div>

            <Suspense fallback={null}>
              {/* 学習パネル（天体を押すと意味と読み解き文を表示） */}
              <LearnPanel
                planet={data.planets.find(p => p.key === learnKey) ?? null}
                onClose={() => setLearnKey(null)}
              />

              {/* アスペクトの解説パネル（天体の解説へ移るときはこちらを閉じる） */}
              <AspectLearnPanel
                target={learnAspect}
                onClose={() => setLearnAspect(null)}
                onOpenPlanet={key => {
                  setLearnAspect(null);
                  setLearnKey(key);
                }}
              />
            </Suspense>

            {/* 各種詳細テーブル（一重円: ツアー・天体一覧・アスペクト・ハウスカスプ / 二重円: アスペクトのみ） */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>
              {!isDoubleCircle && (
                <>
                  {/* 全体 → 細部の順に自分のチャートを読む案内 */}
                  <Suspense
                    fallback={
                      <div style={{ padding: '16px', fontSize: '13px', color: '#8a8070' }}>読み解きツアーを読み込んでいます…</div>
                    }
                  >
                    <ReadingTour data={data} onLearn={setLearnKey} onLearnAspect={setLearnAspect} />
                  </Suspense>

                  {/* 天体一覧（指定順ソート済み） */}
                  <PlanetsTable planets={data.planets} onLearn={setLearnKey} />
                </>
              )}

              {/* アスペクトリスト（一重円: ネイタル / 二重円: ネイタル×トランジット） */}
              <AspectMatrix
                planets={data.planets}
                aspectMatrix={data.aspect_matrix}
                aspects={data.aspects}
                isDoubleCircle={isDoubleCircle}
                transitData={transitData}
                onLearnAspect={setLearnAspect}
              />

              {!isDoubleCircle && (
                <>
                  {/* 小惑星・感受点が関わるアスペクトだけのリスト */}
                  <AspectMatrix
                    planets={data.planets}
                    aspectMatrix={data.aspect_matrix}
                    aspects={data.aspects}
                    includeAsteroids={true}
                    onLearnAspect={setLearnAspect}
                  />

                  {/* ネイタルチャート　ハウスカスプ */}
                  <HouseCuspsTable houses={data.houses} />
                </>
              )}

              {/* 最下部：トップに戻るボタン */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#6E5D54',
                    border: '1px solid #DECFC2',
                    padding: '9px 26px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    boxShadow: '0 2px 8px rgba(74, 63, 58, 0.06)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>↑</span>
                  <span>トップに戻る</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8DFD5',
              borderRadius: '18px',
              padding: '64px 24px',
              textAlign: 'center',
              color: '#8C7A70',
              boxShadow: '0 8px 28px rgba(74, 63, 58, 0.03)'
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                margin: '0 auto 16px auto',
                borderRadius: '50%',
                backgroundColor: '#FBF6EC',
                border: '1px solid #E6D5B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#C5A059'
              }}
            >
              ✦
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                fontWeight: 600,
                color: '#4A3F3A',
                marginBottom: '8px',
                letterSpacing: '0.04em'
              }}
            >
              あなただけの星の配置を描き出します
            </h3>
            <p style={{ fontSize: '13.5px', margin: 0, color: '#8C7A70' }}>
              上のフォームに生年月日を入力し、「ホロスコープ作成」ボタンをクリックするとチャートが表示されます。
            </p>
          </div>
        )}
      </main>

      {/* ライセンス表示（AGPL・Swiss Ephemeris） */}
      <footer
        style={{
          textAlign: 'center',
          padding: '24px 16px 32px',
          fontSize: '12px',
          lineHeight: 1.8,
          color: '#8C7A70',
          borderTop: '1px solid #E6D5B8',
          marginTop: '24px'
        }}
      >
        <div>天体計算：Swiss Ephemeris（© Astrodienst AG）を使用しています</div>
        <div>
          <button
            type="button"
            onClick={() => setShowAbout((v) => !v)}
            aria-expanded={showAbout}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              font: 'inherit',
              color: '#A8865A',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            このサイトについて
          </button>{' '}
          ｜{' '}
          <a href="https://github.com/treegreen1310/seiyo_astro" target="_blank" rel="noopener noreferrer" style={{ color: '#A8865A' }}>
            ソースコード（AGPL）
          </a>
        </div>
        {showAbout && <AboutSite />}
      </footer>
    </div>
  );
};

export default App;
