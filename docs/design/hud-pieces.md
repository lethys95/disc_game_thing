# HUD pieces, one at a time

The plan after the reset (`hud-kit.md`'s note at the top). The user, 2026-10-10: "you don't actually get more very
often when you write 450 lines instead of 150. It gets like... Washed out. So if you try to capture the entire screen
with the HUD [...] you get these gray slabs I think. So we have to think modularity." And: "Do not assume you can use
the prompts we used before." After the first rounds: "Whatever we create should still fit within the art style, but be
very careful you don't think in ultimates here. It's not a bool, it's a gradient. We do need to still have a hud which
fits into the gothic fantasy vibe we're trying to set - BUT, we also don't want every single surface to just be
completely gray cold stone." And on angels: "I'm also not saying that we can't have AN angel somewhere, small inbuilt
into the hud [...] just not towering."

So every piece below is made on its own, from its own short prompt, and the screens are put together from the pieces
in CSS. The words come from `reference_material/elements.md`. `hud-kit.md` still holds the system (material roles,
the language for states, the instruments); this page is how it gets built.

## How HUDs get made elsewhere
The user asked for a look at how others go about it. The methods, and what each means for disc:
- **Layout first, in grey boxes; art last.** A designer's first pass is grey boxes that settle where things are and how
  the player moves between them, before any finished buttons ([Virtuall](https://virtuall.pro/blog/game-ui-design-38a85)).
  Diablo IV's UI team: "ease of interaction comes before visual polish", and "Visual polish is one of the last things
  we focus on" ([Blizzard, Feb 2020](https://news.blizzard.com/en-us/article/23308274/diablo-iv-quarterly-updatefebruary-2020)).
  *For disc:* the greybox exists and works; the map went back to it because it read better. Every piece below goes
  into a layout that already works without it.
- **Hierarchy by urgency.** What the player needs now gets the strongest contrast and the steadiest place, and
  low-frequency information gets quieter treatment. "Your health bar and primary action should win the hierarchy;
  cosmetic flourishes should lose it." Size, contrast and space are the levers: "a bright accent on a muted background
  draws focus", and "isolated elements feel more important than crowded ones"
  ([Generalist Programmer](https://generalistprogrammer.com/tutorials/game-ui-design-best-practices)).
  *For disc:* each screen below names what must win. Ornament is spent where the eye should go anyway (the acting
  unit's card, End turn) and the rest stays plain. That is the gradient the user means: not "no ornament" or
  "ornament everywhere", but more where it serves.
- **A visual target, then a style guide, then the kit.** Studios agree the look on one finished concept of a screen
  (the visual target), then write a short style guide of colours, type and layout rules, and only then make the real
  pieces ([Morphic](https://morphic.com/resources/how-to/design-a-game-ui-hud-mockup)).
  *For disc:* night one's mistake was to use the visual target as the asset. Here the target is made **from the
  kit's own pieces** (step 4 below), so what is agreed is what ships.
- **Pieces made one by one drift.** Made separately, they get "different lighting, different border thickness,
  different corner radius" ([SpriteCook](https://www.spritecook.ai/blog/generate-game-ui-with-ai)). Their answer is to
  paint the whole screen first and cut it up, which is what washed out here. *For disc:* the drift is held by a short
  shared technique line and one light direction in every prompt (not a shared material line: that was night one's
  grey), and by checking every pick against the others on one sheet at in-game size (step 3).
- **One small template, stretched.** A frame is made once and nine-sliced: "The four corners stay fixed, the four
  edges stretch in one direction, and the center stretches both ways"
  ([Wayline](https://www.wayline.io/learn/game-ui-art/3)). *For disc:* the frame, plate, button and parchment are
  made as nine-sliceable pieces and stretched in CSS (`border-image`), never painted at each size.
- **Atoms, molecules, organisms.** Brad Frost's atomic design builds interfaces from small parts (atoms) joined into
  groups (molecules, a name plate with its stud) and sections (organisms, the unit card), then templates and pages
  ([UXPin](https://www.uxpin.com/studio/blog/atomic-ui-components/)). *For disc:* the piece list below is the atoms;
  "How the screens are put together" is the organisms.
- **Fixed tokens.** One spacing scale and a small palette ("one or two accent colors, a couple neutrals, plus
  success/warning/danger") reused everywhere make "your HUD and menus instantly look like they belong together"
  (Generalist Programmer). *For disc:* the rem scale and the CSS colour tokens already exist; the accents below join
  them.
- **Diegetic or not.** Fagerholt and Lorentzon's four kinds: diegetic (in the world, the characters see it),
  non-diegetic (the classic HUD), spatial (in the 3D scene, not part of the story), meta (on the screen, of the story,
  like blood on the lens) ([Game Developer](https://www.gamedeveloper.com/design/user-interface-design-in-video-games)).
  *For disc:* the HUD is non-diegetic but made of objects that could exist in the world: a bell, a sealed letter, a
  candle. Its labels over the map and the field are spatial. That is how Disciples II does it too.

## The plan
1. **Style guide** (below, short): what each material means, the accents, the light, the technique line. Every prompt
   is written against it.
2. **The atoms**, in painted rounds of four. Claude judges every round, rewrites what fails and runs it again; the
   user isn't asked between rounds ("You don't need my accept of everything"). Each round's read is logged at the end
   of this page.
3. **The kit sheet.** The best candidate of every piece on one page, each at its in-game size, side by side
   (`shots/hud-pieces.html`, top). This is the drift check: a piece whose light, wear or colour doesn't sit with the
   others is made again. The user picks from it and cuts.
4. **The battle screen first, as the visual target.** It is the most seen and the hardest. Claude puts it together
   from the user's cuts in CSS, then tests it: the screenshot blurred (the squint test: does the eye land on the
   acting unit and its card?), at 720p for readability, against the greybox it replaces. It is iterated until it beats
   the greybox; then it is the target the other screens follow.
5. **The other screens**, reusing the same atoms: map, Capitol, menus, codex, title.
6. **Faction swaps last.** The pieces are Jilliath's while only Jilliath plays; the other factions get their own marks
   (portrait arch, empty mark, lock, mana vessel) after the look holds.
7. **Polish last:** hover and press states, the small animations.

Until a cut piece exists, its place stays the greybox's plain panel. Nothing goes into the game that is worse than
what it replaces.

## Style guide
**Material means role.** Each material always does one job, so the eye learns what it can touch (hud-kit P9):

| Material | Means | Pieces |
|---|---|---|
| Blackened cast iron | structure; you don't press it | frame, rail, socket rims, the arch |
| Cream veined marble | the game telling you a name or a fact | plate |
| Dark oak, brass rivets | something you press | button |
| Tan parchment | something to read | parchment, roller |
| Crimson wax | commit: confirm, cancel, locked | seal, sealed band |
| Glass, lit or dark | state: on or off, ready or not | lamp gem, rose window, candle |
| Bronze, leather, silver | an object with one job | bell, closed book, vial, coins |

**Accents.** Amber (studs, gems), crimson (wax, Jilliath's glass), brass (rivets, corners). The faction's mana colour
lights only magic. The paintings (portraits, the city, icons) carry the strongest colour.

**Gothic, by degree.** Iron, lancet arches, tracery, wax and bells keep the gothic fantasy. Warmth comes from wood,
parchment, brass and amber; no screen is all stone. Ornament is small and sits on joints and ends (hud-kit P8). One
small built-in angel is welcome where it does a job; a towering one isn't.

**Technique.** "Painted as game interface art." on every prompt: the painted round read best for plate, seal and
bell (the user: "r3 seems to be the best"), and the plain round's plates were "boring".

## How a piece is made
1. **One piece, one prompt, about 25–50 words.** It names the object, its form, its material, at most two accent
   colours, one phrase of finish (worn, tarnished, chipped) and one of ornament (cast scrolls, engraving). No mood
   words, no similes: name the thing itself.
2. **Content faces the player.** Anything that will carry text or a portrait is asked for "seen straight on" or "seen
   from directly above, square to the viewer".
3. **Frames are asked for empty**, their inside flat, so CSS can stretch them and the content goes in front.
4. **Plain background for the cut.** Dark pieces on white, light pieces (parchment, marble, wax) on black. The user
   does the cutting and the cleaning ("I'm fully capable of doing that and I have the eyes").
5. **Four seeds a round.** Claude judges and reruns; the kit sheet goes to the user.
6. **Hand-off:** the uncut candidates are in `art/candidates/ui/pieces/<piece>/`. A cut piece saved as
   `art/cut/ui/<piece>.png` is what Claude installs (`pnpm tsx scripts/art/hud-pieces.ts install`, as
   `assets/ui/pieces/<piece>.webp`, the CSS variable `--ui-pieces-<piece>`) and places in CSS.
7. **Figures, by degree.** A figure is small, does a job and is part of a structure (a corbel, a bracket), never a
   statue standing beside the HUD. The angel corbel below is the one so far.

The prompts live in `scripts/art/hud-pieces.ts` (one source); `shots/hud-pieces.html` shows each one as sent beside
its candidates.

## The pieces
Faction pieces are Jilliath's, from the provisional motifs (#76): red stained glass in lead, a crimson wax seal, the
silver rose, a reliquary vial of red, a bell for End turn. The shared pieces carry no faction.

### Shared structure
| # | Piece | Where it goes |
|---|---|---|
| 1 | plate | every name and fact: the unit card's name, the turn on the map, the Capitol's facts, the title menu's entries; nine-sliced |
| 2 | frame | the edge of every panel: the map's warband and city panels, the settings and save menus, the garrison; nine-sliced |
| 3 | button | the commands you press: End turn's label, Auto-battle, Resolve now, the menus' entries; nine-sliced |
| 4 | socket | an ability or item slot: the battle's ability row, equipment |
| 5 | rail | a thin bar along the top edge of the battle for the turn order, instead of a heavy beam |

### Documents
| # | Piece | Where it goes |
|---|---|---|
| 6 | parchment | everything you read: the right-click explanations, the battle log, the unit card's facts, the save slots, the codex's pages, the branch prompt |
| 7 | roller | the turned rod a sheet hangs from: the unit card and the log hang from one |
| 8 | seal | confirm and cancel inside documents (save, load, the branch prompt, quit) |
| 9 | ribbon | tabs: the codex's kinds, the Capitol's tabs |
| 10 | book | the codex and the credits, lying square |

### Objects with a job
| # | Piece | Where it goes |
|---|---|---|
| 11 | bell | End turn on the map (Jilliath's, #76) |
| 12 | closed book | Menu on the map and in battle |
| 13 | vial | mana beside the turn (Jilliath's vessel, #76) |
| 14 | coins | gold beside the turn |
| 15 | candle | the battle's round, its numeral beside it |
| 16 | lamp gem | a toggle in the settings: one piece, lit (on) or dark (off) in CSS, since a piece lights up rather than changes (hud-kit's states) |
| 21 | angel corbel | the small angel the user allows: under the map's turn plate, holding it up (Disciples II's two small atlantes at the wheel) |

### Faction marks (Jilliath)
| # | Piece | Where it goes |
|---|---|---|
| 17 | portrait arch | every Jilliath face: the unit card, the turn order, the warband panel, the codex |
| 18 | rose window | the empty mark: an empty grid cell, an empty socket |
| 19 | sealed band | locked: research not yet open |

### Paintings (not chrome, but made the same way)
| # | Piece | Where it goes |
|---|---|---|
| 20 | still life | the title screen: a place, not a panel (Arcanum's desk, Heroes III's mage guild); the menu's plates stand over its dark side |

## How the screens are put together
Each names what must win the screen (hierarchy by urgency), then how the pieces build it.
- **Battle.** Wins: the acting unit and its card, then the ability row, then the turn order. The turn order on the rail
  (5) along the top, each face in a small arch (17) with the side's colour as a band below, the round as the candle
  (15) with its numeral. The unit card is a parchment sheet (6) hanging from a roller (7), the portrait in its arch
  overlapping the sheet's top edge (Disciples II's unit card), the name on a plate (1). The sockets (4) in a row on the
  sill, the log a parchment strip on a roller.
- **Map.** Wins: the map itself, then End turn, then the selected warband. No beam. The turn on a small plate at the
  top centre on the angel corbel (21), gold (14) and mana (13) beside it, End turn the bell (11) at the bottom centre,
  Menu the closed book (12). The side panels in the frame (2), their names on plates.
- **Capitol.** Wins: the city painting and the open tab. No header beam: the name on a plate, the tabs as ribbons (9),
  the facts on plates, the garrison and research in framed panels.
- **Codex.** Wins: the page being read. The book (10) lying square, the kinds as ribbons (9) hanging from its top edge.
- **Title.** Wins: the game's name and New game. The still life (20), the menu on plates (1) or buttons (3).
- **Menus.** Wins: the choice being made. A framed panel (2), toggles as lamp gems (16), saves on parchment (6),
  confirm and cancel as seals (8).

## Order
The atoms most screens need come first, so one batch changes the most: plate, frame, button, parchment, then the
objects, then the faction marks, then the paintings. The battle screen is assembled first (plan, step 4).

**Cuts for the battle, in order** (the picks are on the kit sheet, `shots/hud-pieces.html`): parchment, roller,
plate, portrait arch, socket, rail, candle. Then the map's: frame, bell, closed book, coins, vial, angel corbel. Then
the menus' and the rest: button, seal, gem, ribbon, book, rose window, sealed band, still life. A frame, plate, button
or parchment is nine-sliced, so its cut keeps the whole piece; the slices are set in CSS.

## Test 1 (2026-10-10): plate, parchment, seal, bell
Sixteen candidates from the first short prompts. What it showed:
- **Colour and clean edges, yes.** Cream marble with amber studs, warm tan parchment, crimson wax, dark bronze: none of
  it grey, and each piece stands clear on its ground, square to the viewer.
- **But they read as studio photographs**: pristine marble like a bathroom tile, a plain modern hand bell. The prompts
  named object, form, material and colour, and left out two fields the catalogue has for every element: the
  **finish** (worn, chipped, tarnished, cracked) and the **ornament** (cast scrolls, engraving). Round 2 adds one
  phrase of each, still short.

## Round 2 (2026-10-10): finish and ornament added
The same four pieces, each with one phrase of finish and one of ornament, each made twice: as is (r2), and with
"Painted as game interface art." (r3). Both read as game interface now; the painted ones are more stylised, crackled
marble with rust-brown iron. **The user's read:** r3 best for plate, seal and bell; the plain r1 plates boring;
parchment no strong opinion. Painted is the technique from here on.

## Round 3 (2026-10-10): the other seventeen, painted
Every remaining piece once, painted (68 candidates). Claude's read:
- **Right the first time:** frame (blackened iron, brass rivets, amber studs at the corners), button (warm oak with
  riveted iron end bands), ribbon, the open book (flat and square, oxblood and brass), the closed book, the candle,
  the portrait arch (a lancet of iron with a band of red glass in lead), the rose window, the sealed band.
- **Made again:** the socket came out with a quatrefoil opening, so the prompt asks for a square one (an icon is
  square). The rail was a thin rod, too slight to carry the turn's faces: now a band "as tall as a hand". The roller
  read as a rolling pin: now a slim walnut rod with brass acorn finials. The vial's "fine engraving" became fake
  lettering: now a band of engraved leaves. The coins came stamped with letter shapes: now a small six-pointed star.
  The still life is warm and good, but busy across the whole width; the title's menu needs a bare dark side, so the
  objects now gather at the right.
- **Lit and unlit gems came out the same.** One gem now, lit or dark in CSS: the state language says a piece lights
  up rather than changes, so one picture is the right shape anyway.
- **The kit sheet** (the picks at in-game size, side by side): iron, brass, amber, oak, cream marble and crimson sit
  together. Two outliers: the sealed band's iron was greyer and more pitted than the frame's (now the frame's
  smooth blackened iron), and there was too much crimson (seal, ribbon, gem, rose window, arch glass, leather). Red
  means Jilliath and commit; the toggle gem moves to amber, the interface's candlelight.

## Round 4 (2026-10-10): the remakes, and the angel corbel
- **Fixed:** the plate's face asked "smooth and evenly pale with a few faint grey veins" and is calm enough to read
  text on now; the parchment asked "smooth and unfolded" lost its fold cross; the rail is a riveted band; the roller a
  slim walnut rod with brass acorns; the vial's lower cap carries engraved leaves.
- **The angel corbel:** a small angel's head and wings in pale limestone with gilded feathers, holding up a ledge.
  Small and built in, the way the user allowed one.
- **The socket still fails:** every candidate's opening is a shape (a cross, notches, a step). Asked next as a small
  square picture frame with a plain flat black square inside.

## Round 5 (2026-10-10): coins, gem, sealed band, still life
- **The gem in amber** reads as the interface's warm light and no longer competes with the crimson; picked.
- **The still life** now gathers its objects at the right, the left half of the table bare and dark for the menu;
  picked.
- **The coins' six-pointed star is out.** A star of David on a heap of gold coins carries an antisemitic trope; the
  coins are stamped with a small crown instead.
- **The sealed band's rivets came out as slotted screws**, too modern; asked as domed rivet heads.
- **The socket, asked as a small square picture frame,** came out square in all four; picked. Its oak backing is
  right by the style guide: an ability socket is pressed.
- **Round 6:** the coins with a crown and the band with domed rivets came out right; picked. Every piece has a
  pick now.

## The still life is withdrawn (2026-10-10, the user)
"what we're trying to create is a vibrant yet dark universe [...] epic conflicts between abstract factions [...] But
what we have on our front screen is a plain table. One side is completely empty which gives a view of imbalance. And
on the other, there are just 5 regular items [...] I don't know what any of these components mean or why they're
there". Right: its objects were the HUD's own inventory on a table, and its empty half was the menu's room showing
through. The chrome's rules (objects only, no mood) were applied to a painting, which needs a subject and a
composition from what the game is about. The title painting starts over from that, not from props.


**What the tool does with a bare scene (the user's probe, 2026-10-10):** seven prompts from "gothic fantasy epic game
start screen", each built on the last, no contents named (`shots/title-probe.html`; the lessons are in the
`krea-images` skill). The model composes on its own when it is left room; the first words fade as a prompt grows;
"layered values from a dark foreground to a luminous distance" gives depth and a focal point; "rival powers" with
three accents gives each side its colour. Left alone, "gothic fantasy epic" means armoured armies and a giant, so the
title painting needs disc's own subject; this only says how to ask for it.

## Gothic as elevations, and how others make interfaces with AI (2026-10-10)
The user: the paintings' architecture (spires, arches, stained glass, gargoyles, towers) is what they've tried to get
into the HUD, "at least in part, just hints of it. Somehow it just fails." And: "maybe we need to figure out how other
people create huds and interfaces with AI."

**Why it failed.** Architecture reads in a painting by silhouette against light, light through glass and repetition.
Carved into a flat panel, all three are lost, and the panel turns into a slab. The two pieces that did read gothic are
the ones that keep one of them: the portrait arch and the rose window, red light inside a dark shape.

**The elevation probe.** Four prompts asked as "a straight-on architectural elevation" (an architect's flat drawing
of a facade): a parapet strip, an arcade of five lancets, a pinnacle, a buttress with a gargoyle. All came out flat,
square to the viewer, unmistakably gothic, and warm sandstone with moss rather than grey. Uses: the parapet as the top
edge of a bar cut out against the scene (the scene through its tracery, grotesques where it ends), the arcade for the
turn order, the pinnacle as an end cap or post, the buttress with its gargoyle as a side post. Candidates in
`art/candidates/ui/elevation-probe/`.

**How others do it.** The common AI workflow makes one concept of the whole screen for agreement, then regenerates
each piece on a clean ground with that concept as a reference image, and never slices the concept itself (SpriteCook).
Others paint the interface over a real gameplay screenshot, keeping the scene (BudgetPixel), and keep a kit together
with style references (Ludo, Unity, Scenario). Night one sliced its concept; the pieces since have had no reference
tying them. Each was half of the workflow.

**What fits here.** Locally there are Krea-2 text-to-image, image-to-image and inpainting; no IP-Adapter, ControlNet
or edit model (ComfyUI's Kontext, Qwen-Edit and Krea style-reference nodes call paid outside services: the user's
call). So: (1) inpaint the HUD region of a greybox screenshot, scene kept, as the concept in our own layout; (2) crop
each piece from the chosen concept onto a plain ground and image-to-image it at moderate strength, regenerating it
clean while it inherits the concept's light and stone; (3) the user cuts, CSS assembles, compared with the concept and
the greybox. The page: the "Gothic elevations" artifact.

## How the Disciples II map column is built (2026-10-10, from the user's screenshot)
The user, with the right-hand column of Disciples II's map: "there are in fact two angels right there in the lower
panel two, and it doesn't have to be huge or out of place. You can in fact bake them in that easily." The lesson is
how it is built, not its motifs; disc's column takes the structure and none of the carving.

**One object, full height.** It is a single column at the screen's right edge, about a fifth of the screen wide, cut
by the top and bottom of the screen. Everything the map screen needs is inside it. Nothing floats over the map.

**Stacked sections, joined.** Top to bottom: a cap with two round buttons; the minimap window (the tallest section,
about a quarter of the column); a fan with three round buttons; a row of two windows, a square portrait well and a
marble plaque; a thin marble name strip; the command wheel (the bottom third). Each section meets the next along a
thin horizontal band, and every band ends in a small amber diamond stud at each corner. The studs are the column's one
repeated warm colour, and they make the seams look deliberate.

**Content and machine alternate.** Window (minimap), machine (fan of buttons), window (portrait and plaque), machine
(the wheel). The eye gets rest between the clusters of buttons.

**Hierarchy by value, not by size or colour.** The chrome is all one dark, low-contrast iron. The only light things are
what the player reads or presses: the minimap's colours, the marble plaques, the ivory faces of the buttons that are
available, the green orb at the wheel's centre and the amber studs. Squint and only those remain. That is why it reads
although it is covered in ornament.

**Ornament is texture, behind.** The ribbed fans radiating behind each cluster of buttons are dark on dark. They fill
the space between functional parts and never compete with them. They are what reads gothic: vault ribs, a rose
window's spokes.

**The angels are relief in the negative space.** The two figures at the wheel are carved in the column's own dark
material at the same low contrast, crouching left and right, their arms reaching up and over the wheel. The sockets
sit in front of them and the column's edges crop them. They are seen second, after the buttons. They fill the gap
around a round wheel inside a rectangular column. That is "baked in": same material, same value, behind the
functional parts, cropped, doing a job (holding the wheel).

**One button shape.** Every command is a round button in a deep socket. Available is an ivory face with a dark
engraved glyph; unavailable is a dark slate face. A small inset button sits on the minimap's frame edge, half on it.

**For disc's map, translated:** a right-hand column holding what now floats in four boxes: the turn and resources at
the top, a window for the selected warband (its leader's portrait, a name plate, the members), a fan of round sockets
for the map's commands, and at the bottom a round piece with End turn at its centre as the lit primary command. If
anything is carved as a figure, it is low relief in the negative space around that round piece, in the column's own
material. The motifs are disc's (#76), never the atlantes, the sunburst ribs or the green orb.

## Box out, then paint in: the map column (2026-10-10)
The user: "maybe trying to box things out like you suggested, and painting in like that, in the way you suggested,
is the way forward." So: a value greybox of a right-hand map column for disc, drawn in CSS over the map (the reading
above, translated: cap with the turn medallion, a resources row of two plates, the selected warband with the leader's
arched well, a name plate, a facts plate and an arcade of five member wells, a fan of three round sockets, the city
plate, and End turn as a lit round piece at the foot with two relief zones beside it). Its chrome is dark and low in
contrast; only plates, sockets and End turn are light.

**Krea-2, image to image from the greybox** (one ~110-word prompt naming the materials, two seeds, strengths 0.55,
0.70, 0.85; `art/candidates/ui/column-probe/`):
- At **0.55** the layout holds exactly, and the greybox becomes one painted iron column: tracery and vault ribs dark
  on dark behind the sockets, cream marble plates, amber studs at every joint, arched wells, and two angels in dark
  iron low relief holding up the amber disc of End turn. Laid over the map with the game's real text and portraits in
  its windows, everything lands where it should. The closest the HUD has come to the references.
- At **0.70** it is richer but drifts: plates merge, sockets appear, the member arcade turns into tracery, so the
  content no longer fits. At **0.85** the layout is gone.
- Lost even at 0.55: the small Menu socket in the cap (painted over as tracery). Missing by design: glyphs on the
  round buttons, which the game draws.

So the greybox, not the words, carries the layout, and the words only carry the materials: the opposite of night
one, where the words had to carry everything.

**Qwen-Image 2.1, editing the greybox** (downloaded 2026-10-10 with the user's go-ahead; 7B, the turbo weights at
8 steps, about ten seconds an image; the greybox as the image to edit and an instruction naming the materials):
the layout holds exactly, every socket included, at a richer finish than Krea's: one blackened iron column, tracery
dark on dark, cream marble plates, amber studs at the joints, and the two angels as small reliefs holding the End
turn disc. Given our own plate and frame picks as reference images, it takes on their rust and crackled marble: a
kit held together by references, as the guides describe. On the map with real content in its windows it reads as one
structure. Its licence is non-commercial only (question #14); Qwen-Image-Edit-2511 (Apache 2.0) gets the same test.
The page: `shots/column-probe.html`.

**Qwen-Image-Edit-2511 (Apache 2.0), the same test.** With its 8-step Lightning LoRA it came out glossy and speckled
with orange noise. At its documented 20 steps and guidance 4, without the LoRA (about 97 s an image), it is clean: the
layout holds, the angels are reliefs beside the End turn disc, and the iron leans warmer, bronze-tinted. A little more
rendered and glossier than Qwen-Image 2.1, which reads more painted. It is the model whose output can ship.

## The route: Krea-2 with depth control (2026-10-10)
The user dropped both Qwen models (2.1's licence is debt; Edit-2511's quality is poor) and pointed at two Krea-2
add-ons instead: a depth ControlNet (Patil/Krea-2-depth-controlnet with facok's `comfyui-krea2-controlnet` node) and
ostris's style-reference LoRA (with ostris's `ComfyUI-Krea2-Ostris-Edit` node), both under the Krea-2 community licence.
Claude read both nodes' code (torch and ComfyUI internals only, no network or shell) before installing them.
- **Depth alone** (the greybox drawn again as heights: wells far, plates and sockets near) paints the richest column
  yet but confuses what sits at the same height: name plates became wells, the member niches tracery.
- **Depth plus values** (painting starts from the value greybox at 0.7 while the depth holds the structure) keeps
  the plates. Naming "a row of five small arched portrait niches" in the prompt keeps the arcade. Seed 1 at depth 1.0
  keeps every part but the small Menu socket in the cap, which every Krea run loses (draw it bigger, or move it).
- **The style-reference LoRA** took our pieces' marble and faceted amber, but combined with depth and values it broke
  the layout. Set aside.

The method is now a generator: `scripts/art/hud-paint-in.ts <layout>`, with each layout's two greyboxes in
`art/greybox/<layout>/` (`values.html` and `depth.html` as sources; `values.png` and `depth.png` cropped to the column
and scaled to the paint size, 576×1664 for the map column). The graph is `paintIn` in `scripts/art/comfy.ts`.

**The user's read of the column trial (2026-10-10):** "A lot better [...] we might get somewhere with this." The best
run of all was Qwen-Image 2.1 "with our picks · seed 1", which can't be used (licence), so it is the look to aim Krea
at. The Krea runs have "too much lighting applied onto them". Squads are 3×3 grids, so the warband should show as a
3×3 grid, not a leader and five; the units shouldn't be squeezed into arches, "rather maybe it's possible doing some
stuff with stained glass around it" (Claude's options). And the angels should be adults.

**The 3×3 squad, two ways** (`art/greybox/map-column-window/`, `map-column-lattice/`; `hud-paint-in.ts`): a lancet
window (tracery glass in its head, a border of red and amber panes, nine squares below) and an iron lattice (a red
glass frieze, amber roundels at the crossings). Prompt changes, one each: "in soft even light without glare" for the
light, "two adult angels [...] tall robed figures with grown, solemn faces", the squad named as nine square panes. The
light calmed, the angels are adults, and the Menu socket survives at its bigger size. The model filled the nine
squares with stained glass rather than black: with portraits laid over them, an empty slot shows lit glass, which
reads as meant. Both hold their layout in all four seeds; the lattice's thin facts strip became a riveted bar.

**The angel and the succubus** (the user: the angels were "the most boring piece"; "maybe make them fawn or lay on
this gem [...] one of them be an angel, and the other a succubus so it seems like there's some duality to it"):
`art/greybox/map-column-duality/`, the window column with the foot's relief shapes redrawn (a kneeling mass leaning
in on the left, a reclining one over the top and down the right) and the poses named in the prompt. In all six seeds
the angel kneels with her cheek and hands against the gem and the succubus, horned, bat-winged and tailed, leans over
its top reaching down onto the glass; the layout above holds.

## The battle bar (2026-10-10, the `hud-paint-in` skill)
**The reference's structure** (Disciples II's battle bottom bar, `reference_material/elements.md`): one bar along the
bottom edge; the unit's portrait in a heavy ring at an end, its name plaque flowing toward the middle; the commands
clustered at the centre under a tracery arch; the chrome dark, the plaques and available buttons light, amber studs at
the seams. From `hud-references.md`'s battle ideas: the bar's two ends as two different figures with jobs (Total War),
the log as a few lines inset in the bar (Heroes III, Disciples II), the round counter as an object.

**Translated for disc** (none of the reference's ringed portraits at both ends, filigree or button cross): the acting
unit's card at the left (an arched portrait well, the name plate, a health channel, four stat plates, a strip for
effects and traits), the round as a medallion at the centre with Resolve now and Auto-battle beside it and the row of
up to seven ability sockets below, the log as an inset window at the right with the tarot slot beside it. The figures
are new, not the map's angel and succubus (repeat the structure, never the carving): at the left end a herald
presenting the unit's portrait, at the right end a scribe writing the log with a quill. The turn order along the top
is its own piece, later.

**The battle bar, first round** (6 seeds, `shots/battle-probe.html`): the layout holds in seeds 1, 2 and 6; in 3, 4
and 5 one ability socket turned into a marble plate. The chrome came out as tracery in blackened iron with amber studs
at the joints, the plates cream marble, the light calm. The herald and the scribe are small reliefs at the ends,
hooded and grown, the herald's hand raised toward the portrait, the scribe bent over the log with a quill. Laid over
the battle with a Seraph's card, six abilities and the log, everything lands in its window and reads.

**Worn and engraved** (the user: an imbalance in the lighting, "white on the left side, while it's dark on the right";
the monks "don't look like they're engraved into the metal frame itself [...] too perfect. They look like smoothed
stone [...] old worn metal engraved into the metal without highlights"): `battle-bar-worn`. The figures drawn barely
above the face in the depth greybox and in the face's own value, the prompt asking for shallow engraving, "old and
worn almost smooth, the same dark corroded iron as the frame, pitted and rusted at the edges, matte, with no polish
and no highlights"; the stat plates dark iron, a marble plate over the log. In all six seeds the figures became
engraved line work in the iron, flat and matte; each end carries one marble band. The lesson for the skill: **how far
a figure stands out of the depth greybox is how much of a statue it becomes.**

**The user on the worn round (2026-10-10):** "The others were better probably." The problem is what surrounds the
figures: in Disciples II's column "Very very few surfaces are just smooth and plain"; its art "is usually intricate
and dense", and its figures are "within the artwork itself" (the column's carved face, its two small angels). The
statues of Diablo II's and Path of Exile's health globes blend into the HUD: nothing about them says they belong
anywhere else. Icewind Dale's glass ball of turning skulls, shown while the game is paused, shows "how creative you
can be with something that truly is just a stopped clock". Health could be a globe, the classic of Diablo II and
Path of Exile, not a red overlay on the unit (Disciples II's way: "I don't think we should do that"). And the answers:
a unit's traits show when hovering an ability or right-clicking it; right-clicking a unit or its icon opens "a full
sheet over all stats including ability"; the camera may simply move to clear the bar.

**Dense, with a health globe** (`battle-bar-dense`): the bar's face drawn with a fine interlocking pattern in both
greyboxes (low contrast in values, a shallow relief in depth) so no surface is plain; the acting unit's health a
large glass globe at the left end, a robed figure carved in deep relief around it (back to round one's height); the
round as a small glass sphere at the centre holding a flame, disc's own stopped clock (a flame, not Icewind Dale's
skulls: candlelight is the interface's light); the card, sockets, log and scribe as before.

**Dense, first round:** the density worked (all six seeds carved knotwork and scrollwork over every surface) and the
flame sphere came out a candle under glass, but "a large round glass globe [...] dark and empty inside" became a clear
world globe on a stand, its figure a small monk behind it. **The globe again** (`battle-bar-globe`): "a large sphere
of deep red glass set straight into a heavy ornate iron rim, with no stand", and its figure kneeling at its left with
"one arm wrapped across the front of the sphere", the arm drawn raised in front of the globe in the depth greybox. In
all six seeds a hooded, winged figure kneels holding the red globe, and the layout holds. In the mock the game
darkens the globe from the top as health drops and writes the number on the glass.
