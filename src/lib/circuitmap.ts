import { buildCurve, SECTOR_BOUNDS } from './track';

export interface CircuitMapData {
  path: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  markers: { t: number; label: string; pos: [number, number]; color: string }[];
}

let cached: CircuitMapData | null = null;

export function getCircuitMap(): CircuitMapData {
  if (cached) return cached;
  const curve = buildCurve();
  const N = 220;
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const p = curve.getPointAt(i / N);
    pts.push([p.x, p.z]);
  }
  const xs = pts.map((p) => p[0]);
  const zs = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const proj = (x: number, z: number): [number, number] => [
    ((x - minX) / (maxX - minX)) * 260 + 20,
    ((z - minZ) / (maxZ - minZ)) * 260 + 20,
  ];
  const path =
    pts.map(([x, z], i) => `${i === 0 ? 'M' : 'L'}${proj(x, z)[0].toFixed(1)},${proj(x, z)[1].toFixed(1)}`).join(' ') +
    ' Z';
  const mk = (t: number) => {
    const p = curve.getPointAt(t);
    return proj(p.x, p.z);
  };
  cached = {
    path,
    bounds: { minX, maxX, minZ, maxZ },
    markers: [
      { t: 0.0, label: 'START', pos: mk(0.0), color: '#FFF200' },
      { t: SECTOR_BOUNDS.s1 + 0.001, label: 'PROJECTS', pos: mk(SECTOR_BOUNDS.s1 + 0.001), color: '#FF2800' },
      { t: SECTOR_BOUNDS.s2 + 0.001, label: 'EXPERIENCE', pos: mk(SECTOR_BOUNDS.s2 + 0.001), color: '#FFF200' },
      { t: SECTOR_BOUNDS.s3 + 0.001, label: 'ACHIEVEMENTS', pos: mk(SECTOR_BOUNDS.s3 + 0.001), color: '#B100E8' },
    ],
  };
  return cached;
}

export function projectPoint(bounds: CircuitMapData['bounds'], x: number, z: number): [number, number] {
  return [
    ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * 260 + 20,
    ((z - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * 260 + 20,
  ];
}
