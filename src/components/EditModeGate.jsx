import { useEffect, useState } from 'react';
import { useEditMode, unlock, closeGate } from '../editMode.js';
import '../styles/edit-mode.css';

// 页面加载时的简单密码验证：通过 → 编辑模式；否则只读浏览
export default function EditModeGate() {
  const { editMode, gateOpen } = useEditMode();
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // 页面加载时（未进入编辑模式）自动弹出
  useEffect(() => {
    if (!editMode) setShow(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 点击导航栏锁按钮时弹出
  useEffect(() => {
    if (gateOpen) setShow(true);
  }, [gateOpen]);

  if (!show || editMode) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError('');
    const r = await unlock(password);
    if (!r.ok) {
      setError(r.error);
      setBusy(false);
    } else {
      setPassword('');
      setBusy(false);
    }
  };

  const dismiss = () => {
    setShow(false);
    closeGate();
  };

  return (
    <div className="edit-gate-mask" role="dialog" aria-modal="true" aria-label="进入编辑模式">
      <div className="edit-gate-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="edit-gate-title">🔒 进入编辑模式</h2>
        <p className="edit-gate-hint">输入密码后可编辑网站内容；不输入则保持只读浏览。</p>
        <form className="edit-gate-form" onSubmit={submit}>
          <input
            className="edit-gate-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            autoFocus
            autoComplete="current-password"
          />
          <button className="edit-gate-btn" type="submit" disabled={busy || !password}>
            {busy ? '验证中…' : '进入编辑模式'}
          </button>
        </form>
        <button className="edit-gate-skip" type="button" onClick={dismiss}>
          仅浏览（只读）
        </button>
        {error ? <p className="edit-gate-error">{error}</p> : null}
      </div>
    </div>
  );
}
