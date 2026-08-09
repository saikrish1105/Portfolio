import * as THREE from 'three';
import { PORTFOLIO_DATA } from '@/data/portfolio';

export const TRACK_WIDTH = 15;

export const SECTOR_BOUNDS = { s1: 0.1, s2: 0.4, s3: 0.7, finish: 0.95, line: 0.985 };

/** Closed GP-style circuit generated from a star-shaped polar function (guaranteed no self-intersection). */
export function buildCurve(): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  const N = 28;
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    const r =
      260 +
      60 * Math.sin(2 * th + 1.1) +
      32 * Math.sin(3 * th + 0.4) +
      10 * Math.sin(5 * th + 2.2);
    pts.push(new THREE.Vector3(Math.cos(th) * r, 0, Math.sin(th) * r));
  }
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5);
}

/** Signed curvature (turn rate) at t — positive = left. */
export function signedCurvature(curve: THREE.CatmullRomCurve3, t: number): number {
  const tt = ((t % 1) + 1) % 1;
  const a = curve.getTangentAt(tt);
  const b = curve.getTangentAt((tt + 0.006) % 1);
  const cross = a.x * b.z - a.z * b.x; // y-component of a x b (horizontal plane)
  const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1);
  const angle = Math.acos(dot);
  return Math.sign(cross) * angle;
}

export type ZoneKind =
  | 'hero'
  | 'project'
  | 'education'
  | 'internship'
  | 'hackathon'
  | 'certification'
  | 'creative';

export interface Zone {
  id: string;
  kind: ZoneKind;
  t0: number;
  t1: number;
  index: number;
}

/** Content zones derived purely from PORTFOLIO_DATA — no duplicated copy. */
export function buildZones(): Zone[] {
  const zones: Zone[] = [];
  const { s1, s2, s3, finish } = SECTOR_BOUNDS;
  zones.push({ id: 'hero', kind: 'hero', t0: 0, t1: s1, index: 0 });

  const projects = PORTFOLIO_DATA.sector1_projects;
  const pw = (s2 - s1) / projects.length;
  projects.forEach((p, i) =>
    zones.push({ id: `project-${p.id}`, kind: 'project', t0: s1 + i * pw, t1: s1 + (i + 1) * pw, index: i }),
  );

  const edu = [PORTFOLIO_DATA.sector2_experience.education];
  const interns = PORTFOLIO_DATA.sector2_experience.internships;
  const ew = (s3 - s2) / (edu.length + interns.length);
  zones.push({ id: 'education', kind: 'education', t0: s2, t1: s2 + ew, index: 0 });
  interns.forEach((_, i) =>
    zones.push({ id: `internship-${i}`, kind: 'internship', t0: s2 + (i + 1) * ew, t1: s2 + (i + 2) * ew, index: i }),
  );

  const a = PORTFOLIO_DATA.sector3_achievements;
  const items = a.hackathons.length + a.certifications.length + a.creative.length;
  const aw = (finish - s3) / items;
  let k = 0;
  a.hackathons.forEach((_, i) =>
    zones.push({ id: `hackathon-${i}`, kind: 'hackathon', t0: s3 + k++ * aw, t1: s3 + k * aw, index: i }),
  );
  a.certifications.forEach((_, i) =>
    zones.push({ id: `cert-${i}`, kind: 'certification', t0: s3 + k++ * aw, t1: s3 + k * aw, index: i }),
  );
  a.creative.forEach((_, i) =>
    zones.push({ id: `creative-${i}`, kind: 'creative', t0: s3 + k++ * aw, t1: s3 + k * aw, index: i }),
  );
  return zones;
}

export function zoneAt(zones: Zone[], t: number): Zone | null {
  return zones.find((z) => t >= z.t0 && t < z.t1) ?? null;
}

export function sectorOf(t: number): 0 | 1 | 2 | 3 {
  if (t < SECTOR_BOUNDS.s1) return 0;
  if (t < SECTOR_BOUNDS.s2) return 1;
  if (t < SECTOR_BOUNDS.s3) return 2;
  return 3;
}

/* ---------- canvas texture helpers (pre-baked, no runtime DOM) ---------- */

const textureRegistry: { c: HTMLCanvasElement; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; tex: THREE.CanvasTexture }[] = [];

/** Re-bake all canvas textures (call after webfonts finish loading so boards use Orbitron). */
export function refreshAllTextures() {
  for (const r of textureRegistry) {
    const ctx = r.c.getContext('2d')!;
    ctx.clearRect(0, 0, r.c.width, r.c.height);
    r.draw(ctx, r.c.width, r.c.height);
    r.tex.needsUpdate = true;
  }
}

export function makeCanvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  textureRegistry.push({ c, draw, tex });
  return tex;
}

