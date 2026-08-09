'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { TrackScene } from '@/three/TrackScene';
import { buildZones, zoneAt, sectorOf, signedCurvature, refreshAllTextures, type Zone } from '@/lib/track';
import { telemetry, gearAndRpm } from '@/lib/hud';
import { PORTFOLIO_DATA } from '@/data/portfolio';
import Cockpit from '@/components/Cockpit';
import HUD from '@/components/HUD';
import SectorPanels from '@/components/SectorPanels';
import CircuitMap from '@/components/CircuitMap';
import MiniMap from '@/components/MiniMap';
import Preloader from '@/components/Preloader';

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<TrackScene | null>(null);

  const [phase, setPhase] = useState<'pre' | 'race'>('pre');
  const [activeSector, setActiveSector] = useState(0);
  const [zone, setZone] = useState<Zone | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  const zones = useMemo(() => buildZones(), []);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const sim = useRef({
    tSm: 0.001,
    prevT: 0.001,
    kmh: 0,
    rollSm: 0,
    lapStart: 0,
    wrapping: false,
    zoneId: '',
    sector: 0,
    maxScroll: 1,
  });

  /* ------------------------------ engine mount ------------------------------ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowPower =
      window.innerWidth < 820 || (navigator.hardwareConcurrency ?? 8) <= 4 || reduced;
    const scene = new TrackScene(canvas, lowPower ? 'low' : 'high');
    sceneRef.current = scene;
    if (scene.failed) {
      setFailed(true);
      setPhase('race');
      return;
    }

    const resize = () => scene.resize(window.innerWidth, window.innerHeight);
    resize();
    window.addEventListener('resize', resize);

    // re-bake sponsor/board typography once the racing fonts are ready
    if (document.fonts?.ready) void document.fonts.ready.then(() => refreshAllTextures());

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const s = sim.current;
      const dt = Math.min(0.05, (now - last) / 1000) || 0.016;
      last = now;

      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      s.maxScroll = max;
      const target = Math.min(1, Math.max(0, window.scrollY / max));
      const damp = reduced ? 1 : 1 - Math.exp(-dt * 5.5);
      if (!s.wrapping) s.tSm += (target - s.tSm) * damp;

      // speed from scroll velocity
      const u = (Math.abs(s.tSm - s.prevT) / dt) * scene.length;
      s.prevT = s.tSm;
      const kmhTarget = Math.min(340, u * 0.75);
      s.kmh += (kmhTarget - s.kmh) * Math.min(1, dt * 6);
      const { gear, rpm } = gearAndRpm(s.kmh);

      // corner lean
      const k = signedCurvature(scene.curve, s.tSm);
      const rollTarget = reduced ? 0 : THREE.MathUtils.clamp(-k * 1.15, -0.055, 0.055);
      s.rollSm += (rollTarget - s.rollSm) * Math.min(1, dt * 3);

      scene.update({ t: s.tSm, dt, roll: s.rollSm, speedK: s.kmh / 340 });

      // telemetry for DOM overlays
      telemetry.t = s.tSm;
      telemetry.speed = s.kmh;
      telemetry.gear = gear;
      telemetry.rpm = rpm;
      telemetry.roll = s.rollSm;

      // zone / sector state
      const z = zoneAt(zones, s.tSm);
      if ((z?.id ?? '') !== s.zoneId) {
        s.zoneId = z?.id ?? '';
        setZone(z);
      }
      const sec = sectorOf(s.tSm);
      if (sec !== s.sector) {
        s.sector = sec;
        setActiveSector(sec);
      }

      // seamless infinite lap: the spline is closed, so t=1 is the same point as t=0.
      // wrap scroll + progress exactly at the line — no banner, no flash.
      if (s.tSm > 0.998 && !s.wrapping && phaseRef.current === 'race') {
        s.wrapping = true;
        s.tSm = Math.max(0, s.tSm - 1);
        s.prevT = s.tSm;
        s.sector = 0;
        setActiveSector(0);
        window.scrollTo({ top: 0, behavior: 'auto' });
        window.setTimeout(() => {
          s.wrapping = false;
        }, 120);
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      scene.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------ handlers ------------------------------ */
  const teleport = (t: number) => {
    setMapOpen(false);
    window.scrollTo({ top: t * sim.current.maxScroll, behavior: 'smooth' });
  };
  const preDone = () => {
    setPhase('race');
    sim.current.lapStart = performance.now();
    sceneRef.current?.setGantryGreen(true);
  };

  return (
    <div className="relative bg-asphalt text-white">
      {/* 3D canvas shell */}
      <div className="fixed inset-0 z-0">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
      {/* scroll runway */}
      <div style={{ height: '1500vh' }} aria-hidden />

      {/* scanlines */}
      <div className="scanlines pointer-events-none fixed inset-0 z-40" />

      <Cockpit />
      {phase === 'race' && (
        <>
          <MiniMap onOpen={() => setMapOpen(true)} />
          <HUD
            activeSector={activeSector}
            onTeleport={teleport}
            resumeUrl={PORTFOLIO_DATA.driver.socials.resume}
          />
        </>
      )}

      {phase === 'race' && !failed && <SectorPanels zone={zone} />}

      {mapOpen && <CircuitMap onClose={() => setMapOpen(false)} onTeleport={teleport} />}
      {phase === 'pre' && <Preloader onDone={preDone} />}

      {failed && (
        <div className="fixed inset-x-0 top-1/3 z-50 mx-auto w-[min(560px,92vw)] border border-edge bg-card p-6 text-center">
          <div className="font-display text-lg font-bold text-rosso">WEBGL UNAVAILABLE — TELEMETRY ONLY MODE</div>
          <p className="mt-2 text-sm text-sub">
            Your device could not start the 3D race engine. All portfolio data remains available via the panels and circuit map.
          </p>
        </div>
      )}
    </div>
  );
}
