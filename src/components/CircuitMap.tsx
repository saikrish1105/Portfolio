'use client';
import { useEffect, useRef } from 'react';
import { X, Flag } from 'lucide-react';
import { getCircuitMap, projectPoint } from '@/lib/circuitmap';
import { buildCurve } from '@/lib/track';
import { telemetry } from '@/lib/hud';

interface Props {
  onClose: () => void;
  onTeleport: (t: number) => void;
}

/** Big interactive circuit map — click markers to teleport. */
export default function CircuitMap({ onClose, onTeleport }: Props) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal>
      <div
        className="modal-in relative border-2 border-edge bg-card/95 p-5"
        style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))' }}
      >
        <div className="flex items-center justify-between gap-8">
          <div className="font-display text-sm font-bold tracking-[0.3em] text-white">
            <Flag size={14} className="mr-2 inline text-rosso" />
            CIRCUIT MAP // PORTFOLIO GP
          </div>
          <button onClick={onClose} className="clip-card border border-edge p-1.5 text-white hover:border-rosso" aria-label="close map">
            <X size={16} />
          </button>
        </div>
        <svg viewBox="0 0 300 300" className="mt-3 h-[min(56vh,440px)] w-[min(56vh,440px)]">
          <path d={data.path} fill="none" stroke="#2a2a33" strokeWidth="10" strokeLinejoin="round" />
          <path d={data.path} fill="none" stroke="#FF2800" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="6 5" />
          {data.markers.map((m) => (
            <g key={m.label} className="cursor-pointer" onClick={() => onTeleport(m.t)}>
              <circle cx={m.pos[0]} cy={m.pos[1]} r="13" fill={m.color} opacity="0.25" />
              <circle cx={m.pos[0]} cy={m.pos[1]} r="6" fill={m.color} />
              <text x={m.pos[0] + 10} y={m.pos[1] - 9} fill="#e8e8ee" fontSize="11" fontFamily="'Share Tech Mono', monospace">
                {m.label}
              </text>
            </g>
          ))}
          <circle ref={dotRef} r="7" fill="#00ff6a" stroke="#fff" strokeWidth="1.5" />
        </svg>
        <div className="mt-2 text-center font-mono2 text-[10px] tracking-[0.3em] text-sub">TAP A MARKER TO TELEPORT</div>
      </div>
    </div>
  );
}
