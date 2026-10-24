# Project Hack: launch control

The big-screen launch control board for the two-day team hackathon. Twelve topics each add a hidden part to a rocket. The rocket launches on **Tuesday 27 October 2026 at 17:00 Prague time**.

## Run it

Needs Node 20 or newer.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm test         # unit tests for the game logic
```

## Using the board

- Click a topic in the checklist to see its next step: Start work → Mark done (hack topics choose Kill / Continue / Backlog) → Add part to rocket. A part can be removed again, which asks you to confirm first.
- Progress is saved in this browser (localStorage).
- Press the speaker button to mute the "Hello, World" transmissions. Click the waveform to play one right away.
- Click the radar to add a contact.

## God mode

Add `#godmode` to the URL, for example `http://localhost:5173/#godmode`.

- The launch button unlocks before launch time.
- A **GOD MODE** marker and a **Reset** button appear in the top bar. Reset asks you to confirm, then sets every topic back to Waiting and clears the rocket. God mode and normal mode share the same data, so a reset clears both.
- The "Final go / no-go poll" step in Launch Sequence becomes clickable.

## Design review links

- `?preview` adds a bar for stepping through the launch states. `?preview=orbit` opens on one state (`empty`, `countdown`, `ignition`, `climb`, `boom`, `pad`, `lost`, `orbit`).
- `?demo` shows a nearly complete rocket without touching saved data.
- `?camera=night` (or `dawn`, `day`, `dusk`) forces a camera image, so you can check new photos without waiting for the clock.

## Where things live

| What | Where |
|---|---|
| Topics, hidden weights, launch time, formulas, camera slots, rocket position, fake panel values | `src/config.ts` |
| Odds, launch rule, outcome roll, topic steps | `src/game/rules.ts` (tests next to it) |
| Prague time, countdown, camera slot | `src/game/time.ts` |
| Launch timing | `src/game/useLaunch.ts` |
| Trajectory map: milestones, altitude and speed over time | `src/game/trajectory.ts` |
| Saved data (swap this for shared state later) | `src/store/store.ts` |
| Rocket parts, one SVG layer per part id | `src/rocket/parts.tsx` |
| Design tokens from Figma | `src/styles/tokens.css` |
| Figma assets | `src/assets/figma/` |

## Camera images

Put the pad photos in `public/camera/`: `dawn.jpg`, `day.jpg`, `dusk.jpg` and `night.jpg`. The time slots (Prague time) are set in `CAMERA_SLOTS` in `src/config.ts`:

- dawn 05:00–08:00
- day 08:00–16:00
- dusk 16:00–18:00
- night 18:00–05:00

When the slot changes, the new image fades in over about 6 seconds. All four images must be 3:2 and share the same framing as the current photo, because the rocket is pinned to the pad by `ROCKET_PLACEMENT` (in % of the photo). For now, all four files are the photo from the Figma frame (node `18:416`).
