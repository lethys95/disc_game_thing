---
name: hud-paint-in
description: Make a painted HUD piece for disc (a map column, a battle bar, a panel, a frame around live content) the way that worked on 2026-10-10 - read a reference for its structure, box the layout out as a value greybox and a depth greybox in HTML, let Krea-2 paint them with its depth Control LoRA, then lay the game's real content over the result and judge it. Use for any HUD or interface art that has to hold a layout; not for single objects (those are `scripts/art/hud-pieces.ts`) or for paintings.
---

# Box out, then paint in

The user, 2026-10-10, after the first column: "this process has been awesome. I mean this is it." It replaced two
methods that failed: painting a whole screen as one picture (it washed out grey and could not hold content), and
making every piece alone from a short prompt (the pieces had no structure to sit in). The record of how it was found
is `docs/design/hud-pieces.md`; this is the procedure.

The idea in one line: **the greyboxes carry the layout, the prompt carries only the materials.**

## 0. Before you start
- Krea-2 is the only art model. Qwen-Image 2.1 (non-commercial licence: "That's debt. We're not taking that") and
  Qwen-Image-Edit-2511 (too poor) were tried and dropped (`docs/decisions.md`). Don't bring in other models without
  checking their licence first and asking.
- ComfyUI needs the `comfyui-krea2-controlnet` custom node and `loras/krea2-depth-control-lora.safetensors`
  (installed 2026-10-10; the `krea-images` skill lists them). The graph is `paintIn` in `scripts/art/comfy.ts`.
- Generation runs in a background subagent with an exact command (the `krea-images` skill, step 2). Run the rounds
  and judge them yourself; the user doesn't need to approve each round ("You don't need my accept of everything").
- Pages for the user go in `shots/` and are linked over Tailscale (`http://100.118.77.57:5173/shots/...`), never as
  claude.ai artifacts.

## 0b. Start from a judged greybox
A layout is painted only after the `greybox` skill: every element's job written down, the layout built in the game in
flat values and judged by the user there. This skill's value and depth greyboxes are drawn from that judged layout,
not invented with the painting.

## 0c. What the Capitol column taught (2026-10-11, six rounds to an accepted piece)
The column the user accepted (`shots/jilliath-capitol-6.html`, the record in `hud-pieces.md`) took six rounds. Start the
next piece where it ended, not where it began:
- **Exact only where the player reads or presses.** Plates, buttons, panes, text fields are drawn exactly at the judged
  layout's coordinates. Everything else is a soft, blurred mass (a figure, an arch, a portal) that the model makes its
  own. Exact boxes everywhere gave a square, soulless piece ("very very boring [...] Everything is very square").
- **One subject that does the screen's job.** The angel reaching up to the tab orbs is the column's heart. Ask what the
  screen does and give it a figure or object doing that, then build the architecture around it.
- **Functions as things.** The door is the way out (the user: "people already associate a door with leaving"); a tab is
  an orb in the window. Look for the object that already means the function before drawing a button.
- **No pattern as the ground.** A repeated motif over a whole wall (the quatrefoil diaper) reads as a fence (the user:
  "not like gothic architecture"). Disciples II and III never cover a large area with a pattern: big areas are
  parchment, marble, a picture or weathered masonry in shadow; ornament sits on frames, piers and borders; a lattice is
  at most a small framed inset; scale varies from one big carved thing down to studs (`hud-pieces.md`, "Surfaces").
- **Round and pointed, not boxed.** Rose windows, arches, gables, round buttons. Avoid stacks of rectangles.
- **Contrast of materials.** Pale weathered stone figures and portals against dark iron, marble plates, red and amber
  glass, warm wood. Never one material.
- **Everything belongs to the wall.** Free-standing objects painted in front (the pinnacles) read as "ejecting
  themselves out in a different dimension". Carve things into the surface or set them in it.
- **Keep the accepted, change the rest by inpainting.** Once a seed is liked, repaint only what changes: a mask that
  follows the new shapes, never a rectangle across the piece. Where a repeated pattern must be repainted, draw it into
  the depth map at the piece's scale and phase, or the model re-invents it larger (the diaper came back four times
  bigger).
- **An accepted piece is frozen.** Never repaint any part of a piece the user accepted to match a later one (the
  column's diaper repainted to masonry was rolled back: "you were not supposed to touch the angel or what's behind
  her"). Ask first.
- **Start from the old prompts.** Every accepted and rejected prompt is in `scripts/art/hud-paint-in.ts` and
  `hud-inpaint.ts`; the old paintings are in git history. The accepted column's vocabulary (diaper, rose window, pale
  stone angel, crocketed gable, portal) is the Jilliath kit; reuse it so the screen reads as one place.
