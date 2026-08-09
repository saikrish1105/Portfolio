import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  TRACK_WIDTH,
  buildCurve,
  signedCurvature,
  buildZones,
  asphaltTexture,
  checkerTexture,
  sponsorBoardTexture,
  billboardTexture,
  holoTexture,
  holoCardTexture,
  monitorTexture,
  crowdTexture,
  windowsTexture,
} from '@/lib/track';
import { PORTFOLIO_DATA } from '@/data/portfolio';

export interface FrameState {
  t: number;
  dt: number;
  roll: number;
  speedK: number; // 0..1
}

const UP = new THREE.Vector3(0, 1, 0);

export class TrackScene {
  readonly curve: THREE.CatmullRomCurve3;
  readonly length: number;
  failed = false;

  private renderer!: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera!: THREE.PerspectiveCamera;
  private composer: EffectComposer | null = null;
  private quality: 'high' | 'low';
  private gantryMat!: THREE.MeshStandardMaterial;
  private followLight!: THREE.PointLight;
  private dummy = new THREE.Object3D();
  private tmp = {
    pos: new THREE.Vector3(),
    tan: new THREE.Vector3(),
    right: new THREE.Vector3(),
    look: new THREE.Vector3(),
    ahead: new THREE.Vector3(),
  };

  constructor(canvas: HTMLCanvasElement, quality: 'high' | 'low') {
    this.quality = quality;
    this.curve = buildCurve();
    this.length = this.curve.getLength();
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: quality === 'high',
        powerPreference: 'high-performance',
      });
    } catch {
      this.failed = true;
      return;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.75 : 1));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(64, 16 / 9, 0.1, 1600);
    this.scene.background = new THREE.Color('#04050a');
    this.scene.fog = new THREE.FogExp2('#05060a', 0.0016);

    this.buildLights();
    this.buildTrack();
    this.buildTrackside();
    this.buildSkyline();

    if (quality === 'high') {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(1280, 720), 0.8, 0.45, 0.85));
      this.composer.addPass(new OutputPass());
    }
  }

  /* ------------------------------------------------ lights & sky */
  private buildLights() {
    this.scene.add(new THREE.HemisphereLight('#2a3350', '#05060a', 1.05));
    const moon = new THREE.DirectionalLight('#8fa3ff', 0.85);
    moon.position.set(-140, 220, -90);
    this.scene.add(moon);
    this.followLight = new THREE.PointLight('#cfe0ff', 3.4, 160, 0);
    this.scene.add(this.followLight);

    // stars
    const starGeo = new THREE.BufferGeometry();
    const n = 900;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const e = Math.random() * Math.PI * 0.45 + 0.08;
      const r = 780;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
      pos[i * 3 + 1] = Math.sin(e) * r;
      pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starMat = new THREE.PointsMaterial({ color: '#cfd8ff', size: 1.7, transparent: true, opacity: 0.8 });
    starMat.fog = false;
    this.scene.add(new THREE.Points(starGeo, starMat));

    // moon disc
    const moonDisc = new THREE.Mesh(
      new THREE.CircleGeometry(16, 32),
      new THREE.MeshBasicMaterial({ color: '#e8eeff', fog: false }),
    );
    moonDisc.position.set(-420, 260, -520);
    moonDisc.lookAt(0, 0, 0);
    this.scene.add(moonDisc);

    // ground
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(900, 48),
      new THREE.MeshStandardMaterial({ color: '#0a0b10', roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    this.scene.add(ground);
  }

  /* ------------------------------------------------ track ribbon */
  private frame(t: number, out: { pos: THREE.Vector3; tan: THREE.Vector3; right: THREE.Vector3 }) {
    this.curve.getPointAt(t % 1, out.pos);
    this.curve.getTangentAt(t % 1, out.tan);
    out.right.crossVectors(out.tan, UP).normalize();
    return out;
  }

  private makeRibbon(t0: number, t1: number, width: number, y: number, mat: THREE.Material, uvScale = 10) {
    const steps = Math.max(8, Math.floor((t1 - t0) * 700));
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const f = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() };
    let dist = 0;
    let prev: THREE.Vector3 | null = null;
    for (let i = 0; i <= steps; i++) {
      const t = t0 + ((t1 - t0) * i) / steps;
      this.frame(t, f);
      if (prev) dist += f.pos.distanceTo(prev);
      prev = f.pos.clone();
      const lx = f.pos.x - f.right.x * width * 0.5;
      const lz = f.pos.z - f.right.z * width * 0.5;
      const rx = f.pos.x + f.right.x * width * 0.5;
      const rz = f.pos.z + f.right.z * width * 0.5;
      positions.push(lx, y, lz, rx, y, rz);
      uvs.push(0, dist / uvScale, 1, dist / uvScale);
      if (i < steps) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    return mesh;
  }

  private buildTrack() {
    const W = TRACK_WIDTH;
    const asphalt = new THREE.MeshStandardMaterial({ map: asphaltTexture(), roughness: 0.92, metalness: 0 });
    this.makeRibbon(0, 1, W, 0, asphalt, 9);

    // edge white lines
    const lineMat = new THREE.MeshStandardMaterial({ color: '#c9ccd4', roughness: 0.8 });
    this.makeRibbonEdge(0, 1, W, 0.35, 0.012, lineMat);

    // kerbs on high-curvature samples (instanced, alternating rosso/modena-white)
    const kerbGeo = new THREE.BoxGeometry(1.5, 0.09, 2.9);
    const kerbMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });
    const transforms: { m: THREE.Matrix4; c: THREE.Color }[] = [];
    const f = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() };
    const q = new THREE.Quaternion();
    const steps = 1400;
    let acc = 0;
    let lastP: THREE.Vector3 | null = null;
    let seg = 0;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      this.frame(t, f);
      if (lastP) acc += f.pos.distanceTo(lastP);
      lastP = f.pos.clone();
      const k = Math.abs(signedCurvature(this.curve, t));
      if (k < 0.05) continue;
      if (acc < 2.7) continue;
      acc = 0;
      seg++;
      const yaw = Math.atan2(f.tan.x, f.tan.z);
      q.setFromEuler(new THREE.Euler(0, yaw, 0));
      for (const side of [-1, 1]) {
        const off = W / 2 + 0.75;
        const m = new THREE.Matrix4().compose(
          new THREE.Vector3(f.pos.x + f.right.x * off * side, 0.045, f.pos.z + f.right.z * off * side),
          q,
          new THREE.Vector3(1, 1, 1),
        );
        transforms.push({ m, c: new THREE.Color(seg % 2 === 0 ? '#FF2800' : '#f2f2f2') });
      }
    }
    const kerbs = new THREE.InstancedMesh(kerbGeo, kerbMat, transforms.length);
    transforms.forEach((tr, i) => {
      kerbs.setMatrixAt(i, tr.m);
      kerbs.setColorAt(i, tr.c);
    });
    kerbs.instanceColor!.needsUpdate = true;
    this.scene.add(kerbs);

    // barriers (instanced)
    const barGeo = new THREE.BoxGeometry(0.55, 1.15, 7.4);
    const barMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 });
    const barCount = Math.floor(this.length / 7.4);
    const barriers = new THREE.InstancedMesh(barGeo, barMat, barCount * 2);
    const bColor = new THREE.Color();
    let bi = 0;
    for (let i = 0; i < barCount; i++) {
      const t = i / barCount;
      this.frame(t, f);
      const yaw = Math.atan2(f.tan.x, f.tan.z);
      q.setFromEuler(new THREE.Euler(0, yaw, 0));
      for (const side of [-1, 1]) {
        const off = W / 2 + 3.4;
        this.dummy.position.set(f.pos.x + f.right.x * off * side, 0.58, f.pos.z + f.right.z * off * side);
        this.dummy.quaternion.copy(q);
        this.dummy.updateMatrix();
        barriers.setMatrixAt(bi, this.dummy.matrix);
        barriers.setColorAt(bi, bColor.set(i % 6 === 0 ? '#3a3a44' : '#232329'));
        bi++;
      }
    }
    barriers.instanceColor!.needsUpdate = true;
    this.scene.add(barriers);

    // start / finish
    this.buildStartFinish();
  }

  private makeRibbonEdge(t0: number, t1: number, trackW: number, w: number, y: number, mat: THREE.Material) {
    for (const side of [-1, 1]) {
      const steps = 500;
      const positions: number[] = [];
      const indices: number[] = [];
      const f = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() };
      for (let i = 0; i <= steps; i++) {
        const t = t0 + ((t1 - t0) * i) / steps;
        this.frame(t, f);
        const o1 = (trackW / 2 - 0.5) * side;
        const o2 = (trackW / 2 - 0.5 + w) * side;
        positions.push(
          f.pos.x + f.right.x * o1, y, f.pos.z + f.right.z * o1,
          f.pos.x + f.right.x * o2, y, f.pos.z + f.right.z * o2,
        );
        if (i < steps) {
          const a = i * 2;
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      this.scene.add(new THREE.Mesh(geo, mat));
    }
  }

  private buildStartFinish() {
    const W = TRACK_WIDTH;
    const f = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() };
    this.frame(0, f);
    const yaw = Math.atan2(f.tan.x, f.tan.z);

    // checkered line
    const finishGeo = new THREE.PlaneGeometry(W, 3.2);
    finishGeo.rotateX(-Math.PI / 2);
    const finish = new THREE.Mesh(finishGeo, new THREE.MeshStandardMaterial({ map: checkerTexture(), roughness: 0.7 }));
    const fp = this.curve.getPointAt(0.985);
    finish.rotation.y = yaw;
    finish.position.set(fp.x, 0.02, fp.z);
    this.scene.add(finish);

    // start-light gantry
    const steel = new THREE.MeshStandardMaterial({ color: '#191920', roughness: 0.5, metalness: 0.6 });
    const gantry = new THREE.Group();
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 7.6, 10), steel);
      post.position.set(f.right.x * (W / 2 + 2.6) * side, 3.8, f.right.z * (W / 2 + 2.6) * side);
      gantry.add(post);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(W + 6.4, 1.1, 0.9), steel);
    beam.position.y = 7.2;
    beam.rotation.y = yaw;
    gantry.add(beam);
    this.gantryMat = new THREE.MeshStandardMaterial({
      color: '#111',
      emissive: new THREE.Color('#FF2800'),
      emissiveIntensity: 2.2,
    });
    for (let i = 0; i < 5; i++) {
      const pod = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.95, 0.7), this.gantryMat);
      const x = (i - 2) * 1.5;
      pod.position.set(Math.cos(yaw) * x, 6.4, -Math.sin(yaw) * x);
      gantry.add(pod);
    }
    gantry.position.copy(f.pos);
    this.scene.add(gantry);

    // grid slots
    const slotMat = new THREE.MeshStandardMaterial({ color: '#d8dbe2', roughness: 0.8 });
    for (let i = 0; i < 8; i++) {
      const t = 0.012 + i * 0.006;
      this.frame(t, f);
      const side = i % 2 === 0 ? -1 : 1;
      const slot = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.02, 5), slotMat);
      slot.position.set(
        f.pos.x + f.right.x * 2.6 * side,
        0.015,
        f.pos.z + f.right.z * 2.6 * side,
      );
      slot.rotation.y = Math.atan2(f.tan.x, f.tan.z);
      this.scene.add(slot);
    }
  }

  /* ------------------------------------------------ trackside furniture */
  private buildTrackside() {
    const W = TRACK_WIDTH;
    const f = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() };

    // sponsor boards — 4 textures, instanced each
    const texts: [string, string][] = [
      ['SAI KRISH', '#FF2800'],
      ['KRISH.SYSTEMS', '#FFF200'],
      ['ROSSO CORSA', '#FF2800'],
      ['TRIDENT MUSICALS', '#B100E8'],
    ];
    const boardGeo = new THREE.PlaneGeometry(11, 2.75);
    const every = 26;
    const count = Math.floor(this.length / every / texts.length);
    texts.forEach(([text, accent], ti) => {
      const mat = new THREE.MeshStandardMaterial({
        map: sponsorBoardTexture(text, accent),
        emissive: '#ffffff',
        emissiveMap: null,
        emissiveIntensity: 0.14,
        roughness: 0.6,
      });
      mat.emissiveMap = mat.map;
      const mesh = new THREE.InstancedMesh(boardGeo, mat, count);
      for (let i = 0; i < count; i++) {
        const t = ((i * texts.length + ti) * every) / this.length;
        this.frame(t, f);
        const side = i % 2 === 0 ? 1 : -1;
        const off = W / 2 + 4.8;
        this.dummy.position.set(f.pos.x + f.right.x * off * side, 1.5, f.pos.z + f.right.z * off * side);
        this.dummy.lookAt(f.pos.x, 1.5, f.pos.z);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
      }
      this.scene.add(mesh);
    });

    // floodlight poles (instanced) + heads (instanced, emissive -> bloom)
    const poleGeo = new THREE.CylinderGeometry(0.13, 0.18, 13, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: '#14161c', roughness: 0.6, metalness: 0.5 });
    const headGeo = new THREE.BoxGeometry(2.8, 0.9, 0.5);
    const headMat = new THREE.MeshStandardMaterial({
      color: '#0c0c0c',
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.7,
    });
    const poleCount = Math.floor(this.length / 38);
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, poleCount);
    const heads = new THREE.InstancedMesh(headGeo, headMat, poleCount);
    for (let i = 0; i < poleCount; i++) {
      const t = i / poleCount;
      this.frame(t, f);
      let side = i % 2 === 0 ? 1 : -1;
      if (t > 0.1 && t < 0.4) side = -1; // keep pit lane clear
      const off = W / 2 + 8.5;
      const px = f.pos.x + f.right.x * off * side;
      const pz = f.pos.z + f.right.z * off * side;
      this.dummy.position.set(px, 6.5, pz);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.updateMatrix();
      poles.setMatrixAt(i, this.dummy.matrix);
      this.dummy.position.set(px, 12.9, pz);
      this.dummy.lookAt(f.pos.x, 0, f.pos.z);
      this.dummy.updateMatrix();
      heads.setMatrixAt(i, this.dummy.matrix);
    }
    this.scene.add(poles, heads);

    // tall stadium towers
    const towerCount = 10;
    const towerPole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.42, 26, 8), poleMat, towerCount);
    const towerHead = new THREE.InstancedMesh(new THREE.BoxGeometry(7, 2.4, 1), headMat, towerCount);
    for (let i = 0; i < towerCount; i++) {
      const t = i / towerCount + 0.03;
      this.frame(t, f);
      const side = i % 2 === 0 ? -1 : 1;
      const off = W / 2 + 26;
      const px = f.pos.x + f.right.x * off * side;
      const pz = f.pos.z + f.right.z * off * side;
      this.dummy.position.set(px, 13, pz);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.updateMatrix();
      towerPole.setMatrixAt(i, this.dummy.matrix);
      this.dummy.position.set(px, 25.5, pz);
      this.dummy.lookAt(f.pos.x, 0, f.pos.z);
      this.dummy.updateMatrix();
      towerHead.setMatrixAt(i, this.dummy.matrix);
    }
    this.scene.add(towerPole, towerHead);

    // hero hologram
    const d = PORTFOLIO_DATA.driver;
    const holo = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 12),
      new THREE.MeshBasicMaterial({
        map: holoTexture([
          { text: d.name.toUpperCase(), size: 120, color: '#ffffff' },
          { text: d.title.toUpperCase(), size: 54, color: '#FF2800' },
          { text: `“${d.motto}”`, size: 40, color: '#FFF200' },
        ]),
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    (holo.material as THREE.MeshBasicMaterial).fog = false;
    this.frame(0.05, f);
    holo.position.set(f.pos.x, 6.5, f.pos.z);
    const back = this.curve.getPointAt(0.015);
    holo.lookAt(back.x, 4.5, back.z);
    this.scene.add(holo);

    // on-track hologram title for every content zone
    const holoZones = buildZones().filter((z) => z.kind !== 'hero');
    for (const z of holoZones) {
      let title = '';
      let sub = '';
      let color = '#FF2800';
      if (z.kind === 'project') {
        const pr = PORTFOLIO_DATA.sector1_projects[z.index];
        title = pr.title; sub = pr.category; color = '#FF2800';
      } else if (z.kind === 'education') {
        const e = PORTFOLIO_DATA.sector2_experience.education;
        title = e.institution; sub = e.degree; color = '#FFF200';
      } else if (z.kind === 'internship') {
        const it = PORTFOLIO_DATA.sector2_experience.internships[z.index];
        title = it.company; sub = it.role; color = '#FFF200';
      } else if (z.kind === 'hackathon') {
        const hk = PORTFOLIO_DATA.sector3_achievements.hackathons[z.index];
        title = hk.title; sub = 'HACKATHON'; color = '#B100E8';
      } else if (z.kind === 'certification') {
        const c = PORTFOLIO_DATA.sector3_achievements.certifications[z.index];
        title = c.title; sub = c.issuer; color = '#B100E8';
      } else {
        const c = PORTFOLIO_DATA.sector3_achievements.creative[z.index];
        title = c.title; sub = c.subtitle; color = '#B100E8';
      }
      const hp = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 7.5),
        new THREE.MeshBasicMaterial({
          map: holoCardTexture(title, sub, color),
          transparent: true,
          opacity: 0.25,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      (hp.material as THREE.MeshBasicMaterial).fog = false;
      const tc = (z.t0 + z.t1) / 2;
      this.frame(tc, f);
      hp.position.set(f.pos.x, 5.4, f.pos.z);
      const hb = this.curve.getPointAt(((tc - 0.015) % 1 + 1) % 1);
      hp.lookAt(hb.x, 3.6, hb.z);
      this.scene.add(hp);
    }

    // project billboards (sector 1)
    const zones = buildZones();
    for (const z of zones) {
      if (z.kind !== 'project') continue;
      const p = PORTFOLIO_DATA.sector1_projects[z.index];
      const tc = (z.t0 + z.t1) / 2;
      this.frame(tc, f);
      const off = W / 2 + 6.5;
      const grp = new THREE.Group();
      const frameMesh = new THREE.Mesh(
        new THREE.BoxGeometry(14, 5.4, 0.4),
        new THREE.MeshStandardMaterial({ color: '#101014', roughness: 0.4, metalness: 0.6 }),
      );
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(13.2, 4.7),
        new THREE.MeshStandardMaterial({
          map: billboardTexture(p.title, p.category),
          emissive: '#ffffff',
          emissiveIntensity: 0.2,
        }),
      );
      (screen.material as THREE.MeshStandardMaterial).emissiveMap = (screen.material as THREE.MeshStandardMaterial).map;
      screen.position.z = 0.25;
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.4, 8), poleMat);
      legL.position.set(-5, -4.2, 0);
      const legR = legL.clone();
      legR.position.x = 5;
      grp.add(frameMesh, screen, legL, legR);
      grp.position.set(f.pos.x + f.right.x * off, 4.6, f.pos.z + f.right.z * off);
      const target = this.curve.getPointAt(tc - 0.012);
      grp.lookAt(target.x, 3.4, target.z);
      this.scene.add(grp);
    }

    // pit lane ribbon + signage (sector 1 side)
    const pitMat = new THREE.MeshStandardMaterial({ color: '#1c1d24', roughness: 0.9 });
    this.makePitRibbon(0.11, 0.39, pitMat);

    // pit-wall telemetry monitors (sector 2)
    for (let i = 0; i < 6; i++) {
      const t = 0.415 + i * 0.048;
      this.frame(t, f);
      const off = -(W / 2 + 4.6);
      const intern = PORTFOLIO_DATA.sector2_experience.internships[i % 2];
      const mon = new THREE.Mesh(
        new THREE.PlaneGeometry(8.5, 3.2),
        new THREE.MeshStandardMaterial({
          map: monitorTexture(i % 2 === 0 ? intern.company.split('–')[0] : 'PIT WALL', intern.role),
          emissive: '#ffffff',
          emissiveIntensity: 0.45,
        }),
      );
      (mon.material as THREE.MeshStandardMaterial).emissiveMap = (mon.material as THREE.MeshStandardMaterial).map;
      mon.position.set(f.pos.x + f.right.x * off, 2.4, f.pos.z + f.right.z * off);
      mon.lookAt(f.pos.x, 2.2, f.pos.z);
      this.scene.add(mon);
    }

    // grandstands + jumbotron (sector 3)
    const crowd = crowdTexture();
    for (const gt of [0.73, 0.9]) {
      this.frame(gt, f);
      const off = -(W / 2 + 26);
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(52, 12, 10),
        new THREE.MeshStandardMaterial({ color: '#12131a', roughness: 0.9 }),
      );
      stand.position.set(f.pos.x + f.right.x * off, 6, f.pos.z + f.right.z * off);
      stand.rotation.y = Math.atan2(f.tan.x, f.tan.z);
      this.scene.add(stand);
      const crowdPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 9.5),
        new THREE.MeshStandardMaterial({ map: crowd, emissive: '#888899', emissiveIntensity: 0.28 }),
      );
      (crowdPlane.material as THREE.MeshStandardMaterial).emissiveMap = crowd;
      const off2 = -(W / 2 + 20.6);
      crowdPlane.position.set(f.pos.x + f.right.x * off2, 6.4, f.pos.z + f.right.z * off2);
      crowdPlane.lookAt(f.pos.x, 4, f.pos.z);
      this.scene.add(crowdPlane);
    }
    const jumbo = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 11),
      new THREE.MeshStandardMaterial({
        map: monitorTexture('SECTOR 3', 'ACHIEVEMENTS // TROPHY CAM'),
        emissive: '#ffffff',
        emissiveIntensity: 0.5,
      }),
    );
    (jumbo.material as THREE.MeshStandardMaterial).emissiveMap = (jumbo.material as THREE.MeshStandardMaterial).map;
    this.frame(0.815, f);
    const joff = W / 2 + 20;
    jumbo.position.set(f.pos.x + f.right.x * joff, 12, f.pos.z + f.right.z * joff);
    jumbo.lookAt(f.pos.x, 4, f.pos.z);
    this.scene.add(jumbo);
    const jpole = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 12, 8), poleMat);
    jpole.position.set(f.pos.x + f.right.x * joff, 6, f.pos.z + f.right.z * joff);
    this.scene.add(jpole);
  }

  private makePitRibbon(t0: number, t1: number, mat: THREE.Material) {
    const W = TRACK_WIDTH;
    const steps = 200;
    const positions: number[] = [];
    const indices: number[] = [];
    const f = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() };
    for (let i = 0; i <= steps; i++) {
      const t = t0 + ((t1 - t0) * i) / steps;
      this.frame(t, f);
      const o1 = W / 2 + 2.2;
      const o2 = W / 2 + 7.0;
      positions.push(
        f.pos.x + f.right.x * o1, 0.008, f.pos.z + f.right.z * o1,
        f.pos.x + f.right.x * o2, 0.008, f.pos.z + f.right.z * o2,
      );
      if (i < steps) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    this.scene.add(new THREE.Mesh(geo, mat));
    // pit box line
    const boxMat = new THREE.MeshStandardMaterial({ color: '#FFF200', roughness: 0.7 });
    for (let i = 0; i < 10; i++) {
      const t = t0 + ((t1 - t0) * (i + 0.5)) / 10;
      this.frame(t, f);
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 4.5), boxMat);
      line.position.set(f.pos.x + f.right.x * (W / 2 + 5.0), 0.02, f.pos.z + f.right.z * (W / 2 + 5.0));
      line.rotation.y = Math.atan2(f.tan.x, f.tan.z);
      this.scene.add(line);
    }
  }

  /* ------------------------------------------------ skyline */
  private buildSkyline() {
    const win = windowsTexture();
    const mat = new THREE.MeshStandardMaterial({
      color: '#05070c',
      map: win,
      emissive: '#ffffff',
      emissiveMap: win,
      emissiveIntensity: 0.5,
      roughness: 0.9,
    });
    for (let i = 0; i < 42; i++) {
      const a = (i / 42) * Math.PI * 2 + Math.random() * 0.1;
      const r = 430 + Math.random() * 220;
      const h = 14 + Math.random() * 52;
      const b = new THREE.Mesh(new THREE.BoxGeometry(16 + Math.random() * 30, h, 16 + Math.random() * 30), mat);
      b.position.set(Math.cos(a) * r, h / 2 - 2, Math.sin(a) * r);
      b.rotation.y = Math.random() * Math.PI;
      this.scene.add(b);
    }
    // ferris wheel silhouette
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(22, 0.7, 8, 40),
      new THREE.MeshStandardMaterial({ color: '#0a0a10', emissive: new THREE.Color('#7fd4ff'), emissiveIntensity: 1.4 }),
    );
    rim.position.set(Math.cos(2.4) * 520, 30, Math.sin(2.4) * 520);
    rim.lookAt(0, 30, 0);
    this.scene.add(rim);
    const spokeMat = new THREE.MeshStandardMaterial({ color: '#1a2028', emissive: new THREE.Color('#3b6f86'), emissiveIntensity: 0.7 });
    const qLook = new THREE.Quaternion();
    {
      const m = new THREE.Matrix4();
      const zAxis = new THREE.Vector3().subVectors(new THREE.Vector3(0, 30, 0), rim.position).normalize();
      const xAxis = new THREE.Vector3().crossVectors(UP, zAxis).normalize();
      const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis);
      m.makeBasis(xAxis, yAxis, zAxis);
      qLook.setFromRotationMatrix(m);
    }
    const zAxisQ = new THREE.Quaternion();
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 44, 6), spokeMat);
      s.position.copy(rim.position);
      zAxisQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), (i / 8) * Math.PI);
      s.quaternion.copy(qLook).multiply(zAxisQ);
      this.scene.add(s);
    }
  }

  setGantryGreen(green: boolean) {
    if (!this.gantryMat) return;
    this.gantryMat.emissive.set(green ? '#00ff6a' : '#FF2800');
  }

  resize(w: number, h: number) {
    if (this.failed) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
  }

  update(s: FrameState) {
    if (this.failed) return;
    const { pos, tan, right, look } = this.tmp;
    const t = ((s.t % 1) + 1) % 1;
    this.curve.getPointAt(t, pos);
    this.curve.getTangentAt(t, tan);
    right.crossVectors(tan, UP).normalize();

    const camX = pos.x - tan.x * 0.5;
    const camZ = pos.z - tan.z * 0.5;
    const camY = 1.8;

    // speed vibration
    const shake = s.speedK * 0.035;
    const sy = (Math.random() - 0.5) * shake;
    const sx = (Math.random() - 0.5) * shake * 0.6;

    this.camera.position.set(camX + sx, camY + sy, camZ);

    this.curve.getPointAt((t + 0.02) % 1, look);
    look.y = 1.15;

    const roll = s.roll;
    this.camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    this.camera.lookAt(look);

    this.followLight.position.set(camX, 7, camZ);

    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer?.dispose();
    this.composer?.dispose();
  }
}
