# Diablo family: HUD and interface notes

Reference for disc's HUD kit. Ideas, not copies. Everything below is described from the
screenshots in this folder unless marked "(from memory, not in the screenshots)".

Sources: GOG and gameuidatabase.com (D1, D2 at 1728x1080 with pillarbox), the Steam store
(D2R), gameuidatabase.com (D4), plus a few press and fan screenshots found through Bing
(D2R stash and waypoint, D3 screens, D4 close-ups, character select and skill tree).
39 images. Crops (`*-crop-*`) are cut from the full shots next to them.

Disc screens named below: **overworld** (hex map, warband/city side panels, turn bar,
end-turn), **battle** (two 3x3 squads, unit card, battle log, ability bar, turn-order strip),
**capitol** (city painting, medallion tab rail, marble fact plaques), **codex**, **new game**,
**menus**.

---

## Diablo (1996)

### D1: Orbs resting on statues (demon under life, robed swordsman under mana)
- Image: `d1-hud-panel-crop-1.jpg` (left and right of centre), also `d1-hud-1.jpg`, `d1-character-sheet-1.jpg`.
- What's there: the red life orb sits on top of a grey stone demon: horned, bat wings spread out behind the orb, standing on the bottom edge of the panel. The orb rests between its horns as if the demon is carrying it on its head. The blue mana orb rests on a robed stone figure holding a sword point-down in front of it, a ring or crown around its head under the orb. Both statues are cut from the same cracked grey stone as the whole panel. The orbs have a thin stone rim and a single white highlight dot. Each orb is about 18% of screen height and pokes above the panel's top edge.
- What works: the statues *do a job*: they are pedestals. Remove them and the orbs would fall. That's what makes them part of the structure. Same stone, same grain, same lighting as the slab around them. The demon/holy pair also tells you what the game is about without a word.
- What doesn't: tiny and low-res; the statues are only half visible behind the orbs.
- Idea for disc (**battle**): the turn-order strip or the ability bar *rests on* a carved figure instead of being framed by one: a Jilliath angel with the strip across its raised hands or wings, so the strip looks carried. Same stone and light as the frame it stands on.

### D1: The whole HUD as one cracked stone slab
- Image: `d1-hud-panel-crop-1.jpg` (whole strip), `d1-hud-1.jpg` (bottom 27% of the screen).
- What's there: a full-width slab of grey flagstone with visible cracks, framed by a thin gold rim. Everything is set *into* it: a recessed black text well in the centre, eight recessed belt slots above it, beige-gold bevelled plaques for CHAR / QUESTS / MAP / MENU on the left and INV / SPELLS on the right, a big square spell tile bottom right. Hard horizontal edge against the game view.
- What works: one material and everything recessed into it. Nothing sits on top, so nothing looks glued on. The only "metal" is the gold plaque buttons, which makes them read as pressable.
- What doesn't: it eats more than a quarter of the screen; the hard edge feels like a cockpit wall.
- Idea for disc (**battle**): treat the bottom bar (unit card + ability bar + log) as one carved slab where slots, wells and plaques are cut *into* the stone, instead of separate framed boxes in a row. Fewer frames, more recesses.

### D1: One shared text well for every hover
- Image: `d1-hud-1.jpg` ("ROTTING CARCASS / TOTAL KILLS : 1"), `d1-inventory-1.jpg` ("CAPE / ARMOR: 3 DUR: 4/12 / NOT IDENTIFIED"), `d1-character-sheet-1.jpg` ("CHARACTER INFORMATION / HOTKEY : 'C'").
- What's there: the black recessed box in the centre of the panel is the only tooltip in the game. Monster names, item stats and button help all appear there in white or blue spaced capitals.
- What works: hovering always looks in one place. The well is part of the slab, so the tooltip never needs its own frame.
- What doesn't: you look away from the thing you're hovering.
- Idea for disc (**battle**): the battle log well could double as the hover readout ("what this ability would do to that unit") so the log turns into the battle's single speaking stone. No floating tooltip frame needed.

### D1: Character sheet as an engraved tablet
- Image: `d1-character-sheet-1.jpg` (left half of the screen).
- What's there: the sheet covers the left half of the game view. Same cracked grey stone as the HUD. Labels (STRENGTH, MAGIC, ARMOR CLASS, RESIST FIRE…) are embossed into the stone with a drop shadow. Values sit in small black recessed wells with a gold rim, in BASE and NOW columns. A thin knotwork band frames the whole tablet. Long labels break onto two lines ("RESIST / LGTNING").
- What works: the panel and the HUD are one material, so opening it feels like the stone growing upward. Embossed labels plus recessed values give a clear two-level hierarchy without colour.
- Idea for disc (**battle** unit card, **codex**): stat names cut *into* the plaque, numbers in small inset wells. The marble plaques could do the same: veined marble with carved labels and darker inset value wells, instead of text printed on top.

