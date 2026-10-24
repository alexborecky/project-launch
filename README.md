# Project Launch: launch control

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
- On the Netlify site, progress is shared: every screen and laptop sees the same board within about 3 seconds. The first change you make on a device asks for the **team code**. Resetting, the go / no-go poll, launching and Return to pad ask for the **admin code**. Codes are remembered on that device. Anyone with the link can watch without a code.
- System Status shows **SYNCED** when the screen is connected, or **OFFLINE** with "LINK DOWN". Offline, the board keeps showing the last known progress, and changes wait until the connection is back.
- With `npm run dev`, and in the demo, progress is saved only in that browser.
- After the countdown, the camera view plays a 10-second launch clip from `public/videos/`: `launch-success.mp4` when the rocket reaches orbit, `launch-failed.mp4` for any failure. The result appears when the clip ends. Every screen plays it from the same moment.
- Press the speaker button to mute the "Hello, World" transmissions and the launch clip's sound. Click the waveform to play one right away.
- Click the radar to add a contact.

## Shared saving on Netlify

The Netlify site **project-sofa-launch** keeps the board in Netlify Blobs, Netlify's built-in storage. Two small server functions in `netlify/functions/` read it and change it:

- `GET /api/state` returns the current board. Screens check it every 3 seconds, or every 20 seconds while the tab is in the background.
- `POST /api/action` applies one step, using the same game rules as the app (`src/game/actions.ts`).

Each step is checked against the rules on the server. A save only goes through if nobody else saved in the meantime; otherwise the server retries on top of the newer version. That way two people clicking at once never wipe each other's changes. The launch outcome is rolled once on the server, so every screen shows the same flight and result.

### Setting up the site (one time)

1. In Netlify, choose **Add new site → Import an existing project → GitHub**, and pick `alexborecky/project-launch`. Name the site `project-sofa-launch`.
2. Leave the build settings as Netlify shows them. They come from `netlify.toml`: build command `npm run build:netlify`, publish folder `dist`, functions in `netlify/functions`.
3. Under **Site configuration → Environment variables**, add `TEAM_CODE` and `ADMIN_CODE` with values you choose. Mark them as secret. Then trigger a new deploy so the functions pick them up.
4. Open the site. System Status should say **SYNCED**. The board is at `/`, and the demo is at `/demos/`.

Blobs needs no setup. Use one address on the big screen: the site address or your own domain.

### Testing shared saving on your Mac

```bash
cp .env.example .env   # local test codes: team-test / admin-test
npm run netlify        # http://localhost:8899
```

Open the address in two windows to see them sync. One limitation of Netlify's local test server: it can't spot two saves landing at the exact same moment, so there the last one wins. The real Netlify service catches it (see `netlify/lib/save.mts` and its tests).

## Complete reset

Double-click the **MISSION ID** chip in the top bar. A small popover asks you to confirm. "Reset everything" sets every topic back to Waiting, clears the rocket and returns any launch to the pad. It works in every mode, not just god mode. On the Netlify site it asks for the admin code.

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
