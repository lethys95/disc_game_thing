# Infinity Engine family: HUD reference notes

Reference only, for the user and the design notes. Never feed these images to an image generator.

51 images in this folder. All were looked at. Descriptions say only what is in the images. Anything added from
memory is marked "(from memory, not in the screenshots)".

Sources: GOG and Steam store screenshots, IGDB, old-games.com, the IGN 2000 gallery, MobyGames CDN, moddb,
lparchive (IWD2 Let's Play), Bing image results. A few files carry a site watermark: `iwd1-inventory-2.jpg` (Sorcerer's
Place), `iwd2-area-map-1.jpg` (The King of Grabs). `iwd1-world-map-1.jpg` is the Polish release of Heart of Winter,
the IWD1 expansion. `iwd1-hud-*` come from Heart of Winter too, which uses the same interface as IWD1.

Files by game:
- IWD1 (2000, 640x480 / 800x600): `iwd1-hud-1`, `iwd1-hud-dialog-1`, `iwd1-hud-container-1`, `iwd1-dialog-1`,
  `iwd1-inventory-1`, `iwd1-inventory-2`, `iwd1-record-1`, `iwd1-chargen-1`, `iwd1-chargen-2`,
  `iwd1-party-formation-1`, `iwd1-main-menu-1`, `iwd1-loading-1`, `iwd1-prologue-1`, `iwd1-area-map-1`,
  `iwd1-world-map-1`, `iwd1-options-1`
- IWD2 (2002, 800x600): `iwd2-hud-1`, `iwd2-hud-2`, `iwd2-dialog-1`, `iwd2-spellbook-1`, `iwd2-inventory-1`,
  `iwd2-record-1`, `iwd2-chargen-1`, `iwd2-main-menu-1`, `iwd2-prologue-1`, `iwd2-party-formation-1`,
  `iwd2-area-map-1`, `iwd2-world-map-1`
- BG1 / BG2 originals: `bg1-hud-1`, `bg1-inventory-1`, `bg1-item-description-1`, `bg1-world-map-1`, `bg1-main-menu-1`,
  `bg2-hud-1`, `bg2-record-1`, `bg2-world-map-1`
- Enhanced Editions: `bg1ee-inventory-1`, `iwdee-hud-dialog-1`, `pstee-main-menu-1`, `pstee-inventory-1`,
  `pstee-dialog-1`
- PST original: `pst-radial-menu-1`, `pst-record-1`
- Heirs: `poe1-hud-1`, `poe1-inventory-1`, `poe1-stronghold-1`, `poe2-hud-1`, `poe2-inventory-1`,
  `pfkm-inventory-1` (Kingmaker), `wotr-hud-1`, `wotr-global-map-1` (Wrath of the Righteous)

---

## Icewind Dale (2000)

### IWD1 — the bottom bar is a chunk of wall with roots grown over it
- Image: `iwd1-hud-1.png` (bottom ~18% of the screen); also `iwd1-hud-container-1.png`, `iwd1-dialog-1.jpg`.
- What's there: the strip under the game view is not a border but a painted section of dark, damp stone with gnarled
  roots or branches crawling across it, lit dimly from above. Into that wall are set: a long black recessed slot (the
  log) with a gold double-spindle scroll knob at its right end, a row of 9 square wooden-framed action buttons (shield,
  talking head, sword, crossed weapons, five formation-pip buttons), and at the far right two small framed buttons
  (a lantern, a pointing hand) above a wide button with a carved closed eye. The roots run behind and between the
  buttons, so the buttons look set *into* a growing wall.
- What works: the frame has depth and a story (the dale is overgrown and cold); it is one illustration, not a tiled
  border, so nothing repeats. The buttons are a different material (warm wood) from the wall (cold stone), which makes
  them read as the touchable parts.
- What doesn't: at 640x480 the roots turn to mud; in a busy fight the wall and the log blur together.
- Idea for disc: battle screen. Make the ability-bar housing a single painted piece per faction rather than a repeated
  border: a Sylvan housing where root and rot actually wrap the ability sockets; a Jilliath housing that is a carved
  altar step; a Ral-Vitahl housing that is a cabinet of batteries. The sockets stay one shared material (the
  touchable layer); the housing carries the faction.

