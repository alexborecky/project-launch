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
- Odds (changed 26 Oct 2026): every added part counts (base 5% + weights) with or without Headless API. Without the engine the odds are capped at 45% (`ODDS.maxWithoutEngine`), below the 60% needed to launch, so the engine is still required. Before this, no engine meant 0%, which hid all progress on the live board.
- Trajectory map (26 Oct 2026):
  - The radar rings and sweep were removed. A pulsing, blinking dot shows the rocket: on PAD 39A before launch, then along the route. Max-Q is a normal milestone.
  - The map flies its own realistic profile, steady acceleration (`MAP_PROFILE`): stage 1 ≈ 0:37, Max-Q ≈ 0:58, stage 2 ≈ 1:37, orbit at about 3–4 min. A failure stops at its break-up altitude (≈ 30–60 s).
  - The profile starts at lift-off in the clip. The map keeps flying after the result panel shows; the camera phases still follow the clip (`ascentMs`).
- Saved progress lives in Netlify Blobs, separately from deploys, so pushing new code never clears it. Keep `GameData` compatible: add fields with defaults; never rename or remove them.
- Rocket art (since 24 Oct 2026):
  - It's 12 PNG construction layers per lighting set, in `public/rocket-48-construction-layers/` (256 × 1536 canvas). It replaced the old SVG parts.
  - The build is linear: N parts added means layers 1..N show, whichever topics they came from. The odds and the hidden weights per topic are unchanged.
  - Lighting follows the camera slot: day, dusk or night. `black-night` exists but isn't used.
  - Each slot in `CAMERA_SLOTS` has its own `placement` (photo px), matched to Alex's reference renders. The nose tip and engines line up with the references. The layer art is slightly longer than the reference rocket, so it's scaled a little narrower horizontally to fit.
  - Night is placed lower and shorter, as in its reference.
  - The photo and its rocket crossfade as one unit, inside a 3:2 scene that covers the viewport.
  - Flame, smoke and explosion are drawn in layer-canvas units. Climb distance is in rocket heights (`climbFor`).
  - The countdown and result panels sit in the open sky right of the rocket.
- Radio audio replaced the speech-synthesis "Hello, World" voice, which is fully removed (24 Oct 2026). `AUDIO` in config; `src/audio/player.ts` plays one file at a time, keeps a short queue, respects mute, and skips quietly if the browser blocks sound. `src/audio/useAudioCues.ts` decides when:
  - A topic moving Waiting → In Progress plays its targeted file after exactly 2 s (Alex, 24 Oct). Mapped topics: engine, tank, body + paint (same colour-scheme file), window, nose, boosterR. The other five have no file yet.
  - Any new part added plays the next `new-part-N` file in turn (1→2→3→1). The position is remembered per device in localStorage (`project-hack:new-part-index`).
  - A launch start plays `t-minus-countdown.mp3`, but not for screens that join more than 1.5 s late.
  - Random chatter plays about every 20 minutes (18–22 min, `randomGapMs`) if nothing is playing. Alex asked for this on 24 Oct 2026, because the board runs for about 20 hours.
  - Changes seen on page load don't count. Every screen with sound plays the cues, laptops included, if they've clicked once.
- Never two sounds at once (Alex's rule): the player is single-channel with a queue. During a launch, `holdForLaunch` keeps the radio quiet from the countdown until the clip ends. Queued messages play afterwards, random chatter is skipped, and `playNow` (demo buttons, waveform) is ignored except for the countdown itself.
- Countdown is 5→1, timed to the countdown audio: `LAUNCH_COUNTDOWN.marksMs` [0, 2400, 3600, 4850, 5850] and `liftoffMs` 7500 (just after the 7.44 s countdown audio ends, so it doesn't overlap the clip's sound) (measured from the audio's loudness, not by ear; adjust if the voice and numbers drift). The clip starts at liftoff.
- Demo toolbar has an Audio row to play every file.
- Netlify refuses to deploy files with `#` or `?` in their names. The radio-audio deploy failed silently because of this; the chatter files were renamed to `radio-chatter-1..4.mp3`. `scripts/check-filenames.mjs` now fails `npm run build` / `build:netlify` early if a file in `public/` has such a name.
- Launch film (25 Oct 2026): every launch opens with Alex's 25.5 s short film (`LAUNCH_FILM`), then the countdown, then the clip (about 43 s in total).
  - The film plays full window in `FilmOverlay` (rendered by App, outside the scaled board): `position: fixed`, black, `object-fit: contain`, no UI on top. It closes when the film phase ends. Only the demo toolbar sits above it (z-index 1100), so the demo stays steerable.
  - Flight phase `film`, MODE label "BROADCAST". `COUNTDOWN_AT` = film length; `VIDEO_AT` = COUNTDOWN_AT + liftoff.
  - The radio holds from the launch press. The countdown voice is scheduled for COUNTDOWN_AT.
  - Phones only preload the film's metadata.
  - The web copy (`public/videos/launch-film.mp4`, 27.6 MB H.264) came from `source-media/Launch-final-clip.mov` (ProRes, 331 MB, git-ignored) via `avconvert -p Preset1920x1080`.
  - Never put originals in `public/`: Vite copies everything there into every build.
- Launch clips (`LAUNCH_VIDEO` in config, `src/components/LaunchVideo.tsx`):
  - After the 7.5 s countdown, the success clip (orbit) or the fail clip (pad or lost) plays in the camera view, 10 s long. The game rules are unchanged; Alex chose to keep them.
  - The timeline phases follow the clip: lift-off at 1.5 s, the fail clip's explosion at 5.2 s, and the result when it ends. The trajectory map uses the same timing.
  - Both clips preload. Each screen seeks to (server now − start), so late joiners and refreshes stay in step.
  - Sound plays unless the Communications speaker is muted (`src/hooks/muted.ts`, shared with the radio audio). If the browser blocks sound, the clip plays muted.
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