### D1: Paperdoll as a silhouette painted into the stone
- Image: `d1-inventory-1.jpg` (right half of the screen).
- What's there: a black human silhouette painted directly onto the flagstone. Equipment slots are dark-red rectangles placed where the body parts are (head, chest, both hands, rings). The backpack grid below has cells with a faint dark-red engraved pattern. Occupied cells turn red-tinted. A red "+" level-up badge floats in the game view with "LEVEL UP" above it.
- What works: the slots are positioned by meaning (on the body) rather than in a list.
- Idea for disc (**overworld** warband panel): the 3x3 squad shown as nine recesses in a slab with each unit's silhouette cut in. An empty slot is just bare carved shape. Position carries meaning, like the body does here.

---

## Diablo II (2000) and Lord of Destruction

### D2: Orb huggers (angel left, demon right)
- Image: `d2-hud-panel-crop-1.jpg` (both ends), `d2-inventory-1.jpg`, `d2-game-menu-1.jpg`.
- What's there: on the left a stone angel (female, folded wing, armlet) hugs the red life orb from behind with one arm around it. On the right a horned stone demon rests a clawed hand on top of the blue mana orb. The statues lean in from the screen edges and are *cut off by them*. The orbs sit in front of the statues with no frame of their own: the statues are the frame. The orbs and statues rise well above the bar's top edge (orb about 15% of screen height, bar about 8%).
- What works: (1) the statues hold the orbs, so they have a job; (2) they break the rectangle: the HUD's silhouette is irregular and runs off-screen, which makes it read as a sculpture in front of the world rather than a panel; (3) same grey stone and light direction as the bar. Only two unique sculptures in the whole HUD.
- What doesn't: in 4:3 they're dark and murky.
- Idea for disc (**battle**, **overworld**): have the two ends of the bottom bar each *hold* the most important thing on that side, for example the end-turn button held by one figure and the active unit's portrait by another. Let them run off the screen edge instead of sitting inside a box.

### D2: Control bar: knotwork stone, stamina, belt, two skill tiles
- Image: `d2-hud-panel-crop-1.jpg` (centre), `d2-npc-menu-1.jpg`, `d2-character-and-skills-1.jpg`.
- What's there: a long low bar of grey stone with celtic knotwork relief at both ends. From left: a red skill tile (white arrow icon), a square tile with a four-way cross, a thin experience line over a gold stamina bar with a running-man toggle, a narrow centre column with an arrow (opens the mini-panel), four belt slots with potions numbered 1–4, another cross tile and a second red skill tile. The cross tiles are grey in one shot and lit red in another (`d2-inventory-1.jpg`) (from memory, not in the screenshots: they are the new-stat and new-skill buttons, lit when points are waiting).
- What works: about 8% of screen height. Ornament only at the ends (knotwork), function in the middle. Waiting points are shown by the *same* tile lighting up, not by a new badge.
- Idea for disc (**overworld** turn bar): carved ornament only at the two ends of the turn bar, plain stone in the middle. "Something is waiting" (unspent upgrades, a city that can build) shown by an existing tile glowing red, not by a new marker.

### D2: Mini-panel drawer above the bar
- Image: `d2-npc-menu-1.jpg` (bottom centre, above the bar).
- What's there: a strip of eight square icon buttons (figure, sword, skill tree, party, map, speech bubble, star, pentagram) in a gold-rimmed tray that slides up out of the centre of the bar.
- What works: secondary screens live in a drawer that belongs to the bar. Closed, it costs nothing.
- Idea for disc (**battle**): rarely-used actions (wait, retreat, options) in a drawer that slides out of the ability bar's centre instead of a permanent second row.

### D2: Half-screen panels with a hinge
- Image: `d2-inventory-1.jpg` (right half), `d2-character-and-skills-1.jpg` (both halves).
- What's there: each panel covers half the 800x600 screen. A heavy grey stone frame with deep celtic/scroll relief and square carved corner blocks. On the outer edge at mid-height there's a large ornate gold round boss, like a book clasp or door hinge. When character and skills are both open, the two frames meet at the centre seam and each has its clasp on its outer edge.
- What works: the clasp makes the panel read as an *object*, a door or a book cover that swings in from the screen edge. It's one unique piece per panel and the rest is repeated trim.
- Idea for disc (**overworld** side panels, **capitol**): give each side panel one hinge or clasp sculpture on the screen-edge side, a single unique piece per panel, so the panel reads as a door or tablet fixed to the edge. That's where a Jilliath angel could actually *be* the hinge (wings as the hinge leaves) instead of standing in a corner.

