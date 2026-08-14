import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useEditMode, openGate, lock } from '../editMode.js';
import '../styles/topnav.css';

const LINKS = [
  { label: '首页', href: '/' },
  { label: '来时路', href: '/journey' },
  { label: '习艺录', href: '/skills' },
  { label: '拾光集', href: '/experiences' },
];

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export default function TopNav() {
  const [theme, setTheme] = useState(currentTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const { editMode } = useEditMode();

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      document.documentElement.setAttribute('data-theme', stored);
      setTheme(stored);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return (
    <header className="blog-top-nav" data-pagefind-ignore>
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label="打开导航菜单"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      <NavLink className="brand" to="/" aria-label="回到首页">
        <span className="brand-mark" aria-hidden="true"></span>
        <span className="brand-title">生涯记录</span>
      </NavLink>

      <nav className="nav-links" aria-label="主导航">
        {LINKS.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            end={link.href === '/'}
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="nav-actions" aria-label="页面操作">
        <button
          type="button"
          className={'edit-lock-btn' + (editMode ? ' active' : '')}
          onClick={editMode ? lock : openGate}
          title={editMode ? '退出编辑模式' : '进入编辑模式'}
          aria-label={editMode ? '退出编辑模式' : '进入编辑模式'}
        >
          {editMode ? (
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
          )}
        </button>
        <button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'} title="切换主题">
          <svg className="theme-icon-moon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <svg className="theme-icon-sun" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>

      <nav className={'mobile-menu-panel' + (menuOpen ? ' open' : '')} id="mobile-nav-menu" aria-label="移动端导航">
        {LINKS.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            end={link.href === '/'}
            className={({ isActive }) => 'mobile-menu-link' + (isActive ? ' active' : '')}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
