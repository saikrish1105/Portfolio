'use client';
import { useEffect, useRef } from 'react';
import { telemetry } from '@/lib/hud';

/**
 * Fixed screen-space T-Cam cockpit foreground: halo, front wheels, bodywork,
 * steering wheel w/ live LED shift lights + gear display, driver helmet.
 */
export default function Cockpit() {
  const rootRef = useRef<HTMLDivElement>(null);
  const swayRef = useRef<SVGGElement>(null);
  const ledsRef = useRef<(SVGRectElement | null)[]>([]);
  const gearRef = useRef<SVGTextElement>(null);
  const speedRef = useRef<SVGTextElement>(null);
  const streakRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const { speed, gear, rpm, roll } = telemetry;
      // shift lights
      const litCount = rpm * 15;
      const flash = rpm > 0.96 && Math.floor(now / 70) % 2 === 0;
      for (let i = 0; i < 15; i++) {
        const el = ledsRef.current[i];
        if (!el) continue;
        const lit = litCount > i;
        let color = i < 6 ? '#00ff6a' : i < 11 ? '#FF2800' : '#3b82f6';
        if (i >= 11) color = '#FFF200';
        el.setAttribute('fill', lit && !flash ? color : '#1a1a20');
        el.setAttribute('opacity', lit ? '1' : '0.55');
      }
      if (gearRef.current) gearRef.current.textContent = String(gear);
      if (speedRef.current) speedRef.current.textContent = String(Math.round(speed));
      // cockpit sway / roll
      if (swayRef.current) {
        const bounce = Math.sin(now / 46) * (speed / 340) * 2.2;
        const swayX = Math.sin(now / 300) * (speed / 340) * 2;
        const deg = (roll * 180) / Math.PI * 0.9;
        swayRef.current.setAttribute(
          'transform',
          `translate(${swayX.toFixed(2)} ${bounce.toFixed(2)}) rotate(${deg.toFixed(2)} 800 900)`,
        );
      }
      if (streakRef.current) {
        const o = Math.max(0, Math.min(0.55, (speed - 160) / 340));
        streakRef.current.style.opacity = o.toFixed(2);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={rootRef} className="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden>
      {/* speed streaks */}
      <div
        ref={streakRef}
        className="absolute inset-0 opacity-0"
        style={{
          background:
            'repeating-linear-gradient(90deg, transparent 0 46px, rgba(255,255,255,0.14) 46px 48px, transparent 48px 96px)',
          maskImage: 'radial-gradient(ellipse at center, transparent 34%, black 92%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 34%, black 92%)',
        }}
      />
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="carbon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b2b33" />
            <stop offset="0.5" stopColor="#101014" />
            <stop offset="1" stopColor="#050507" />
          </linearGradient>
          <linearGradient id="carbonH" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#08080a" />
            <stop offset="0.5" stopColor="#23232b" />
            <stop offset="1" stopColor="#08080a" />
          </linearGradient>
          <radialGradient id="helmet" cx="0.5" cy="0.35" r="0.9">
            <stop offset="0" stopColor="#2e2e38" />
            <stop offset="0.65" stopColor="#121218" />
            <stop offset="1" stopColor="#08080b" />
          </radialGradient>
          <linearGradient id="tire" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#17171c" />
            <stop offset="0.5" stopColor="#0a0a0d" />
            <stop offset="1" stopColor="#030304" />
          </linearGradient>
        </defs>

        <g ref={swayRef}>
          {/* front wheels */}
          <g>
            <rect x="40" y="470" width="250" height="330" rx="90" fill="url(#tire)" stroke="#1e1e24" strokeWidth="4" />
            <rect x="1310" y="470" width="250" height="330" rx="90" fill="url(#tire)" stroke="#1e1e24" strokeWidth="4" />
            <path d="M 70 500 q 90 -34 190 0" stroke="#2c2c34" strokeWidth="8" fill="none" />
            <path d="M 1340 500 q 90 -34 190 0" stroke="#2c2c34" strokeWidth="8" fill="none" />
            {/* winglets */}
            <rect x="252" y="560" width="90" height="16" rx="8" fill="#0c0c10" />
            <rect x="1258" y="560" width="90" height="16" rx="8" fill="#0c0c10" />
          </g>

          {/* bodywork shoulders */}
          <path d="M 0 900 L 0 700 Q 160 640 330 668 Q 480 696 560 780 L 600 900 Z" fill="url(#carbon)" stroke="#1e1e24" strokeWidth="3" />
          <path d="M 1600 900 L 1600 700 Q 1440 640 1270 668 Q 1120 696 1040 780 L 1000 900 Z" fill="url(#carbon)" stroke="#1e1e24" strokeWidth="3" />
          {/* accent stripes */}
          <path d="M 60 760 Q 240 690 430 742" stroke="#FF2800" strokeWidth="7" fill="none" />
          <path d="M 1540 760 Q 1360 690 1170 742" stroke="#FF2800" strokeWidth="7" fill="none" />
          <text x="150" y="830" fill="#e8e8ee" fontSize="40" fontStyle="italic" fontWeight="800" fontFamily="Orbitron, sans-serif" transform="rotate(-8 150 830)">LEO CLUB</text>
          <text x="1230" y="830" fill="#e8e8ee" fontSize="40" fontStyle="italic" fontWeight="800" fontFamily="Orbitron, sans-serif" transform="rotate(8 1450 830)">TRIDENT</text>

          {/* mirrors */}
          <g>
            <rect x="300" y="560" width="86" height="46" rx="10" fill="#0b0b0f" stroke="#26262c" strokeWidth="3" />
            <rect x="308" y="568" width="70" height="30" rx="6" fill="#101722" />
            <rect x="1214" y="560" width="86" height="46" rx="10" fill="#0b0b0f" stroke="#26262c" strokeWidth="3" />
            <rect x="1222" y="568" width="70" height="30" rx="6" fill="#101722" />
          </g>

          {/* HALO — 50% scale */}
          <g transform="translate(800 900) scale(0.5) translate(-800 -900)">
            <path d="M 210 900 C 260 470 520 330 800 330 C 1080 330 1340 470 1390 900" fill="none" stroke="url(#carbonH)" strokeWidth="64" strokeLinecap="round" />
            <path d="M 224 900 C 272 486 528 352 800 352 C 1072 352 1328 486 1376 900" fill="none" stroke="#FF2800" strokeWidth="6" opacity="0.9" />
            <path d="M 196 900 C 248 458 512 310 800 310 C 1088 310 1352 458 1404 900" fill="none" stroke="#000000" strokeWidth="8" opacity="0.8" />
          </g>

          {/* steering wheel */}
          <g transform="translate(800 800)">
            <rect x="-128" y="-74" width="256" height="158" rx="30" fill="url(#carbon)" stroke="#000" strokeWidth="4" />
            <rect x="-150" y="-40" width="34" height="96" rx="16" fill="#0a0a0d" />
            <rect x="116" y="-40" width="34" height="96" rx="16" fill="#0a0a0d" />
            {/* shift light LEDs */}
            {Array.from({ length: 15 }).map((_, i) => (
              <rect
                key={i}
                ref={(el) => {
                  ledsRef.current[i] = el;
                }}
                x={-84 + i * 12}
                y={-64}
                width={9}
                height={10}
                rx={2}
                fill="#1a1a20"
              />
            ))}
            {/* display */}
            <rect x="-74" y="-44" width="148" height="96" rx="10" fill="#04060a" stroke="#26262c" strokeWidth="3" />
            <text ref={speedRef} x="0" y="-16" textAnchor="middle" fontSize="24" fill="#7fd4ff" fontFamily="'Share Tech Mono', monospace">
              0
            </text>
            <text x="-58" y="-16" textAnchor="middle" fontSize="13" fill="#4a5568" fontFamily="'Share Tech Mono', monospace">
              KM/H
            </text>
            <text ref={gearRef} x="0" y="40" textAnchor="middle" fontSize="56" fontWeight="700" fill="#FFF200" fontFamily="Orbitron, sans-serif">
              1
            </text>
            <text x="52" y="40" textAnchor="middle" fontSize="13" fill="#4a5568" fontFamily="'Share Tech Mono', monospace">
              GEAR
            </text>
          </g>

          {/* helmet */}
          <g transform="scale(1)"> 
            <circle cx="800" cy="1010" r="180" fill="url(#helmet)" stroke="#000" strokeWidth="5" />
            <path d="M 640 940 Q 800 860 960 940" stroke="#FF2800" strokeWidth="14" fill="none" />
            <path d="M 660 972 Q 800 900 940 972" stroke="#FFF200" strokeWidth="7" fill="none" />
            <text x="800" y="985" textAnchor="middle" fontSize="74" fontStyle="italic" fontWeight="900" fill="#FFF200" fontFamily="Orbitron, sans-serif" stroke="#0a0a0a" strokeWidth="2">
              11
            </text>
          </g>
        </g>
      </svg>
      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)' }}
      />
    </div>
  );
}
