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
- **The user on round 1 (2026-10-09):** "Overall I think it worked very well, though yes, there's fixes needed in
  most places." The angel should hold the portrait, not the name plate, and the portrait mustn't sit on top of her;
  every angel's wings were cut off; reliquary 85-3's top left (a candle in the beam's arcade) and its dimmer light on
  the angel work best, while reliquary 65-2 has "a distinct 'Ai Look' in terms of lighting, and we generally need
  something darker"; the two signs at the top right are the weakest part; the log was cut off; the ridge of spikes on
  the sill adds noise; the targeting grids should fit inside the card; many arms came out strangely long. Painting the
  whole HUD at once is good for consistency but "probably has a consequence on quality" (upscalers: `maybe/upscalers`).
- **Why the wings were cut (the user asked):** the paint mask was the greybox silhouette itself, so the stele's straight
  sides sliced the wings the model painted wider. Fixed in `hud-paint.ts`: the structure keeps its exact edges, the
  sculpture gets room around it in the mask, and Photon's subject segmentation cuts it out along what was painted (the
  user's suggestion to use Photon). The greybox changed too: she holds the portrait at her chest, hands in front of its
  frame, wings whole and overhanging the stele; the plate in the stone below; text in recessed dark panels; no ridge;
  Resolve now and Auto-battle as a hanging hourglass and puppeteer's cross; smaller targeting grids; steles inset from
  the screen's edges. Round 2 compares two darker, candlelit lights. A first round-2 run with the old mask was stopped.
- **Round 2 (2026-10-09):** `shots/hud-paint-battle-2.html`, 16 paintings, the sculpture cut by Photon. The user's
  round-1 notes land: she holds the portrait, wings whole, dim and matte, a candle in the beam's arcade, hourglass and
  puppeteer's cross, the log whole, no ridge. 0.7 keeps the frame on the portrait; 0.8 drifts. Claude's pick: darker
  70-3 (candlelit 70-3 the alternative). Left to fix by inpainting (the user: "Idk if there's the option of
  inpainting to fix things too"): fake sockets on the sill, the lost round medallion, the weak cross, the hood clipped
  where the zone ended, the plate's alignment; the instruments' shapes become their own crisp pieces, out of the
  painting. Photon's PNG export corrupts some files at higher compression levels; the pipeline saves at level 1.
- **The user on round 2 (2026-10-09):** "the darkness on each angel is now and overreaction. If you see the original,
  it still had light, but there was contrast between dark and light. now its just dark grey. Also there are even more
  cuts now […] All in all I think the first round actually went better […] I take everything I said back. You did the
  studies, and I should just trust you. I'm giving you control." Claude's read: the darkness came from two darkening
  steps stacked for one note; the cuts were the card's greybox rectangle still standing behind the angel, where the
  painting put shadow (Photon's own cuts were clean), and the left wing running off the screen. Round 3 (Claude in
  control): round 1's light and source values, the angel standing on the stele's top with nothing behind her, the
  wings on screen, the small glyphs out of the painting. Then Claude picks, fixes by inpainting, cuts the pieces and
  installs them.
- **The user (2026-10-09, 22:34):** "I don't trust my own opinion to interject. So please just keep going for as long as
  you need, at most until 2am on this machine (as that is when the reset happens). I'll be going to bed anyway."
  Claude works the battle screen through on its own tonight: pick, 1440p repaint, inpainted fixes, the pieces cut
  and installed in the game, verified; the write-up for the morning in `docs/status.md` and on this story.
- **Steps 3 and 4 for the battle, done (2026-10-09, night; Claude in control):** round 3 (round 1's light; the angel on
  the stele's top) gave the pick, reliquary 75-3; repainted at 1440p, the sill's grille removed by inpainting, the
  log's stele grafted from seed 1, the pieces cut (Photon) into `assets/ui/battle/` and installed where they were
  painted. Verified (types, tests, playtests; 720p, 1080p, 1440p). Write-up for the user: `shots/hud-battle.html`.
  Next: the map and the Capitol the same way.
- **The map (2026-10-09, night):** built from the battle's pieces (beam, plaques, chains, the log's block as tablets);
  only its bell-bearer (End turn) and hanging book (Menu) painted, through a mask, in their light (`map-1`, reliquary
  75-2, repainted at 1440p, cut by Photon). Verified. Next: the Capitol and the other screens the same way.
- **The Capitol and the other full screens (2026-10-09, night):** the Capitol, the cities, the leader and the structure
  screens take the battle's beam as their header and its blocks as tablets; a city adds a rail down the right edge,
  painted into those pieces (`capitol-1`, reliquary 85-1, repainted at 1440p): a hooded angel on its capital carrying
  the beam on her wings, the tabs as four niches below her, the facts on plaques. The city painting is the window
  behind every tab. The old plaque, plate, medallion, angel corners and end caps retired. Next: the codex.
- **The codex as a book (2026-10-10, past midnight):** the accepted layout change, built: an open book on the carved
  wall (`codex-1`, reliquary 85-3, 1440p), the list on the left page and the entry on the right in ink, the kinds as
  plaques on the wall; the credits in the same book. The tracery frame retired. Next: the battle's last flat glyphs,
  the title, new game and menus.
- **The title, the new game and the menus (2026-10-10, past midnight):** the title's menu is one stele (`title-1`,
  reliquary 75-3, 1440p) with the name in gilt in its arch and the choices as plaques in its recess; the new game and
  the settings move onto the kit's pieces (light-rim tablets, plaques that light, gem-lamp toggles, iron sliders).
  Next: the battle's last flat glyphs, the saves on parchment, then the other factions' skins.
- **Documents, panels, moments and instruments (2026-10-10, ~00:50):** the rules slip and the explanations on the
  codex's parchment; every other panel on the light rim (the old filigree frame retired); the battle's and the game's
  end on one moment layout; the card's instruments and health seal as engraved silver emblems (`ui.ts`). Next: the
  moments' keystone, the saves on parchment, the new game's emblems and March, the codex's ribbons; the faction skins.
- **The moments' keystone and the saves (2026-10-10, ~01:00):** the keystone is the card's silver seal until each
  faction's emblem takes its place; saved games are parchment strips. Next: the new game's emblems and March, the
  codex's ribbons, the map's pennants; then the faction skins.
- **The user on night one (2026-10-10, morning):** the direction is reset. Their notes, in order:
  - "you have too many angels and too many tombstones. When I say gargoyle, then I think about a structure that is
    part of a larger whole."
  - The battle's angel is cut off again. "I think it's better if you let me do the cuts and the cleaning in the
    future. I'm fully capable of doing that and I have the eyes."
  - Important assets at an angle "defeats usability": the card's angel and the codex's book. "When you turn the angel
    like this […] all the content and text would realistically have to be turned as well. And if you do that, then it
    becomes unreadable." The book the same: "Anyone would point it out immediately." The title is "a tombstone and a
    set of buttons".
  - "too gray. I think we can do better." In battle the eye goes to the top-left candle, "the only point where there
    isn't anything […] everything else is just grey surfaces."
  - The battle's angel "isn't attached to the side".
  - "part of the reason why we're having this many problems, is that we're trying to generate the entire HUD as one
    image. I don't think that is how artists do it in practice."
  - "The log block needs help. It needs to be something else, it's just a grey stone."
  - "we have all this reference material […] but all we have in ours are just like. Grey bland surfaces. We need to
    more words, man." Back to the drawing board with the wording of each piece, and "question how we got to this
    uninspiring answer".
  - The Capitol's angel is cut off at the head, "and none of your probes caught it".
  - "we've gotten more creative, which is cool. But by and in large, it's become less readable."
  - The Capitol "saw the most improvements", but too many angels, the head cut, and the header beam "doesn't need to
    be in every screen". The overworld HUD "actually become worse […] It was more clean before, more readable".
    Neither is final; "the usual creative process in games just often scraps what was done and starts over if
    something didn't work."