### IWD1 — the glass orb in the corner
- Image: `iwd1-hud-1.png` (bottom-left corner, ~1/8 of the bar's width); zoom shows it best.
- What's there: a round glass sphere, lit greenish-gold from inside, with small pale skull or bone shapes visible
  through the glass, sunk into the dark root-stone where the left column meets the bottom bar. (From memory, not in
  the screenshots: this is the game clock and the return-to-game button.)
- What works: it sits exactly on the structural joint of the two frame arms, so it reads as the keystone of the frame,
  not as a sticker. Its own light source makes it the brightest thing in the HUD; the eye finds it instantly.
- What doesn't: its function is unguessable without the manual.
- Idea for disc: overworld. Put the end-turn control on the joint where the turn bar meets a side panel, as the one
  object in the HUD that emits light (a reliquary lamp for Jilliath, a charged battery cell for Ral-Vitahl, a seed pod
  or fungal bloom for the Sylvan). The glow can dim as actions are spent, so the ornament carries state.

### IWD1 — the left button column: carved relief icons on planks
- Image: `iwd1-hud-1.png` (left column, ~7% of screen width).
- What's there: 9 square buttons stacked on dark riveted wooden planks. Each icon is an ivory or bone-coloured carved
  relief, not a flat glyph: a teal diamond gem at the top (the game's emblem, see the loading screen), then a cracked
  pattern, a quill on paper, a pile of armour, a bust, a book, a scroll, a ring-like shape, a hand. Each sits in its own
  shallow square recess.
- What works: icons are drawn as *objects* lit from the same direction as the frame, so they belong to the frame. The
  top button repeats the emblem, which ties the HUD to the menus and loading screen.
- What doesn't: the icons are all the same size and value; nothing tells you which ones matter most.
- Idea for disc: capitol tab rail. Instead of identical iron medallions with flat icons, carve each medallion's icon as
  a small relief object (a ledger, a bell, a key) in the same metal as the rim, lit with the same light as the panel.
  Keep the rims identical and let the reliefs differ.

### IWD1 — the portrait column
- Image: `iwd1-hud-1.png`, `iwd1-hud-container-1.png` (right column, ~7% of width, 6 portraits).
- What's there: six painted portraits stacked on a grey stone column, each with only a thin outline (bright green
  when selected), HP as small numbers ("33/33") in the top-left corner over the paint, round status icons in the
  bottom-left corner.
- What works: the portraits are the frame's only saturated colour, so they read first. The frame does not compete.
- What doesn't: the thin green line is a debug-looking overlay on top of a hand-painted frame; HP numbers on top of
  the paint are hard to read on light portraits.
- Idea for disc: warband panel. Let portrait framing be quiet and put the state (HP, status) in a carved strip
  *below* each portrait rather than over the painting.

### IWD1 — dialog and log text set on stone
- Image: `iwd1-hud-dialog-1.png` (dialog grows to ~1/3 of the screen), `iwd1-dialog-1.jpg`.
- What's there: the dialog panel's background is dressed grey masonry; text sits directly on the stone. Speaker name in
  orange-gold, numbered replies in red, chosen-colour white. A vertical brass rod with spindle finials is the scroll
  bar. In `iwd1-dialog-1` the stone is lighter and cracked, with the roots of the wall frame running along the bottom.
- What works: the text box is literally more of the same wall, so opening it does not add a new object to the scene;
  the brass rod is the one metal accent and it doubles as the scroll bar.
- What doesn't: masonry joints behind text cost legibility; light-grey text on mid-grey stone in places.
- Idea for disc: battle log. Make the log a recess cut into the battle frame (darkened, low-contrast stone so text stays
  readable) with one functional metal piece, a rod or chain, as its scroll control.

### IWD1 — the bottom bar changes per context, the frame stays
- Image: `iwd1-hud-container-1.png` (bottom bar).
- What's there: when a container is open, the action row is replaced by a loot strip on the same frame: a small
  painting of the corpse/container at the left, a 2x3 item grid, a backpack icon with weight ("64 lbs / 150 lbs"), a
  second item column, a heap of gold coins with "62724".
- What works: one housing, several contents. The player learns the frame once.
- Idea for disc: battle screen. The ability bar's housing could also host the unit card on hover, or the spell
  targeting prompt, instead of opening new floating panels.

### IWD1 — inventory: wooden boards pinned to a stone wall
- Image: `iwd1-inventory-1.png`, `iwd1-inventory-2.jpg` (full screen).
- What's there: the whole screen is a mottled stone wall. Every panel is a dark wooden board laid on it: a tall board
  behind the paper doll, short boards as headers ("QUICK WEAPONS", "QUIVER", "QUICK ITEMS", "GROUND"), a long plank
  for the character name and class. Slots are carved wooden squares; empty ones show a faint embossed ghost of what goes
  there (helmet, cloak, gloves, ring, boots). The title "INVENTORY" is on a board with a decorative capital "I".
- What works: two materials only (stone ground, wood panels), so dozens of panels never get noisy. Ghost icons in the
  slots replace labels.
- What doesn't: everything is a rectangle on a rectangle; there is no hero piece.
- Idea for disc: unit card and codex. Ghosted embossed silhouettes in empty slots (e.g. an empty ability slot showing
  a faint carved outline of its type) instead of text labels.

### IWD1 — AC shield and HP disc
- Image: `iwd1-inventory-1.png` (shield "-7", disc "141/141", right of centre), `iwd1-record-1.png` (bottom row).
- What's there: armour class lives in a small pointed heraldic shield plaque; hit points live in a round black disc
  with a light rim, current over max. They sit as a pair, never in a table.
- What works: shape means stat. You find the HP by shape before reading a number. BG1, BG2, BG1EE and PST all keep this
  pairing (see their entries), which shows how strong it is.
- Idea for disc: unit card. Give each core number its own silhouette (e.g. HP in a round seal, armour in a shield,
  initiative in an hourglass or a bell), carved in the card's material. That alone adds "more HUD elements, fewer
  copies".

### IWD1 — record screen: stat planks, portrait and parchment
- Image: `iwd1-record-1.png`.
- What's there: six attribute rows, each a wooden plank with the name right-aligned in white serif caps and the value
  in a separate small square box; a large portrait with a thin frame in the centre; under it three stacked labels
  (race, alignment, sex) on dark wood; at right a torn-edged parchment sheet pinned on the stone with the detail text.
- What works: the parchment is the one warm, light surface for long text, everything else stays dark. A changed value
  shows in yellow ("15").
- Idea for disc: codex. Long prose on one light surface (the marble plaques already do this), short facts on dark
  carved rows.

### IWD1 — character creation step rail
- Image: `iwd1-chargen-1.jpg`, `iwd1-chargen-2.jpg`.
- What's there: a left column of 10 dark wooden buttons (Gender, Race, Class, Alignment, Abilities, Skills, Appearance,
  Biography, Name), the current step lit warmer brown, unavailable steps dim; a big title plank in an uncial face with
  tall decorative capitals; content in a central plank-framed panel; portrait in a wooden frame at right;
  Import/Cancel/Accept below.
