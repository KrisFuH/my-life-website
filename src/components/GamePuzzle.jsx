import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE, listEntries, searchSteamGrid } from '../api.js';
import '../styles/game-puzzle.css';

// 解析游戏时长：支持 "120h"、"45小时"、"2h 30m"、"36.5" 等；未填默认 5h
export function parseDuration(str) {
  const s = String(str || '').trim().toLowerCase();
  if (!s || s === '0' || s === '0h' || s === '0小时') return 5; // 未填默认 5h
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

// 封面墙布局：按权重（时长开方，压缩极端比例）排成行，保证每块宽高可读
// 权重 = sqrt(时长)；未填默认 5h -> sqrt(5)
function posterLayout(items, W) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  const minW = 74, minH = 68;
  const rows = [];
  let row = [], rw = 0, minInRow = Infinity;
  for (const it of items) {
    const newMin = Math.min(minInRow, it.weight);
    if (row.length && rw + it.weight > (newMin * W) / minW) {
      rows.push({ items: row, weight: rw });
      row = []; rw = 0; minInRow = Infinity;
    }
    row.push(it); rw += it.weight; minInRow = Math.min(minInRow, it.weight);
  }
  if (row.length) rows.push({ items: row, weight: rw });
  const baseH = W * 0.62;
  const rowHs = rows.map((r) => Math.max(minH, (r.weight / total) * baseH));
  const posterH = rowHs.reduce((a, b) => a + b, 0);
  const out = [];
  let y = 0;
  rows.forEach((r, ri) => {
    const rh = rowHs[ri];
    let x = 0;
    for (const it of r.items) {
      const w = (it.weight / r.weight) * W;
      out.push({ x, y, w, h: rh, ...it });
      x += w;
    }
    y += rh;
  });
  return { tiles: out, posterH, rows: rows.length };
}

function coverSrc(url) {
  if (!url) return null;
  return url.indexOf('data:') === 0 || url.indexOf('http') === 0 ? url : API_BASE + url;
}

export default function GamePuzzle() {
  const [games, setGames] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);
  const [boxW, setBoxW] = useState(0);

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

  // 观测画布宽度（海报高度按宽度动态计算）
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => setBoxW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  const total = useMemo(() => games.reduce((s, g) => s + g.hours, 0), [games]);

  const layout = useMemo(() => {
    if (!boxW || !games.length) return { tiles: [], posterH: 0 };
    const items = games
      .map((g) => ({ ...g, weight: Math.sqrt(g.hours > 0 ? g.hours : 5) }))
      .sort((a, b) => b.weight - a.weight);
    return posterLayout(items, boxW);
  }, [games, boxW]);

  if (loading) return <div className="gp-loading">正在汇总游戏时长与封面…</div>;
  if (error) return <div className="gp-loading" style={{ color: '#c25e5e' }}>{error}</div>;
  if (!games.length) return <div className="gp-empty">还没有游戏记录，先去拾光集添加「游戏」类型的卡片吧～</div>;

  return (
    <div className="pp-wrap">
      <div className="pp-stats">
        <span className="pp-stat"><b>{fmtHours(total)}</b> 累计时长</span>
        <span className="pp-stat"><b>{games.length}</b> 款游戏</span>
        <span className="pp-stat-hint">方块越大 = 玩得越久 · 悬停查看详情 · 未填时长按 5h 计</span>
      </div>
      <div className="pp-canvas" ref={canvasRef} style={{ height: layout.posterH || 'auto' }}>
        {layout.tiles.map((t) => (
          <div key={t.id} className="pp-tile" style={{ left: t.x, top: t.y, width: t.w, height: t.h }}>
            {t.cover ? <img className="pp-img" src={coverSrc(t.cover)} alt={t.title} loading="lazy" /> : (
              <div className="pp-ph">{t.title.replace(/[《》]/g, '')}</div>
            )}
            <div className="pp-overlay">
              <span className="pp-name">{t.title.replace(/[《》]/g, '')}</span>
              <span className="pp-time">⏱ {fmtHours(t.hours)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
