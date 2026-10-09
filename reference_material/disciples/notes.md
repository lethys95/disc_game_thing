# Disciples family: HUD reference notes

44 images in this folder. Disciples II (2002–2006) is the bulk; Sacred Lands (D1), Disciples III and Liberation are here for comparison. Sources: Steam and GOG store screenshots, myabandonware, MobyGames CDN, archive.org, alldisciples.ru, games.tiscali.cz (2001 previews), Epic store, d2ext.sklabs.ru. Some D2 shots are from the German or Russian versions; the layout is identical.

Everything below describes what is visible in the images. Anything from memory is marked "(from memory, not in the screenshots)".

Not found in usable form: the merchant (buy/sell) screen, the mage tower, the quest log, a loading screen, and the end-of-battle summary. `d2-carryover-items.png` looks like a shop but is the campaign "pick five items to carry into the next quest" screen.

Detail crops made from the screenshots: `d2-detail-map-panel-2x.png`, `d2-detail-command-wheel-atlantes-3x.png`, `d2-detail-battle-bottom-bar-2x.png`. Comparison sheets: `d2-race-select-all.jpg`, `d2-dialog-portrait-frames.jpg`, `d2-portrait-frames-compare.jpg`.

---

### Disciples II — the right-hand command column (adventure map)
- Image: `d2-map-hud.jpg` (right ~20% of the screen), enlarged in `d2-detail-map-panel-2x.png`.
- What's there: a full-height column of dark carved iron, about a fifth of the screen wide, built as a stack of compartments: (1) three round iron-rimmed buttons (quill, book, framed picture) sitting in an arched bracket; (2) the minimap in a black recessed well, with a small round crescent-moon button at its lower left; (3) a second arched bracket with three round buttons (spellbook, handshake, towers); (4) the selected leader's portrait next to a pale veined-marble plaque reading "Move: 55 / 65"; (5) a parchment name strip ("Argothorne"); (6) a small oval cartouche holding the day number ("29"); (7) the round command wheel (see the next entry); (8) one more round button at the foot. Every joint between compartments has a small amber/gold diamond stud.
- What works: it reads as one cast machine, not a set of boxes. The compartments share one material and one light direction (top-left), and the joins are covered by the same diamond studs everywhere, so the eye accepts every seam as made on purpose. Buttons are recessed into sockets, so they look set into the iron rather than placed on it.
- What doesn't: at 800x600 the button glyphs are tiny and some are unreadable. The column takes a lot of width away from the map.
- Idea for disc (overworld side panels): treat the warband panel as one vertical iron "reliquary" with fixed compartments (portrait well, movement plaque, name strip, day cartouche, command cluster) instead of floating cards. Put a single repeated join piece (a small stud or knot) at every seam so the seams look deliberate.

