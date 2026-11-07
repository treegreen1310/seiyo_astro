import React, { useEffect, useRef, useState } from 'react';
import { GLOSSARY } from '../data/learn/glossary';

interface Props {
  id: string;                 // GLOSSARY のキー
  children?: React.ReactNode; // 省略時は id をそのまま表示
}

const POPOVER_WIDTH = 270;

// 押すと用語の短い説明が出る（表の見出しなど overflow:hidden の中でも切れないよう position: fixed で表示）
export const Term: React.FC<Props> = ({ id, children }) => {
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const text = GLOSSARY[id];

  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => {
      if (ref.current && e.target instanceof Node && ref.current.contains(e.target)) return;
      setPos(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPos(null);
    };
    const onScroll = () => setPos(null);
    document.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [pos]);

  if (!text) return <>{children ?? id}</>;

  const toggle = (e: React.MouseEvent) => {
    // 行クリック（解説パネルを開く）などに伝わらないようにする
    e.stopPropagation();
    if (pos) {
      setPos(null);
      return;
    }
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - POPOVER_WIDTH - 8);
    // 画面の下の方では上側に出す
    const above = rect.bottom + 180 > window.innerHeight;
    setPos({ top: above ? rect.top - 6 : rect.bottom + 6, left, above });
  };

  return (
    <span ref={ref} className="term" role="button" tabIndex={0} onClick={toggle} onKeyDown={e => e.key === 'Enter' && toggle(e as unknown as React.MouseEvent)}>
      {children ?? id}
      {pos && (
        <span
          className="term-popover"
          role="tooltip"
          style={{
            top: pos.top,
            left: pos.left,
            width: Math.min(POPOVER_WIDTH, window.innerWidth - 16),
            transform: pos.above ? 'translateY(-100%)' : undefined,
          }}
          onClick={e => e.stopPropagation()}
        >
          <strong style={{ display: 'block', marginBottom: '3px', color: 'var(--accent-rose-dark)' }}>{id}</strong>
          {text}
        </span>
      )}
    </span>
  );
};
