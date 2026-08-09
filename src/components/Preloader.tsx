'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  onDone: () => void;
}

/** FIA start-light loading sequence: 5 reds, random hold, lights out. Runs automatically on every load. */
export default function Preloader({ onDone }: Props) {
  const [lights, setLights] = useState(0);
  const [out, setOut] = useState(false);
  const [gone, setGone] = useState(false);
  const timers = useRef<number[]>([]);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    for (let i = 1; i <= 5; i++) {
      timers.current.push(window.setTimeout(() => setLights(i), 150 + i * 350));
    }
    const hold = 300 + Math.random() * 500;
    const outAt = 150 + 5 * 350 + hold; // lights out ≤ ~2.7s
    timers.current.push(window.setTimeout(() => setOut(true), outAt));
    timers.current.push(window.setTimeout(() => setGone(true), outAt + 500));
    timers.current.push(window.setTimeout(() => doneRef.current(), outAt + 650));
    return () => timers.current.forEach(clearTimeout);
  }, []);

  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black transition-opacity duration-700 ${
        out ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 border-2 border-[#1c1c22] bg-[#0c0c0f] p-2">
            {[0, 1].map((r) => (
              <div
                key={r}
                className="h-10 w-10 rounded-full sm:h-12 sm:w-12"
                style={{
                  background: lights > i && !out ? '#FF2800' : '#1a1a1f',
                  boxShadow: lights > i && !out ? '0 0 30px #FF2800' : 'none',
                  transition: 'background 120ms',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