### Disciples II — the command wheel held by stone atlantes
- Image: `d2-detail-command-wheel-atlantes-3x.png` (from `d2-capital-undead.png`, lower right). Also visible in `d2-map-hud.jpg`, `d2-capital-*.jpg/png`.
- What's there: a round iron disc, about 20% of the column's height, carrying seven round button sockets in a ring around a green swirling glass orb. Two crouching nude stone figures, one on each side, reach their arms across the upper edge of the wheel as if bracing or carrying it. Behind them is a ribbed half-sunburst of iron. Unavailable buttons are not hidden: they show as empty dark iron sockets with no glyph.
- What works: this is the clearest case of a statue doing a structural job. The figures are cropped by the column's edges and the wheel overlaps their arms, so they can't be read as stickers. They are carved in the same grey stone tone as the rest of the frame. The empty sockets keep the machine's silhouette constant from screen to screen, and only the lit glyphs change.
- What doesn't: the figures are small and low-contrast, and many players probably never noticed them. That may be fine, since they are texture rather than signal.
- Idea for disc (battle ability bar / overworld end-turn): seat the ability bar or the end-turn medallion on a figure or pair of figures that hold it (an angel's hands cupped under a disc for Jilliath; for the Sylvan, roots that grip the disc). Abilities not available this turn should keep their socket, left dark and empty.

### Disciples II — top resource strip
- Image: `d2-map-hud.jpg` (top centre-right).
- What's there: a narrow pale parchment strip with ragged torn ends, docked against the top of the iron column. It holds six small icons with numbers: black, white, blue, red and green crystals (the mana types) and a stack of gold coins.
- What works: the resource bar is a different material from the iron column (paper, not metal), and it is small. It looks like a note tucked into the machine, which keeps it from competing with the map.
- What doesn't: the strip only spans part of the width and floats a little; its ragged edges are flat, with no shadow.
- Idea for disc (top turn bar): make the turn/resource bar a strip of a different material from the side panels, for example a vellum strip pinned under an iron clip at each end, so the bars don't all repeat the same iron frame.

### Disciples II — capital screen: painting plus the same column
- Image: `d2-capital-undead.png`, `d2-capital-empire.jpg`, `d2-capital-clans.jpg`, `d2-capital-legions.jpg`, `d2-capital-elves.png`.
- What's there: about 80% of the screen is a single painted view of the capital (a gothic necropolis with bone arches, a blue-roofed castle with a golden cross, a snowy fortress on crags, a red cavern of horns and towers, a giant autumn tree with houses in it). The right column is the same iron command column as on the map. In the Undead and Legions shots, the minimap compartment is replaced by a marble plaque naming the hovered building ("Cursed Cemetery", "Temple of Grief") with a small framed thumbnail of it.
- What works: the painting has no frame of its own. It runs straight into the iron column, so the column feels like the edge of a window onto the city. The compartments keep their positions, but their content changes with the context (minimap on the map, building info in the city), so the player never has to relearn the layout.
- What doesn't: the city screen is mostly a picture; the actual management happens elsewhere (city development screen).
- Idea for disc (capitol screen): keep the capitol painting unframed on the side where it meets the medallion rail, and let the rail be the window edge. Re-use one rail compartment as a hover readout (building name plus thumbnail) instead of adding a new popup.

### Disciples II — the capital painting grows with the city
- Image: `d2-capital-empire-early.jpg` (campaign start; source was a stretched widescreen capture, so proportions are off) and `d2-capital-empire.jpg` (built up).
- What's there: the same castle and sky. Early on there is one main tower with a single low wall. In the later shot, many more towers, a golden cross spire, a domed hall and extra roofs have been added around it.
- What works: progress is shown in the picture itself, not in a list. The painting is built from layers that switch on as buildings are bought (from memory, not in the screenshots: each building is a separate overlay sprite).
- Idea for disc (capitol screen): plan the capitol painting as a base plate plus building overlays. Buildings the player hasn't built could even show as scaffolding or chalk outlines.

### Disciples II — city development tree
- Image: `d2-city-development-undead.jpg`.
- What's there: on the left, five framed square building thumbnails on a dark painted nave of stone pillars, joined by thin iron girders that act as the tree's connecting lines. Unavailable buildings are washed solid red. Each thumbnail has a small parchment name tab underneath. On the right, a large iron frame holds a marble-texture panel ("City Development") with rich text, an upgrade preview picture, and red warning text. At its foot is a smaller version of the command wheel, with teal diamond crystals at the frame corners.
- What works: the connecting lines of the tech tree are drawn as physical struts, so the tree belongs to the architecture of the screen. The red wash for "can't build" is crude, but it reads instantly.
- What doesn't: the solid red overlay hides the building art completely.
- Idea for disc (capitol build tree): draw build-tree connectors as iron tie-rods or tracery mullions instead of lines. Show locked buildings darkened or veiled rather than painted over.

### Disciples II — building upgrade scroll
- Image: `d2-building-upgrade-scroll.jpg`.
- What's there: a parchment scroll with turned wooden rollers top and bottom, unrolled over the city development screen. A Greek-key border runs along the top and bottom edges. Inside: the building title, a small framed building picture, a description, and two unit portraits joined by a large iron arrow (archer turns into ranger).
- What works: "before → after" is shown with two portraits and one arrow, with almost no text. The popup is a physical scroll, so it doesn't need an iron frame.
- Idea for disc (capitol / unit upgrades): a promotion or upgrade preview as two portraits and a forged arrow on vellum.

### Disciples II — unit info card on a hanging rod
- Image: `d2-unit-info-undead.jpg`, comparison in `d2-portrait-frames-compare.jpg`.
- What's there: a tall parchment sheet hangs from a dark wooden curtain rod with iron finials at the top of the screen. Thorny wrought-iron vines run down both side edges. The portrait sits upper-left in its own frame, the stats are a two-column label/value list in black serif type on the right, and the name and flavour text sit below the portrait.
- What works: the sheet has a reason to be where it is: it hangs. The rod gives it weight and a top edge that the iron vines grow down from. The text is plain black serif on paper, so it is very readable.
- What doesn't: there are no icons in the stat list at all; it is a wall of labels.
- Idea for disc (unit card in battle / codex): hang the unit card from a rod or chain across the top of its panel, with the side ornament growing down from that rod, so the frame has a top that bears the load.

### Disciples II — faction-coded portrait frames
- Image: `d2-portrait-frames-compare.jpg`, `d2-dialog-portrait-frames.jpg`.
- What's there: the same parchment card layout, but the portrait frame changes with the unit's side: Lich (Undead) has a pale silver frame with a skull at the top, bone-like hooks at the corners and a pierced ornament at the bottom. Imperial Priest and Titan (Empire) have a dark iron frame with a lion head at the top. Berzerker (a possessed demon-line unit) has no frame at all: the portrait shows through a ragged burned hole in the parchment, edged dark red. The neutral Mermaid has a copper/bronze frame with a horned skull-and-wings crest. In the event dialogs, the speaker gets the same kind of frame: a skull frame for the Undead advisor, a frame of twisted roots and branches for the elf queen, a lion-head frame for Borbadas, and the copper crest frame for neutrals (an elf, a cyclops event).
- What works: one layout with many frames gives variety where the eye lands (the face) and keeps everything else steady. The frame tells you whose voice it is before you read a word. The burned hole is the boldest version: the frame is the absence of paper.
- Idea for disc (battle unit card, dialogs, codex): one portrait-frame family per faction. For example: Jilliath a gilded reliquary with a halo arch; Ral-Vitahl lacquered brass with a battery/coil crest; Sylvan a frame that is living wood on one side and rot on the other; neutrals plain iron. Enemy cards could use a burned or torn opening instead of a frame.

### Disciples II — event dialog: framed portrait over a parchment banner
- Image: `d2-dialog-portrait-frames.jpg` (five map dialogs plus one diplomacy scroll).
- What's there: a portrait in its faction frame stands on, and overlaps, the top edge of a wide parchment banner across the bottom of the map. The banner has iron thorn vines down both ends. The speaker's name and quoted text are centred in serif type. The dismiss button is a red wax seal at the lower right. In the Mountain Clans diplomacy message the whole thing is a scroll with wooden rollers, the portrait set into the paper, and a wax seal again.
- What works: the portrait frame breaks the parchment's top edge, so the two pieces lock together (overlap instead of side-by-side). The wax seal as the "OK" control is a control that is also an ornament.
- Idea for disc (event and story popups, new-game screen): let portraits overlap their text plaque's edge. Use a seal, signet or reliquary boss as the confirm button instead of a generic button.

### Disciples II — hire-a-leader scroll with wax seal buttons
- Image: `d2-hire-leader.jpg`.
- What's there: a long vertical parchment scroll down the centre of the screen. The bottom roller is a turned wooden rod with the gold total on it, and two red wax seals at its right end hold a check mark and an X. Five leader portraits are stacked in a thin iron film-strip column on the left of the scroll, with the stats beside them. Behind the scroll, the city screen's iron architecture shows: round porthole wells for the city art, marble plaques, a quatrefoil lattice.
- What works: confirm/cancel are the seals on the scroll, the gold readout sits on the roller, and the list frame is a strip. Every function is attached to the object it belongs to.
- Idea for disc (recruit / hire screens): put the price and the accept/decline controls physically on the recruitment document.

### Disciples II — city garrison sheet
- Image: `d2-city-garrison.png` (German).
- What's there: a large parchment sheet hanging from the same rod as the unit card. It shows two 2x3 grids of empty square slots with thin iron corner brackets (the visiting army on the left, the city defence on the right), with portraits dropped in. The slots without units are only drawn as corner marks, not full boxes.
- What works: empty squad slots are drawn as corner ticks, so an empty grid is light and calm, not a wall of boxes.
- Idea for disc (squad grids in battle and warband): draw empty 3x3 cells as corner brackets or faint inlay marks. Only occupied cells get a full frame.

### Disciples II — hero inventory: the paper doll is a statue
- Image: `d2-hero-inventory.jpg`.
- What's there: on the right, a full-height stone statue of a man stands in a misty cathedral nave. Around it, diamond-shaped lattice windows hold the equipped items (banner, orb, sword, boots, skull necklace). Below is a row of three square inventory slots with a quatrefoil lattice and up/down triangle buttons. On the left: a round leader portrait, the squad's portraits with HP plaques, and a marble plaque listing move, leadership and abilities with small item icons.
- What works: the body to dress is a sculpture in the same stone as the UI, so the equipment screen and the frame are one world. The diamond lattice slots echo the iron lattice used in other screens.
- Idea for disc (codex or warband leader view): show the leader as a statue in a niche with equipment or relics in tracery openings around it. It is the same statue language as the angels, but here the statue is the subject, not the ornament.

### Disciples II — battle: bottom duel bar
- Image: `d2-detail-battle-bottom-bar-2x.png` (from `d2-battle-1.png`), also `d2-battle-3.jpg`, `d2-battle-both-grids.jpg`.
- What's there: a bar about a quarter of the screen high. At each end is a large round portrait in a thick iron ring, the acting unit on the left and the target on the right. Each ring flows into a parchment plaque with name and HP ("Anti-Paladin HP 146/220"). Wrought-iron scrolls and thorns grow out of the rings along the top edge of the bar. In the centre, a gothic arch of tracery holds a five-button cluster (flag, shield, hourglass, crossed swords, crossed sword-and-shield). Small amber diamond studs again at the joins. Near the right portrait, two or three pale silver orb slots in diamond settings.
- What works: the bar is a symmetrical duel layout, me versus them, and the portraits are the biggest elements on the screen. The top edge is ragged with iron thorns, not a straight line, so the bar meets the 3D scene like overgrowth rather than a box.
- What doesn't: the portraits take a lot of space and repeat what the grid shows.
- Idea for disc (battle unit card and ability bar): a symmetrical duel strip, with the active unit at one end, the hovered target at the other, and the abilities in a central tracery arch. Make the top edge of the strip break into the scene with a few points (pinnacles, thorns, roots per faction).

### Disciples II — battle: squad grid panel
- Image: `d2-battle-1.png` (right), `d2-battle-3.jpg`, `d2-battle-2.jpg`, `d2-battle-both-grids.jpg` (both sides shown).
- What's there: a 2-column x 3-row grid of square portraits in a narrow iron frame, about a fifth of the screen wide, hugging one side. There is an HP plaque under each portrait, damage numbers drawn on the portrait, small round status icons (green rune, blue potion) on the portrait corners, a red wash on hit units, and skulls replacing dead units' portraits. Teal diamond crystals sit at the top and bottom of the central spine. A wreath of thorny iron filigree spills over the frame's top edge. Empty slots show a silver knotwork medallion instead of nothing. In `d2-battle-both-grids.jpg` (expansion era), the attacker's grid sits on the left and the defender's on the right, framed alike.
- What works: dead units become skulls in place, so the grid keeps its shape and tells the story of the fight. The empty-slot medallion turns "nothing here" into an ornament.
- Idea for disc (battle 3x3 grids): use a faction sigil as the empty-cell filler. Have fallen units turn to a stone or ash version of their portrait in place, not vanish.

### Disciples II (pre-release, 2001) — stained-glass skin
- Image: `d2-battle-prerelease-2001.jpg`, `d2-map-prerelease-2001.jpg`.
- What's there: the same layout, built in pale grey limestone instead of iron. Empty grid slots are small rose windows of stained glass. The bottom portraits sit in pointed lancet arches with a strip of stained glass beside them. The command cluster sits under a gothic arch with a row of carved skulls along its top (map version), and a green gargoyle crouches in the bottom-right corner.
- What works: the architecture is literal: windows, arches, a skull frieze. Every ornament is a building part.
- What doesn't: pale stone plus coloured glass fights the bright 3D scene for attention, and it reads more church than dread. The shipped version went dark iron, which lets the scene and portraits dominate. (The alpha shot on alldisciples already shows iron, so the order of the two skins isn't certain.)
- Idea for disc (Jilliath screens): the Jilliath skin could take this route, with tracery and rose windows as the empty slots, but darkened (soot-stained limestone, dim glass) so it stays in the iron family.

