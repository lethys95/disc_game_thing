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
- **Back to the references (2026-10-10):** the user: "write down what you see, the actual elements […] it's
  descriptions we'll use to generate in the end anyway". `reference_material/elements.md` describes every element of
  the key screenshots by object, form, material, colour, finish, ornament and joinery, then traces how night one went
  grey (one "black iron and dark stone … desaturated" line in every prompt; "the chrome stays grey" misread from
  Disciples II's "neutral"; marble and parchment never named; "stele" asked for three times). Next: write each disc
  piece's prompt from that vocabulary, one piece at a time, for the user to read before anything is generated.
- **The user (2026-10-10):** "you don't actually get more very often when you write 450 lines instead of 150. It gets
  like... Washed out. So if you try to capture the entire screen with the HUD [...] you get these gray slabs I think.
  So we have to think modularity." "See if you can throw the tombstones away too. Do not assume you can use the
  prompts we used before. You don't even need the angels". Done the same day: the map back to its pre-kit HUD, the
  battle's monument and log block and the title's stele replaced by plain panels, the Capitol's angel masked, the
  codex a flat book, the paint script deleted. Next: `docs/design/hud-pieces.md`, a short prompt per piece.
- **Pieces, one by one (2026-10-10):** `docs/design/hud-pieces.md`, `scripts/art/hud-pieces.ts`, `shots/hud-pieces.html`.
  Test 1 (plate, parchment, seal, bell): colour and clean edges, but studio-photo pristine. Round 2 added a phrase of
  finish and of ornament to each, made both plain and "painted": both read as game interface. Waiting on the user:
  photographic or painted (questions #14), and a read of the other prompts; then the rest, and the user's cuts.
- **The user's read of round 2 (2026-10-10):** "We're not going to take that much of a granular process where you have
  to ask for everything." An angel is fine "small inbuilt into the hud [...] just not towering"; "be very careful you
  don't think in ultimates here. It's not a bool, it's a gradient." Gothic fantasy stays, but not every surface "gray
  cold stone". r3 (painted) best for plate, seal, bell; the r1 plates "boring". "Try to continue longer next time. You
  don't need my accept of everything." And: find how others build HUDs, "All we need is a coherent plan on how to make
  a proper implementation."
- **The plan (2026-10-10):** `docs/design/hud-pieces.md` now opens with how HUDs are made elsewhere (layout first,
  hierarchy by urgency, a visual target then a style guide then the kit, drift between pieces made one by one, nine
  slices, atomic design, tokens, diegesis), what each means here, and a seven-step plan: style guide, atoms in painted
  rounds judged by Claude, a kit sheet of the picks at in-game size against drift, the battle assembled first from the
  cuts as the visual target, then the other screens, faction swaps, polish. Painted is the default with one light (upper
  left); an angel corbel added under the map's turn plate. The battle's card and log are parchment on a roller in
  stand-in values meanwhile. All 17 remaining pieces generating, painted.
- **Every piece picked (2026-10-10):** six painted rounds, judged by Claude without stopping between them; each
  round's read in `hud-pieces.md`. 21 picks on the kit sheet (`shots/hud-pieces.html`, `shots/hud-kit-sheet.png`),
  including the small angel corbel. Waiting on the user's cuts, in the order in `hud-pieces.md` (the battle's first:
  parchment, roller, plate, portrait arch, socket, rail, candle); `hud-pieces.ts install` puts them in the game, then
  the battle is assembled from them as the visual target.
- **Box out, then paint in (2026-10-10):** the user, with Disciples II's map column: its two angels are "baked in", and
  "maybe trying to box things out like you suggested, and painting in [...] is the way forward." The column's
  structure read and translated (`hud-pieces.md`); a value greybox and a depth greybox of disc's own map column; Krea-2
  with the depth Control LoRA paints it with the layout held and the game's content fitting its windows
  (`shots/column-probe.html`, `scripts/art/hud-paint-in.ts`). Qwen-Image 2.1 and Edit-2511 tried and dropped by the
  user (licence debt; quality). Next: the column in the game, then the battle screen.
- **The column in the game (2026-10-10):** after the 3×3 squad window, adult angels, and the user's angel-and-succubus
  duality at the End turn gem ("this is near perfect"), and the `hud-paint-in` skill. The map's floating boxes are
  replaced by the painted column (`decisions.md`); `pnpm verify` passes, 720p to 1440p checked. Next: the battle.
- **Handover (2026-10-11):** in the game: the map column (hands repaired, a stray third arm painted out), the battle
  bar (the user's duel design; draining globes; wide-monitor extensions inpainted Warcraft III's way; "the battle
  field hud is good enough for now"), the Capitol column (round 2, seed 1). Next: the Capitol's tab panels, then the
  leader and structure screens. Everything in `docs/design/hud-pieces.md` and the `hud-paint-in` skill.

- **The Capitol's tabs (2026-10-11, the user: "go ahead"):** the garrison tab as one painted wall (`capitol-garrison`,
  seed 6; the effigy's hands and the windows' middle panes repaired by inpainting), research and spells in one frame
  (`capitol-tab-2`, seed 1, after round 1 read as a blank slab). In the game, verified at 720p to 1440p, 21:9 and 5:4.
  Write-up: `shots/capitol-tabs.html`; record in `docs/design/hud-pieces.md`. Next: the leader and structure screens.
- **The leader's and structures' screens (2026-10-11, the user: "Continue then."):** one warband column
  (`warband-column`, seed 3) for both, the content in the Capitol's tab frame; night one's beam is left only on the
  battle's turn order and the warbands' meeting. Write-up: `shots/warband-screens.html`. Next: the turn order.
- **The turn order (2026-10-11):** a strip hanging from the top's middle (`turn-strip`, seed 1, keyed out), the faces
  behind its openings; the warbands' meeting moved to the warband column; night one's beam deleted. Write-up:
  `shots/turn-order.html`. Next: the title and the menus.
- **The user's review of the day (2026-10-11)**, after "I'm not sure if i should go back and give you critique or if
  I should just continue to let you sprint". In their numbering:
  1. Capitol: "a lot of noise. The difference in quality between elements is very clear" (the wall blurred next to
     the column: the left painting is larger than the right; "I'd do segment upscaling"); "very difficult to see
     what's going on, and I'd argue some elements are just too much"; the cut between wall and column shows "the two
     images are not connected".
  2. The interlace bands: "more norse than gothic". 3. The tomb effigy: "a bit bizarre".
  4. Names as text in the garrison tiles are noise: "the images are enough", details on a held right-click.
  5. Portraits don't cover the tile; "This tile component should be the same one we're using in all of these grids
     [...] We need modularity"; changing dimensions between grids means noise.
  6. Cut the column's facts segment; why a seal as the exit button?
  7. The tab frame's top band: Norse again. 8. Research: a cutoff at the frame's edge. 9. Segments that "clearly
     don't fit together" (frame against column).
  10. Research tree nodes cram too much (tier, HP, hits, armor): hold right-click for the unit's card; Disciples II's
      unit cards as inspiration (in the reference material).
  11. The field's ring pattern: Norse. Idea: WoW-like specs, a background image per line/spec.
  12. The Avatar of Vengeance icon is cut off. 13. "Capitol research" sits on every research tab: General should be
      its own tab. 14. The tab buttons fuse with the background.
  15. The graveyard "seems more complicated than it needs to be". 16. The ivory order buttons need a hover change.
  17. The nodes panel reads as if the Capitol holds one gold mine; cities should have more nodes, upgradable in
      different ways.
  18. The map column flickers between turns (disappears briefly when the turn comes back).
  19. The turn strip: "better than it was before, and the game is more readable now. good".
  20. The bar's unit name: the tier doesn't belong in the title; the name is hard to read (font and colour).
  21. Unclear why some stat panels are lighter than others. 22. The knobs in the bar: "the right choice. Good job".
  23. More than seven abilities: arrows to flip through, shown only when needed.
  24. -37 over the head and -37 in the hint line is redundant; keep the one over the head.
  25. Healers default to healing when hovering allies but not when hovering themselves; and it isn't clear that
      hovering an ally switched to healing.
  26. The map's city box looks odd.
  Overall: "it's getting better", but drifting from the style in places, and "stumbling into one of the lessons [...]
  creating the designs around the UI that they had tested and knew worked. Here we've instead created the designs
  first, and then try to fit the UI into the design" (the Capitol's grids against the map column's; the user prefers
  the map column's). Stained glass: "I'm not really sure whether or not our audience would buy that what they're
  looking at is in fact stained glass [...] ours is like murky red", where real stained glass has "multiple colors in
  between segments in a coordinated way"; "we can absolutely use stained glass [...] But I do wonder if we couldn't
  do more with it".
- **The user on the plan (2026-10-11):** "Yes. Be careful not everything just turns grey with the gothic stuff. But
  otherwise give it a shot. I'd prepare yourself that this process of creating and then scrapping repeatedly is
  probably going to happen a lot, so I hope we'll learn something from it in each iteration." Order: components first
  (one squad tile, the unit card, the tree), screens greyboxed with real content for the user to judge, then paint
  (gothic ornament, not knotwork; many-coloured glass; matched density; designed joints). Alongside: the map column's
  window repainted in a few glass palettes for the user to pick.
- **The user (2026-10-11):** "I'm pretty confident in the boxout strategy we've learnt by the way, but maybe having a
  segment upscaling step after that is the next part in that chain." Box out, paint in, then segment upscaling.
- **The user (2026-10-11):** "what we're creating now, is basically the Jilliath HUD, right? Like if I'm sylvan, then
  looking at tainted glass and church stuff probably doesn't make too much sense. So we'll probably go through a lot of
  this again with other styles." Everything painted so far is Jilliath's skin; Ral-Vitahl and the Sylvan get their own
  full skins on the same layouts and components (`hud-kit.md`, "Faction skins"). Screens outside a game stay neutral.
- **Glass rests (2026-10-11, the user):** "this model is either just not good at creating stained glass, or we're
  prompting it fundamentally wrong. Either way [...] we should just stick to the original attempt we had and just let
  it rest for now [...] this might be us polishing, and maybe we're not at that stage right now anyway." The map
  column keeps its original glass. Kept for later: the exact glass mask (`art/masks/glass_mask.py`, the fix for the
  tear) and the colour reasoning (`hud-pieces.md`, "Colour in the glass"); `shots/glass-probe.html` has the rounds.
- **The UI pass by job, done (2026-10-11):** every screen greyboxed with the `greybox` skill: the Capitol, the
  leader's and structures' screens, the map column and battle bar (kept, labelled in the greybox setting), the title,
  new game, menu and settings, the skirmish and the codex. Pages: `shots/capitol-greybox.html`,
  `shots/warband-greybox.html`, `shots/front-greybox.html`. Waiting on the user's read; painting comes per faction
  skin after. Next on the board: the code review's findings 1–3 (`todo/code-review`), before any new unit.
- **Jilliath's Capitol painted on the judged layout (2026-10-11):** the column (`jilliath-capitol-column`: the flat
  screen's boxes, gothic blind tracery, a cathedral front carved low under the tabs, Back as a plate) and one panel
  frame used as a nine-slice border round every panel (`jilliath-frame`), both at the column's density.
  `docs/design/hud-pieces.md`, "Jilliath's Capitol on the judged layout".
- **Rejected (the user, 2026-10-11):** "way worse than what we had before [...] no soul or character", painted without
  the reference material. Reverted; the cause and the skill's new rule in `hud-pieces.md`.
- **Round 2 (2026-10-11):** the old painted Capitol's detail on the judged layout, the column first
  (`jilliath-capitol-column-2` seed 4: stained glass, the mason and the abbess holding Back to the map).
  `shots/jilliath-capitol-2.html`. Waiting on the user before the garrison.
- **Round 3 (2026-10-11), from the user's sketch:** round tab buttons on a rose window, a veiled saint reaching up,
  pinnacles, leaving as a round symbol button (`view/leave.ts`, every column); loose greyboxes.
  `shots/jilliath-capitol-3.html`. Waiting on the user.
- **Round 4 (2026-10-11), the angel** (the user's idea): a pale stone angel, wings spread, channelling the tab orbs;
  a diaper face. `shots/jilliath-capitol-4.html`. Waiting on the user.
- **The base (2026-10-11):** under the angel, a portal framing the leave button, a crocketed gable and corbel she
  stands on, pinnacles with flying buttresses (inpainted into round 4). `shots/jilliath-capitol-5.html`.
- **Two renditions with the door (2026-10-11):** the door is the way out (the user's find); (1) round 4 inpainted
  tighter, the pattern held at its scale; (2) painted whole with a corbel, gable, portal and two candles, in the game.
  `shots/jilliath-capitol-6.html`. The user picked (1): in the game, emblems centred and larger, no labels. Next:
  the panels left of the column in this style.
- **The garrison wall (2026-10-11):** lancet windows as the squad grids, stone knights, a crypt, the growth on a hung
  parchment; one round and a pane repair. `shots/jilliath-garrison.html`. Next: the graveyard in the crypt, then the
  research and spells frame.
- **In stone (2026-10-11):** the user: the diaper "looks like a fence actually, not like gothic architecture". Garrison
  and column now weathered masonry, iron only on frames (`shots/jilliath-garrison-2.html`). No overworld ambience in
  the Capitol.
- **Open (2026-10-11):** the garrison's plain masonry reads unthemed (it came from Claude's greybox and prompt, not
  inpainting); the user will sketch the garrison as they did the column (template `shots/garrison-sketch-template.png`).
  Wide screens done (the wall extended to the left for 21:9).
- **The garrison accepted with the style line (2026-10-11):** the user: "it's good enough like this now with the style
  changes"; units fitted to the painted panes; extended for 21:9.
