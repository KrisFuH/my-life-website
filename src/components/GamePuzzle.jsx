import { useEffect, useMemo, useRef, useState } from 'react';
import { listEntries, searchSteamGrid } from '../api.js';
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

const COVER_CACHE_KEY = 'sgdb_cover_cache_v1';
function readCoverCache() {
  try { return JSON.parse(sessionStorage.getItem(COVER_CACHE_KEY) || '{}'); } catch { return {}; }
}
function writeCoverCache(cache) {
  try { sessionStorage.setItem(COVER_CACHE_KEY, JSON.stringify(cache)); } catch { /* ignore */ }
}

// 封面尺寸按时长变化
const MIN_W = 108;
const MAX_W = 268;
function tileWidth(hours) {
  return Math.round(Math.min(MAX_W, MIN_W + Math.min(hours, 600) * 0.28));
}
const TILE_ASPECT = 0.72; // 高 = 宽 / 0.72（竖版封面）

function Cover({ title, url, hours }) {
  const [err, setErr] = useState(false);
  const style = { width: '100%', height: '100%' };
  if (err || !url) {
    return (
      <div className="gp-cover gp-cover-ph" style={style}>
        <span className="gp-cover-name">{title}</span>
        <span className="gp-cover-h">{fmtHours(hours)}</span>
      </div>
    );
  }
  return (
    <div className="gp-cover" style={style}>
      <img src={url} alt={title} loading="lazy" onError={() => setErr(true)} />
      <span className="gp-cover-name">{title}</span>
      <span className="gp-cover-h">{fmtHours(hours)}</span>
    </div>
  );
}

export default function GamePuzzle() {
  const [games, setGames] = useState([]); // { id, title, hours, cover }
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const gridRef = useRef(null);
  const [gridW, setGridW] = useState(0);

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
        setLoading(false); // 先渲染拼图（占位），封面后台加载
        // 逐张拉封面，拉到即更新对应卡片
        const missing = gs.filter((g) => !cache[g.title]);
        for (const g of missing) {
          try {
            const r = await searchSteamGrid(g.title);
            if (r && r.imageUrl) {
              cache[g.title] = r.imageUrl;
              if (active) {
                setGames((prev) => prev.map((x) => (x.id === g.id ? { ...x, cover: r.imageUrl } : x)));
              }
            }
          } catch { /* 保持占位图 */ }
        }
        writeCoverCache(cache);
      } catch (e) {
        if (active) { setError(e.message); setLoading(false); }
      }
    })();
    return () => { active = false; };
  }, []);

  // 观测容器宽度（用于瀑布列数）
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setGridW(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const total = useMemo(() => games.reduce((s, g) => s + g.hours, 0), [games]);
  const ranked = useMemo(() => [...games].sort((a, b) => b.hours - a.hours), [games]);

  // 瀑布流排版：按时长定宽，放入最矮列（绝对定位 masonry）
  const layout = useMemo(() => {
    if (!gridW) return [];
    const GAP = 12;
    const colCount = Math.max(2, Math.min(6, Math.floor((gridW + GAP) / (MIN_W + GAP))));
    const slotW = (gridW - (colCount - 1) * GAP) / colCount;
    const colX = new Array(colCount).fill(0);
    const colY = new Array(colCount).fill(0);
    return ranked.map((g) => {
      const w = Math.min(tileWidth(g.hours), Math.floor(slotW));
      const h = Math.round(w / TILE_ASPECT);
      const ci = colY.indexOf(Math.min(...colY));
      const x = colX[ci];
      const y = colY[ci];
      colX[ci] += w + GAP;
      colY[ci] += h + GAP;
      return { ...g, w, h, x, y };
    });
  }, [ranked, gridW]);

  const gridHeight = useMemo(() => {
    if (!gridW || !layout.length) return 0;
    let maxBottom = 0;
    layout.forEach((g) => { maxBottom = Math.max(maxBottom, g.y + g.h); });
    return maxBottom + 4;
  }, [layout, gridW]);

  if (loading) {
    return <div className="gp-loading">正在汇总游戏时长与封面…</div>;
  }
  if (error) {
    return <div className="gp-loading" style={{ color: '#c25e5e' }}>{error}</div>;
  }
  if (!games.length) {
    return <div className="gp-empty">还没有游戏记录，先去拾光集添加「游戏」类型的卡片吧～</div>;
  }

  return (
    <div className="gp-wrap">
      <div className="gp-stats">
        <div className="gp-stat">
          <span className="gp-stat-num">{fmtHours(total)}</span>
          <span className="gp-stat-label">累计游戏时长</span>
        </div>
        <div className="gp-stat">
          <span className="gp-stat-num">{games.length}</span>
          <span className="gp-stat-label">游戏数量</span>
        </div>
        <div className="gp-stat">
          <span className="gp-stat-num">{ranked[0] ? ranked[0].title.replace(/[《》]/g, '') : '-'}</span>
          <span className="gp-stat-label">时长冠军</span>
        </div>
      </div>

      <h4 className="gp-sec-title">🧩 游戏生涯拼图</h4>
      <div className="gp-grid" ref={gridRef} style={{ height: gridHeight }}>
        {layout.map((g) => (
          <div
            key={g.id}
            className="gp-tile"
            style={{ width: g.w, height: g.h, transform: 'translate(' + g.x + 'px,' + g.y + 'px)' }}
          >
            <Cover title={g.title} url={g.cover} hours={g.hours} />
          </div>
        ))}
      </div>
    </div>
  );
}
