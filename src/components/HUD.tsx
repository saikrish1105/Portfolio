'use client';
import { Download } from 'lucide-react';

interface Props {
  activeSector: number;
  onTeleport: (t: number) => void;
  resumeUrl: string;
}

const NAV = [
  { label: 'START', t: 0.0 },
  { label: 'PROJECTS', t: 0.101 },
  { label: 'EXPERIENCE', t: 0.401 },
  { label: 'ACHIEVEMENTS', t: 0.701 },
];

const SECTOR_LABELS = ['START', 'PROJECTS', 'EXPERIENCE', 'ACHIEVEMENTS'];
const SECTOR_COLORS = ['#7a7a85', '#FF2800', '#FFF200', '#B100E8'];

export default function HUD({ activeSector, onTeleport, resumeUrl }: Props) {
  const color = SECTOR_COLORS[activeSector] ?? '#7a7a85';
  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {/* ---------- top bar: sector nav + resume (right) ---------- */}
      <div className="absolute top-0 right-0 flex items-center gap-1.5 p-3 sm:p-4">
        {NAV.map((n, i) => (
          <button
            key={n.label}
            onClick={() => onTeleport(n.t)}
            className={`pointer-events-auto clip-card border px-2 py-2 font-display text-[9px] font-bold tracking-[0.15em] backdrop-blur transition-colors ${
              i > 0 && activeSector === i
                ? 'border-rosso bg-rosso/20 text-white'
                : 'border-edge bg-card/85 text-sub hover:border-modena hover:text-modena'
            }`}
          >
            {n.label}
          </button>
        ))}
        <a
          href={resumeUrl}
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto clip-card ml-1 flex items-center gap-2 border border-edge bg-card/85 px-3 py-2 font-display text-[11px] tracking-[0.2em] text-white backdrop-blur hover:border-rosso hover:text-rosso"
        >
          <Download size={14} className="text-rosso" /> RESUME
        </a>
      </div>

      {/* ---------- bottom: single live sector box ---------- */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-end p-3 sm:p-4">
        <div
          className="clip-card border px-4 py-2 font-display text-xs font-bold tracking-[0.3em] text-white backdrop-blur transition-all duration-300"
          style={{ borderColor: color, background: `${color}1f`, boxShadow: `0 0 16px ${color}55` }}
        >
          <span className="mr-2 inline-block h-2 w-2" style={{ background: color }} />
          {SECTOR_LABELS[activeSector] ?? 'START'}
        </div>
      </div>
    </div>
  );
}