### Disciples II — spell book on a table
- Image: `d2-spellbook.png`.
- What's there: an open leather-bound book lying on a wooden table, filling the screen. Gold coins and a green bottle sit at the left edge and a quill on the right. The left page lists spells with hand-drawn rune icons in red or blue ink. The right page shows the selected spell's details and the mana costs, with a row of the five mana crystals at the bottom. Hanging from the bottom edge are five cloth bookmark ribbons, blue with red borders and Roman numerals I–V, as the spell-level tabs.
- What works: the tab rail is made of bookmarks, so the tabs belong to the object. There is no frame at all; the book is the frame, and its edges, spine and table do all the work.
- Idea for disc (codex): make the codex a book with ribbon bookmarks for faction or chapter tabs, lying on a surface with a few props, instead of another iron panel.

### Disciples II — campaign carry-over items
- Image: `d2-carryover-items.png`.
- What's there: a symmetrical iron frame with a vertical spine down the centre, studded with teal diamond crystals that get larger towards a big crystal at the centre cross. On the left is the leader (round porthole portrait plus a marble plaque) and a scrolling list of items on marble plaques. On the right are 3x2 item sockets made of circular iron lattice, filled with a banner and a chalice.
- What works: the crystals give the frame a focal point and a sense of hierarchy (small studs at the edges, the big gem at the heart). The spine visibly carries both halves.
- Idea for disc (any two-sided screen, such as trade or the warband transfer): a central spine that both panels hang from, with a single large boss at the crossing.

