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

- Click a topic in the checklist to open it and see its actions: Start work → Mark done (hack topics choose Kill / Continue / Backlog) → Add part to rocket. It stays open while you click through the steps. Click it again, or anywhere else, to close it. A part can be removed again, which asks you to confirm first.
- Progress is saved in this browser (localStorage).
- Press the speaker button to mute the "Hello, World" transmissions. Click the waveform to play one right away.
- Click the radar to add a contact.

## God mode

Add `#godmode` to the URL, for example `http://localhost:5173/#godmode`.

- The launch button unlocks before launch time.
- A **GOD MODE** marker and a **Reset** button appear in the top bar. Reset asks you to confirm, then sets every topic back to Waiting and clears the rocket. God mode and normal mode share the same data, so a reset clears both.
- The "Final go / no-go poll" step in Launch Sequence becomes clickable.

## Demo version

The demo is the same app with a floating **DEMO** toolbar. You can drag it by its handle or hide it. It has three rows:

- **Parts:** 0–12 builds the rocket instantly. Each number marks that many topics, in checklist order, as Part Added.
- **Time:** Clock follows Prague time, or pick Day, Dusk or Night.
- **Launch:** still frames of each launch state (countdown, ignition, climb, explosion and each result). The real Launch button works too.

In the demo, the launch is always unlocked and god mode is on. It saves its own data, separate from the real board, so playing with it never changes the hackathon state.

```bash
npm run build:demo     # builds the demo into demos/
npm run preview:demo   # serves it at http://localhost:4174
```

`demos/` is a plain static site with relative paths, so it can be hosted from any folder. It needs a web server: opening `index.html` straight from the disk won't work, because browsers block the app's code that way. During development, `npm run dev` and then http://localhost:5173/?demo shows the same toolbar.

`?camera=night` (or `day`, `dusk`) still forces a time of day in any version.

## Where things live

| What | Where |
|---|---|
| Topics, hidden weights, launch time, formulas, camera slots, rocket position, fake panel values | `src/config.ts` |
| Odds, launch rule, outcome roll, topic steps | `src/game/rules.ts` (tests next to it) |
| Prague time, countdown, camera slot | `src/game/time.ts` |
| Launch timing | `src/game/useLaunch.ts` |
| Trajectory map: milestones, altitude and speed over time | `src/game/trajectory.ts` |
| Saved data (swap this for shared state later) | `src/store/store.ts` |
| Rocket: PNG layers plus flame, smoke and explosion | `src/rocket/Rocket.tsx`, art in `public/rocket-48-construction-layers/` |
| Design tokens from Figma | `src/styles/tokens.css` |
| Figma assets | `src/assets/figma/` |

## Camera images and the rocket

The camera photos are in `public/camera/`: `launchpad-day.png`, `launchpad-dusk.png` and `launchpad-night.png`. The time slots (Prague time) are set in `CAMERA_SLOTS` in `src/config.ts`:

- day 07:00–16:00
- dusk 16:00–18:00
- night 18:00–07:00

When the slot changes, the photo and the rocket on it fade over to the new lighting together, in about 6 seconds.

The rocket is built from the 12 layers in `public/rocket-48-construction-layers/<lighting>/`. Every part added to the rocket shows the next layer, from `01-primary-truss` up to `12-fairing-and-final-surface`, whichever topic it came from. Removing a part hides the top layer again. The hidden weights and the launch odds don't change.

Each slot has its own `placement`, in photo pixels, for where the layer canvas sits in the photo. These were matched to the reference renders. All photos must stay 1536 × 1024 with the same framing.
