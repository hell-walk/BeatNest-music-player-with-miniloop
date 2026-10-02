import { usePlayer, usePlayerTime } from '../../context/PlayerContext.jsx';
import { formatTime, formatTimeSpoken } from '../../lib/format.js';

/** Accessible seek slider – a real <input type="range">, so keyboard and screen readers work. */
export default function SeekBar() {
  const { currentTime, duration } = usePlayerTime();
  const { actions, hasSource } = usePlayer();

  const max = duration > 0 ? duration : 0;
  const value = Math.min(currentTime, max);
  const pct = max ? (value / max) * 100 : 0;

  return (
    <div className="seekbar">
      <span className="seekbar__time" aria-hidden="true">
        {formatTime(value)}
      </span>
      <input
        type="range"
        className="range seekbar__range"
        min={0}
        max={max || 1}
        step={0.25}
        value={value}
        disabled={!hasSource || !max}
        aria-label="Seek"
        aria-valuetext={`${formatTimeSpoken(value)} of ${formatTimeSpoken(max)}`}
        style={{ '--pct': `${pct}%` }}
        onChange={(event) => actions.seek(Number(event.target.value))}
      />
      <span className="seekbar__time" aria-hidden="true">
        {formatTime(max)}
      </span>
    </div>
  );
}
