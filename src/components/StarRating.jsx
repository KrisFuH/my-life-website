import { useId, useState } from 'react';
import '../styles/star-rating.css';

// 实心星（金色填充）与空心星（镂空环）使用不同的 SVG 路径
const SOLID_STAR =
  'M12.00,2.00L14.35,8.76L21.51,8.91L15.80,13.24L17.88,20.09L12.00,16.00L6.12,20.09L8.20,13.24L2.49,8.91L9.65,8.76Z';
const RING_STAR =
  'M12.00,2.00L14.35,8.76L21.51,8.91L15.80,13.24L17.88,20.09L12.00,16.00L6.12,20.09L8.20,13.24L2.49,8.91L9.65,8.76ZM12.00,5.80L13.47,9.98L17.90,10.08L14.38,12.77L15.64,17.02L12.00,14.50L8.36,17.02L9.62,12.77L6.10,10.08L10.53,9.98Z';

// 0-5 分，支持 0.5 星粒度；onChange 传入时进入可交互模式
export default function StarRating({ value = 0, onChange, size = 18, readOnly = false }) {
  const uid = useId();
  const [hover, setHover] = useState(null);
  const [bouncing, setBouncing] = useState(null);
  const interactive = !readOnly && typeof onChange === 'function';
  const display = hover != null ? hover : Number(value) || 0;

  const halfOf = (i, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientX - rect.left < rect.width / 2 ? i + 0.5 : i + 1;
  };

  const handleMove = (i, e) => {
    if (!interactive) return;
    setHover(halfOf(i, e));
  };

  const handleClick = (i, e) => {
    if (!interactive) return;
    setBouncing(i);
    window.setTimeout(() => setBouncing(null), 420);
    onChange(String(halfOf(i, e)));
  };

  const stars = [];
  for (let i = 0; i < 5; i++) {
    const fraction = Math.min(1, Math.max(0, display - i));
    const clipId = uid + '-clip-' + i;
    stars.push(
      <span
        key={i}
        className={'star-cell' + (bouncing === i ? ' bounce' : '')}
        style={{ width: size, height: size }}
        onMouseMove={(e) => handleMove(i, e)}
        onMouseLeave={() => interactive && setHover(null)}
        onClick={(e) => handleClick(i, e)}
      >
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className="star-svg"
          shapeRendering="geometricPrecision"
          aria-hidden="true"
        >
          <path className="star-ring" d={RING_STAR} />
          <path className="star-fill" d={SOLID_STAR} clipPath={'url(#' + clipId + ')'} />
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <rect x="0" y="0" width={24 * fraction} height="24" />
          </clipPath>
        </svg>
      </span>
    );
  }

  return (
    <span
      className={'star-rating' + (interactive ? ' interactive' : '')}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={'评分 ' + (Number(value) || 0) + ' / 5'}
    >
      {stars}
    </span>
  );
}