- **One piece, one link, then the next round.** Show each round's page before stacking another.

## 1. Read a reference for its structure, not its look
**Never skip this step.** The user, 2026-10-11, rejecting a round painted without it: "There is no soul or character in
this whatsoever [...] You didn't use any of the reference material did you?" Open the reference images and
`reference_material/elements.md` (materials, colours, objects, written as prompt vocabulary) every round, and check the
prompt against its "How night one's HUD came out grey" list: more than one material, warm ones among them, small
saturated accents repeated, objects with jobs. Fixing a review's faults by taking things out leaves a sterile piece;
replace what goes with something that has character.

Take one reference screen the user points at (`reference_material/`, `elements.md`) and write down how it is
built, the way `hud-pieces.md` "How the Disciples II map column is built" does:
- What is one object, and where does it meet the screen's edges?
- How do its sections join (bands, studs at seams)?
- Where is the light? Usually all chrome is one dark low-contrast material and only what the player reads or presses
  is light. Squint: what remains?
- Where does ornament sit (texture behind the functional parts, dark on dark)?
- Where are the figures, and what do they do? They are relief in the negative space, in the chrome's own material,
  holding something. Not statues, not repeated.

Then translate it to disc's own content: disc's sections, disc's game data (squads are 3×3 grids), disc's motifs
(faction motifs are provisional, #76). Never transcribe a reference's signature features
(memory: references-are-direction). Screenshots of other games never go into a generator.

## 2. Box it out: two greyboxes in HTML
Make `art/greybox/<layout>/` with two pages at the piece's size in the game at 1080p (CSS pixels; the map column is
300×864):
- **`values.html`**: the layout in flat values. Chrome dark and low in contrast; plates, sockets and the primary
  command light; wells for portraits black; accents (amber studs, coloured glass) in their colour. This decides where
  light and dark land.
- **`depth.html`**: the same layout in heights: near is white, far is black. Wells and openings deep, the face in the
  middle, plates, sockets, studs and the primary command raised. Figures are soft raised masses in the pose wanted
  (a kneeling mass, a reclining one); the model follows the masses.

Rules learned:
- **Every part that has to survive must be drawn big enough.** A 38 px socket got painted over in every run; at 46 px
  it survives.
- **Leave content areas blank.** Text, portraits and numbers are the game's HTML, laid over the paint. A wanted glyph
  or face in the greybox comes back garbled.
- **A figure's height in the depth greybox decides what it becomes.** Raised well above the face it is sculpted as a
  smooth statue; barely above it, in the face's own value, it is engraved into the metal (the battle bar's herald and
  scribe). Ask for "old and worn [...] matte, with no polish and no highlights" to keep it from shining.
- **Mirror what looks like it should be mirrored.** Three sections with a symmetrical middle make the eye expect
  the outer two to match; build them alike, the same width, a counterpart at each end.
- **Balance the light across the piece.** Marble plates are the brightest things in it; a section with several and
  another with none reads lopsided. Give each end its share, or make some plates dark iron with light inlay.
- **Both greyboxes are needed.** Values alone drift above strength ~0.55; depth alone confuses parts at the same
  height (name plates became wells, small niches became tracery).

Add the layout to `LAYOUTS` in `scripts/art/hud-paint-in.ts` (page size, paint size: a multiple of 64 near the page's
aspect, about a megapixel), then render: `pnpm tsx scripts/art/hud-paint-in.ts render <layout>`. Look at both PNGs
before painting.