### Disciples II — diplomacy relationship gauges
- Image: `d2-diplomacy.png`.
- What's there: lords' faces in deep round iron porthole wells along the bottom half. Between neighbouring portraits there are vertical glass tubes: blue for peace, red for war, with a handshake medallion on top and crossed-swords medallion at the bottom. Above are marble plaques with bulleted relations.
- What works: a relationship is a physical gauge between two faces, not a number.
- Idea for disc (overworld faction relations, or morale/corruption meters): vertical reliquary vials between faction seals, filled with the faction's colour.

### Disciples II — options: gem toggles
- Image: `d2-options.png`.
- What's there: rows of marble plaques with labels. Each on/off toggle is an oval gem inset at the row's right end: glowing green crystal when on, dark green when off. Value selectors are plaques flanked by triangular iron arrows. A vertical iron spine with diamond crystals divides the two columns.
- What works: the toggle is a lit or unlit stone, so the state is visible from across the room and fits the material world.
- Idea for disc (settings menu): toggles as small lamp/ember insets (for example a votive light that is lit or snuffed).

### Disciples II — main menu: plaques hung on a post
- Image: `d2-main-menu.png`.
- What's there: a dark landscape painting (twisted trees, a stormy sky, a river at lower right, a skull and a gold coin in the grass). Seven stone/parchment plaques with iron end caps hang down a vertical iron post on the right. Each end cap holds a teal gem, and the plaques' points read like arrowheads. The mouse cursor is a small dagger.
- What works: the buttons hang from something. The cursor is a themed object, a dagger, which appears in many D2 screens.
- Idea for disc (title and menus): menu items as plaques chained to a post or pillar. A themed cursor (a nail, a quill, a thorn) is cheap atmosphere.