- What works: progress is shown by light, not by checkmarks.
- Idea for disc: new-game screen. A vertical step rail where the current step is lit and past steps are dimmer.

### IWD1 — party formation
- Image: `iwd1-party-formation-1.png`.
- What's there: six long wooden panels in a 2x3 grid, each with a small portrait in a thin gold frame at its right end,
  a header plank, a "MODIFY CHARACTERS" bar, and Exit / Done stacked in a corner box.
- What works: big, simple slots; portraits make the empty/filled state obvious.
- What doesn't: plain; the same panel six times.
- Idea for disc: warband setup or new game. A 3x3 version reads directly as the squad grid.

### IWD1 — main menu: one slab of stone
- Image: `iwd1-main-menu-1.jpg` (menu ~1/3 of the screen, right).
- What's there: the menu is a single irregular slab of mossy green-ochre stone with a chipped corner, standing over a
  rendered snowy tower. The buttons are raised rectangular stone blocks with bevelled edges; section headings
  ("GAME MODE", "BEGIN GAME") are white uncial letters set straight onto the slab. The disabled "JOIN GAME" block is
  flatter and darker. The logo "ICEWIND" is in pale greenish stone letterforms with "D·A·L·E" in teal between them.
- What works: buttons are *part of the slab* (same stone, raised), not panels laid on it. Disabled = less relief.
- Idea for disc: main menu. Carve the menu buttons out of the same block as the backing (raised relief), and show the
  disabled state by lowering the relief instead of greying the text.

### IWD1 — loading screen emblem
- Image: `iwd1-loading-1.png`.
- What's there: a diamond-shaped stone frame with rivets at the corners, rotated over a square stone tile; inside, a teal
  ice or glass field with a carved bronze leafless tree. The progress bar is a thin orange line in a dark wooden recess,
  ending in a small copy of the same emblem. "STARTING GAME" in small caps above.
- What works: one emblem reused at three scales (loading, the progress-bar end, the top button of the HUD column). The
  diamond also appears in the IWD2 logo. A motif tied to the game, not a generic ornament.
- Idea for disc: give each faction one emblem and reuse it at different scales: the capitol tab rail's top medallion,
  the end of the turn bar, the loading screen.

### IWD1 — prologue / chapter painting screen
- Image: `iwd1-prologue-1.jpg`.
- What's there: a full-width painting between a stone strip above and below; the title "PROLOGUE" on a wooden plank
  laid over the top strip; narration in a semi-transparent dark box with a thin light border over the lower right of
  the painting; Replay / Done as wooden buttons on the bottom strip.
- What works: the painting is the screen; the frame is only what is needed to hold a title and two buttons.
- Idea for disc: capitol screen and new-game intro. The city painting can be given the same treatment: stone above and
  below, title plank breaking into the top strip, facts in one translucent box over a quiet part of the painting.

### IWD1 / Heart of Winter — world map with framed-painting locations
- Image: `iwd1-world-map-1.jpg` (Polish release), `iwd1-area-map-1.jpg`.
- What's there: a painted bird's-eye landscape in a double frame (outer timber, inner stone blocks). Each location is a
  small framed painting (a thumbnail of the place) with its name under it; the party marker is a pair of crossed axes.
  Top-right: a carved stone globe on a pedestal in its own box with up/down arrows. The area map has the same globe
  button and a header plank.
- What works: locations shown as little paintings promise what is there; the globe as a 3D object is the "zoom out"
  button and needs no label.
- Idea for disc: overworld. Hovering a city or neutral group could show a tiny framed painting rather than a text
  tooltip; a physical object (a globe, an astrolabe, a reliquary) for the zoom or map-mode toggle.

### IWD1 — options: the HUD dims behind a modal
- Image: `iwd1-options-1.jpg`.
- What's there: long planks with right-aligned labels, small red-rimmed square checkboxes, sliders with a diamond handle
  running in a wooden groove. Behind the panel, the HUD and game view are darkened and desaturated rather than hidden.
- Idea for disc: menus. Desaturate and darken the HUD behind modals so the carved frame stays present but recedes.

---

## Icewind Dale II (2002)

### IWD2 — the statue that holds the orb
- Image: `iwd2-hud-1.png`, `iwd2-hud-2.png`, also visible on every IWD2 screen (bottom-right, ~8% of width, ~18% of
  height).
- What's there: a robed, bearded figure carved in the same pale grey stone as the frame, cradling a large stone sphere
  in his arms. He is cut off by the right and bottom screen edges; his robe merges into the frame. Behind him is a
  panel of teal and rust mosaic. He sits right next to the menu wheel (next entry). (From memory, not in the
  screenshots: I can't confirm whether the orb is clickable; it reads as a held object, not a button.)
- What works, and why it does not look bolted on:
  - same stone, same top-left light, same grime as the frame; no outline or drop shadow of its own;
  - he is *cropped by the frame*, so he reads as part of a larger carving that continues off-screen, not a figure
    placed on top;
  - he *holds something*: the sculpture has a job in the composition (it ends the HUD and anchors the wheel);
  - there is exactly one of him; nothing else in the HUD is a figure at that scale.
- Idea for disc: battle and overworld. An angel that is cropped by the screen edge, carved from the same stone as the
  panel, and holding a functional element: the end-turn bell or orb, the turn-order strip unrolled from her hands, or
  the battle log as a scroll she holds open. One per screen, at one scale, in the corner where two frame arms meet.

### IWD2 — the menu wheel
- Image: `iwd2-hud-1.png` (bottom-right, left of the statue, ~20% of width).
- What's there: an oval wheel divided into six wedge buttons carved in pale stone (scroll, a figure with a sword,
  book, crossed tools, quill on paper, a check-like mark), around a central polished steel boss with two smaller
  rivets on a horizontal bar. Around it: a pointing-hand button top-left, a carved closed eye top-right (rest), a small
  carved skull bottom-left, all set into mosaic.