### D2: Paperdoll with engraved empty-slot shapes
- Image: `d2-inventory-1.jpg` (upper right panel).
- What's there: equipment slots are recessed boxes in stone. Empty ones show a faint carved relief of the expected item (helm, body armour, boots outline). Weapon slots have I / II tabs for weapon swap. The backpack grid has dark navy-violet cells. A small round "no" button and a gold amount with a coin icon in a black inset strip sit below.
- What works: empty slots still look made rather than blank. The carving tells you what goes there.
- Idea for disc (**battle** 3x3 grid, **overworld** warband): empty grid cells could show a faint carved hint of what fits (front line or back line shape) rather than an empty square.

### D2: Character sheet and skill tree side by side
- Image: `d2-character-and-skills-1.jpg`.
- What's there: left is stats in black boxes with thin gold rims and small red "+" tiles beside each attribute; "Stat Points Remaining" in red. Right is the skill tree on bare stone: square skill icons in a grid, prerequisite lines cut as grooves with right-angle steps, three tab plaques on the right ("Javelin and Spear Skills", "Passive and Magic Skills", …), "Skill Choices Remaining 3" in a carved box with curled corners. The tooltip is red and white text on translucent black, no frame.
- What works: the tree's lines look *carved into* the stone, so the tree is part of the slab. Tabs are stone plaques sticking out of the panel's inner edge.
- Idea for disc (**codex**, unit upgrade paths): draw upgrade or promotion paths as grooves cut into a slab, not lines on top. Tabs as plaques that jut out of the panel.

### D2: NPC choice box
- Image: `d2-npc-menu-1.jpg` (upper middle, above the NPC).
- What's there: a small translucent black box with a thin gold line border, floating in the world near the speaker. Centred lines: "Talk" in gold, "Introduction" and "Gossip" in white, "Cancel" in blue.
- What works: no ornament at all, and it doesn't need any. Colour alone tells you which line is which.
- Idea for disc (**overworld**): interaction pop-ups (enter a city, attack a neutral group) as minimal translucent plates *next to the hex*, not modal frames. Save the carving for the big screens.

### D2: Pause menu with no box, pentagram cursor
- Image: `d2-game-menu-1.jpg`.
- What's there: no panel. Large gold engraved capitals ("Options", "Save and Exit Game", "Return to Game") laid straight over the dimmed game. The selected line is marked by two red pentagrams, one at each end of the row (from memory, not in the screenshots: they spin).
- What works: the only ornament is the selection marker, and it's the game's symbol.
- Idea for disc (**menus**): a pause or title menu as bare carved words with a faction's own mark as the selection cursor, so the cursor changes with the faction you play.

### D2: Front-end buttons with gem studs and grotesque spacers
- Image: `d2-character-list-1.jpg` (bottom: Create New Character / Convert to Expansion / Delete Character, Exit / OK), `d2-class-select-1.jpg` (Exit / OK).
- What's there: buttons are grey stone slabs with a gold scrollwork rim and a blue gem stud at each end. Between the three big buttons sit two small carved demon or skull faces, used as spacers or keystones. The list frame has gold scrollwork corners and a carved title band.
- What works: the grotesque faces make the gaps between buttons a *place*. It's a small unique piece where a plain gap would be.
- Idea for disc (**new game**, **menus**): between grouped buttons, a small carved face or keystone instead of a gap or divider line, one per group.

### D2: Class select as a campfire scene
- Image: `d2-class-select-1.jpg`.
- What's there: the eight classes stand in a semicircle around a campfire in a ruined camp at night. The selected one is lit by a blue aura. Gold spaced capitals "Select Hero Class" and the class name, a white two-line description, a thin gold name field. Almost no frames.
- What works: the screen *is* a place; the UI is three lines of text.
- Idea for disc (**new game**): faction choice as a scene: a representative of each faction standing in one shared painted place, the chosen one lit. Text kept to name plus one line.

### D2: Loading vignette
- Image: `d2-loading-1.jpg`.
- What's there: a small square picture in the centre of a black screen, under a quarter of the screen's height. Thin gold frame with curling tendril corners, a small "LOADING…" tag plate at the bottom edge with crescent notches, and a flat dark-red progress bar below.
- What works: intimate and quiet; the frame's tag plate is a unique piece that names the thing.
- Idea for disc (**menus**, end-of-turn AI wait): a small framed vignette with a tag plate, centred in darkness.