### Disciples II — race selection: one stage, one swapped monument
- Image: `d2-race-select-all.jpg`.
- What's there: each race gets a full-screen painting of one monument: a carved sword-shaped stele with a blue gem (Empire), a rune-cut rock spire in snow (Mountain Clans), a horn of black rock in a red sky (Legions), a skull-hung wooden shrine (Undead), a glowing green crystal wrapped in roots (Elves). At the bottom is the same selector: a "Choose Race" plaque over a long iron bar with blue/teal gem arrows and the race name plate. In the Empire, Legions and Undead paintings, the foreground (rocks, a river at the right, a skull and a coin in the grass) matches the main menu.
- What works: one shared foreground stage with the monument, sky and colour grade swapped gives each faction a strong identity cheaply, and the screens still read as one family.
- Idea for disc (new-game faction picker): one painted plinth or valley, with only the central monument and the colour of the light changing per faction.

### Disciples II — choose lord: difficulty as crowns
- Image: `d2-choose-lord.jpg`.
- What's there: a central tall portrait in an iron frame with a Celtic-knot border and green gems at the corners. On the left, three stone-tablet buttons carry lord-class symbols (fist, book, coins). On the right is a stack of four crowns: dark iron ones for the unselected levels and a gold, gem-set one for the chosen difficulty ("Very hard"). Below is a marble description plaque.
- What works: difficulty is shown as a physical object that changes material (iron to gold) when chosen.
- Idea for disc (new-game screen): show choices as objects that change material when picked (a dark iron to gilded halo for Jilliath, a dead to green sprig for the Sylvan).

