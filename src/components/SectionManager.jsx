import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSectionData, createEntry, updateEntry, deleteEntry } from '../api.js';
import '../styles/section-manager.css';

const NEW_ID = '__new';

const CONFIGS = {
  journey: {
    addLabel: '＋ 新增一段经历',
    hideDescription: true,
    fields: [
      { key: 'title', label: '标题', type: 'text', placeholder: '这段经历叫什么' },
      { key: 'category', label: '分类', type: 'text', placeholder: '如：学习 / 旅行 / 工作' },
      { key: 'period', label: '日期', type: 'text', placeholder: '如：2016 — 2020' },
      { key: 'place', label: '地点', type: 'text', placeholder: '可选' },
      { key: 'description', label: '描述', type: 'textarea', placeholder: '写下这段经历……' },
      { key: 'image', label: '图片 URL', type: 'text', placeholder: 'https://... 或 /images/xxx.jpg' },
    ],
    empty: { title: '', category: '', period: '', place: '', description: '', tags: [], image: '' },
  },
  skills: {
    addLabel: '＋ 新增一项技能',
    fields: [
      { key: 'name', label: '标题', type: 'text', placeholder: '技能名称' },
      { key: 'level', label: '熟练度', type: 'select', options: ['入门', '进阶', '熟练', '精通'], placeholder: '选择熟练度' },
      { key: 'description', label: '描述', type: 'textarea', placeholder: '这项技能的说明……' },
    ],
    empty: { name: '', level: '入门', description: '', tags: [], icon: 'sparkle' },
  },
  experiences: {
    addLabel: '＋ 新增一段体验',
    hideDescription: true,
    fields: [
      { key: 'kind', label: '类型', type: 'text', placeholder: '如：游戏 / 阅读 / 旅行' },
      { key: 'place', label: '地点', type: 'text', placeholder: '如：青海 · 甘肃', showWhen: (d) => d.kind === '旅行' },
      { key: 'date', label: '日期', type: 'text', placeholder: '如：2026.08' },
      { key: 'title', label: '标题', type: 'text', placeholder: '这段体验叫什么' },
      { key: 'description', label: '描述', type: 'textarea', placeholder: '写下这段体验……' },
      { key: 'image', label: '图片 URL', type: 'text', placeholder: 'https://... 或 /images/xxx.jpg' },
    ],
    empty: { kind: '', date: '', title: '', place: '', description: '', tags: [], image: '' },
  },
};

function fieldValue(entry, key) {
  if (key === 'badge') return entry?.category || entry?.kind || '';
  if (key === 'date') return entry?.period || entry?.date || '';
  return entry?.[key] || '';
}