---

## Diablo II: Resurrected (2021)

### D2R: Orb statues, remastered and floating
- Image: `d2r-hud-1.jpg` (bottom corners), also `d2r-stash-inventory-1.jpg`, `d2r-inventory-tooltip-1.jpg`.
- What's there: the same idea rebuilt in 3D. A seated winged woman with an armlet has her hand on top of the glossy red orb; a horned demon crouches with its claw on the glossy blue orb, wing raised behind. Each statue plus orb is about 20% of screen height. The middle bar is now a thin dark-iron strip with small spikes or rivets along the top edge. There's no slab: the game view runs right down to the bottom between the statues.
- What works: lit from the upper left like the scene, with visible stone texture and soft shadow under the arm. The orbs are glass spheres with a specular highlight, and the statues touch them, so they read as physical.
- What doesn't: without the slab the bar feels thin next to two heavy statues.
- Idea for disc (**battle**): if the angels stay, give each one a *contact point*: a hand, wing or chin resting on the element it guards, with a contact shadow. Touch is what turns "next to" into "holding".

### D2R: Enemy nameplate
- Image: `d2r-hud-1.jpg` (top centre, "Skeleton").
- What's there: a dark-red plate with a small winged demon-head ornament on each side of the name. Below it, plain text without a plate: "Undead" (white), "Extra Strong" (violet), "Immune to Lightning" (yellow).
- What works: one small plate for the name, then plain coloured lines. The plate only frames the most important word.
- Idea for disc (**battle** unit card or hover): the unit name on a small carved plate whose ornament matches the faction; traits and statuses below as plain coloured text without boxes.

### D2R: Gothic pillars behind the side panels
- Image: `d2r-stash-inventory-1.jpg` (screen edges), `d2r-inventory-tooltip-1.jpg` (right edge).
- What's there: opening the stash and inventory brings full-height stone architecture at the screen edges: gothic columns with cusped tracery windows at the bottom and carved bands at the top. The two panels sit in front of it with a metal clasp or hinge on each outer edge. The game view between them reads as seen through a window. Panel titles ("Stash", "Inventory") are engraved into a stone header. The gold amount sits in an inset plate with a coin icon.
- What works: the ornament is *architecture*, not decoration on a frame. The panels look bolted to a wall that exists, and the clasp tells you how.
- Idea for disc (**overworld**, **capitol**): when side panels open, the screen edges become a carved wall or cathedral flank (tracery, columns) that the panels hang on. The angels could be figures *in* that architecture, standing in the niches of the columns, rather than glued to the panel corners.

### D2R: Frameless tooltip and Exocet type
- Image: `d2r-inventory-tooltip-1.jpg` (item tooltip upper middle).
- What's there: a translucent black box with no border. Centred lines: item name and type in gold, base stats in white, magic affixes in blue-violet, control hints in grey at the bottom. Everything set in Diablo's Exocet-style capitals: wide spaced caps with odd glyphs (an O with a cross in it).
- What works: the typeface carries the style, so the box doesn't have to. Colour does the hierarchy.
- Idea for disc (**battle** ability tooltip, **codex**): one strongly characterful display face for names and headers and colour-coded lines, no frame. Pick a face per faction for headers on faction screens.

### D2R: Main menu with cathedral pillars
- Image: `d2r-main-menu-1.jpg`.
- What's there: a tall left panel shaped like a gothic window (pointed arch top) holding the burning logo, stone buttons with blue gem studs (Options, Cinematics, Credits, Exit). A right panel with Online/Local tabs and a character list. The centre shows the 3D hero in a night scene with a ruined tower. Play / TCP/IP Game buttons sit at bottom centre, joined by a small vertical spine between them.
- What works: the side panels are shaped like the building (lancet arch), so they read as architecture.
- Idea for disc (**new game**, **menus**): panels with pointed-arch tops and stone tracery inside, framing a painting of the faction or capitol in the middle.

### D2R: Waypoint list with sigils and act tabs
- Image: `d2r-waypoint-1.jpg`.
- What's there: a stone frame with a knotwork border and the header "Waypoint" engraved. Roman-numeral tabs I–V for the acts. Each row is a dark stone bar with a sigil on the left (a black spiked circle when not active, a glowing blue emblem when active) and the place name in gold (the current one in violet).
- What works: unlit or lit sigils give each row state without extra text. Roman numerals feel carved.
- Idea for disc (**codex** chapters, **overworld** list of owned cities): roman-numeral tabs and a per-row sigil that is dark until visited or owned, then lit.

