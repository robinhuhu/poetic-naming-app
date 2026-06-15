import { useEffect } from 'react';
import { useAppStore } from '../store';

export function ThemeSwitch() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  // 监听主题状态并更新 DOM 属性
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeLabel = () => {
    if (theme === 'light') return '阳 (浅色)';
    if (theme === 'dark') return '阴 (深色)';
    return '混 (系统)';
  };

  return (
    <div className="theme-switch-container">
      <button
        type="button"
        className="taiji-btn"
        onClick={toggleTheme}
        title={`主题切换：${getThemeLabel()}，点击切换`}
        aria-label={`切换主题，当前为 ${getThemeLabel()}`}
      >
        {theme === 'light' && (
          <svg className="taiji-icon sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        )}
        {theme === 'dark' && (
          <svg className="taiji-icon moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
        {theme === 'system' && (
          <svg className="taiji-icon taiji-symbol" viewBox="0 0 24 24">
            <path d="M12 2A10 10 0 0 0 12 22A10 10 0 0 0 12 2M12 4A8 8 0 0 1 12 20A8 8 0 0 1 12 4" opacity="0.15" />
            <path d="M12 2A10 10 0 0 1 12 22A5 5 0 0 1 12 12A5 5 0 0 0 12 2" />
            <circle cx="12" cy="7" r="1.5" fill="var(--bg-color)" />
            <circle cx="12" cy="17" r="1.5" fill="var(--text-main)" />
          </svg>
        )}
      </button>
    </div>
  );
}
