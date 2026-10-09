# The HUD kit: a system

Claude's system (2026-10-09), accepted by the user the same day: all eight choices at the end, with the faction motifs
extracted by Claude from each faction's themes (`provisional.md` #76). It is step 1 of the plan the user agreed to: the
system on paper, then a greybox in the game, then each screen painted as one picture, then the pieces cut from it.
Every decision names the principle it comes from (`hud-references.md`, "P" plus its number). The pieces it covers are
the ones in `reference_material/ui-inventory.md` (the letter-and-number ids).

The user's test for all of it: "are they actually hud elements? do they blend in? […] im NOT interested in a random
gargoyle", and after the angels: "they feel like they're boltes on, rather than actually part of it. also, i think we
can have even more hud elements, less copies of the same thing."

## The idea: architecture at the edges, the world in the window
Today each panel is a framed box floating over the scene, and sculpture is stuck on its corners. That is the floating
kit the research warns about: the version of Warcraft III that split its console into blocks read as generic and was
reverted (P15). Instead, each screen's interface is one piece of gothic architecture built around the view. Pillars
stand at the screen's edges and are cut off by them. A beam runs across the top and a sill across the bottom, and the
panels hang from them on clasps. The game is seen through the opening. Sculpture lives only where architecture puts
it: a keystone, a capital, a corbel, a niche, a column. Each figure does a job (P1, P2, P4).

Seven rules follow from that:
1. **Delete test.** Every sculpted piece must be a part the structure would miss: a post, an arch, a keystone, the
   thing that holds a control. If the frame still looks finished without it, it doesn't go in (P1).
2. **One loud piece per screen.** Each screen gets one hero piece, usually a figure with a job. Everything else is
   quiet carving at a whisper (P6, P13).
3. **Repeat the structure, never the carving.** Slots, niches and studs repeat. Figures, emblems and held objects
   never do. A mirrored pair is allowed only when it flanks one thing (P7).
4. **Shape means function.** Every kind of value has its own silhouette, so the eye finds it by shape before reading
   it. This is where "more HUD elements" comes from: new distinct pieces that each carry meaning, not more copies
   (P10, P11).
5. **One stone, one light.** Figures are carved from the material of the thing they belong to, lit from the same
   side, at the same detail, and they touch what they hold. That is why each screen is painted as one picture and cut
   up afterwards (P5).
6. **The machine never changes shape; it lights up.** Empty, locked, unavailable and selected are all states of the
   same piece, shown by light and binding, never by hiding (P12).