---

## Diablo III (2012) and Reaper of Souls

### D3: Globe guardians (gargoyle left, praying angel right)
- Image: `d3-hud-globes-crop-1.jpg`, `d3-hud-1.jpg`.
- What's there: a horned, snarling gargoyle-demon crouches around the left of the red life globe, skulls piled at its feet. A hooded winged angel with hands together wraps around the right of the resource globe. Both are dark charcoal stone with cool highlights. Between them is the action bar: six skill slots with keys 1–4 plus two mouse icons, a potion with a stack count, a portal icon, five small red menu tiles, and a small skull at the bar's top centre. Teal verdigris trim sits at the bar ends. Globes are about 14% of screen height.
- What works: the statues *wrap* the globes (front paws and wings overlap the glass), so globe and statue are one shape. The skull at the bar's centre is a single unique keystone.
- Idea for disc (**battle**): a keystone sculpture at the exact centre of the ability bar (where the bar's tension is), with the sides plain. One crafted piece where the eye lands.

### D3: Per-class resource globe
- Image: `d3-hud-1.jpg` (right globe split orange and blue), `d3-skills-1.jpg` (orange, Barbarian), `d3-blacksmith-1.jpg` (blue).
- What's there: the right globe's liquid changes per class. In `d3-hud-1.jpg` (Demon Hunter) it's split vertically down the middle, orange on the left and blue on the right, with an ornamental blade-like divider between, for two separate resources in one globe.
- What works: one shared frame, and the *contents* carry the class. The split globe is a clever way to show two pools.
- Idea for disc (**battle**): same frame for all factions, but what fills it differs per faction: the Ral-Vitahl battery charge as a liquid that glows, Sylvan as something growing or rotting inside, Jilliath as light. A unit with two pools could get a split vessel.

### D3: Side panels with medallion headers and hanging tabs
- Image: `d3-stash-1.jpg`, `d3-blacksmith-1.jpg`, `d3-vendor-inventory-1.jpg`.
- What's there: each side panel has a red header with a lattice pattern like stained glass or a grille. At the top centre a round gold-rimmed medallion holds the panel's icon: a bag (inventory), a chest (stash), an anvil-and-hammer style icon (blacksmith). The panel name sits engraved below ("STASH", "FORGE ARMOR", "INVENTORY"). Red vertical rails run down the sides. Tabs are tall red tiles that *hang out of* the panel's inner edge like banners.
- What works: every panel shares the same frame, but each gets one unique medallion: family resemblance plus identity. The tabs stick out of the frame, so they read as attached pieces.
- Idea for disc (**capitol**): the round medallion tab buttons could *become* the header medallion of the panel they open: click the medallion on the rail and the same medallion crowns the opened panel. One unique carved icon per panel, shared frame.

### D3: Paperdoll on parchment with a stat column
- Image: `d3-vendor-inventory-1.jpg` (right panel), `d3-stash-1.jpg` (right panel).
- What's there: equipment slots on a warm parchment-coloured field with a faint body silhouette. Slots are coloured by item rarity (gold, green, blue backgrounds). A darker stat column on the left (Level, Paragon button, Strength, Dexterity, Intelligence, Vitality, Damage, Toughness, Recovery, Details). Gems are stacked in a grid with counts. The tooltip shows one huge serif number (DPS or armour), with gains in green and losses in red.
- What works: the single huge number makes the tooltip readable in a second. Rarity colour fills the whole slot, not just a border.
- Idea for disc (**battle** unit card): one large number for what matters most on the card, the rest small. In comparisons (an ability preview) show gains and losses as green and red deltas.

### D3: Skills modal with sections and keybind tags
- Image: `d3-skills-1.jpg`.
- What's there: a centred modal in a dark red and black lacquered frame, "SKILLS" on a small winged plate at the top. Sections ("MOUSE SKILLS", "ACTION BAR SKILLS", "PASSIVE SKILLS") are labelled in small spaced capitals between thin flourishes. Each skill is a dark recessed card with an icon, name and rune line, and a small keybind tag hangs *below* the card (1, 2, 3, 4). Passives are round medallions. A "CLOSE" red slab button sits at the bottom.
- What works: the keybind tags hang off the cards like labels tied on: small attached pieces that make the cards feel physical.
- Idea for disc (**battle** ability bar): hotkey numbers as small tags hanging from each ability slot, carved or cast, instead of printed in a corner.

### D3: Act map as an illustrated parchment
- Image: `d3-map-1.jpg`.
- What's there: a warm parchment sheet with ink-sketched landmarks (fortress, bridge, crater, a giant spider-demon, a tower). Waypoints are small grey shields; quests have gold markers; the town is a glowing orange house icon; paths are dashed lines. The title "ACT III" sits on a scroll ribbon at the top with a "MAP LEVEL" stepper. A "BOUNTIES" plaque in the corner has a banner-shaped header.
- What works: a different material (parchment and ink) for a different kind of screen, but the gold ribbon title keeps it in the family.
- Idea for disc (**codex**, campaign overview): the codex or a campaign map as ink-on-parchment with sketched landmarks. A screen that changes material on purpose, tied to the kit by one carved title piece.

### D3: Hero banner in the menu scene
- Image: `d3-hero-select-1.jpg`, `d3-main-menu-banner-1.jpg`.
- What's there: the hero stands in a painted landscape beside their own heraldic banner on a pole (a deer or stag on cream in one, a bird and crescent on dark blue in the other). Left column: slab buttons with pointed ends and corner filigree, red for the main action ("RESUME GAME", "START GAME"), dark for the rest. The hero portrait sits in a round medallion with level above; in RoS it's ringed by stars and a big emblem with the paragon level in blue.
- What works: the banner is *diegetic*: a thing in the world that carries the player's identity. The red/dark split marks the one action that matters.
- Idea for disc (**new game**, **overworld**): the faction's banner as an object standing in the scene (or planted on the warband's hex) rather than a crest in a frame. One red primary button, the rest dark.

