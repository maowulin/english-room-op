import { useEffect, useState } from 'react';

const STORAGE_KEY = 'english-room-op-demo-banner-dismissed';

interface DemoDataBannerProps {
  disclaimer: string;
  generatedAt: string;
}

export function DemoDataBanner({ disclaimer, generatedAt }: DemoDataBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      setVisible(false);
    }
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <aside className="demo-banner" role="status" aria-live="polite">
      <div className="demo-banner__inner">
        <p>
          <strong>演示数据</strong>
          {' — '}
          {disclaimer}
          {' '}
          <span>
            生成时间：
            {generatedAt}
          </span>
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ minHeight: 'var(--touch-min)', background: '#fff' }}
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, '1');
            setVisible(false);
          }}
        >
          知道了
        </button>
      </div>
    </aside>
  );
}
