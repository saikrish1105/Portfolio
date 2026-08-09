'use client';
import { useEffect, useRef } from 'react';
import { getCircuitMap, projectPoint } from '@/lib/circuitmap';
import { buildCurve } from '@/lib/track';
import { telemetry } from '@/lib/hud';

/** Always-visible mini circuit map (top-left). Click to open the big interactive map. */
export default function MiniMap({ onOpen }: { onOpen: () => void }) {
  const dotRef = useRef<SVGCircleElement>(null);
  const data = getCircuitMap();

  useEffect(() => {
    const curve = buildCurve();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!dotRef.current) return;
      const t = ((telemetry.t % 1) + 1) % 1;
      const p = curve.getPointAt(t);
      const [x, y] = projectPoint(data.bounds, p.x, p.z);
      dotRef.current.setAttribute('cx', x.toFixed(1));
      dotRef.current.setAttribute('cy', y.toFixed(1));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [data]);

  return (
    <button
      onClick={onOpen}
      aria-label="open circuit map"
      title="Open circuit map"
      className="clip-card pointer-events-auto fixed left-3 top-3 z-30 border border-edge bg-card/80 p-1.5 backdrop-blur transition-colors hover:border-rosso"
    >
      <svg viewBox="0 0 300 300" className="block h-24 w-24 sm:h-32 sm:w-32">
        <path d={data.path} fill="none" stroke="#26262e" strokeWidth="14" strokeLinejoin="round" />
        <path d={data.path} fill="none" stroke="#FF2800" strokeWidth="3" strokeLinejoin="round" strokeDasharray="7 6" />
        {data.markers.map((m) => (
          <circle key={m.label} cx={m.pos[0]} cy={m.pos[1]} r="7" fill={m.color} />
        ))}
        <circle ref={dotRef} r="9" fill="#00ff6a" stroke="#fff" strokeWidth="2" />
      </svg>
    </button>
  );
}
