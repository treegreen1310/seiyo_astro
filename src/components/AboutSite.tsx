import React, { useEffect, useRef } from 'react';

/**
 * 画面下の「このサイトについて」の本文（入力した情報・解説・ライセンス）
 */
const AboutSite: React.FC = () => {
  // 開いたら「入力した情報について」の先頭までスクロールする
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const headingStyle: React.CSSProperties = {
    fontWeight: 700,
    color: '#4A3F3A',
    marginBottom: '2px'
  };
  const itemStyle: React.CSSProperties = { marginBottom: '12px' };
  const linkStyle: React.CSSProperties = { color: '#A8865A' };

  return (
    <div
      ref={boxRef}
      style={{
        scrollMarginTop: '16px',
        maxWidth: '640px',
        margin: '16px auto 4px',
        padding: '16px 18px',
        textAlign: 'left',
        backgroundColor: '#FDFBF7',
        border: '1px solid #E6D5B8',
        borderRadius: '12px',
        fontSize: '12.5px',
        lineHeight: 1.8,
        color: '#5C4F48'
      }}
    >
      <div style={itemStyle}>
        <div style={headingStyle}>入力した情報について</div>
        生年月日・時刻・場所は、お使いのブラウザの中だけで計算に使います。サーバーへの送信や保存はしていません。
        読み解きのメモは、お使いのブラウザにだけ保存されます。ブラウザの設定で「Cookieとサイトデータ」を削除すると消えます（このサイトはCookieを使っていません）。
      </div>
      <div style={itemStyle}>
        <div style={headingStyle}>解説について</div>
        このサイトの解説は、一般的な西洋占星術の解釈をもとにした、楽しみと学びのためのものです。内容の正確さや結果を保証するものではありません。
        解説は「ひとつの見方」としてお読みください。大切なことを決めるときは、ご自身の判断でお願いいたします。
      </div>
      <div>
        <div style={headingStyle}>ライセンス</div>
        このサイトのプログラムと解説文は、GNU AGPL v3 で公開しています。
        <div style={{ marginTop: '4px' }}>
          <a href="https://github.com/treegreen1310/seiyo_astro" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            ソースコード
          </a>{' '}
          ｜{' '}
          <a href="/LICENSE.txt" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            ライセンス全文
          </a>{' '}
          ｜{' '}
          <a href="/NOTICE.txt" target="_blank" rel="noopener noreferrer" style={linkStyle}>
            著作権表示
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutSite;
