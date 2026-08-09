/** Mutable per-frame telemetry shared between the render loop and DOM overlays (no React re-renders). */
export const telemetry = {
  t: 0,
  speed: 0, // km/h 0..340
  gear: 1,
  rpm: 0, // 0..1 within gear band
  roll: 0, // rad
  pit: 0,
};

export const GEAR_CUTS = [0, 45, 85, 125, 165, 205, 250, 295, 341];

export function gearAndRpm(kmh: number): { gear: number; rpm: number } {
  let gear = 1;
  for (let i = 1; i < GEAR_CUTS.length - 1; i++) if (kmh >= GEAR_CUTS[i]) gear = i + 1;
  gear = Math.min(8, gear);
  const lo = GEAR_CUTS[gear - 1];
  const hi = GEAR_CUTS[gear];
  return { gear, rpm: Math.max(0, Math.min(1, (kmh - lo) / (hi - lo))) };
}
