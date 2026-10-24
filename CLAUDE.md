# Project Launch (launch control board): context for Claude

A standalone big-screen web app for a two-day team hackathon. It is not part of SOFA or CMS4, and none of their rules apply. The owner is Alex, Design Lead at Shoptet. Alex is a designer: explain things in plain language, and ask before anything that can't be undone, before installing any package, before committing, and before pushing or deploying (nothing is pushed or deployed until Alex asks).

## Sources of truth
- Game rules: the original prompt (summarised below) beats the prototype in `reference/raketa-hackathon.html`. Use the prototype for behaviour only, never for layout or styling.
- Visuals: Figma file `08aZ2jM4GZwyHtJADjICMj`, frame `17:346` ("Main Control Board — HUD", 1440 × 900). The file has no variables; tokens in `src/styles/tokens.css` are its raw values. Components: `HUD/Task Row` (17:348, one component, no variants; states are colour overrides) and `HUD/KV Row` (17:354).
- All Figma assets are downloaded into `src/assets/figma/`. Never use temporary Figma URLs at runtime.

## Stack (agreed)
Vite + React + TypeScript, plain CSS modules and CSS variables, no UI or CSS framework. Packages added beyond the template: `vitest` (logic tests only), `@fontsource/orbitron` and `@fontsource/tektur` (self-hosted fonts), `@netlify/blobs` and `netlify-cli` (dev). Lint is oxlint (from the template). Node 24 on Alex's machine.

## Decisions
- Layout: the board is laid out at 1440 × 900 and scaled to the window height. Extra width goes to the centre column. Below a 0.78 scale the panels stack and the page scrolls (`useFit` in `Board.tsx`).
  - `useFit` measures the layout viewport (`documentElement.clientWidth/Height`), not `innerWidth`. Phones report the zoomed-out width otherwise and get stuck on the 1440px board. It's worked out before the first paint.
  - Phones (≤ 640px), as Alex asked:
    - Top-bar chips stacked full width; the "Launch control system / operational" description hidden.
    - One long column: camera, gauges row, Launch Sequence, checklist, conditions, status, map, comms.
    - Camera keeps 704:541 proportions; compass, pitch scale and zoom rail hidden; countdown and result panel centred.
    - Launch button fixed to the bottom with solid colours, and the page gets bottom padding so nothing hides behind it.
  - In any stacked layout the trajectory map is 320px tall.