### Disciples II — scenario briefing: framed painting over a painted backdrop
- Image: `d2-scenario-briefing.jpg`, `d2-campaign-intermission.png`.
- What's there: a wide painting (an old man in a turban beside a colonnade) in a narrow riveted iron frame with teal diamond crystals at the midpoints of each side. It floats over a dark, smoky painted backdrop. The title and objective are set in italic serif directly on the dark background, with no plaque.
- What works: the restraint. One frame, a few gems, and the text sits on the darkness. It shows the family can go quiet.
- Idea for disc (codex entries, story beats): not every screen needs the full kit. A thin frame plus text on darkness reads as part of the same family if the joint pieces (gems or studs) are the same.

### Disciples II — training camp: a face in the pillar
- Image: `d2-training-camp.png`.
- What's there: two panels (the squad on the left, a painting of the camp on the right) divided by the central iron spine. At the bottom of that spine, a large carved stone face with closed eyes sits just above the round button cluster.
- What works: the face is the base of the spine. It is part of the column, not something added to it.
- Idea for disc (any screen with a central divider): put one sculpted head at the foot or head of the divider, where it carries the button cluster, instead of putting statues in all four corners.

### Disciples: Sacred Lands — wood, iron castings and a skull frieze
- Image: `d1-battle.png`, `d1-options.png`, `d1-capital-clans.png`.
- What's there: the whole screen background is planks of warm brown wood with black iron fleur brackets nailed into it. The battle view is framed in black iron. Along its top edge runs a frieze of piled iron skulls with one large central skull, and at each end an iron dragon perches with its claws over the frame edge. The unit grids sit in iron frames on both sides. The buttons are round brass bosses. The options screen has iron-cornered plaques and a pinned parchment with an engraved demon face.
- What works: the dragons grip the frame and the skull pile is the frame's top rail, so they belong to it.
- What doesn't: warm wood plus black iron looks like furniture or a wooden board game. It is much less dark than D2, and the wood fights the battle scene.
- Idea for disc: a decorative crest can be the frame's top rail itself (a frieze of carved heads or skulls), rather than a figure placed on top of a plain rail.