---

## Diablo IV (2023)

### D4: Small globes, gargoyle and angel as bookends of the bar
- Image: `d4-hud-bar-crop-1.jpg`, `d4-hud-1.jpg`, `d4-hud-globe-closeup-1.jpg`.
- What's there: the globes are small (about 14% of screen height) inside a thin dark-iron ring with little spikes at the four compass points. The statues moved *inward*: a crouching horned, winged gargoyle sits between the life globe and the bar, and a hooded winged figure sits between the bar and the resource globe. They are bookends that hold the bar in place. The bar has six square slots (keys 1–4 plus two mouse tags in pale square chips), a segmented XP track with small spikes above it, a gold diamond badge with the level, and a round potion medallion ("8/8") with its key in a chip. Skill icons are painted like stained glass in colour-coded frames (teal, gold, flesh/red).
- What works: the statues press against the bar's ends like book-ends, a structural role. Same cool blue-grey iron and stone as the bar and the globe rings. Very compact; the world dominates.
- What doesn't: the statues are so small they nearly read as texture.
- Idea for disc (**battle**): small carved figures as *bookends* clamped at the ends of the ability bar or the turn-order strip, facing inward and pressing on it, rather than big corner statues.

### D4: Globe ring with a warning glow
- Image: `d4-hud-globe-closeup-1.jpg`.
- What's there: the life globe's iron ring has inset red glowing segments; the liquid shows a visible fill line with a lighter band at the surface. The gargoyle beside it has rim-lit edges in the same cool light as the ring.
- What works: the frame itself carries state (glowing segments) without adding a new element.
- Idea for disc (**battle** unit card, **overworld** end-turn): frames whose inset channels glow to show state (the active unit, an end-turn that's ready), so state lives in the structure.

### D4: Skill tree inside a carved arch
- Image: `d4-skill-tree-arch-1.jpg`.
- What's there: the whole tree grows inside a huge rounded stone archway. A skull medallion sits at the keystone with two smaller round medallions on the arch shoulders. The arch is surrounded by dense relief of writhing bodies and demons in dark stone, with runic inscription bands along its inner edge. Inside is a dark red leather or parchment field with a faint painted figure. Skills are square icons, passives small round tokens, branch hubs big red star-shaped nodes; the chosen path glows red. A "SKILL ASSIGNMENT" plaque sits at the bottom centre.
- What works: the ornament *is* the screen's architecture. You're looking into a shrine and the tree is inside it. The one unique sculpture (the skull keystone) sits at the top of the frame's structure, where a real keystone would be.
- Idea for disc (**codex**, faction pages): each faction's codex page framed by a different piece of architecture: an inquisition arch for Jilliath, an opulent salon door for Ral-Vitahl, a root-arch for the Sylvan. Put the one unique figure at the keystone.

### D4: Paragon board: lit tokens on a carved slab
- Image: `d4-paragon-1.jpg`.
- What's there: a big grid of round tokens laid on dark carved stone with faint architectural line engravings under the grid. Taken tokens glow orange, a socket region glows red from below, gates are small arched icons. On the left a stat plaque and a "GLYPHS" header in pale stone over a grid of glyph tokens.
- What works: the grid is *on* a carved surface with the carving showing through gaps; light comes from under the active area.
- Idea for disc (**battle** 3x3 grids): each squad's 3x3 as tokens on a carved slab; the active unit's cell lit from underneath.

### D4: Right-docked character panel with a 3D paperdoll
- Image: `d4-character-1.jpg`.
- What's there: a full-height panel docked right with tabs on top ("CHARACTER", "BOOK OF THE DEAD", "ABILITIES") in serif small caps, keybind chips under each, the active tab in red lacquer. A name plate ("KASSIANI / Lethal Casualty") with thorny flourishes. The character is a 3D render inside the panel, with gear slots in two columns either side. Stats sit in a second sub-panel docked to its left with thin dividers and old-style numerals. Footer: gold, red dust and obols with icons. Frames are dark iron with thorny spikes at corners and edges.
- What works: sub-panels dock onto the main panel like added leaves.
- Idea for disc (**overworld** warband panel): a second leaf that docks out of the warband panel for the selected unit's details.

### D4: A panel that only one class has
- Image: `d4-book-of-the-dead-1.jpg`.
- What's there: a Necromancer-only panel. A pale stone header plate ("SKELETAL WARRIORS") with diamond studs. Rows for each summon type with a big icon tile (red when active), round thorny sockets for upgrades and a red diamond for "Sacrifice", all linked in a row.
- What works: per-class identity at the *screen* level, not just a palette swap.
- Idea for disc (all factions): give each faction one screen or panel that only it has, built around its own mechanic and in its own sub-material (no new mechanics invented here; just where an existing faction mechanic would live).

### D4: Clan crest as a carved stone tablet
- Image: `d4-clan-relief-1.jpg`.
- What's there: a header band of glowing red (lava or blood) with a demon skull at the top centre flanked by thorns. The right area is a big dark-stone relief: a shield crest with sun rays, intertwined serpents, crowned skulls; side panels with swords, ram heads and rune inscriptions above and below.
- What works: a screen-sized relief, low-contrast grey on grey, so it's ornate but quiet. It looks like a tomb door, and it fills an empty state nicely.
- Idea for disc (**capitol**, empty states): when a panel has nothing to show, fill it with a faction relief carved in the panel's own stone, not a blank or a big statue.

### D4: Map and journal
- Image: `d4-map-journal-1.jpg`.
- What's there: a top navigation row (MAP, COLLECTIONS, SOCIAL, CLAN, SHOP, GAME) with keybind chips; the active tab is red. The map is sepia parchment with pale ink lines and icons. The journal floats on the right with a pale stone header ("JOURNAL" with the cross-O glyph) and diamond studs, icon filter tabs (red when active), and a quest list with diamond bullets and italic region subheaders aligned right. A round red arrow button sits half off the panel's left edge. Control hints run along the bottom.
- What works: the round collapse button straddling the panel edge is a small attached piece that shows how the panel opens and closes.
- Idea for disc (**overworld**): a round carved knob half off the side panel's edge to fold it away, the panel's "handle".

### D4: Modals with barbed frames and pale stone title plates
- Image: `d4-difficulty-select-1.jpg`, `d4-vendor-1.jpg`.
- What's there: modal frames are dark iron with thorn and barb spikes along the outside edge. The title sits on a pale grey stone plate with a diamond stud at each end ("SELECT DIFFICULTY"). Choice cards are deep red lacquer, each with a central round medallion holding a roman numeral on a horizontal barbed-wire flourish; the selected card gets a white inner outline. Buttons are red with a pale inner rim.
- What works: three materials, always in the same roles: dark iron (structure), pale stone (titles), red lacquer (choice and selection). Easy to read across every screen.
- Idea for disc (all screens): fix roles per material: iron or black stone = structure, pale marble = titles and facts, one accent (gilt or a faction colour) = selection. The marble plaques already point this way.

### D4: Character select with a horned crest on the list
- Image: `d4-character-select-1.jpg`.
- What's there: the left list panel is crowned by a horned demon-skull sculpture with red glowing wings along the header. Each slot shows the level over a class emblem, a portrait, a name and the realm. The right panel has a helmet medallion at the top and a world-tier medallion with a roman numeral. A large 3D hero fills the centre.
- What works: the header sculpture sits *on top of* the panel like a crest on a helmet, part of its silhouette rather than inside it.
- Idea for disc (**new game**): crown each faction's panel with one crest sculpture sitting on the top edge, changing per faction.

### D4: Loading screen as a sculpted door
- Image: `d4-loading-1.jpg`.
- What's there: a dark full-screen 3D render of a bronze relief door with a horned emblem at the centre, flanked by two stone beasts. A tip line of text between two thin rules at the bottom, and a small bronze rune-ring emblem in the corner.
- What works: the loading screen is a single sculpted object, very dark, with almost nothing on it.
- Idea for disc (**menus**, faction turn change): a dark sculpted image (a faction's door or gate) as the between-turns or loading card, with one line of text.

---

## Patterns across the Diablo family

**Ornament that carries something.** In every game the sculpture has a job. D1: the statues are *pedestals* that hold the orbs up. D2 and D2R: they *embrace* the orbs, a hand on top, an arm around. D3: they *wrap* the globes, their paws and wings overlapping the glass. D4: they become *bookends* that clamp the action bar. The D4 skill tree's skull is a *keystone*, D2's panel clasps are *hinges*, D4's character-select skull is a *crest*. None of them is ornament placed beside something; each one holds, closes, crowns or clamps.

**They break the edge.** D1's orbs and statues rise above the slab line; D2's statues lean in from outside the screen and are cut by its edges; D3's statues stand higher than the bar; D4's crests sit on top of panel edges and its collapse knob hangs half off the journal. The silhouette is never a clean rectangle at the point where the sculpture is.

**Few unique pieces, a lot of shared trim.** The D2 HUD has exactly two unique sculptures; everything else is repeated knotwork band. D3 panels share one frame and differ only in their header medallion. D4 gives each *screen* one hero piece (skull keystone, horned crest, clan relief, loading door) and uses the same barbed-iron edge everywhere else. Four identical statues in four corners would be the opposite of this.

**One material and one light per element.** Statues are carved from the material of the thing they belong to (D1/D2 grey flagstone, D3 charcoal stone, D4 cool blue-grey iron) and lit from the same direction as the frame, with contact shadows where they touch. Colour is kept for function: red/blue orbs, rarity colours, red selection.

**Duality as a constant.** Angel/holy versus demon on the two sides in all four games. The sides swap: D1 demon under life and holy figure under mana, D2 angel at life and demon at mana, D3 and D4 demon at life and angel at the resource globe. The pair tells the story without text.

**HUD meets world.** D1: a hard full-width slab, about 27% of the screen. D2: a lower slab (about 8%) with statues breaking above it. D2R: no slab; a thin iron strip floating over the scene between two big statues. D3: a bar on a dark base, statues wrapping the globes. D4: a small floating bar, globes about 14% of height, statues shrunk to bookends. The trend is from a wall to sculpture floating in front of the world. The sculpture survived every reduction; the slab didn't.

**Panels.** D1/D2: half-screen stone tablets (character left, inventory right) with a hinge-boss on the outer edge. D2R adds full-height gothic architecture at the screen edges for the panels to hang on. D3: red-lacquer side panels with medallion headers and hanging tab banners. D4: right-docked panels with docking sub-leaves and a top tab row for full-screen views. Special screens change material on purpose (D3 parchment map, D4 parchment map, D4 skill-tree shrine) but keep one shared title piece.

**Type.** D1 and D2: Exocet-style spaced capitals everywhere, gold for headers and white for values; the font *is* the frame (D2R tooltips and the D2 pause menu have no box at all). D3: Exocet for headers, a plain serif or sans for body text. D4: a book serif with old-style numerals for body text; the cross-O display caps survive only in headers ("J⊕URNAL", "SKELETAL WARRI⊕RS"). Numbers that matter get huge (D3 tooltip DPS).

**Materials by era.** D1/D2: grey stone and gold plaques, blue gem studs. D3: red lacquer, gold, charcoal stone, teal verdigris accents. D4: dark iron with thorns and barbs, pale stone title plates, red lacquer for selection. In each game every material keeps one role.

**Per-class variation.** Mostly *inside* shared frames: the D3 resource globe liquid per class (and split for two resources), D4's resource globe colour per class, skill icon frame colours. D4 also adds whole screens for one class (Book of the Dead). The frames stay shared; content and one-off screens carry the identity.

**Diegetic bits.** D3's hero banner standing in the menu scene; D2's class-select campfire; D4's loading door; D2R's architecture behind panels; D2's stone-carved empty slots. Each is UI that looks like an object or a place.