- Name: **Project Launch** (renamed from Project Hack on 24 Oct 2026). Internal storage keys stay `project-hack:*` so saved progress isn't lost.
- Fonts (Figma frame 22:1383): titles and headings use Orbitron (`--font-display`): brand, panel titles, deck labels, chip values, MODE value, Launch button, countdown digit, result and dialog titles. Everything else uses Tektur (`--font`), including the elements Figma left in Geist Mono (task numbers, compass, pitch scale, zoom). Packages: `@fontsource/orbitron`, `@fontsource/tektur`; Geist Mono was removed.
- Part Added status is green (`--c-go`, #2AE219). It's the only green in the UI. The topic name stays orange.
- Complete reset: double-click the Mission ID chip to open a confirm popover (click away or Esc closes it). It works in any mode. God mode's Reset button still uses the dialog.
- Checklist: each row is an accordion. Clicking it opens the row's actions for its current state underneath. Actions keep it open, so the next step appears right away. It closes when you click the row again, click anywhere else, or press Esc. Clicks in the confirm dialog don't close it. One row is open at a time. Hack topics finish with Kill / Continue / Backlog, all styled the same. **Kill is never shown as a failure.** "Remove part" uses the HUD confirm dialog.
- Defaults Alex accepted for open questions:
  - "ALL GREEN" stays orange.
  - The clock shows the real UTC offset.
  - A dawn slot (05:00–08:00) was added.
  - Map zoom has 3 steps.
  - The Status chip and MODE follow the game phase.
  - Comms shows ON AIR / STANDBY / MUTED.
  - The go / no-go step is informational and does not block launch.
- Launch Sequence:
  1. Assemble: ≥1 part added.
  2. Integrate: launch is viable.
  3. Go / no-go: a manual tick in god mode.
  4. Launch: locked until launch time, ticked after a launch.
- Rocket art (since 24 Oct 2026):
  - It's 12 PNG construction layers per lighting set, in `public/rocket-48-construction-layers/` (256 × 1536 canvas). It replaced the old SVG parts.
  - The build is linear: N parts added means layers 1..N show, whichever topics they came from. The odds and the hidden weights per topic are unchanged.
  - Lighting follows the camera slot: day, dusk or night. `black-night` exists but isn't used.
  - Each slot in `CAMERA_SLOTS` has its own `placement` (photo px), matched to Alex's reference renders. The nose tip and engines line up with the references. The layer art is slightly longer than the reference rocket, so it's scaled a little narrower horizontally to fit.
  - Night is placed lower and shorter, as in its reference.
  - The photo and its rocket crossfade as one unit, inside a 3:2 scene that covers the viewport.
  - Flame, smoke and explosion are drawn in layer-canvas units. Climb distance is in rocket heights (`climbFor`).
  - The countdown and result panels sit in the open sky right of the rocket.
- Launch clips (`LAUNCH_VIDEO` in config, `src/components/LaunchVideo.tsx`):
  - After the 2.7 s countdown, the success clip (orbit) or the fail clip (pad or lost) plays in the camera view, 10 s long. The game rules are unchanged; Alex chose to keep them.
  - The timeline phases follow the clip: lift-off at 1.5 s, the fail clip's explosion at 5.2 s, and the result when it ends. The trajectory map uses the same timing.
  - Both clips preload. Each screen seeks to (server now − start), so late joiners and refreshes stay in step.
  - Sound plays unless the Communications speaker is muted (`src/hooks/muted.ts`, shared with the voice). If the browser blocks sound, the clip plays muted.
  - With reduced motion, the clip shows its last frame.
  - The clips are night-lit, so they look slightly off against the day and dusk photos. Flagged to Alex; nothing decided yet.
- `.env` must not contain `VITE_SYNC`. Vite reads `.env` too, so plain `npm run dev` would switch to shared saving. netlify.toml sets it for Netlify builds and `npm run netlify`.
- Launch Conditions has 8 px of extra bottom padding; its slot is 195 px.
- Camera slots (`from` as HH:MM, Prague time): day 07:00, dusk 16:20, night 17:30 (set 24 Oct 2026; Alex will check the real light on site and may adjust). The dawn slot was removed, as Alex asked.
- Flight state is kept in memory only. A reload returns to the pad, but the parts stay.
- Shared state uses Netlify Blobs and Functions. Hosting is Netlify, site name `project-sofa-launch`. The earlier Cloudflare idea was dropped once Netlify was chosen.

## Slices
1. Setup, full layout, game logic, local state, launch sequence (`src/game/useLaunch.ts`). Done. The launch visuals (countdown, result panels and so on) are placeholders Alex accepted for now. Alex is designing replacements, so keep them easy to swap. Review them with the demo toolbar (Launch row).
2. Camera crossfade by time of day, trajectory marker and ALT/V during launch. Done:
   - All slot images stay loaded. The new one fades in on top over 6 s, then the old one drops away (no dark dip). `?camera=<slot>` forces a slot.
   - The map milestones stand for altitudes: pad 0, stage 1 at 10 km, max-Q at 25 km, stage 2 at 70 km, and orbit at the outcome's altitude. The marker follows a smooth curve through them. Typical failures (12–44 km) stop between stage 1 and stage 2, and the map shows SIGNAL LOST there.
   - A successful flight lasts 7 s on the map, so the orbit result now appears about 3 s after the rocket leaves the camera.
   - Map progress runs on a timer, not animation frames, so it keeps going in a background tab.
   - The camera's pitch marker tilts up during the climb.
3. Shared state on Netlify. Done:
   - All changes are `Action`s applied by `applyAction` (`src/game/actions.ts`, pure). The browser uses it for local saving, and `netlify/functions/action.mts` uses it for the shared save.
   - `src/store/store.ts` has `createLocalStore` (demo, `npm run dev`) and `createSharedStore` (Netlify builds, `VITE_SYNC=1` from netlify.toml).
     - The shared store polls `/api/state?since=<version>` every 3 s (20 s while hidden). The server answers 204 when nothing changed.
     - Topic steps show instantly (pending) until the server answers.
     - It caches the last confirmed state in localStorage and tracks the server clock offset.
   - Saving (`netlify/lib/save.mts`): read with etag, apply, then `setJSON` with `onlyIfMatch`, retrying up to 5 times.
     - Netlify's local sandbox sends no etags, so locally it falls back to a plain write plus an in-process queue. Truly parallel local writes can still lose one. Production is protected (confirmed in Netlify's docs).
   - Codes: `TEAM_CODE` and `ADMIN_CODE` env vars are compared against the `x-team-code` header. The team code covers topic steps. The admin code covers reset, go / no-go, launch, return and setTopics. Reading is open.
     - `useAct` (`src/store/useAct.ts`) shows the code prompt and retries, and reports no-connection and conflict errors in a dialog.
     - The code is saved in localStorage (`project-hack:code`).
   - Launch: the server rolls once and stores `{ id, at, outcome }`. Every screen derives the same flight from it with `flightAt` (`src/game/timeline.ts`) using the server clock. A launch is saved, so a refresh keeps it until Return to pad.
   - `ConfirmProvider` wraps the whole app in `main.tsx`. It provides confirm, alert and prompt dialogs.
   - Local Netlify test: `cp .env.example .env && npm run netlify`, then open http://localhost:8899. Ports 5180 and 8899 were chosen because Docker on Alex's Mac uses 8888 and 5174.
   - `public/videos/` (launch-success/failed mp4) is Alex's work in progress and isn't committed yet.

## Demo build
- `npm run build:demo` builds into `demos/`. It uses `--mode demo --base ./`, so it works from any folder. Public asset paths in `config.ts` use `import.meta.env.BASE_URL` for that reason: never hard-code `/camera/...`.
- `IS_DEMO` (`src/demo/demo.ts`) is true in the demo build or with `?demo` in dev.
- In the demo: the DEMO toolbar is shown (`src/demo/DemoToolbar.tsx`), god mode is always on, and the store uses its own localStorage key (`project-hack:demo`).
- The toolbar's Parts buttons write real (demo) store data, so the checklist, gauges and launch roll all agree.
- The old `?preview` and `?demo=N` review links were replaced by this toolbar.

## Checks before handing back
`npm run build`, `npm test`, `npm run lint`, and a look in the browser at 1440 × 900.
