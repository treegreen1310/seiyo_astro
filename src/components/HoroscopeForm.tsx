import React, { useState } from 'react';
import { JAPAN_PREFECTURES } from '../constants/prefectures';
import { ComboInput } from './ComboInput';

interface Props {
  onCalculate: (params: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    latitude: number;
    longitude: number;
    timezone: number;
  }) => void;
  isLoading: boolean;
}

// 候補リスト
const YEAR_OPTIONS: number[] = [];
for (let y = 2030; y >= 1920; y--) {
  YEAR_OPTIONS.push(y);
}
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

export const HoroscopeForm: React.FC<Props> = ({ onCalculate, isLoading }) => {
  // 初期状態はまっさら（空欄）
  const [yearStr, setYearStr] = useState<string>('');
  const [monthStr, setMonthStr] = useState<string>('');
  const [dayStr, setDayStr] = useState<string>('');
  const [hourStr, setHourStr] = useState<string>('');
  const [minuteStr, setMinuteStr] = useState<string>('');

  const [locationMode, setLocationMode] = useState<'city' | 'manual'>('city');
  const [selectedPref, setSelectedPref] = useState<string>('東京都 (新宿区/東京)');
  const [latStr, setLatStr] = useState<string>('35.6895');
  const [lonStr, setLonStr] = useState<string>('139.6917');

  const handlePrefChange = (prefName: string) => {
    setSelectedPref(prefName);
    const target = JAPAN_PREFECTURES.find(p => p.name === prefName);
    if (target) {
      setLatStr(target.lat.toString());
      setLonStr(target.lon.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearStr || !monthStr || !dayStr) {
      alert('生年月日の年・月・日を入力または選択してください。');
      return;
    }

    const y = parseInt(yearStr, 10);
    const m = Math.min(12, Math.max(1, parseInt(monthStr, 10) || 1));
    const d = Math.min(31, Math.max(1, parseInt(dayStr, 10) || 1));
    const h = hourStr === '' ? 12 : Math.min(23, Math.max(0, parseInt(hourStr, 10) || 0));
    const min = minuteStr === '' ? 0 : Math.min(59, Math.max(0, parseInt(minuteStr, 10) || 0));
    const lat = parseFloat(latStr) || 35.6895;
    const lon = parseFloat(lonStr) || 139.6917;

    onCalculate({
      year: y,
      month: m,
      day: d,
      hour: h,
      minute: min,
      latitude: lat,
      longitude: lon,
      timezone: 9.0
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: '#FFFFFF',
        padding: '22px 24px',
        borderRadius: '16px',
        border: '1px solid #E8DFD5',
        boxShadow: '0 8px 28px rgba(74, 63, 58, 0.04), 0 2px 6px rgba(74, 63, 58, 0.02)',
        marginBottom: '28px',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '18px',
          paddingBottom: '12px',
          borderBottom: '1px solid #F2EBE3'
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#FBF6EC',
            border: '1px solid #E6D5B8',
            color: '#C5A059',
            fontSize: '14px'
          }}
        >
          ✦
        </span>
        <div>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: '17px',
              fontWeight: 600,
              color: '#4A3F3A',
              letterSpacing: '0.04em'
            }}
          >
            出生データ入力
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
        {/* 生年月日（直接入力 ＋ 全候補ドロップダウン選択） */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: '#8C7A70',
              marginBottom: '7px',
              letterSpacing: '0.03em'
            }}
          >
            生年月日
          </label>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '3px' }}>
            <ComboInput
              value={yearStr}
              onChange={setYearStr}
              options={YEAR_OPTIONS}
              placeholder="年"
              width="58px"
              menuWidth="88px"
              unit="年"
            />
            <ComboInput
              value={monthStr}
              onChange={setMonthStr}
              options={MONTH_OPTIONS}
              placeholder="月"
              width="40px"
              menuWidth="68px"
              unit="月"
            />
            <ComboInput
              value={dayStr}
              onChange={setDayStr}
              options={DAY_OPTIONS}
              placeholder="日"
              width="40px"
              menuWidth="68px"
              unit="日"
            />
          </div>
        </div>

        {/* 出生時間 */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: '#8C7A70',
              marginBottom: '7px',
              letterSpacing: '0.03em'
            }}
          >
            出生時間
          </label>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '3px' }}>
            <ComboInput
              value={hourStr}
              onChange={setHourStr}
              options={HOUR_OPTIONS}
              placeholder="時"
              width="40px"
              menuWidth="68px"
              unit="時"
            />
            <ComboInput
              value={minuteStr}
              onChange={setMinuteStr}
              options={MINUTE_OPTIONS}
              placeholder="分"
              width="40px"
              menuWidth="68px"
              unit="分"
            />
          </div>
        </div>

        {/* 出生地の選択方式 */}
        <div style={{ flex: '1', minWidth: '280px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: '#8C7A70',
              marginBottom: '7px',
              letterSpacing: '0.03em'
            }}
          >
            出生地の指定方法
          </label>
          <div style={{ display: 'flex', gap: '18px', marginBottom: '10px', fontSize: '13px', color: '#4A3F3A' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="locationMode"
                checked={locationMode === 'city'}
                onChange={() => setLocationMode('city')}
                style={{ marginRight: '6px', accentColor: '#C27D7A' }}
              />
              主要都市から選ぶ
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="locationMode"
                checked={locationMode === 'manual'}
                onChange={() => setLocationMode('manual')}
                style={{ marginRight: '6px', accentColor: '#C27D7A' }}
              />
              緯度・経度を手動入力
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedPref}
              disabled={locationMode !== 'city'}
              onChange={e => handlePrefChange(e.target.value)}
              className="input-field"
              style={{ width: '190px', height: '36px' }}
            >
              {JAPAN_PREFECTURES.map(p => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: locationMode === 'manual' ? 1 : 0.45 }}>
              <span style={{ fontSize: '12px', color: '#8C7A70' }}>緯度:</span>
              <input
                type="text"
                disabled={locationMode !== 'manual'}
                value={latStr}
                onChange={e => setLatStr(e.target.value)}
                className="input-field"
                style={{ width: '82px', textAlign: 'center', padding: '6px 6px', height: '36px' }}
              />
              <span style={{ fontSize: '12px', color: '#8C7A70' }}>経度:</span>
              <input
                type="text"
                disabled={locationMode !== 'manual'}
                value={lonStr}
                onChange={e => setLonStr(e.target.value)}
                className="input-field"
                style={{ width: '102px', textAlign: 'center', padding: '6px 6px', height: '36px' }}
              />
            </div>
          </div>
        </div>

        {/* ボタン名称: ホロスコープ作成 */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? '作成中...' : '✦ ホロスコープ作成'}
          </button>
        </div>
      </div>
    </form>
  );
};