- What works: six navigation buttons become one object with a centre, instead of a row of six copies. The wheel has
  the same pale stone as the statue, so the two read as one sculpture group.
- Idea for disc: overworld side panel or capitol. Group the medallion tab buttons into one carved wheel or rose window
  (fits the cathedral-tracery frame already in the kit): each lobe is a tab, the centre boss is the faction emblem.

### IWD2 — action bar of stone tablets
- Image: `iwd2-hud-1.png` (bottom bar, left of the portraits; zoom shows 8 buttons).
- What's there: eight square stone buttons, each a raised frame with a recessed square, the icon carved in pale gold
  (heraldic shield, sword, crossed weapons, five formation-pip patterns). The selected one has a thin red outline.
  Thin mosaic strips run above and below the row.
- What works: the buttons are the frame's own stone, just raised; the gold of the icons is the same gold as the stone
  highlights.
- What doesn't: the red selection outline is a flat overlay again.
- Idea for disc: battle ability bar. Show "selected" by changing the carving (pressed deeper, lit from inside), not by a
  coloured outline.

### IWD2 — mosaic as the binding material
- Image: every IWD2 image; clearest in `iwd2-dialog-1.png`, `iwd2-world-map-1.png`, `iwd2-chargen-1.png`.
- What's there: thin bands of broken-tile mosaic (teal, green, rust orange, set in grey grout) run along the seams
  between stone frames; larger rectangles of the same mosaic fill otherwise empty panels (the dialog's side columns,
  the world map's right column, the statue's backdrop).
- What works: one colour accent that runs through every screen makes the whole interface one family, and the seams
  between pieces become decoration instead of gaps. It is also the only colour in an otherwise grey kit, so it is
  cheap to recognise.
- What doesn't: the large filler panels in the dialog screen are visibly "space we had left over".
- Idea for disc: a faction "inlay" running along panel seams: Jilliath could have a thin band of stained glass or
  gilt inscription, Ral-Vitahl a thin band of glowing conduit or enamel, Sylvan a thin band of moss or lichen. The
  frame stays shared; the seam inlay switches with the faction.

### IWD2 — carved knotwork in empty grooves
- Image: `iwd2-spellbook-1.png`, `iwd2-area-map-1.jpg` (the empty bar above the log), `iwd2-inventory-1.png` (the ring
  around the paper doll), `iwd2-party-formation-1.jpg` (screen border).
- What's there: wherever there is nothing to show, IWD2 cuts a recessed groove and fills it with a repeating
  interlace knot in low relief, the same grey as the stone.
- What works: empty space is carved, not flat, so ornament is spread through the structure at low contrast instead
  of being concentrated in corners. Because it is low relief, it never competes with content.
- Idea for disc: in the black-stone frames, carve empty runs (between ability slots, under the turn bar) with a
  low-relief faction pattern (lettering for Jilliath, vine or rot for Sylvan, circuitry for Ral-Vitahl), very low
  contrast.

### IWD2 — the paper doll in a scrying well
- Image: `iwd2-inventory-1.png` (centre, ~40% of width); zoomed crop shows the detail.
- What's there: the character model stands inside a round, dark, convex glass disc, like a mirror or a well, ringed by
  a band of carved knotwork; the disc sits in a square stone frame with mosaic in the four corner spandrels. Around
  the square rim, the equipment slots are small carved squares with embossed ghost icons, separated by riveted metal
  balls. Below: weight "17 / 120 lb." in green on a dark slot.
- What works: the figure has a place with its own meaning (a scrying glass), not a rectangle. The circle-in-square is a
  strong, unique shape that appears nowhere else in the HUD.
- Idea for disc: unit card or codex. Show the unit model or portrait in a round reliquary window or a well (in-square
  or in-arch), different per faction: a monstrance for Jilliath, a battery jar for Ral-Vitahl, a hollow trunk for
  the Sylvan.

### IWD2 — statue plaques that hold AC and HP
- Image: `iwd2-inventory-1.png` (right column), `iwd2-record-1.png` (bottom centre); zoomed crop.
- What's there: two small half-length carved figures, hooded, each holding a shield against its chest: one with a
  chevron-like device (AC "15"), one with a cross (HP "11 / 11"). The number sits in a dark round niche directly below
  each figure. Both are framed in a stone niche with rivets at the corners.
- What works: this is sculpture that carries data. The figures are tiny and repeated only twice, and each holds a
  different emblem, so they read as two characters, not copies. This is the most direct answer in this family to
  "angels feel bolted on": the figure's pose exists to present the number.
- Idea for disc: unit card. Small carved angels (Jilliath) or other faction figures that hold the core numbers: one
  presenting the HP seal, one presenting the armour shield. Different emblem per figure, same carving.

### IWD2 — spell level column and memorisation grid
- Image: `iwd2-spellbook-1.png`.
- What's there: a narrow right-hand column headed "Spell Level" with nine oval stone cabochon buttons numbered 1–9 in
  white serif; the selected one has a yellow ellipse. The memorisation grid alternates round sockets (memorised spell
  slots, "1/1") with square sockets. Known spells are dark stone strips with an icon square and a centred name. A tab
  strip at the top ("Cleric", "Domain") with arrows.
- What works: round vs square sockets encode different things in one grid; the level column is a unique shape (ovals)
  that exists only here.
- Idea for disc: codex or spells. Ovals or roundels for tiers/ranks, squares for items, so the shape tells you what kind
  of slot it is.

