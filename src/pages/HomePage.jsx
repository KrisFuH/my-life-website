import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHomeData, saveHomeData, uploadImage } from '../api.js';
import { useEditMode } from '../editMode.js';
import '../styles/home.css';

function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function Editable({ editing, path, value, onChange }) {
  if (!editing) return value;
  return (
    <span
      className="home-editable"
      data-path={path}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => onChange(path, e.currentTarget.textContent.trim())}
    >
      {value}
    </span>
  );
}

function EditableImg({ editing, path, value, alt, className, onClickImage }) {
  return (
    <img
      className={(className || '') + (editing ? ' home-img-edit' : '')}
      src={value}
      alt={alt || ''}
      loading="lazy"
      onClick={editing ? () => onClickImage({ path, current: value }) : undefined}
      onError={(e) => {
        e.currentTarget.style.opacity = '0.25';
      }}
    />
  );
}

export default function HomePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const { editMode } = useEditMode();
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imgTarget, setImgTarget] = useState(null);
  const [imgNotice, setImgNotice] = useState('');
  const urlInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    getHomeData()
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const changeDraft = (path, value) => {
    setDraft((d) => {
      const copy = JSON.parse(JSON.stringify(d));
      setPath(copy, path, value);
      return copy;
    });
  };

  const startEdit = () => {
    setDraft(JSON.parse(JSON.stringify(data)));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
    setImgTarget(null);
    setImgNotice('');
  };

  useEffect(() => {
    if (!editMode && editing) cancelEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode]);

  const saveEdit = async () => {
    setSaving(true);
    const finalDraft = JSON.parse(JSON.stringify(draft));
    document.querySelectorAll('.home-editable').forEach((el) => {
      const p = el.getAttribute('data-path');
      if (p) setPath(finalDraft, p, el.textContent.trim());
    });
    try {
      await saveHomeData(finalDraft);
      setData(finalDraft);
      setEditing(false);
      setDraft(null);
      setImgTarget(null);
      setImgNotice('');
    } catch (e) {
      window.alert('保存失败：' + e.message);
    }
    setSaving(false);
  };

  const handleFileUpload = (file, onDone) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = await uploadImage(file.name, reader.result);
        onDone(json.url);
      } catch (e) {
        setImgNotice('上传失败：' + e.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const applyImage = () => {
    const url = urlInputRef.current ? urlInputRef.current.value.trim() : '';
    const file = fileInputRef.current && fileInputRef.current.files[0];
    const done = (finalUrl) => {
      changeDraft(imgTarget.path, finalUrl);
      setImgTarget(null);
      setImgNotice('');
    };
    if (file) handleFileUpload(file, done);
    else if (url) done(url);
    else setImgNotice('请粘贴图片地址或选择本地图片');
  };

  if (error) {
    return (
      <main className="home-shell">
        <p className="home-loading" style={{ color: '#c25e5e' }}>{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="home-shell">
        <p className="home-loading">正在加载…</p>
      </main>
    );
  }

  const d = editing ? draft : data;
  const { profile, home, sections } = d;

  return (
    <main className="home-shell">
      {editing && (
        <div className="home-edit-toolbar">
          <span className="home-edit-hint">编辑模式：点击文字直接修改，点击图片可更换</span>
          <button onClick={saveEdit} disabled={saving}>{saving ? '保存中…' : '保存'}</button>
          <button onClick={cancelEdit}>取消</button>
        </div>
      )}

      <section className="hero">
        <div className="hero-copy">
          <p className="hero-greeting">
            <Editable editing={editing} path="home.greeting" value={d.home.greeting} onChange={changeDraft} />
          </p>
          <h1 className="hero-name">
            <Editable editing={editing} path="profile.name" value={d.profile.name} onChange={changeDraft} />
          </h1>
          <p className="hero-role">
            <Editable editing={editing} path="profile.role" value={d.profile.role} onChange={changeDraft} />
          </p>
          {profile.bio && profile.bio[0] ? (
            <p className="hero-bio">
              <Editable editing={editing} path="profile.bio.0" value={d.profile.bio[0]} onChange={changeDraft} />
            </p>
          ) : null}
          {profile.quote ? (
            <p className="hero-quote">
              「<Editable editing={editing} path="profile.quote" value={d.profile.quote} onChange={changeDraft} />」
            </p>
          ) : null}
          <div className="hero-meta">
            {profile.location ? (
              <span className="hero-chip">
                <Editable editing={editing} path="profile.location" value={d.profile.location} onChange={changeDraft} />
              </span>
            ) : null}
            {profile.email ? (
              editing ? (
                <span className="hero-chip">
                  <Editable editing={editing} path="profile.email" value={d.profile.email} onChange={changeDraft} />
                </span>
              ) : (
                <a className="hero-chip" href={`mailto:${d.profile.email}`}>{d.profile.email}</a>
              )
            ) : null}
          </div>
        </div>
        <div className="hero-media">
          <div className="hero-avatar-wrap">
            <EditableImg
              editing={editing}
              path="profile.avatar"
              value={d.profile.avatar}
              alt={d.profile.name}
              className="hero-avatar"
              onClickImage={setImgTarget}
            />
          </div>
          {home.heroImage ? (
            <EditableImg
              editing={editing}
              path="home.heroImage"
              value={d.home.heroImage}
              alt=""
              className="hero-bg"
              onClickImage={setImgTarget}
            />
          ) : null}
        </div>
      </section>

      <section className="intro-block" aria-label="简介">
        {(home.intro || []).map((line, i) => (
          <p key={i}>
            <Editable editing={editing} path={`home.intro.${i}`} value={line} onChange={changeDraft} />
          </p>
        ))}
      </section>

      <section className="sections-grid" aria-label="生涯板块">
        {(sections || []).map((s, i) => (
          <Link
            className="section-card"
            to={s.href}
            key={s.key || i}
            onClick={(e) => {
              if (editing) e.preventDefault();
            }}
          >
            <div className="section-thumb">
              {s.image ? (
                <EditableImg
                  editing={editing}
                  path={`sections.${i}.image`}
                  value={s.image}
                  alt=""
                  className="section-card-img"
                  onClickImage={setImgTarget}
                />
              ) : null}
              <span className="section-index">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div className="section-body">
              <h2>
                <Editable editing={editing} path={`sections.${i}.title`} value={s.title} onChange={changeDraft} />
              </h2>
              <p className="section-subtitle">
                <Editable editing={editing} path={`sections.${i}.subtitle`} value={s.subtitle} onChange={changeDraft} />
              </p>
              <p className="section-desc">
                <Editable editing={editing} path={`sections.${i}.description`} value={s.description} onChange={changeDraft} />
              </p>
              <span className="section-arrow" aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </section>

      {editMode ? (
        <button className="home-edit-fab" type="button" onClick={editing ? cancelEdit : startEdit}>
          {editing ? '完成' : '编辑'}
        </button>
      ) : null}

      {imgTarget && (
        <div className="home-img-dialog-mask" onClick={() => setImgTarget(null)}>
          <div className="home-img-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>更换图片</h3>
            <label>
              图片地址
              <input type="url" ref={urlInputRef} placeholder="https://… 或 /images/xxx" defaultValue={imgTarget.current || ''} />
            </label>
            <div className="home-img-or">或</div>
            <label>
              上传本地图片
              <input type="file" ref={fileInputRef} accept="image/*" />
            </label>
            {imgNotice ? <p className="home-img-notice">{imgNotice}</p> : null}
            <div className="home-img-actions">
              <button onClick={applyImage} className="primary">应用</button>
              <button onClick={() => setImgTarget(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}