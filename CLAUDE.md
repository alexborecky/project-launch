# Project Hack launch control: context for Claude

A standalone big-screen web app for a two-day team hackathon. It is not part of SOFA or CMS4, and none of their rules apply. The owner is Alex, Design Lead at Shoptet. Alex is a designer: explain things in plain language, and ask before anything that can't be undone, before installing any package, before committing, and before pushing or deploying (nothing is pushed or deployed until Alex asks).

## Sources of truth
- Game rules: the original prompt (summarised below) beats the prototype in `reference/raketa-hackathon.html`. Use the prototype for behaviour only, never for layout or styling.
- Visuals: Figma file `08aZ2jM4GZwyHtJADjICMj`, frame `17:346` ("Main Control Board — HUD", 1440 × 900). The file has no variables; tokens in `src/styles/tokens.css` are its raw values. Components: `HUD/Task Row` (17:348, one component, no variants; states are colour overrides) and `HUD/KV Row` (17:354).
- All Figma assets are downloaded into `src/assets/figma/`. Never use temporary Figma URLs at runtime.

## Stack (agreed)
Vite + React + TypeScript, plain CSS modules and CSS variables, no UI or CSS framework. Packages added beyond the template: `vitest` (logic tests only) and `@fontsource/geist-mono` (self-hosted font). Lint is oxlint (from the template). Node 24 on Alex's machine.

## Decisions
- Layout: the board is laid out at 1440 × 900 and scaled to the window height. Extra width goes to the centre column. Below a 0.78 scale the panels stack and the page scrolls (`useFit` in `Board.tsx`).
- Checklist: the whole row is a button that opens a small menu with only the next step. Hack topics finish with Kill / Continue / Backlog, all styled the same. **Kill is never shown as a failure.** "Remove part" uses the HUD confirm dialog.
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
- The rocket is placed in % of the photo (`ROCKET_PLACEMENT`), inside a 3:2 scene that covers the viewport, so it stays on the pad at any screen ratio.
- Flight state is kept in memory only. A reload returns to the pad, but the parts stay.
- Shared state recommendation (slice 3): a tiny hosted key-value store (Cloudflare Worker + KV or Durable Object) behind the `GameStore` interface. Jira and one-screen-only were rejected for now.

## Slices
1. Setup, full layout, game logic, local state, launch sequence (`src/game/useLaunch.ts`). Done. The launch visuals (countdown, result panels and so on) are placeholders Alex accepted for now. Alex is designing replacements, so keep them easy to swap. Review them with `?preview`.
2. Camera crossfade by time of day, trajectory marker and ALT/V during launch. Done:
   - All slot images stay loaded. The new one fades in on top over 6 s, then the old one drops away (no dark dip). `?camera=<slot>` forces a slot.
   - The map milestones stand for altitudes: pad 0, stage 1 at 10 km, max-Q at 25 km, stage 2 at 70 km, and orbit at the outcome's altitude. The marker follows a smooth curve through them. Typical failures (12–44 km) stop between stage 1 and stage 2, and the map shows SIGNAL LOST there.
   - A successful flight lasts 7 s on the map, so the orbit result now appears about 3 s after the rocket leaves the camera.
   - Map progress runs on a timer, not animation frames, so it keeps going in a background tab.
   - The camera's pitch marker tilts up during the climb.
3. Shared state, only after the approach is agreed.

## Checks before handing back
`npm run build`, `npm test`, `npm run lint`, and a look in the browser at 1440 × 900.
