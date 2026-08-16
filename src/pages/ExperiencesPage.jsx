import { lazy, Suspense, useState } from 'react';
import SectionPage from '../components/SectionPage.jsx';
import FloatingPanel from '../components/FloatingPanel.jsx';
const GamePuzzle = lazy(() => import('../components/GamePuzzle.jsx'));
const TravelMap = lazy(() => import('../components/TravelMap.jsx'));
import '../styles/experiences-tools.css';

export default function ExperiencesPage() {
  const [panel, setPanel] = useState(null); // null | 'game' | 'travel'

  return (
    <>
      <SectionPage section="experiences" />

      {/* 右侧悬浮功能入口 */}
      <div className="exp-tools">
        <button
          type="button"
          className="exp-tool-btn"
          onClick={() => setPanel(panel === 'game' ? null : 'game')}
          aria-label="游迹"
        >
          <span className="exp-tool-icon">🎮</span>
          <span className="exp-tool-label">游迹</span>
        </button>
        <button
          type="button"
          className="exp-tool-btn"
          onClick={() => setPanel(panel === 'travel' ? null : 'travel')}
          aria-label="行迹"
        >
          <span className="exp-tool-icon">🗺️</span>
          <span className="exp-tool-label">行迹</span>
        </button>
      </div>

      {panel === 'game' ? (
        <FloatingPanel title="🎮 游迹 · 游戏生涯拼图" onClose={() => setPanel(null)}>
          <Suspense fallback={<div className="fp-loading">正在加载游迹数据…</div>}><GamePuzzle /></Suspense>
        </FloatingPanel>
      ) : null}
      {panel === 'travel' ? (
        <FloatingPanel title="🗺️ 行迹 · 旅行足迹地图" onClose={() => setPanel(null)}>
          <Suspense fallback={<div className="fp-loading">正在加载旅行足迹…</div>}><TravelMap /></Suspense>
        </FloatingPanel>
      ) : null}
    </>
  );
}
