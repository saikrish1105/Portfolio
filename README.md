# SAI KRISH // PORTFOLIO GRAND PRIX 🏁

A hyper-immersive single-page 3D portfolio themed as a Formula 1 night-race lap, viewed from the
driver's **T-Cam / TV-pod** perspective (halo + steering wheel foreground, track beyond) — built
with **Next.js + Three.js + Tailwind** and a scroll-driven camera
on a closed `CatmullRomCurve3` spline.

## Run it

```bash
npm install
npm run build          # production build
npx next start -H 0.0.0.0 -p 3000
# dev alternative: npm run dev
```

> ⚠️ Never rebuild while `next start` is running — restart the server after each build
> (stale chunk hashes otherwise 500).

## Drive it

| Input | Effect |
|---|---|
| **Load / reload** | Automatic ≤3 s start-light sequence — 5 reds, short hold, lights out, race on from the grid (no camera drop) |
| **Scroll** | Throttle — camera follows the track spline; scroll velocity = speed (0–340 km/h), gear 1–8, RPM shift LEDs |
| **Corners** | Camera leans with path curvature; cockpit sways |
| **Side cards** | Full info inline: description, tech stack, links, copyable Sepolia contracts — while the title floats on-track as a hologram |
| **Mini map** (top-left, always on) | Live position dot on the track layout; click it for the big map with tap-to-teleport markers |
| **START / S1 / S2 / S3** (top-right) | Instant teleport to any sector, next to the RESUME button |
| **Cross the checkered line** | Fully seamless infinite loop — progress wraps at the line with no banner or flash |

## Sectors (all content sourced from `src/data/portfolio.ts`)

- **Grid / Hero (t 0→0.10)** — 3D holographic name/title/motto floating over the track + GitHub / LinkedIn / Resume neon buttons.
- **S1 (0.10→0.40)** — 6 project billboards (3D canvas-texture boards + broadcast panel) with Pitstop modals; pit-lane ribbon on the right.
- **S2 (0.40→0.70)** — education driver-spec card + 2 internship telemetry cards; pit-wall monitors trackside.
- **S3 (0.70→0.95)** — hackathon trophy card, certification card, short-film broadcast frame (YouTube embed) + music links; grandstands + jumbotron trackside.

## Architecture

```
src/data/portfolio.ts     single source of truth (PORTFOLIO_DATA)
src/lib/track.ts          spline builder, zones, curvature, canvas texture bakery (+font re-bake)
src/lib/hud.ts            per-frame telemetry singleton (no React re-renders)
src/three/TrackScene.ts   vanilla three.js scene: instanced kerbs/barriers/boards/floodlights,
                          bloom (UnrealBloomPass 0.8/0.85), fog, skyline, ferris wheel, gantry
src/components/…          Cockpit (SVG halo/wheel/helmet), HUD, SectorPanels, PitstopModal,
                          CircuitMap, Preloader
src/app/page.tsx          scroll→t damping loop, sector/lap state machine, pitstop state
```

Performance & accessibility: `InstancedMesh` for all repeated geometry, low-power/mobile mode
(no bloom, dpr 1), `prefers-reduced-motion` disables camera roll/shake and CSS animation,
WebGL-failure fallback keeps all data readable.
