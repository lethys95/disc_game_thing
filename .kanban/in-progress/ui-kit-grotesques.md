# A bigger, creative UI kit

- **What:** Grotesques built into the HUD (a stone angel carved into a corner), corner pieces, finials, keystones, faction variants (`docs/design/art.md`).
- **Why:** The current kit limits the design (the user, 2026-10-06).
- **Done when:** A kit the HUD and screens use throughout.
- **Who:** Claude generates when ComfyUI is free; the user judges.
- **The user again (2026-10-07), after the codex:** "We do need more UI elements though." ComfyUI is free again now.
- **Started (2026-10-09):** the user: "I'd like you to attempt to create more diversity in hud assets […] that
  requires less of me to find solutions." Claude's first batch: a stone angel and a horned grotesque carved into panel
  corners, a spire finial, a keystone, bar end caps, a divider, a cathedral-tracery frame for screens (so screens and
  the HUD stop sharing one frame). Generated with the existing kit's recipe, no new style words.
- **The user's test for it (2026-10-09):** "when you're done, i want you to review this work. are they actually hud
  elements? do they blend in? etc. because I'm interested in a random gargoyle somewhere. it'd be something that
  blends into a whole." Then: "im NOT interested in a random gargoyle". The pieces must belong to the panels they sit on, one whole, never an ornament stuck
  on top (the Capitol's gargoyle reads as a sticker, `docs/design/art.md`).
- **Built (2026-10-09), for the user to look at:** `shots/hud-kit.html` (before and after, Claude's review against
  the user's test). Kept: the angel corner as the side panels' whole frame (battle card and log, map warband and
  city), the tracery frame on the screens' large panels (codex, Capitol, leader, credits), end caps on the map's turn
  bar, a divider on the battle card. Rejected: the horned grotesque (it grips the frame: the random gargoyle), the
  keystone (brown, a third material; no arch), the finial (nothing to crown). The Capitol's gargoyle is removed.
- **Claude's own doubts, for the user:** the angel panels' plain bar sits next to the filigree frame that the
  ability tiles, turn bar and menus keep (two frame styles in one view; a plain frame cut from the angel image could
  unify them); the garrison tab carries 12 corner angels, where they start to read as a pattern.
- **The user's look (2026-10-09):** "I enjoy the angels, but there's a problem they feel like they're boltes on,
  rather than actually part of it. also, i think we can have even more hud elements, less copies of the same thing.
  i think you might need reference material." Next: "state of the art" research on old gothic-fantasy HUDs (Icewind
  Dale, Disciples 2 and 3, Diablo 2, 3 and 4, others in the style), screenshots in `reference_material/`
  (gitignored), every element written down with what works and why ("like... 50 or something at least"). "I'm not
  asking you to copy, but we need more ideas."
- **The research (2026-10-09):** about 220 screenshots and over 200 element entries in `reference_material/`
  (local; `index.html` shows each entry beside its picture). The lessons and 52 ideas by screen are in
  `docs/design/hud-references.md`. Why the angels read as bolted on: they hold nothing, sit clipped inside the
  rectangle, repeat as copies, sit on finished corners rather than joints, and don't share the frame's detail. Next:
  the user picks directions from the ideas; then a kit built on them (a figure with a job per panel, one hero piece
  per screen, shapes by function).
- **The inventory (2026-10-09, the user: "an inventory over everything we need to paint"):**
  `reference_material/ui-inventory.md`, every separate UI element in the game today by screen, with its states
  and how it's drawn now, style ignored.
- **The plan (agreed 2026-10-09):** the system on paper, then a greybox in the game, then each screen painted as one
  picture and the pieces cut from it, then the rollout. The user: "we're going to take as educated a decision to design
  what we've boxed out as possible."
- **Step 1, the system (2026-10-09):** `docs/design/hud-kit.md`. Architecture at the screen's edges with the world in
  the window; one figure with a job per screen in place of the angel corners; shape means function; one language for
  states; nineteen families covering all 140 inventory entries; what swaps per faction. Eight choices wait for the user
  at its end. Next: the battle screen's greybox.
- **The user on the system (2026-10-09):** "I'm not a designer, so I'll be relying on your judgment a lot." All eight
  choices accepted; the faction motifs left to Claude, extracted from the factions' themes (provisional #76). Step 2,
  the battle greybox, started.
- **Step 2, the battle greybox (2026-10-09):** built in the game, flat values (`shots/greybox.html`, before and
  after, states, sizes). The layout changes the user accepted are in: the sill joining card, sockets and log; the log a
  few lines that unroll; dark sockets for what can't be used now; red health; ground brackets instead of glowing
  tiles. Next: step 3, the battle painted as one picture over the greybox, a few style probes in Jilliath's skin.
- **The user on the greybox (2026-10-09):** "it looks great". Remarks done: the subtitle became marks on the plate
  (side band, tier numeral, crown), the instruments lost their captions, and explanations moved under a held
  right-click everywhere in battle (rule 7 of the system). Asked what "paint" means in step 3; explained, waiting for
  the go.
- **Step 3 started (2026-10-09, the user: "yes"):** `scripts/art/hud-paint.ts` shoots the battle greybox in layers
  (stone and iron alone, their mask, the live content, the field), repaints only the stone and iron through the mask
  (Krea, masked image-to-image), and lays each painting back between the field and the content. Probes: the user's
  own gothic line, plus two of Claude's to compare (soot-darkened cathedral stone, reliquary iron), at two
  strengths, three seeds each, with Jilliath's skin in the subject.
- **The probes (2026-10-09):** `shots/hud-paint-battle.html`, 18 paintings composited into the real screen. The
  method works: the greybox silhouette became a hooded stone angel whose wings arch around the portrait, one stone
  and one light with the stele. Strength 0.65 keeps the layout (0.85 moves the medallion, pales the stone, carves
  behind the text). Claude's picks: reliquary 65-2, cathedral 65-2, gothic 65-2. To fix before cutting: dark
  recessed panels behind text, no light glare, no moss, no fake sockets on the sill, the plate in front of the
  portrait. Waiting for the user's pick.