### IWD2 — record tabs as lit eyes
- Image: `iwd2-record-1.png` (top right); zoomed crop.
- What's there: four horizontal almond-shaped sockets set in the stone, each with a small icon; the selected one
  glows yellow inside, like a lamp or an open eye.
- What works: "selected" is shown as light from inside the carving.
- Idea for disc: codex tabs or capitol tab rail. Selected tab = its socket lit from within (candle for Jilliath, arc
  glow for Ral-Vitahl, bioluminescence for the Sylvan).

### IWD2 — dialog frame
- Image: `iwd2-dialog-1.png` (lower half of the screen).
- What's there: dark slate text field, speaker name and replies in the IWD colours; a left column with the speaker's
  portrait in a small stone frame above two mosaic-filled panels; a right column with a gold-coin icon and "2556" above
  more mosaic; a gauntlet-like pointing-hand cursor.
- What doesn't: the side columns are padding filled with mosaic.
- Idea for disc: if a panel has spare columns, give them a job (party gold, the speaker, a faction emblem) or remove
  them; don't fill them.

### IWD2 — full-screen frame with carved corner blocks
- Image: `iwd2-chargen-1.png`, `iwd2-prologue-1.png`.
- What's there: four square corner blocks, each carved with a recessed double-rectangle motif edged in knotwork, joined
  by stone rails with mosaic strips. The title sits on a dark wood plaque between the top two blocks. Buttons are long
  stone-framed bars ("Biography", "Import", "Back", "Next", "Start Over"). Stat modifiers are green (+) and red (−).
- What works: the same corner blocks frame chargen and the prologue, so full-screen screens look like one set.
- Idea for disc: codex, new game, capitol. A shared set of four corner pieces for all full-screen pages; the hero
  sculpture lives on the in-game HUD only.

### IWD2 — party formation: the title plaque breaks the border
- Image: `iwd2-party-formation-1.jpg`.
- What's there: a thick border of knotwork bands frames the screen; the "Party Formation" title plaque sits on top of
  the border and interrupts it, overlapping both the border and the inner panel.
- What works: an element that crosses the seam between two pieces ties them together. A plaque inside a frame looks
  placed; a plaque that bridges the frame and the content looks built.
- Idea for disc: panel titles (warband, city, unit card) as plaques that overlap the frame edge rather than sitting
  inside it.

### IWD2 — main menu tablet
- Image: `iwd2-main-menu-1.png`.
- What's there: a narrow vertical stone tablet; headers ("Game Mode", "Begin Game") on rust-brown plaques, buttons on
  grey-green stone, groups separated by mosaic bands; disabled buttons lighter and washed out. The logo is "ICEWIND
  DALE" over a giant stone roman "II" with a diamond painted tile set in its middle (two figures), the diamond motif
  again.
- Idea for disc: main menu. Group menu items with the faction inlay band (see the mosaic entry) instead of gaps.

### IWD2 — map screens: sidebar with a stone sphere button
- Image: `iwd2-area-map-1.jpg`, `iwd2-world-map-1.png`.
- What's there: the map fills a stone frame with tall carved pilasters left and right (area map). A right sidebar
  holds a "World Map"/"Area Map" plaque, a large mosaic panel, and a polished stone sphere in a round socket as the
  map-switch button. World-map location names are plain white text on the painting.
- What works: the sphere is the same object language as the statue's orb, so the map toggle feels related to the HUD.
- Idea for disc: overworld. A single physical object for "switch view" that echoes the hero sculpture's held object.

---

## Baldur's Gate and Baldur's Gate II (originals)

### BG1 — blue-grey slate frame and the sun-and-moon medallion
- Image: `bg1-hud-1.jpg` (left column and bottom bar; medallion bottom-left).
- What's there: blue-grey veined slate with darker trim; left column of 8 buttons with silver-gilt icons; bottom-left a
  round medallion with a gold sun on one side and a blue moon on the other around a cross-hair centre. Bottom bar of
  shield-shaped action buttons (a quartered heraldic shield, a gold mask, a sword, a staff...). The text box has a gold
  double rule. (From memory, not in the screenshots: the medallion is the day/night clock.)
- What works: the time indicator is a heraldic object; the action buttons are shields, which fits a game about
  adventurers.
- Idea for disc: overworld turn bar. Show the turn or season as a turning dial or medallion rather than a number.

### BG1 — inventory with engraved rays
- Image: `bg1-inventory-1.jpg`.
- What's there: the paper doll stands on bare slate; thin engraved lines radiate from behind the figure out toward the
  equipment slots arranged around it. AC in a shield ("2"), HP in a spiked ring ("24/24"). Header "INVENTORY" in a
  blackletter-like face on a gold-ruled plaque.
- What works: the engraved rays connect the figure to its slots, so the layout has a centre and a reason.
- Idea for disc: unit card. Thin engraved lines from the portrait to the ability slots or stat seals.

### BG1 — item description on an unrolled scroll
- Image: `bg1-item-description-1.jpg`.
- What's there: a parchment scroll with wooden rolls top and bottom fills the screen; an ink sketch of the item at
  left; the text starts with a coloured illuminated drop capital ("B"); header "ITEM" on a slate plaque.
- What works: reading text gets its own material (parchment) and its own typography (drop capital).
- Idea for disc: codex entries. One scroll or vellum page per entry with an illuminated capital in the faction's colour
  and an ink sketch beside the text.

### BG1 — world map as drawn cartography
- Image: `bg1-world-map-1.jpg`.
- What's there: a hand-drawn map on tan parchment with small isometric building icons and handwritten-style labels; a
  slate header plaque; a gilt globe with a compass "N" in the top-right box.