### Disciples III — campaign select: figures gripping the panels
- Image: `d3-campaign-select.jpg`.
- What's there: a heavy frame of dark bronze/iron with organic carved ornament surrounds a 3D scene (an armoured white-winged angel floating in a rainy gothic cathedral). At the top: red pill-shaped tabs for the campaigns, a "Choose campaign" plaque, and a hanging pendant medallion under it. On the left, a hooded sculpted figure leans over the "Difficulty" panel, gripping a cross-hilted sword planted in front of it. On the right, a helmeted sculpted figure grips a weapon over the "Lord Class" panel. Black text panels with thin borders sit under each.
- What works: the side figures are doing something to the panels (guarding them, leaning over them), which ties them to the structure.
- What doesn't: everything is the same muddy dark bronze at the same detail density, so the figures dissolve into noise and the screen feels heavy. The red pill tabs look generic.
- Idea for disc: if figures guard panels, give them a clear silhouette and a calmer surface around them. Detail everywhere means detail nowhere.

### Disciples III — battle: initiative strip and corner portraits
- Image: `d3-battle.jpg`.
- What's there: a carved frame runs along the bottom and up the left. Along the bottom, a row of portrait cards in turn order, each with a level number, a rank shield, and an HP number on a plate; ally cards have a gold/white rim and enemy cards a red rim. The left side holds four square action buttons. At top left and top right, round portraits sit in ornate claw-like bronze frames, with a horizontal bar of round medallion buttons and a parchment tooltip between them.
- What works: the turn order as a strip of cards that also carries HP is very legible. The claw frames on the corner portraits look like they grip the portraits.
- What doesn't: square buttons and long thin bars feel like a generic RPG HUD. The D2 sense of one machine is gone.
- Idea for disc (battle turn-order strip): small portrait cards with level and HP and an ally/enemy rim colour. Have the strip emerge from the same frame as the ability bar rather than float.

### Disciples III — capital building panel
- Image: `d3-capital-building.jpg`.
- What's there: a 3D city view (a mage tower in rain and lightning) between a left column holding a building tree (tall framed cards with blue backgrounds, one showing a keyhole lock) and a right column with a parchment description, two portraits joined by an iron arrow, and a large framed portrait whose frame has a big claw/hook piece at the upper left. There is a resource bar along the top and square icon buttons along the bottom.
- What works: it keeps D2's before/after arrow and parchment text. The keyhole card is a nice locked state.
- What doesn't: the columns are flat and the frame ornament is thin. The scene and the UI don't touch.
- Idea for disc (capitol locks): a locked building or node can show a lock or seal object on its card instead of being dimmed.

### Disciples: Liberation — flat parchment cards and hex medallions
- Image: `lib-battle.jpg`, `lib-explore.jpg`, `lib-research.jpg`, `lib-city-yllian.jpg`.
- What's there: in battle, a top row of hexagonal portrait medallions shows the turn order, with a "ROUND 2" medallion between rounds. The lower-left card is flat parchment ("BONE GOLEM", level, an HP bar, stats). The ability bar at bottom centre has a big hex portrait in the middle. Tooltips are parchment cards with a torn bottom edge, plus a dark red keyword tooltip ("BURNING"). On exploration, the HUD is a level medallion with HP/mana bars top left, a quest text top right and hex party portraits at the bottom. The gothic weight lives in the 3D world (a giant carved skull in the rocks, caryatid figures flanking a door). Research is a full-screen parchment with flat diamond icons. The city is a 3D view with a parchment pop-up menu.
- What works: very readable. Keyword tooltips with coloured terms are clear. A round marker inside the turn-order strip is a good idea.
- What doesn't: the HUD has almost no material presence; it is modern flat UI with a parchment texture. Nothing is load-bearing, because there is no frame to bear anything.
- Idea for disc (battle log / turn-order strip): borrow the round separator in the turn-order strip and the coloured keywords in tooltips. Leave the flatness.

---

## Patterns across the Disciples family