const PencilIcon = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const TrashIcon = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function SectionManager({ section }) {
  const config = CONFIGS[section];
  const [entries, setEntries] = useState([]);
  const [creating, setCreating] = useState(false);
  const [editingIds, setEditingIds] = useState(() => new Set());
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const drafts = useRef({});
  const newCardRef = useRef(null);

  const forceRender = useCallback(() => setVersion((v) => v + 1), []);

  const load = useCallback(async () => {
    try {
      const data = await getSectionData(section);
      setEntries(data.entries || []);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [section]);

  // 每次进入页面都会重新请求数据（路由切换时组件重新挂载）
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (creating && newCardRef.current) {
      const first = newCardRef.current.querySelector('input, textarea, select');
      if (first) first.focus();
    }
  }, [creating]);

  const setDraft = useCallback(
    (id, patch) => {
      drafts.current[id] = { ...(drafts.current[id] || {}), ...patch };
      forceRender();
    },
    [forceRender],
  );

  const getDraft = (id, entry) => ({ ...config.empty, ...(entry || {}), ...(drafts.current[id] || {}) });

  const startCreate = () => {
    setError('');
    setCreating(true);
  };

  const startEdit = (id) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.add(String(id));
      return next;
    });
  };

  const cancelCard = (id) => {
    delete drafts.current[id];
    if (id === NEW_ID) {
      setCreating(false);
    } else {
      setEditingIds((prev) => {
        const next = new Set(prev);
        next.delete(String(id));
        return next;
      });
    }
    forceRender();
  };

  const saveCard = async (id, baseEntry) => {
    const values = getDraft(id, baseEntry);
    setBusyId(id);
    setError('');
    try {
      if (id === NEW_ID) {
        await createEntry(section, values);
        setCreating(false);
      } else {
        await updateEntry(section, id, values);
        setEditingIds((prev) => {
          const next = new Set(prev);
          next.delete(String(id));
          return next;
        });
      }
      delete drafts.current[id];
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除这条记录吗？删除后无法恢复。')) return;
    setError('');
    try {
      await deleteEntry(section, id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const renderField = (f, value, onChange) => {
    if (f.type === 'textarea') {
      return (
        <textarea value={value} placeholder={f.placeholder || ''} onChange={(e) => onChange(e.target.value)} />
      );
    }
    if (f.type === 'select') {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {(f.options || []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input type="text" value={value} placeholder={f.placeholder || ''} onChange={(e) => onChange(e.target.value)} />
    );
  };

  const renderEditCard = (id, baseEntry, ref) => {
    const draft = getDraft(id, baseEntry);
    return (
      <article className="cm-card cm-editing" key={id} ref={ref}>
        <div className="cm-form">
          {config.fields.map((f) => {
            if (f.showWhen && !f.showWhen(draft)) return null;
            return (
              <label key={f.key}>
                {f.label}
                {renderField(f, draft[f.key] ?? '', (val) => setDraft(id, { [f.key]: val }))}
              </label>
            );
          })}
        </div>
        <div className="cm-form-actions">
          <button type="button" className="cm-save" disabled={busyId === id} onClick={() => saveCard(id, baseEntry)}>
            {busyId === id ? '保存中…' : '保存'}
          </button>
          <button type="button" className="cm-cancel" disabled={busyId === id} onClick={() => cancelCard(id)}>
            取消
          </button>
        </div>
      </article>
    );
  };

  const renderViewCard = (entry) => {
    const badge = fieldValue(entry, 'badge');
    const date = fieldValue(entry, 'date');
    const level = fieldValue(entry, 'level');
    const title = fieldValue(entry, 'title');
    const place = fieldValue(entry, 'place');
    const desc = fieldValue(entry, 'description');
    const image = fieldValue(entry, 'image');
    const id = String(entry.id);
    return (
      <article className="cm-card" key={id}>
        <div className="cm-card-head">
          {badge ? <span className="cm-badge">{badge}</span> : null}
          {date ? <span className="cm-date">{date}</span> : null}
          <span className="cm-actions">
            <button type="button" className="cm-icon-btn" title="编辑" aria-label="编辑" onClick={() => startEdit(id)}>
              {PencilIcon}
            </button>
            <button type="button" className="cm-icon-btn cm-delete" title="删除" aria-label="删除" onClick={() => handleDelete(id)}>
              {TrashIcon}
            </button>
          </span>
        </div>
        {title ? <h3>{title}</h3> : null}
        {place ? <p className="cm-place">{place}</p> : null}
        {level ? <p className="cm-level">{level}</p> : null}
        {desc && !config.hideDescription ? <p className="cm-desc">{desc}</p> : null}
        {image ? <img className="cm-img" src={image} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} /> : null}
      </article>
    );
  };

  const list = useMemo(() => {
    const cards = [];
    if (creating) cards.push(renderEditCard(NEW_ID, null, newCardRef));
    for (const e of entries) {
      cards.push(editingIds.has(String(e.id)) ? renderEditCard(e.id, e, null) : renderViewCard(e));
    }
    return cards;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creating, entries, editingIds, busyId, version]);

  return (
    <div className="section-manager" data-pagefind-ignore>
      <button type="button" className="cm-add-btn" onClick={startCreate}>
        {config.addLabel}
      </button>
      {error ? (
        <p className="cm-empty" style={{ color: '#c25e5e' }}>
          {error}
        </p>
      ) : null}
      <div className="cm-list">{list}</div>
      {entries.length === 0 && !creating ? <p className="cm-empty">还没有记录，点上方「新增」开始记录。</p> : null}
    </div>
  );
}