- Idea for disc: a campaign or codex map page in drawn style, separate from the 3D overworld.

### BG1 — main menu slab over a treasure still-life
- Image: `bg1-main-menu-1.jpg`.
- What's there: a vertical slab of dark green-grey marble with the gold "Baldur's Gate" logo carved in, four
  rectangular buttons with thin rims, over a rendered still-life of coins, shields, helmets and books.
- Idea for disc: menus. A still-life of faction objects behind the menu slab (reliquaries, batteries, seeds) instead of
  a landscape.

### BG2 — the vine frame with gems at the joints
- Image: `bg2-record-1.jpg`, `bg2-world-map-1.jpg`; zoomed corner crop.
- What's there: a heavy frame of pale gnarled wood or bone-like stone, with dark vines and tendrils woven through it
  and curling scrollwork at the corners in an art-nouveau manner. Small pale teardrop gems (moonstone-like) are set
  where the tendrils cross the frame rails. Inner panels are dark with a gold edge. Buttons are pewter plates with
  silver icons. The header "RECORD" is a blue-gradient uncial on a dark band, with an ornamental bracket and gem at
  each end. AC shield with vertical stripes, HP in a spiked ring.
- What works: the ornament grows *through* the structure: vines pass under and over the rails, and gems sit exactly
  where pieces join, so the decoration explains the joints. Nothing is stuck on top.
- Idea for disc: the angels. Instead of a statue placed in a corner, let the angel's wings or drapery pass behind and
  in front of the frame rails at the corner joint, the way BG2's vines do; or set the faction gem exactly where rails
  meet. Sylvan: roots and rot growing through the frame at joints.

### BG2 — world map with two corner instruments
- Image: `bg2-world-map-1.jpg`.
- What's there: the same vine frame; at the top-left a compass-rose button, at the top-right a blue gem set in gold
  petals; between them a title band. The map is a bright painted city with regions outlined in colour.
- Idea for disc: overworld. Put two distinct instruments at the two top corners of the turn bar (one for map/zoom, one
  for menu) instead of identical buttons.

### BG2 — slim in-game frame
- Image: `bg2-hud-1.png`.
- What's there: a thin olive-brass frame, much slimmer than IWD's: a left column of pewter buttons, portraits on the
  right with only a green highlight, a single bottom row of action buttons, a two-line red log ("PAUSED").
- What works: the ornament budget is spent on the full-screen panels (record, map); the in-game frame stays thin to
  give the view room.
- Idea for disc: battle screen. Keep the frame around the grids slim; put the heavy carving where the eye rests (unit
  card, end turn).

---

## Enhanced Editions

### BG1EE — inventory as a floating window
- Image: `bg1ee-inventory-1.jpg` (1920x1080).
- What's there: the inventory is a window in the middle of the dimmed game view, with a thin gold border and blue
  marble side strips; labels in small-caps serif; the shield-and-disc stats are kept (gold-rim shield "0", spiked sun
  discs "54/54", "9", and a "4-7" damage disc); a stat text column has been added at the right.
- What changed: legibility and information went up (more stats, clean type). Lost: the full-screen environment; the
  panel is now a box floating in lots of dark space, and the painted wall is gone.
- Idea for disc: if panels must float, give them a ground (a plinth, a hanging chain, a lectern) so they are held by
  something, not hovering.

### IWDEE — dialog with the root wall gone
- Image: `iwdee-hud-dialog-1.jpg`.
- What's there: thin desaturated side columns remain; the root-wrapped bottom bar is gone. The dialog box floats over
  the game view as a dark stone-textured rectangle with a thin wood rim and the brass scroll rod. A cleaner, larger
  humanist serif; speaker name in blue small caps.
- What changed: far more game view, better text. Lost: the overgrown wall that gave IWD its identity; the frame became
  generic.

---

## Planescape: Torment

### PST — main menu as a machine
- Image: `pstee-main-menu-1.jpg`.
- What's there: concentric rings of brass and copper pipes, riveted plates and steel clamps around a central medallion
  with a spiky face sigil. The buttons are curved purple enamel bands that follow the rings ("NEW LIFE" at the top,
  "SELECT LIFE" and "RESUME LIFE" bent along the arc), held to the rings by the clamps. The logo plate above is riveted
  scrap metal.
- What works: the buttons are parts of the mechanism, clamped into it. Text follows the shape it sits on.
- Idea for disc: Ral-Vitahl menus or panels. Buttons as cells clamped into a battery rack or conduit ring, labels bent
  along the curve.

### PST — inventory wired by pipes
- Image: `pstee-inventory-1.jpg`.
- What's there: on a black ground, rusted pipes radiate like veins. Every slot is a riveted iron box; slots are joined
  by pipes with small valve wheels between them. The paper doll stands in an oval bronze cartouche with engraved
  patterns. AC in a round medallion ("AC 2"), HP in a round badge with a body silhouette ("33 / 33"); the name and class
  on a riveted plate; the copper-coin heap at top right.
- What works: the structure connects every element; nothing floats because everything is plumbed in.
- Idea for disc: Ral-Vitahl unit card or capitol. Ability or building slots joined by conduits, so the layout is a
  circuit; the angel's equivalent for Jilliath could be chains or inscribed bands joining the slots.

### PST — bottom bar and radial menu
- Image: `pst-radial-menu-1.jpg` (bottom ~17%, and the ring over the game view); zoomed crop.
- What's there: an olive riveted metal bar; at the left a half-disc with a sunburst over a dark spiky shape; portraits
  in frames with gradient health bars under them; four empty quick slots that look like eye or bone sockets with round
  nubs; three round coloured buttons (teal, red, green); at the right a quarter-wheel of menu buttons. The radial menu is
  a ring of icons around the character's portrait, drawn over the game view.