## 3. Paint it in: the prompt
One paragraph, materials only, in this order: what the object is ("A tall vertical game interface column seen
straight on"), the technique ("painted as game interface art, in soft even light without glare"), the chrome's
material and finish, its joints, the plates and sockets ("blank"), each special part named with its count, the
ornament behind, the figures and what they do, "No text, no letters."
- **Name repeated small parts with their count**, or the model turns them into tracery ("a row of five small arched
  portrait niches", "a three by three grid of square panes").
- **Give different parts different words.** "Four small round sockets" in one place and "four small plates" in
  another made the plates round too; name each part's shape outright ("rectangular", "buttons").
- **Light:** "lit from the upper left" gave glare beams; "soft even light without glare" fixed it.
- **Figures:** say adult ("grown, solemn faces"), give them a pose and a job against the piece ("kneeling and leaning
  in to rest her cheek and both hands against the glass"). The user's duality (an angel and a succubus at the End
  turn gem) is the model: figures that tell something are the opposite of boring.
- Settings that worked: denoise 0.7 from the values greybox, depth strength 1, Krea-2 Turbo's 8 steps.
- One measured change per round (memory: notes-calibrate-not-overshoot).

Run 4–6 seeds: `pnpm tsx scripts/art/hud-paint-in.ts <layout> 1 2 3 4`.

## 4. Judge it
Look at every seed yourself, the full piece and a close crop of the figures:
- **Did the layout hold?** Every plate, socket, well and band where the greybox put it. A merged plate or a lost
  socket fails the seed, however beautiful.
- **Is the light calm,** and only the readable parts light?
- **Do the figures do something,** in the chrome's own material?
- Happy accidents are allowed when they read as meant (the 3×3 panes came out as stained glass: an empty squad slot
  now shows lit glass).

### Repair, don't reroll
When a seed holds the layout but one part is broken (hands, a merged plate), repaint just that part:
`pnpm tsx scripts/art/hud-inpaint.ts <repair>` (a repair names the source, boxes in page units, strengths and a
prompt for that part only). Mask only the broken part, not its frame; hold the repaint to the piece's depth greybox
(`depth` in the repair) so rims and edges survive; and name what must stay the same size ("a sphere that fills its
rim edge to edge"), or it shrinks. Separate repairs on one piece can be combined. Use one small box per broken part: a box that also covers a face repaints the face (a relief's iron came
back as skin), and say the material outright ("no skin, no flesh") and the colour of anything it touches. Count each figure's limbs first: an extra one is
painted out (masked alone, the prompt naming only what belongs behind it, no depth map so it can't come back).

### Wider screens
A bar painted at 16:9 leaves black on a wider monitor. Paint it wider instead (Warcraft III's way): greybox an
ornament-only extension for each end, set the finished painting between them on one canvas, and inpaint only the ends
(`art/greybox/battle-bar-wide/compose.py`, the `battle-bar-wide` repair). The game shows the wide painting behind the
bar's parts; narrower screens crop the extensions.

## 4b. Match the density, then upscale by segment
The user, 2026-10-11: "I'm pretty confident in the boxout strategy [...] maybe having a segment upscaling step after
that is the next part in that chain." Pieces shown side by side must carry the same pixels per screen pixel, or one
reads blurred next to the other (the Capitol's garrison wall at 1.04× beside its column at 1.9×). Paint every piece at
the same density, about 2× its 1080p page size, and where a piece is too large to paint at that size in one go, upscale
it segment by segment (`maybe/upscalers`). Interface first, though: a piece is painted only after its layout has been
tested in the game in flat values with the real content (the review of 2026-10-11).

## 4c. Gothic, not knotwork, and not grey
"Interlaced knotwork" is Celtic and Norse; it came from these prompts and read as Norse to the user. Gothic ornament is
tracery, trefoils and quatrefoils, crockets, finials, pinnacles, cusped arches, fleurons, diaper and blind arcading. And
the user's warning: "Be careful not everything just turns grey with the gothic stuff." Colour lives in the glass (many
coordinated colours, not one red), the marble, the gems and the paintings; keep the iron dark but never let a whole
piece go one grey.

## 5. Lay the real content over it
Make a mock page: the game's screen as the backdrop (`pnpm tsx scripts/art/hud-backdrop.ts <out.png> "?map&seed=3"`
renders a route at 1536×864 with its HTML interface hidden), the painted piece at its size, and the game's real text and portraits placed into the windows at the greybox coordinates. This is the test
that matters: everything has to land in its window, and read.

Fit content to the **painted** openings, not the greybox's: the paint moves edges by a few pixels, and its frames
have an inner lip. Measure each window on the painting (from its pixels where the edge is light against dark, by eye
on a fine grid where it isn't) and clip the content to the inner opening, so the lip frames it.

**Never draw a live value over a figure.** A health level or any fill drawn as a flat shape over a painted globe cuts
the figure holding it. Change only what the value lives in: a copy of the painting with only that part altered (the
drained glass, `scripts/art/hud_drain.py`), clipped to the level, so everything in front stays whole. Zoom into every
live part with its overlay on before calling a mock done.

## 6. Show it, record it
- A page in `shots/` with the greyboxes, every seed, the mocks and the prompt as sent; link it over Tailscale.
- `docs/design/hud-pieces.md`: what changed and what it showed, with the user's words when they react.
- Commit the greyboxes, the layout entry and the doc. Candidates stay in `art/candidates/` (gitignored).

## What failed (don't repeat)
- One painting for a whole screen; cutting a concept painting up as the asset.
- Long prompts carrying the layout in words; mood words; shared material lines (night one's grey).
- Krea-2's image to image alone above strength ~0.55; depth alone.
- The style-reference LoRA together with depth and values: it took the materials and broke the layout.
