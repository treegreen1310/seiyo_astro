import React, { useState, useRef, useEffect } from 'react';

interface ComboInputProps {
  value: string;
  onChange: (val: string) => void;
  options: number[];
  placeholder?: string;
  width?: string;
  menuWidth?: string;
  unit: string;
}

export const ComboInput: React.FC<ComboInputProps> = ({
  value,
  onChange,
  options,
  placeholder,
  width = '64px',
  menuWidth = '80px',
  unit
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 外側クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          border: isOpen ? '1.5px solid #C27D7A' : '1px solid #D8C8B8',
          borderRadius: '8px',
          boxSizing: 'border-box',
          height: '36px',
          boxShadow: isOpen ? '0 0 0 3px rgba(194, 125, 122, 0.15)' : '0 1px 2px rgba(74, 63, 58, 0.03)',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}
      >
        {/* 直接キーボード数字入力 */}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
          onFocus={() => setIsOpen(false)}
          placeholder={placeholder}
          style={{
            width,
            border: 'none',
            outline: 'none',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500',
            color: '#4A3F3A',
            padding: '4px 2px',
            backgroundColor: 'transparent',
            boxSizing: 'border-box',
            fontFamily: 'inherit'
          }}
        />

        {/* 候補展開用トグルボタン（▼） */}
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          title="候補から選ぶ"
          style={{
            border: 'none',
            borderLeft: '1px solid #E8DFD5',
            backgroundColor: '#FAF7F2',
            color: '#8C7A70',
            cursor: 'pointer',
            height: '100%',
            padding: '0 7px',
            fontSize: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTopRightRadius: '7px',
            borderBottomRightRadius: '7px',
            outline: 'none',
            transition: 'background-color 0.15s'
          }}
        >
          ▼
        </button>

        {/* 余裕のある広々とした候補リスト（絶対配置ドロップダウン） */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              minWidth: menuWidth,
              maxHeight: '210px',
              overflowY: 'auto',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E8DFD5',
              borderRadius: '10px',
              boxShadow: '0 10px 24px rgba(74, 63, 58, 0.12)',
              zIndex: 9999,
              padding: '4px 0'
            }}
          >
            {options.map(opt => {
              const optStr = opt.toString();
              const isSelected = value === optStr;
              return (
                <div
                  key={opt}
                  onClick={() => {
                    onChange(optStr);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13.5px',
                    fontWeight: isSelected ? '600' : '400',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#C27D7A' : 'transparent',
                    color: isSelected ? '#FFFFFF' : '#4A3F3A',
                    transition: 'background-color 0.12s'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#F7ECEB';
                      e.currentTarget.style.color = '#A86461';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#4A3F3A';
                    }
                  }}
                >
                  {opt}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 単位ラベル（年・月・日・時・分） */}
      <span style={{ fontSize: '12.5px', color: '#8C7A70', marginRight: '6px', marginLeft: '1px' }}>
        {unit}
      </span>
    </div>
  );
};
