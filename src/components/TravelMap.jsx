import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { MapChart, ScatterChart, LinesChart } from 'echarts/charts';
import { TooltipComponent, GeoComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { listEntries } from '../api.js';
import { CHINA_CITIES, extractCities } from '../chinaCities.js';
import '../styles/travel-map.css';

echarts.use([MapChart, ScatterChart, LinesChart, TooltipComponent, GeoComponent, CanvasRenderer]);

const GEO_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';
const GEO_CACHE_KEY = 'china_geo_v1';

async function loadChinaGeo() {
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch { /* ignore */ }
  const res = await fetch(GEO_URL);
  if (!res.ok) throw new Error('中国地图数据加载失败');
  const geo = await res.json();
  try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(geo)); } catch { /* ignore */ }
  return geo;
}

function dateOrder(d) {
  const m = String(d || '').match(/(\d{4})[.\-\/\u5e74]?(\d{1,2})?/);
  return m ? Number(m[1]) * 100 + Number(m[2] || 0) : 0;
}

export default function TravelMap() {
  const chartRef = useRef(null);
  const [trips, setTrips] = useState([]);
  const [geo, setGeo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listEntries('experiences');
        const t = (data.entries || [])
          .filter((e) => e.kind === '旅行')
          .map((e) => {
            const text = [e.title, e.place, e.description].filter(Boolean).join(' ');
            return { id: e.id, title: e.title || '', place: e.place || '', date: e.date || '', cities: extractCities(text) };
          });
        if (!active) return;
        setTrips(t);
        const g = await loadChinaGeo();
        if (active) setGeo(g);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // 已到访城市（按时间先后去重）
  const visited = useMemo(() => {
    const sorted = [...trips].sort((a, b) => dateOrder(a.date) - dateOrder(b.date));
    const seen = new Set();
    const list = [];
    for (const t of sorted) for (const city of t.cities) {
      if (!seen.has(city)) { seen.add(city); list.push(city); }
    }
    return list;
  }, [trips]);

  // 渲染地图
  useEffect(() => {
    if (!geo || !chartRef.current) return;
    const el = chartRef.current;
    const chart = echarts.init(el);
    echarts.registerMap('china', geo);

    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const visitedSet = new Set(visited);
    const allPts = Object.entries(CHINA_CITIES).map(([name, coord]) => ({ name, value: coord }));
    const visitedPts = visited.filter((c) => CHINA_CITIES[c]).map((c) => ({ name: c, value: [...CHINA_CITIES[c], 1] }));
    const routeCoords = visited.filter((c) => CHINA_CITIES[c]).map((c) => CHINA_CITIES[c]);

    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item' },
      geo: {
        map: 'china',
        roam: true,
        scaleLimit: { min: 0.8, max: 8 },
        itemStyle: {
          areaColor: dark ? '#2a3446' : '#eef3fb',
          borderColor: dark ? '#4a5872' : '#b8c7e0',
          borderWidth: 0.8,
        },
        emphasis: { itemStyle: { areaColor: dark ? '#35455e' : '#dbe7f7' } },
      },
      series: [
        {
          name: '未到访城市',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: allPts,
          symbolSize: 3.5,
          itemStyle: { color: dark ? '#6b7280' : '#b6bdc9' },
          silent: true,
        },
        {
          name: '到访城市',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: visitedPts,
          symbolSize: 11,
          itemStyle: { color: '#ffd700', shadowBlur: 12, shadowColor: 'rgba(255,215,0,.9)' },
          label: {
            show: true,
            formatter: '{b}',
            position: 'top',
            distance: 4,
            color: dark ? '#fff' : '#333',
            fontSize: 11,
            fontWeight: 700,
          },
          zlevel: 2,
        },
        ...(routeCoords.length >= 2
          ? [{
              name: '旅行路线',
              type: 'lines',
              coordinateSystem: 'geo',
              data: [{ coords: routeCoords }],
              lineStyle: { color: '#ff6b6b', width: 2, curveness: 0.25, opacity: 0.85 },
              effect: { show: true, period: 6, trailLength: 0.4, symbol: 'arrow', symbolSize: 6, color: '#ff8a80' },
              zlevel: 1,
            }]
          : []),
      ],
    });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => { ro.disconnect(); chart.dispose(); };
  }, [geo, visited]);

  if (loading) return <div className="tm-loading">正在生成旅行足迹地图…</div>;
  if (error) return <div className="tm-loading" style={{ color: '#c25e5e' }}>{error}</div>;

  return (
    <div className="tm-wrap">
      <div className="tm-stats">
        <div className="tm-stat">
          <span className="tm-stat-num">{visited.length}</span>
          <span className="tm-stat-label">已点亮城市</span>
        </div>
        <div className="tm-stat">
          <span className="tm-stat-num">{trips.length}</span>
          <span className="tm-stat-label">旅行记录</span>
        </div>
      </div>

      {visited.length ? (
        <div className="tm-chips">
          {visited.map((c) => (
            <span key={c} className="tm-chip">📍 {c}</span>
          ))}
        </div>
      ) : null}

      <div className="tm-map" ref={chartRef} />

      {trips.length ? (
        <div className="tm-list">
          {trips.map((t) => (
            <div key={t.id} className="tm-trip">
              <span className="tm-trip-date">{t.date || '未标注时间'}</span>
              <span className="tm-trip-title">{t.title || t.place || '旅行'}</span>
              <span className="tm-trip-cities">{t.cities.length ? t.cities.join(' → ') : '未识别到城市'}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="tm-empty">还没有旅行记录，先去拾光集添加「旅行」类型并写明城市吧～</div>
      )}
    </div>
  );
}
