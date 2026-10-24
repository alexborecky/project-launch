// One SVG layer per rocket part, ported from the prototype.
// To swap in new artwork, replace the drawing for a part id; keep the key.
// Coordinates live in the rocket's own 800 × 700 space (see Rocket.tsx viewBox).
import type { ReactElement } from 'react'
import type { PartId } from '../config'

const hull = 'url(#rk-hull)'
const carbon = 'url(#rk-carbon)'
const bell = 'url(#rk-bell)'

/** The rocket occupies x 300–500, y 56–610 of the prototype's 800 × 700 space. */
export const ROCKET_VIEWBOX = { x: 300, y: 56, w: 200, h: 554 }

/** Back-to-front drawing order. */
export const PART_ORDER: PartId[] = [
  'boosterL', 'boosterR', 'engine', 'fins', 'tank', 'shield', 'body', 'paint', 'window', 'nose', 'patch', 'antenna',
]

export const PARTS: Record<PartId, () => ReactElement> = {
  boosterL: () => (
    <>
      <rect x="318" y="384" width="34" height="176" fill={hull} />
      <path d="M318 386 C318 360 328 346 335 338 C342 346 352 360 352 386 Z" fill={hull} />
      <rect x="318" y="470" width="34" height="10" fill={carbon} />
      <path d="M326 560 L344 560 L350 590 L320 590 Z" fill={bell} />
      <line x1="352" y1="420" x2="362" y2="420" stroke="var(--rk-metal-1)" strokeWidth="3" />
      <line x1="352" y1="540" x2="362" y2="540" stroke="var(--rk-metal-1)" strokeWidth="3" />
    </>
  ),
  boosterR: () => (
    <>
      <rect x="448" y="384" width="34" height="176" fill={hull} />
      <path d="M448 386 C448 360 458 346 465 338 C472 346 482 360 482 386 Z" fill={hull} />
      <rect x="448" y="470" width="34" height="10" fill={carbon} />
      <path d="M456 560 L474 560 L480 590 L450 590 Z" fill={bell} />
      <line x1="438" y1="420" x2="448" y2="420" stroke="var(--rk-metal-1)" strokeWidth="3" />
      <line x1="438" y1="540" x2="448" y2="540" stroke="var(--rk-metal-1)" strokeWidth="3" />
    </>
  ),
  engine: () => (
    <>
      <rect x="362" y="552" width="76" height="12" fill={carbon} />
      <path d="M372 564 L388 564 L392 604 L368 604 Z" fill={bell} />
      <path d="M392 564 L408 564 L412 606 L388 606 Z" fill={bell} />
      <path d="M412 564 L428 564 L432 604 L408 604 Z" fill={bell} />
    </>
  ),
  fins: () => (
    <>
      <path d="M364 512 L366 556 L330 604 L324 600 Z" fill={carbon} />
      <path d="M436 512 L434 556 L470 604 L476 600 Z" fill={carbon} />
      <rect x="356" y="366" width="8" height="18" fill="var(--rk-carbon-2)" />
      <rect x="436" y="366" width="8" height="18" fill="var(--rk-carbon-2)" />
    </>
  ),
  tank: () => (
    <>
      <rect x="362" y="358" width="76" height="196" fill={hull} />
      <line x1="362" y1="420" x2="438" y2="420" stroke="var(--rk-steel-4)" strokeWidth="1" />
      <line x1="362" y1="500" x2="438" y2="500" stroke="var(--rk-steel-4)" strokeWidth="1" />
    </>
  ),
  shield: () => <rect x="362" y="336" width="76" height="24" fill={carbon} />,
  body: () => (
    <>
      <rect x="362" y="212" width="76" height="126" fill={hull} />
      <line x1="362" y1="270" x2="438" y2="270" stroke="var(--rk-steel-4)" strokeWidth="1" />
    </>
  ),
  paint: () => (
    <>
      <rect x="362" y="524" width="76" height="14" fill={carbon} />
      <rect x="362" y="320" width="76" height="4" fill="var(--c-accent)" />
      <text
        transform="translate(410 498) rotate(-90)"
        fontFamily="var(--font)"
        fontWeight="700"
        fontSize="30"
        letterSpacing="10"
        fill="var(--rk-carbon-2)"
      >
        SOFA
      </text>
    </>
  ),
  window: () => (
    <>
      <rect x="362" y="212" width="76" height="12" fill={carbon} />
      {[378, 392, 406, 420].map((cx) => (
        <circle key={cx} cx={cx} cy="218" r="2" fill="var(--c-accent)" />
      ))}
    </>
  ),
  nose: () => (
    <>
      <path d="M362 214 C362 164 384 124 400 98 C416 124 438 164 438 214 Z" fill={hull} />
      <path d="M386 150 L414 150" stroke="var(--rk-steel-4)" strokeWidth="1" />
    </>
  ),
  patch: () => (
    <>
      <circle cx="400" cy="294" r="13" fill="var(--rk-carbon-2)" />
      <circle cx="400" cy="294" r="13" fill="none" stroke="var(--c-accent)" strokeWidth="1.5" />
      <path d="M400 285 L402.6 291.4 L409 291.4 L404 295.4 L405.8 302 L400 298 L394.2 302 L396 295.4 L391 291.4 L397.4 291.4 Z" fill="#fff" />
    </>
  ),
  antenna: () => (
    <>
      <line x1="400" y1="100" x2="400" y2="66" stroke="var(--rk-metal-2)" strokeWidth="2" />
      <line x1="392" y1="78" x2="408" y2="78" stroke="var(--rk-metal-2)" strokeWidth="1.5" />
      <circle className="rk-beacon" cx="400" cy="64" r="3" fill="var(--c-accent)" />
    </>
  ),
}
