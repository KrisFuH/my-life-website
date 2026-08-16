import '../styles/floating-panel.css';

// 80% 悬浮窗：右上角关闭
export default function FloatingPanel({ title, onClose, children }) {
  return (
    <div className="fp-mask" onClick={onClose}>
      <div className="fp-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="fp-head">
          <h3 className="fp-title">{title}</h3>
          <button type="button" className="fp-close" onClick={onClose} aria-label="关闭" title="关闭">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="fp-body">{children}</div>
      </div>
    </div>
  );
}