7. **Words wait under the right button.** The interface shows shapes, marks and numbers; what they mean is read by
   holding right-click on them, never in captions beside them (the user, 2026-10-09: captions on the instruments "will
   eventually come off as noise, and it's better that you can hold right click for an explanation").

## Materials and light
Each material always means one thing (P9). The world stays muted and the faction's mana colour is the one loud
colour, as the art direction already says.

| Material | Means | Used for |
|---|---|---|
| Black stone | mass | pillars, beams, sill, panel bodies, every figure and relief |
| Dark iron | joinery | clasps, bands, chains, rims, studs, sockets, rods |
| Pale marble | the game speaking | names and numbers: title plaques, name plates, fact plaques |
| Parchment (new; the user's call) | documents and voices | tooltips, rules text, prompts, the full battle log, the codex if it becomes a book |
| Light | state | lit means available, selected or ready; dark means not now. Warm candlelight is the interface's light. The faction's mana colour lights only magic and the faction's own inlay |
| Cloth and enamel | allegiance | the player's colour, only on banners, pennants, the bands under the turn order's faces and standee bases, never on stone |
| Paintings | the world | portraits, the city painting, tarot faces, ability icons. They carry the colour, so the chrome stays grey (Disciples II) |

## One language for states
| State | How it looks | Example |
|---|---|---|
| Hover | the rim catches more light | any button or socket |
| Selected | pressed deeper and lit from within; no outline, no halo (it replaces today's glow, A43) | the chosen ability, the open tab |
| Available | a faint warm light in the socket | a target that can be clicked |
| Unavailable | a dark socket; the carving sinks into the stone | an ability with no target |
| Locked | bound shut by the faction's binding: band, seal or growth | research not yet open |
| Empty | the faction's sigil carved where the content would be | an empty grid cell, an empty bag |
| Waiting for you | the piece's inlay glows | points to spend, a branch to choose |
| Danger | red light; a skull for death | a lethal preview |

## The families
The 140 entries of the inventory come down to these. "Swaps" marks the families that change with the faction of the
player at the screen.

| Family | What it is | Shape and material | Inventory | Swaps |
|---|---|---|---|---|
| Architecture | the members that anchor the HUD to the screen: edge pillars, the top beam, the bottom sill, the header beam | black stone with iron bands, cut off by the screen edges (P4) | A10, C1, D1, E1, E15; new pillars and sill | the silhouette of the beam's and sill's edge (P14, P15) |
| Frames | the edges of panels: one profile in two weights, a heavy tablet and a light rim | quiet moulding with carved runs; ornament only at corner blocks and joints (P8) | A1, A2, A3, B6, B7, B11, B13, B16, C4, C8, C12, C13, D3, D6, E2, E5, E6, E9, E10, E14, F3, F6, G1 | — |
| Joints | what joins two members | one small iron stud at every seam, carved corner blocks, terminals at the ends of beams; a thin inlay along each seam (Icewind Dale II's mosaic). Scrollbars are an iron rod with a sliding knob | A17, A36, C2, E12; new studs and inlay | the inlay |
| The cast | the few figures, each with a job (below) | carved from the stone of what they hold, overlapping its frame both ways (P2, P3) | replaces the angel corners; D3, C11, E2 | yes, all of it |
| Reliefs | low engravings cut into panel backgrounds and empty spaces | near-grisaille, at very low contrast (P13) | backgrounds of tablets; empty states such as E10's | the motif |
| Rows and nodes | everything listed | a carved strip: the name at the left, the facts in the middle, the inline action at the right carrying its price. Tree nodes are the same strip stood up as a small card, joined by iron rods | B13, C6, C9, E11, E13, E16, E19, F4, G3, G4, G5, G6 | — |
| Plaques | names and numbers | pale marble, three sizes: title plaque, name plate, fact plaque. Name plates cross the frame's edge (Icewind Dale II's plaque bridging the seam) | A11, A12, B1, C9, D3's name, E1, E15, F7 | — |
| Parchment | documents | warm pale sheets with torn or rolled edges; text dark on light | A35, C12, D15, B16; the full log; the codex if a book | — |
| Buttons | one object per role, not per size | the primary command is a held object, lit (below); secondary commands are stone slabs; inline actions are small slabs carrying their price; choices are plaques or tokens that light; toggles are gems that light; confirm and cancel inside documents are seals. Text fields are a recessed well; colours to pick are enamel discs | A4, A5, A6, A37, A38, A39, A40, A41, A42, B3, B8, B9, B15, C3, C5, C7, C11, D9, D10, D12, E19, F9, G7 | — |
| Sockets and slots | where things sit | iron-rimmed sockets cut into stone. Empty shows the carved sigil, unavailable a dark socket, locked the binding. Equipment slots show a faint carved ghost of what goes there (Icewind Dale). An ability row is its icon in a socket, then its text and grids | A32, B12, C13, D8, E7, E8, E17, E18, F8 | the sigil and the binding |
| Portrait frames | every face in the interface | the one place the frame changes shape (P14): an arch, a porthole, a niche. Icon, bust and card sizes. A frame follows the faction of the unit in it, not the player's, so a mixed turn order shows whose each face is (Disciples II's frames say who speaks) | A29, A30, B6, C6, D2, D16, E8, E13, F4, F7 | by the unit's faction |
| Instruments | values, each with its own shape (below) | carved and inlaid; the fill is light or liquid | A18–A24, D4, D17, D19; the round medallion, the turn keystone | the mana vessel |
| Markers | small signs | carved or cast: skull, crown, tier numeral, hotkey tag, charge bead, preview marks, now and next | A25–A28, A33, A34, D5, D18, D20 | — |
| Tabs | switching views | Capitol tabs become niches holding their tab's object (below); codex tabs become bookmarks if the codex is a book; other tab rows are plaques that light | A7, E3, F1, F2 | the held objects |
| Labels in the world | names floating over the map and the field | small pennants: the name on dark cloth, the owner's colour as a band, a skull or tier mark (Darkest Dungeon's estate map) | C15, C16 | — |
| Ground marks | selection and targets drawn on the ground | thin brackets in the HUD's own line style: candlelight for the acting unit, red for targets (Darkest Dungeon). The fog stays the map's own rendering | C17, C18, C19, C20, D21, D22 | — |
| Surfaces | fills | the carved wall behind full screens, the iron plate, the dark panel fill | A8, A9, B4 | — |
| Type | the faces | the display serif for names, titles and plaques; the sans for numbers and rules; the numbers that matter set large (Diablo 3). A third face for places and moments is the user's call | A14–A16, A44, B5, B10, B14, C10, D7, E20, F5, G2 | — |
| Moments | big events | one shared layout: the faction's emblem as its keystone, the title in the display face, seals as buttons | A13, C14, D11, D13 | the emblem |
| Cursor | new | a small object, not the system arrow (Disciples II's dagger) | — | maybe |
| Paintings | not chrome: made by the art pipeline and only framed here | portraits, ability icons, tarot faces, the city painting, the map's structures | A31, B2, D14, E4, C21 | — |

## The cast
Each screen has one figure, or one figure group, and each has a job. They take the place of the angel corners, which
retire. These are the slots and their jobs; each faction's figures are under the faction skins below.

| Figure | Screen | Job | Why it can't look bolted on |
|---|---|---|---|
| The end-turn figure | map | rises from the bottom edge at the centre, cut off by it, and holds up the End turn object, which glows while it's your move | it carries the screen's one call to action; delete it and End turn has nothing to stand on (P2, P4; Disciples II's figures bracing the wheel) |
| The niche figure | battle | forms the unit card's portrait niche: wings or arms make the arch, the head is its keystone, the hands hold the name plate | the niche is made of the figure; delete it and the portrait has no frame (P1, P3) |
| The column figure | Capitol, cities, leader and structure screens | stands at the top of the right-hand rail as its column and carries the header beam on its head and raised hands | it holds up the roof; delete it and the beam floats (P1; Vampire: Redemption's mourners as side posts) |
| Marginalia | codex, if it becomes a book | figures drawn in the page's own ink, in the margins | drawn into the surface, not set on it (Pathfinder) |

## The instruments
| Value | Shape | Notes |
|---|---|---|
| Health | a channel cut into the stone, filled with red | on the unit card the current number sits in a round seal at the channel's end, set large |
| Shield | a pale segmented band laid over the health channel | the Nexus automatons' pool |
| Armour | a heraldic shield with the number and the share it takes off | |
| Initiative and actions | an hourglass, with one small stud per action | |
| Ability power | a rayed disc | |
| Experience | a thin rail; its end lights when a branch is ready | |
| Movement | a row of small studs that light | today's ●●●○ |
| Spell charges | small cells that empty | Nexus casters only, so they can be battery cells |
| Ability uses | beads hanging under the socket that go dark when spent | today's "1/1" tag |
| Gold | a coin; a small heap where gold is the subject | |
| Mana | a vessel in the faction's colour | per faction (below) |
| Round (battle) | a medallion where the turn beam begins | the turn order grows out of it (Heroes V) |
| Turn (map) | the keystone at the centre of the top beam: turn number and whose move | the beam's two arms carry gold and mana on one side and movement on the other (Warcraft III's clock) |

## The screens
"Layout change" marks a change to where things are or what they do, beyond how they look. Each one is the user's
call; the look works without it.

**Battle.** Hero piece: the niche figure.
- *Composition (layout change):* the turn beam across the top and the sill along the bottom. The unit card rises from
  the sill's left end as a tall stele with the niche figure at its top. The ability sockets are cut into the sill's
  middle. The log moves into a shorter stele at its right end, a few lines deep, and the full history unrolls
  as a parchment scroll. The scene darkens toward the sill, and the sill's top edge is the faction's silhouette (P15).
- *Turn beam:* starts at the round medallion. The faces sit in small arched niches cut into the beam, each with a band
  of its side's colour in enamel beneath it, with no letters and no coloured tiles. The acting unit's niche is larger,
  right beside the medallion. Resolve now and Auto-battle hang from the beam's right end as chained plaques.
- *Sockets:* the icon fills the socket. A hotkey tag and the use beads hang beneath, and spell cost cells sit beside it.
  The overload toggle is a gem on the socket's rim. Hovering a socket shows its rules and targeting grids on a parchment
  slip right above the sill, replacing the browser tooltip (Darkest Dungeon II). Optional (layout change): abilities
  with no legal target stay as dark sockets instead of disappearing.
- *Card:* the instruments above in place of the stat table, the effects as tags, the divider rod, and one low relief in
  the card's black.
- *Field:* slim carved channels for the floating health bars, the preview marks, numbers in the display face, ground
  brackets instead of tile colours. A fallen standee turns to stone with a skull mark.
- *Tarot:* the held cards lie on the sill; a click fans them out; captions on parchment.

**Map.** Hero piece: the end-turn figure.
- *Composition (layout change):* pillars at the left and right edges, cut off by the screen, carry the warband and city
  tablets on clasps (Diablo II: Resurrected's stash pillars). The top beam spans between them with the turn keystone at
  its centre. The map runs down to the bottom edge, where the end-turn figure rises with End turn.
- *Tablets:* each title plate crosses the tablet's top edge. Warband selectors are tokens that light. Members are a
  portrait in the faction frame, a name plate, the health channel and the experience rail. The Leader tree button's
  inlay glows when points wait.
- *Hint line:* text on a dark fade above the end-turn figure, with no box.
- *Menu:* a chained plaque hanging from the beam.
- *Prompts:* the branch prompt is a document. Each branch shows the unit before and after joined by a forged arrow, and
  is chosen with a seal (Disciples II's upgrade scroll). The enemy peek is a light-rim slip.
- *Labels:* pennants. *Highlights:* the four hex kinds stay, in the palette above.

**Capitol, and the city, leader and structure screens.** Hero piece: the column figure.
- *Composition:* the header beam across the top, carried on the right by the rail, whose top is the column figure.
  The city painting fills the rest and has no frame of its own where it meets the beam and the rail. The interface's
  edge is the window (Disciples II).
- *Tabs:* below the column figure, the rail is an arcade of niches, one per tab, each holding its tab's object (the four
  emblems we have suggest them: a keep, crossed swords on a shield, a book with a quill, a crescent and star). The open
  tab's niche is lit. The fact plaques stay marble, below the niches.
- *Garrison:* the two squad grids face each other across one carved divider. Empty cells show the sigil. The fallen in
  the graveyard are stone portraits with a skull. Upgrades show before and after on a scroll with a seal.
- *Research:* the tree's connectors are iron rods. Locked branches are bound. The chosen branch is lit.
- *Leader and structures:* the same beam and tablets. Equipment slots show carved ghosts of what goes in them.

**Codex.** Hero piece: the book, if the user wants it.
- *Proposal (layout change):* an open book lying on the carved wall. The list is on the left page and the entry on the
  right. The shelves and tabs are ribbon bookmarks, entries open with an illuminated capital, and marginalia are drawn
  in the page's ink (Disciples II's spellbook, Pathfinder). Without the book, the codex keeps dark tablets with the same
  instruments as the battle card.

**Title, new game and menus.**
- *Title:* the menu is part of one carved object standing among the portrait parade, not a column of loose buttons
  (both Disciples II and Icewind Dale build their menus into one piece), and the game's name is inscribed. The greybox
  tries the object's shape.
- *New game:* each faction is picked by its own emblem object, which lights when chosen. Colour swatches become enamel
  discs and map size a row of objects. March is the screen's primary command, a held object like End turn. The longer
  idea, one shared painted foreground with only the faction's monument and light changing (Disciples II's race select),
  needs paintings and comes later.
- *Menus and settings:* a light-rim panel. Toggles are gem lamps, sliders an iron knob in a groove, the speed choice
  plaques, saves rows on parchment. The skirmish screen reuses all of these and comes last. The frame-rate readout (G8)
  stays a plain developer box.
- *Moments:* battle end and game end use the shared moment layout.

## Faction skins
The skin follows the player at the screen. Everything else is shared, so each faction is a small set of large pieces,
not a kit of small ones (P14):
- the cast, and the object the end-turn figure holds
- the seam inlay
- the relief motif
- the empty-slot sigil
- the mana vessel
- the locked-state binding
- the silhouette of the beam's and the sill's edge

The portrait frames are the exception: they follow the faction of the unit they hold. Screens outside a game (the title,
the codex, new game, credits) use the shared stone and iron with no faction skin, and the neutral tribes' faces get a
plain iron frame.

The user (2026-10-09): "I cannot write down every faction's motifs, no. They can be extracted from the themes of each
faction, presumably." Claude's extraction, from the faction pages and the user's own unit designs, provisional (#76).
The paintings in step 3 show them, and the user overrules any that miss.
- *Jilliath* (angels and their human followers; relic and wound; the user's black, white and red):
  - **cast:** hooded stone angels, female like every angel but the Avatar, humble rather than triumphant (the Seraph:
    hooded, closed off, praying)
  - **end turn:** a bell, rung to pass the turn
  - **portrait frame:** a lancet arch edged in red glass
  - **inlay:** stained glass in lead (the user's Shepherd)
  - **relief:** folded wings and bands of written decrees
  - **sigil:** the silver rose from the user's Templar shield, carved as a rose window
  - **vessel:** a reliquary vial of red
  - **binding:** a red wax seal over an iron band
  - **silhouette:** tracery pinnacles
- *Ral-Vitahl* (a haughty arcane noble house; inventors; opulent and immaculate, never worn; teal lightning):
  - **material:** polished black lacquer and silver in place of weathered stone
  - **cast:** elegant arcane automata in the house's livery. The house's servants carry; its nobles don't
  - **end turn:** a caged orb of teal lightning, an arc lamp
  - **portrait frame:** a silver oval, a cameo, with a small teal cell at its crown
  - **inlay:** a thin conduit of arc light
  - **relief:** engraved schematics: rings, coils, star charts
  - **sigil:** the house crest, a coil within a ring (a placeholder design)
  - **vessel:** a battery cell, glass between silver caps
  - **binding:** a clockwork dial lock
  - **silhouette:** slender spires and lightning rods
- *Sylvan* (wild, fierce, tribal, never noble; regrowth and decay; moss green with violet pulses):
  - **material:** dark bark and living wood, antler and bone bound with sinew, wet moss, fungus, autumn leaves
  - **cast:** grown effigies of briar and wood with carved tribal masks, uneven and asymmetric, grown rather than carved
  - **end turn:** a frame drum (the user's Grove music: "tribal, drums")
  - **portrait frame:** a ring of bent branches bound with sinew
  - **inlay:** moss and lichen, glowing violet with fungus in places
  - **relief:** tribal carvings of animals and spirals
  - **sigil:** a carved spiral knot
  - **vessel:** a sap gourd, green with a violet pulse
  - **binding:** thorny roots grown over
  - **silhouette:** roots, briars, antler tips and a few autumn leaves
  - Decay shows the way the world has it, in fungus and withered leaves, never as a frame split into a living half and
    a dead half: the user found the literal life-and-death tree too literal.

## What stays from today's kit
- **Stays** as a stand-in until the painted pieces replace it:
  - the stone slab buttons
  - the backdrop
  - the four tab emblems, as the niches' first objects
- **Retired:** the angel corners, the turn bar's end caps, the divider rod, the first marble plaque, the iron plate,
  the iron medallion and the tracery frame with its corner angels (gone with the battle, the map, the Capitol and the
  codex painted). Their figures came back with jobs. The filigree frame gives way to the painted pieces screen by
  screen.

## Decided (the user, 2026-10-09)
"I've read the document. I'm not a designer, so I'll be relying on your judgment a lot." All eight accepted:
1. The governing idea: architecture at the edges, the world in the window.
2. Parchment as a fourth material, for documents.
3. The layout changes:
   - the battle sill joining card, sockets and log, with the log shortened to a few lines and a scroll
   - the map's edge pillars and full-width beam
   - the codex as a book
   - unavailable abilities kept as dark sockets
4. Faction skins that follow the player at the screen, with the swap list above.
5. Each faction's motifs: extracted by Claude from the factions' themes, as above.
6. Health red everywhere, with allegiance carried by cloth and position.
7. A third typeface for places and moments (Claude picks it in the greybox; provisional #76).
8. Candlelight as the interface's light for selection and availability, with the mana colour kept for magic.

## Step 2, the greybox
**The battle (2026-10-09):** built in the game in flat values (`shots/greybox.html`): the beam with the round's
medallion and the face niches, the sill with the sockets and their hanging tags, the card stele with the niche
figure and the instruments, the log stele that unrolls, ground brackets, red health. Found while reviewing it and
changed: the figure read as a blob, then a bow tie, until the wings traced the arch; the card stele hid the back row
until it was capped near the old card's height; the sill went empty during the enemy's turn until it kept the next
unit's sockets. Known compromises: a wide squad's far-left back row can sit behind the card stele (camera framing,
later); the portrait window keeps a rim of its own until the painting makes the wings its rim.

**The user on it (2026-10-09):** "it looks great", with two remarks, both done: the card's subtitle ("Your · Tier 2 ·
Front left") "seems arbitrary", so the plate now carries it as marks (the side's enamel band, the tier's numeral at
the joint of portrait and plate, a crown for a leader) and the words moved under a held right-click; and the
instruments lost their captions for the same reason (rule 7). Every battle element that had a browser tooltip now
explains itself on a held right-click instead (the peek, now available on every screen).

## Steps 3 and 4: the battle painted and cut (2026-10-09)
**How a screen gets painted** (`scripts/art/hud-paint.ts`; modes `render`, `paint`, `composite`, `hires`, `fix`,
`graft`, `pieces`):
1. **Render** the greybox in layers: its stone and iron alone, the structure and the sculpture apart, the live
   content, the field.
2. **Paint** through a mask with Krea (masked image-to-image). The structure keeps its exact edges; the sculpture gets
   room around it to finish its own outline. Rendering the source darker overshot the light (round 2), so the source
   keeps the greybox's values.
3. **Composite** every probe into the real screen for judging. Photon's subject segmentation cuts the sculpture along
   what was painted.
4. **Hires:** repaint the pick at 1440p from its own upscale at a low strength. Detail is added and the composition
   stays.
5. **Fix:** repair single spots by inpainting just that spot.
6. **Graft:** where a repair won't take, take the piece from a sibling seed of the same probe (same prompt and light),
   upscaled and lightly repainted.
7. **Pieces:** cut the game's pieces into `assets/ui/<screen>/`, each placed in CSS where it was painted (28.8 of the
   painting's pixels are 1rem; across the screen, a position is a share of the 16:9 painting's width).

**Three rounds of probes** (`shots/hud-paint-battle-1.html`, `-2`, `-3`):
- *Round 1* compared materials. Reliquary won (85-3's light, which the user named). The user's notes: the angel
  should hold the portrait, not the name plate; the wings were cut off; the log was cut off; the spiky ridge was noise;
  the two signs were the weakest part; the light needed contrast.
- *Round 2* went too dark ("an overreaction […] now its just dark grey") and showed cuts: two darkening steps had been
  stacked for one note. The cuts came from the card's greybox rectangle still standing behind the angel, where the
  painting put shadow. The user then handed control to Claude ("I'm giving you control").
- *Round 3* went back to round 1's light and source values. The angel stands on the stele's top with nothing behind
  her, and the small glyphs stay out of the painting.

**The pick is reliquary 75-3.**
- A hooded angel stands on a stone stele, holding a gilded arched frame at her chest, with a marble plate below her.
- The pedestal's recessed panel holds the text, with candles at its foot.
- An arcade beam carries a medallion and a candle.
- The sill has a red glass seam.
- An iron hourglass and a marionette hang on chains.

It was repainted at 1440p, the sill's painted grille was removed by inpainting, and the log's stele was grafted from
seed 1.

**In the game:**
- *Turn order:* the beam itself. The acting unit's face is in the medallion, the next ones stand in the arcade's
  arches, and the round's numeral sits in the arch before the medallion.
- *Card:* the monument. The angel holds the portrait in her frame (it shows through the painting's opening). The plate
  names the unit, with the tier and the side's enamel line. The pedestal's panel holds the instruments and the
  abilities as tiles, whose rules wait under a held right-click.
- *Sockets:* each socket is the pedestal's recess frame, nine-sliced.
- *Log:* the grafted block, nine-sliced to a line's width.
- *Resolve now and Auto-battle:* the hanging hourglass and marionette.

**Left for the battle:**
- Placeholder faces show where units have no icon art yet.
- The field's brackets and health channels keep their greybox values.
- The log's unrolled scroll is the stretched block around parchment.

## The map (2026-10-09, night)
The map is built from the battle's pieces: the beam, the plaque and the chain, with the log's block as its tablets.
Only its two sculptures were painted, through a mask around them, in the light of those pieces:
- **The bell-bearer.** A hooded angel rises from the bottom edge, cut off by it, and holds up the bell that is End
  turn. It glows while the move is yours.
- **The book.** Menu is a book hanging from the beam.

The rest of the map's chrome:
- *The beam:* its medallion shows the turn, ringed in the colour of whoever moves, with marble plaques for the purse
  and the march.
- *The tablets:* the warband and the cities sit on blocks hung from the beam by chains. Their names are on plaques
  crossing their top edge, and the warband buttons are plaques that light.

## The Capitol and the other full screens (2026-10-09, night)
The Capitol, every city, a leader and a structure share one frame built from the battle's pieces: the beam is the
header, with the name and the purse on marble plaques, and the panels are tablets (the log's block with its edges
stretched and the recess's tone in the middle, so a wide tablet doesn't streak; the recess frame for the small rows).
Their names sit on plaques across the top edge, and each screen scrolls as one, so the plaques aren't clipped.

What a city adds was painted into those pieces:
- **The rail.** A pillar runs down the right edge from the beam to the bottom. On its capital stands the column
  figure, a hooded angel with her hands folded and candles at her feet; her wings and hood rise behind the beam, so
  the beam rests on her. Below her, the tabs are four niches in two rows, each holding its tab's emblem, lit when
  open. A tab the city lacks stays a dark niche. The facts are marble plaques on the pillar below.
- **The tier** is the beam's medallion, the city's one number.
- **The window.** The city painting fills everything left of the rail and under the beam, behind every tab, with no
  frame of its own. Behind a tab's tablets it is veiled, so the tablets read first.

The greybox asked for her arms raised under the beam. Every probe painted her with her hands folded instead, and
with the niches lower than drawn. The stylesheet follows the painting: the niches' buttons sit where the painting put
the niches.

## The codex as a book (2026-10-10, past midnight)
The layout change the user accepted, built: the codex is an open book lying on the carved wall, painted as one piece
(`codex-1`, reliquary 85-3, repainted at 1440p). The list is on the left page and the entry on the right, in ink on
the parchment, and each entry's name opens with a rubric capital. On the units shelf, a chapter line at the top of the
left page names the shelves, and the chosen one is in rubric and underlined. The four kinds of entry are marble
plaques on the wall above the book that light, with Back beside them. The text sits where the painting put the pages,
clear of the corner fittings and the slanting page edges. The credits are written in the same book, across both
pages, and the tracery frame and its corner angels retired with them.

Still to come for the book: ribbon bookmarks for the kinds and shelves, illuminated capitals, and marginalia in the
page's ink.

## The title and the new game (2026-10-10, past midnight)
- **The title's menu is one object:** a stone stele rising from the bottom edge in front of the parade, painted as
  one piece (`title-1`, reliquary 75-3, repainted at 1440p) and cut along its greybox outline. The game's name is
  inscribed in gilt in its arch. The choices are marble plaques set into its recess, and they light on hover.
- **The new game** moves onto the kit's pieces without new painting. The faction cards and the options are tablets
  with the light rim, so the cards, the options and March still fit one screen. The chosen card is lit and the
  others are dimmed. The screen's name is a plaque, and the choices are plaques that light. The faction emblems,
  the enamel discs and March as a held object are still to come.

- **Menus and settings** are a light-rim panel with the title on a plaque. Toggles are gem lamps that light with
  candlelight, sliders are an iron knob in a groove, and the speed choices are plaques that light.
- **The recess frame** lost a candle's glow from its lower left corner by cloning the stone beside it. A wide panel
  shows that corner at full size.

- **Documents on parchment:** a clean patch of the codex's page is the parchment the battle's rules slip and the
  held-right-click explanations are written on, in ink.
- **Every other panel** (the fork prompt, the grid's menu, the skirmish's panels) has the light rim. The old filigree
  frame retired.
- **The moments** (a battle's end, the game's end) share one layout on the tablet. A keystone sits on its top edge,
  the card's silver seal until each faction's emblem takes its place. The title is in the moment face, and the
  choices are plaques with a seal pressed at each one's start.
- **Saved games** are parchment strips in the menu, written in ink, with their choices in red ink.
- **Labels in the world** are pennants: the name in pale thread on dark cloth, the owner's colour as a band along the
  bottom, a swallowtail at the end.

- **The card's instruments** are engraved silver emblems, the Capitol tabs' metal: the shield (armour), the
  hourglass (initiative), the rayed disc (ability power), the sword (hits). The health's number sits on a silver seal
  with a dark centre.

**Next:** the new game's faction emblems and March as a held object, the codex's ribbons and capitals, then the
faction skins (each faction's emblem as the moments' keystone).