- What works: the radial menu is an amulet around the character, placed at the cursor, not in the frame.
- Idea for disc: battle screen. Abilities shown as a ring around the selected unit on the 3x3 grid, as an optional
  alternative to the ability bar.

### PST — record screen around a round portrait
- Image: `pst-record-1.jpg`.
- What's there: stat labels (STR, INT, WIS, DEX, CON, CHR) on curved metal tabs with their values in small boxes,
  arranged around a large circular portrait frame set in a ring of radiating rods. AC in a horned skull-helm ("-10"),
  HP in a gear-like ring ("643/643"). Buttons are purple enamel capsules. Detail text on stained parchment in a metal
  frame, with a rope as the scroll bar.
- Idea for disc: unit card. Stats placed around the portrait instead of in a list.

### PST — dialog box held by the machine
- Image: `pstee-dialog-1.jpg`.
- What's there: the dialog panel sits in a wide housing of curved metal arms and pipes that hug it from both sides,
  like a machine holding a slate. Names in blue and gold, replies in red, the coin heap with "13" in the corner.
- What works: the panel is gripped by the frame, not laid on it.
- Idea for disc: battle log or unit card, held by sculpted hands or wings at its two sides.

---

## Pillars of Eternity 1 and 2

### PoE1 — HUD islands around a brass clock
- Image: `poe1-hud-1.jpg`; zoomed crop of the centre.
- What's there: no frame around the view. Bottom centre: a round brass dial with a sun-moon window, flanked by two 3x2
  grids of dark wooden square buttons with cream line icons; party portraits bottom-left with a thin vertical green
  health bar at each portrait's left edge; an ability row above them; the combat log at the right in a dark framed
  panel with a spear-tipped brass scroll bar.
- What changed: the HUD is islands floating on the view. Lost: a single material identity; the islands are tasteful but
  could belong to any fantasy game.
- Idea for disc: the dial idea for the turn indicator; keep one central hero object even if the rest is islands.

### PoE1 — inventory: the figure in a Gothic arch
- Image: `poe1-inventory-1.jpg`.
- What's there: dark weathered planks; the paper doll stands in a cusped pointed-arch niche, a doorway that frames
  the figure. Stats are shaped badges: shields, a heart, crosshair rings. "Enchant" and "Crafting" are long plates with
  arrowhead ends.
- Idea for disc: unit card. A pointed-arch window for the portrait fits the cathedral-tracery language of the kit.

### PoE1 — stronghold page with an icon rail
- Image: `poe1-stronghold-1.jpg`.
- What's there: a cream parchment page in a heavy dark wood frame; at the bottom-right of the frame a carved relief
  panel with a face in it. Left rail: square icon tiles (scroll, banners, trebuchet, seal, three heads). Right column:
  coins "2217", a crown "2", a padlock "0". Each upgrade row: a framed thumbnail painting, title, description, a
  cost-and-days line, a red "Requires ..." line.
- What works: city management as a readable ledger; costs and requirements in fixed columns; small paintings per row.
- Idea for disc: capitol screen. Building rows with a tiny painting each, cost and requirement columns, and resources in
  a separate right-hand column of distinct objects (each resource its own shape).

### PoE2 — carved corner rosettes and a notched title
- Image: `poe2-inventory-1.png`.
- What's there: a floating window framed in reddish mahogany with a carved rope border; large carved floral rosettes at
  the four corners and two at the top centre, each about 5% of the screen width and overlapping the frame edge. The
  "INVENTORY" plaque sits in the notch between the two top-centre carvings. The paper doll stands in a tall dark panel
  with eye toggles above the slot columns.
- What works: the title sits *between* carvings, so the carvings frame the title and look intended.
- What doesn't: the corner rosettes are four identical copies; they read as applied, the same problem as the angels.
- Idea for disc: the counterexample. Identical corner sculptures look like stickers; if a corner piece repeats, make
  each copy different (pose, held object) or keep only one.

### PoE2 — HUD with clock controls
- Image: `poe2-hud-1.jpg`.
- What's there: the central dial now carries pause/play/speed buttons; a bar of ability icons in dark panels with teal
  resource counters ("8") and a fiery orange swirl resource; portraits bottom-left; log at right.
- Idea for disc: put the turn controls (end turn, auto, speed) on the one central object.

---

## Pathfinder: Kingmaker and Wrath of the Righteous

### Kingmaker — the interface as an illuminated book
- Image: `pfkm-inventory-1.jpg`.
- What's there: the full-screen menu is an open book: cream parchment pages, a dark leather cover edge visible around
  them, a tab rail of chapter names along the top (Inventory, Character, Spellbook, Journal, Encyclopedia, Map). Red
  drop capitals start headings ("A", "E", "S"). Around the "Equipment" panel, small red-and-blue marginal drawings: a
  dragon, a knight, a horseman, drawn into the page. Slots are tan squares with gold rims; the party portraits sit on a
  dark strip at the bottom edge of the book.
- What works: the marginalia are drawn in the same ink as the page and sit in the margins, so they decorate without
  being objects stuck on top. The book metaphor gives every screen one identity.
- Idea for disc: Jilliath codex or the whole codex. Inquisition ledgers with marginal angels drawn in the page's ink
  rather than sculpted angels placed on the frame.

### Wrath of the Righteous — parchment HUD and name plates
- Image: `wotr-hud-1.jpg`.
- What's there: bottom centre, a strip of six portraits with green vertical health bars; above it an ability bar on a
  parchment strip with numbered slots; bottom-left a grid of dark square icon buttons with a round gauge; bottom-right
  the log on parchment with tabs (All, Events, Combat, Dialogue). In the scene, name plates and an objective banner
  ("TAVERN DEFENSES 12/12") are parchment strips with red drop capitals.
