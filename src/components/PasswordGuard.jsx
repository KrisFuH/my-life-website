import { useState } from 'react';
import { verifyPassword } from '../api.js';

const STORAGE_KEY = 'auth_coming_road';
const AUTH_TOKEN_KEY = 'auth_token_coming_road';

export default function PasswordGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true' && !!sessionStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return false;
    }
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await verifyPassword(password);
      if (result && result.success) {
        if (result.token) {
          try { sessionStorage.setItem(AUTH_TOKEN_KEY, result.token); } catch { /* ignore */ }
        }
        try {
          sessionStorage.setItem(STORAGE_KEY, 'true');
        } catch {
          /* ignore */
        }
        setIsAuthenticated(true);
      } else {
        setError((result && result.error) || '密码错误');
      }
    } catch {
      setError('密码错误');
    } finally {
      setLoading(false);
    }
  }

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="password-guard">
      <div className="password-guard-card">
        <h2 className="password-guard-title">🔒 受保护的页面</h2>
        <p className="password-guard-hint">「来时路」仅对本人开放，请输入密码后访问</p>
        <form className="password-guard-form" onSubmit={handleSubmit}>
          <input
            className="password-guard-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            autoFocus
          />
          <button className="password-guard-btn" type="submit" disabled={loading || !password}>
            {loading ? '验证中…' : '进入'}
          </button>
        </form>
        {error && <p className="password-guard-error">{error}</p>}
      </div>
    </div>
  );
}
