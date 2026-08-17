import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE, listEntries, searchSteamGrid } from '../api.js';
import '../styles/game-puzzle.css';

// 解析游戏时长：支持 "120h"、"45小时"、"2h 30m"、"36.5" 等
export function parseDuration(str) {
  const s = String(str || '').trim().toLowerCase();
  if (!s || s === '0' || s === '0h' || s === '0小时') return 0;
  let hours = 0;
  const h = s.match(/(\d+(?:\.\d+)?)\s*(?:h|hrs?|小时|时)/);
  if (h) hours += parseFloat(h[1]);
  const m = s.match(/(\d+(?:\.\d+)?)\s*(?:m|min|分钟)/);
  if (m) hours += parseFloat(m[1]) / 60;
  if (hours === 0) {
    const n = parseFloat(s);
    if (!Number.isNaN(n)) hours = n;
  }
  return Math.max(0, Math.round(hours * 10) / 10);
}

function fmtHours(h) {
  if (h >= 10000) return (h / 10000).toFixed(1) + ' 万小时';
  if (h >= 1000) return (h / 1000).toFixed(2) + 'k h';
  return h + ' h';
}

const COVER_CACHE_KEY = 'sgdb_cover_cache_v3';
function readCoverCache() {
  try { return JSON.parse(sessionStorage.getItem(COVER_CACHE_KEY) || '{}'); } catch { return {}; }
}
function writeCoverCache(cache) {
  try { sessionStorage.setItem(COVER_CACHE_KEY, JSON.stringify(cache)); } catch { /* ignore */ }
}

// ---------- squarified treemap：无缝铺满、面积按时长比例 ----------
function squarify(values, x, y, w, h) {
  const total = values.reduce((s, v) => s + v, 0) || 1;
  const areas = values.map((v) => (v / total) * (w * h));
  const out = [];
  let cur = { x, y, w, h };
  let remaining = areas.slice();
  let row = [];
  function worst(rowArr, cw, ch) {
    if (!rowArr.length) return Infinity;
    const s = rowArr.reduce((a, b) => a + b, 0);
    const max = Math.max(...rowArr);
    const min = Math.min(...rowArr);
    const s2 = s * s;
    const wh2 = cw * ch * cw * ch;
    return Math.max((s2 * min) / wh2, wh2 / (s2 * max));
  }
  function layoutRow(rowArr) {
    const s = rowArr.reduce((a, b) => a + b, 0);
    if (cur.w >= cur.h) {
      const rw = s / cur.h;
      let yy = cur.y;
      for (const a of rowArr) { const hh = a / rw; out.push({ x: cur.x, y: yy, w: rw, h: hh }); yy += hh; }
      cur = { x: cur.x + rw, y: cur.y, w: cur.w - rw, h: cur.h };
    } else {
      const rh = s / cur.w;
      let xx = cur.x;
      for (const a of rowArr) { const ww = a / rh; out.push({ x: xx, y: cur.y, w: ww, h: rh }); xx += ww; }
      cur = { x: cur.x, y: cur.y + rh, w: cur.w, h: cur.h - rh };
    }
  }
  while (remaining.length) {
    const first = remaining[0];
    if (!row.length) { row.push(first); remaining = remaining.slice(1); continue; }
    const candidate = [...row, first];
    if (worst(candidate, cur.w, cur.h) <= worst(row, cur.w, cur.h)) { row = candidate; remaining = remaining.slice(1); }
    else { layoutRow(row); row = []; }
  }
  if (row.length) layoutRow(row);
  return out;
}

function coverSrc(url) {
  if (!url) return null;
  return url.indexOf('data:') === 0 || url.indexOf('http') === 0 ? url : API_BASE + url;
}

export default function GamePuzzle() {
  const [games, setGames] = useState([]); // { id, title, hours, cover }
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listEntries('experiences');
        const gs = (data.entries || [])
          .filter((e) => e.kind === '游戏')
          .map((e) => ({ id: e.id, title: e.title || '', hours: parseDuration(e.duration) }));
        if (!active) return;
        const cache = readCoverCache();
        setGames(gs.map((g) => ({ ...g, cover: cache[g.title] || null })));
        setLoading(false);
        // 并行拉封面，拉到即更新
        const missing = gs.filter((g) => !cache[g.title]);
        const results = await Promise.all(
          missing.map((g) =>
            searchSteamGrid(g.title)
              .then((r) => ({ title: g.title, url: r && r.imageUrl ? r.imageUrl : null }))
              .catch(() => ({ title: g.title, url: null })),
          ),
        );
        results.forEach((r) => { if (r.url) cache[r.title] = r.url; });
        writeCoverCache(cache);
        if (active) setGames((prev) => prev.map((g) => ({ ...g, cover: cache[g.title] || g.cover })));
      } catch (e) {
        if (active) { setError(e.message); setLoading(false); }
      }
    })();
    return () => { active = false; };
  }, []);

  // 观测画布尺寸（宽高都要）
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  const total = useMemo(() => games.reduce((s, g) => s + g.hours, 0), [games]);

  // 树图排版：权重 = 时长（0 分时给最小权重，保证海报完整）
  const tiles = useMemo(() => {
    if (!box.w || !box.h || !games.length) return [];
    const weights = games.map((g) => (g.hours > 0 ? g.hours : 1));
    const rects = squarify(weights, 0, 0, box.w, box.h);
    return rects.map((r, i) => ({ ...r, game: games[i] }));
  }, [games, box]);

  if (loading) return <div className="gp-loading">正在汇总游戏时长与封面…</div>;
  if (error) return <div className="gp-loading" style={{ color: '#c25e5e' }}>{error}</div>;
  if (!games.length) return <div className="gp-empty">还没有游戏记录，先去拾光集添加「游戏」类型的卡片吧～</div>;

  return (
    <div className="pp-wrap">
      <div className="pp-stats">
        <span className="pp-stat"><b>{fmtHours(total)}</b> 累计时长</span>
        <span className="pp-stat"><b>{games.length}</b> 款游戏</span>
        <span className="pp-stat-hint">方块越大 = 玩得越久 · 悬停查看详情</span>
      </div>
      <div className="pp-canvas" ref={canvasRef}>
        {tiles.map((t, i) => (
          <div
            key={t.game.id}
            className="pp-tile"
            style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
          >
            {t.game.cover ? (
              <img className="pp-img" src={coverSrc(t.game.cover)} alt={t.game.title} loading="lazy" />
            ) : (
              <div className="pp-ph">{t.game.title.replace(/[《》]/g, '')}</div>
            )}
            <div className="pp-overlay">
              <span className="pp-name">{t.game.title.replace(/[《》]/g, '')}</span>
              <span className="pp-time">⏱ {fmtHours(t.game.hours)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