### How races differ while the layout stays one family (Disciples II)
- **The frame stays; the content carries the race.** The command column, the battle bar and the grid frame are the same dark iron for every race in these screenshots. Race identity comes from: the capital painting (gothic necropolis, blue-roofed castle, snowy crag fortress, red cavern of horns, giant tree); the race-select monument and its colour grade (blue-steel, snow-white, blood-red, sepia, green glow); and, most finely, **the portrait frames** (silver skull and bone hooks for the Undead, iron lion head for the Empire, a burned hole in the paper for the possessed, twisted roots for the elves, copper horned crest for neutrals).
- **Colour per race is mostly in the art, not the chrome.** The chrome stays neutral grey-iron, cream marble and parchment. That keeps the HUD from clashing with any race's painting.
- (From memory, not in the screenshots: some D2 versions also tint the interface per race; nothing in these images shows a per-race tint of the command column.)

### What Disciples III and Liberation kept or lost
- **Kept:** parchment for text, framed portraits, the before/after upgrade arrow, the building tree, the resource strip, the capital as a picture or scene, the turn order expressed through portraits.
- **D3 lost:** the single machine-like frame (it split into thin bars and square icon buttons), the empty sockets, the command wheel, the restraint (everything is dense bronze), and the strong contrast between metal, marble and paper. Its sculpted figures are there but drown in same-tone detail.
- **Liberation lost** the frame entirely. It is flat parchment plus hex medallions, readable but anonymous. The gothic sculpture moved into the 3D world.

### How ornament becomes structure (the "bolted on" problem)
1. **Figures do a job.** The D2 atlantes brace the command wheel with their arms. In D1 the dragons grip the frame edge and the skull pile *is* the top rail. In D3 the figures lean on and guard the panels. A statue reads as bolted on when it just stands next to a frame; it reads as part of it when it carries, grips, holds or is cut by the frame's edges.
2. **Overlap and cropping.** The wheel overlaps the atlantes' arms. Dialog portrait frames overlap the parchment banner's edge. The battle bar's thorns overlap the scene. Pieces lock together because one passes in front of another. Nothing in D2 sits in its own clean rectangle next to another rectangle.
3. **One join piece everywhere.** Small amber diamond studs at every seam of the command column and battle bar; teal crystals at the spine junctions of the city, item and option screens. Seams become deliberate details, and the eye stops reading separate panels.
4. **Few unique pieces, used once each, against a calm repeated field.** Per screen, D2 has roughly one sculpted feature (a pair of atlantes, one stone face, one statue doll, one big central crystal) and otherwise repeats plain iron, lattice and marble. The prominent figures are not repeated in every corner. Variety comes from the portrait frames and the paintings, not from multiplying statues.
5. **The empty state is ornament.** Unavailable buttons show as empty sockets. Empty grid cells show a silver knot medallion (rose windows in the 2001 skin). Dead units become skulls. The machine never changes shape; it only lights up.
6. **Functions attach to physical objects.** Wax seals are the confirm/cancel buttons, the gold readout sits on the scroll's roller, bookmarks are the spell-level tabs, crowns are the difficulty, lit gems are the toggles, glass vials are the diplomacy gauges, and the statue is the paper doll. Each ornament has a function, so none of it is purely decoration.
7. **Materials have roles.** Iron is the structure; marble plaques are system readouts (move points, city info); parchment is voice and documents (dialogs, unit sheets, scrolls, the resource note); paintings are the world. Because each material always means the same thing, a lot of ornament stays legible.
8. **How the HUD meets the game view.** Paintings and 3D scenes have no frame of their own on the side where they meet the HUD. The HUD's silhouette is ragged (thorn filigree spilling over the grid top, iron thorns along the battle bar), so it reads as growth along the window edge rather than a box laid on top.
9. **Text treatment.** Black serif type on marble or parchment, centred names, italic serif titles on dark backgrounds in briefings, and almost no text on iron. Labels are always on a plaque, never engraved into the iron.
10. **Portraits are the jewels.** The biggest coloured elements on every D2 screen are faces: the duel portraits in battle, porthole wells in diplomacy and the city, faction-framed faces in dialogs. The chrome is desaturated so the faces carry the colour.