- What works: the floating labels in the game view share the HUD's parchment, so view and HUD speak the same language.
- Idea for disc: battle screen. Damage numbers or unit name plates in the same material as the battle log.

### Wrath of the Righteous — global map with a celestial dial
- Image: `wotr-global-map-1.jpg`.
- What's there: a drawn chart on purple and ochre paper; location labels on small parchment strips with red drop
  capitals; a parchment top bar with morale ("Morale: high" and three shield pips), time and date, a purple "Skip Day"
  plaque. In the centre of the bar a big blue starry day-night disc overlaps it, with heraldic banners hanging below.
- What works: the dial breaks the bar's edge and hangs over the map, so the top bar has a centre and a hero piece.
- Idea for disc: overworld turn bar. A central disc that overlaps the bar (turn, season, faction banner hanging below)
  with end turn beside it.

---

## Patterns across the Infinity Engine family

### Same layout, different material
The layout barely changes across the original games: a column of navigation buttons on one side, portraits on the
other, a bottom strip with actions and the log, full-screen panels for inventory, record, spells, map. What changes
is the material, and that alone gives each game its identity.

- **Icewind Dale**: cold stone, damp roots, wood panels, one teal ice emblem. The frame is a painted wall with roots
  grown over it, a world object.
- **Icewind Dale II**: grey dressed stone, carved knotwork, teal and rust mosaic seams, and one hero sculpture group
  (statue plus wheel). The richest kit and the most unified: two materials and one inlay colour across every screen.
- **Baldur's Gate**: blue-grey slate and gold rules; parchment for reading and maps. Heraldic shapes (shield buttons,
  sun-and-moon medallion).
- **Baldur's Gate II**: pale gnarled frame with vines growing through it and gems at the joints; pewter buttons.
- **Planescape: Torment**: rusted pipes, rivets, purple enamel, bone sockets. Everything is plumbed together; the
  interface is a body or a machine.

### What the Enhanced Editions and the heirs changed, and what was lost
- EEs: widescreen meant panels became floating windows over a dimmed game view (`bg1ee-inventory-1`,
  `iwdee-hud-dialog-1`). Type got much better and more information is shown. Lost: the full-screen painted
  environment, the root wall of IWD, the sense that the screen is one carved object.
- Pillars: the frame dissolved into islands around a central brass clock. Tasteful and readable; the identity now lives
  in a few hero pieces (the dial, PoE2's carved rosettes) and much of it reads as generic fantasy.
- Pathfinder: identity came back through a metaphor (the illuminated book), with marginalia drawn into the page and
  parchment shared between HUD, name plates and map labels.

### How ornament becomes part of the structure instead of looking bolted on
1. **Sculpture with a job.** IWD2's statue holds an orb and ends the HUD; IWD2's two small figures each present a
   shield with a stat number. A figure that presents, holds or supports a functional element reads as built. A figure
   that only decorates a corner reads as a sticker.
2. **Cropped by the edge, merged into the frame.** The IWD2 statue is cut off by the screen and his robe becomes the
   frame. A figure that is fully visible with its own silhouette and its own shadow looks placed on top.
3. **Same material, same light.** The statue, the wheel, the action buttons and the frame are one stone, one grime, one
   top-left light. No outline, no separate drop shadow. Bolted-on usually means a different material, scale or light
   from the panel it sits on.
4. **Ornament at the joints.** BG2 sets gems exactly where rails meet and runs vines over and under the rails; IWD1
   sinks its orb into the corner where two frame arms join; IWD2 and PoE2 put title plaques across the seam between
   border and content. Decoration that explains a joint looks structural.
5. **Distributed low-relief ornament.** IWD2 carves empty grooves with knotwork and runs mosaic along every seam, at low
   contrast. Ornament is everywhere at a whisper, plus one loud hero piece, instead of loud corners on plain panels.
6. **Unique pieces versus copies.** On IWD2's main HUD there is one statue, one wheel, one action row, one portrait
   strip, one log, and each full screen adds its own unique piece (the scrying-well doll, the statue plaques, the
   spell-level cabochons, the eye tabs). Copies are used only for things that really are equal (slots, buttons in a
   row). PoE2's four identical corner rosettes are the counterexample: they look applied.
7. **Shape means function.** Shield = armour, round disc or spiked sun = HP, globe = map switch, closed eye = rest,
   oval = spell level, round socket vs square socket = different slot kinds. Giving each function its own silhouette
   is the natural route to "more HUD elements, fewer copies".
8. **Text treatment.** Long text gets a light warm surface (parchment, scroll with an illuminated capital); short labels
   go on dark wood or stone in white or gold serif caps; titles use an uncial or blackletter face with decorative
   capitals. Speaker names in a warm accent, choices in red. The EEs and heirs moved to cleaner humanist serifs, which
   read far better.
9. **Portrait frames stay quiet.** In every game the portraits carry the colour and the frame around them is minimal
   (a thin line, a small gold rim). State sits at the edge of the portrait, not across it, in the better versions.
10. **One family across screens.** IWD1 reuses its teal diamond emblem at three scales; IWD2 reuses the same four
    corner blocks on every full screen and the same mosaic everywhere. Screens differ in their hero piece; they share
    materials, corner pieces and the inlay colour.
11. **How the HUD meets the game view.** The originals use a hard edge (a carved lip or a dark recessed seam), and the
    HUD is clearly a wall around a window. The heirs drop the edge and float islands. A third way: the PST radial menu
    and the Pathfinder name plates put the HUD's material into the view itself.