export function asphaltTexture(): THREE.CanvasTexture {
  const tex = makeCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1c1e24';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const g = 18 + Math.random() * 26;
      ctx.fillStyle = `rgba(${g},${g},${g + 4},${0.5 + Math.random() * 0.5})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
    }
    // dark racing line down the middle
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0.32, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(5,5,8,0.55)');
    grad.addColorStop(0.68, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function checkerTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(256, 64, (ctx, w, h) => {
    const s = 16;
    for (let y = 0; y < h / s; y++)
      for (let x = 0; x < w / s; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#f5f5f5' : '#0a0a0a';
        ctx.fillRect(x * s, y * s, s, s);
      }
  });
}

export function sponsorBoardTexture(text: string, accent: string): THREE.CanvasTexture {
  return makeCanvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#0d0d12';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 52px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = accent;
    ctx.shadowBlur = 18;
    ctx.fillText(text.toUpperCase(), w / 2, h / 2 + 4);
  });
}

export function billboardTexture(title: string, category: string): THREE.CanvasTexture {
  return makeCanvasTexture(1024, 384, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#101016');
    g.addColorStop(1, '#07070b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#FF2800';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = '#FFF200';
    ctx.font = '700 34px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`// ${category}`, 40, 78);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 62px Orbitron, sans-serif';
    const words = title.toUpperCase().split(' ');
    let line = '';
    let y = 160;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > w - 80 && line) {
        ctx.fillText(line, 40, y);
        line = word;
        y += 70;
      } else line = test;
    }
    if (line) ctx.fillText(line, 40, y);
    ctx.fillStyle = '#FF2800';
    ctx.font = '700 30px "Share Tech Mono", monospace';
    ctx.fillText('[ ENTER PITSTOP ]', 40, h - 40);
  });
}

export function holoTexture(lines: { text: string; size: number; color: string }[]): THREE.CanvasTexture {
  return makeCanvasTexture(1024, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    let y = h / 2 - ((lines.length - 1) * 60) / 2;
    ctx.textAlign = 'center';
    for (const l of lines) {
      ctx.font = `italic 900 ${l.size}px Orbitron, sans-serif`;
      ctx.fillStyle = l.color;
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 30;
      ctx.fillText(l.text, w / 2, y);
      y += l.size + 46;
    }
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else line = test;
  }
  if (lines.length < maxLines && line) lines.push(line);
  return lines;
}

/** On-track hologram title card: wrapped title + colored subtitle. */
export function holoCardTexture(title: string, sub: string, color: string): THREE.CanvasTexture {
  return makeCanvasTexture(1024, 384, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.font = 'italic 900 64px Orbitron, sans-serif';
    const lines = wrapLines(ctx, title.toUpperCase(), w - 120, 2);
    const total = lines.length * 84 + 70;
    let y = h / 2 - total / 2 + 60;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 26;
    for (const l of lines) {
      ctx.fillText(l, w / 2, y);
      y += 84;
    }
    ctx.font = '700 34px "Share Tech Mono", monospace';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillText(sub.toUpperCase(), w / 2, y + 6);
  });
}

export function monitorTexture(title: string, sub: string): THREE.CanvasTexture {
  return makeCanvasTexture(512, 192, (ctx, w, h) => {
    ctx.fillStyle = '#04060c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1E1E24';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    // fake line graph
    ctx.strokeStyle = '#FF2800';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const y = h * 0.72 - Math.sin(x * 0.05) * 18 - Math.random() * 10;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#FFF200';
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const y = h * 0.55 - Math.cos(x * 0.03) * 14 - Math.random() * 8;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 800 34px Orbitron, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title.toUpperCase(), 20, 52);
    ctx.fillStyle = '#A1A1AA';
    ctx.font = '24px "Share Tech Mono", monospace';
    ctx.fillText(sub, 20, 88);
  });
}

export function crowdTexture(): THREE.CanvasTexture {
  const tex = makeCanvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, w, h);
    const palette = ['#FF2800', '#FFF200', '#ffffff', '#B100E8', '#7a7a85', '#3b3b45'];
    for (let i = 0; i < 2200; i++) {
      ctx.fillStyle = palette[(Math.random() * palette.length) | 0];
      ctx.globalAlpha = 0.35 + Math.random() * 0.65;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2.4, 3.2);
    }
    ctx.globalAlpha = 1;
  });
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

export function windowsTexture(): THREE.CanvasTexture {
  const tex = makeCanvasTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 14)
      for (let x = 6; x < w; x += 12) {
        if (Math.random() < 0.42) {
          ctx.fillStyle = Math.random() < 0.85 ? '#ffd98a' : '#9fd8ff';
          ctx.globalAlpha = 0.5 + Math.random() * 0.5;
          ctx.fillRect(x, y, 5, 7);
        }
      }
    ctx.globalAlpha = 1;
  });
  return tex;
}
