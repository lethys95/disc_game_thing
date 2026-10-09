# Strategy and tactics HUDs: reference notes

These notes cover strategy and tactics games in a dark-fantasy style, other than Disciples. The games are Warcraft III (classic and Reforged), Heroes of Might and Magic III (HD) and V, Darkest Dungeon 1 and 2, Total War: Warhammer 1 and 3, King's Bounty (The Legend, Armored Princess), and Age of Wonders 1, 2 and Shadow Magic.

They are written for the user's verdict on disc's UI kit, quoted in full: "I enjoy the angels, but there's a problem they feel like they're bolted on, rather than actually part of it. also, i think we can have even more hud elements, less copies of the same thing."

Each entry describes what is visible in the saved screenshot. Anything added from memory is marked *(from memory, not in the screenshots)*. Sizes are rough fractions of the screenshot. The images are reference for people only. They must never go to an image generator.

Sources: Steam store screenshots, classic.battle.net (Warcraft III race pages), heroes.thelazy.net, YouTube thumbnails, press and guide sites found through Bing. Three files are crops or stacks made from other saved shots: `wc3-console-undead-closeup.jpg`, `wc3-console-orc-nightelf-human-closeups.jpg` and `wc3-daynight-clock-four-races-compared.jpg`. So are the stacked bars in `tww-faction-bars-vc1-dwarfs1-vc3-compared.jpg`, which come from two Steam shots and one press shot.

---

## Warcraft III

### Warcraft III — the bottom console as one sculpted object
- Image: `wc3-console-orc-1.jpg` (bottom quarter), `wc3-console-orc-nightelf-human-closeups.jpg` (all three bands)
- What's there: the console is one continuous band across the whole bottom of the screen, about 27% of the screen height. In the Orc version it is built from dark wood planks held by black iron straps with big rivets. Two huge curved ivory tusks rise above the band's top edge, one on each side of the portrait. A rack of rawhide-wrapped bones hangs from the left tusk. Spikes run along the top edge on the right. The parts are the same as in every race's console, left to right: minimap, a column of minimap mode buttons, portrait, unit info or selection grid, then inventory and command card. Each sits in its own black recess cut into the wood. Nothing floats, and every window is a hole in the same object.
- What works, and why: it reads as a piece of furniture you look through, not as panels with decorations stuck on. The tusks are the posts that frame the portrait. The iron straps are the seams between the recesses. Every ornament marks where one recess ends and the next begins.
- What doesn't: it eats a quarter of the screen, and the black recesses look empty when nothing is selected. The look is cartoony-heavy, and its colours are more saturated than disc's palette.
- An idea for disc: on the **map screen**, try making the warband panel, the turn bar and the end-turn button one carved object instead of three floating rectangles. One possible shape is a single low wall along the bottom, with the warband list and the city facts as recesses in it. The ornament would sit only on the seams between recesses, so each carved piece separates two things.

### Warcraft III — race crest filling the space where content is missing
- Image: `wc3-console-orc-1.jpg` and the closeup (Orc: the big skull between the selection grid and the command card), `wc3-console-undead-closeup.jpg` (Undead: the carved stone panel on the right)
- What's there: in the Orc console, the area where an inventory would sit holds a large relief instead: a horned skull with the red Horde emblem on its brow, framed by small bone claws. The selected unit has no inventory. In the Undead console, the same area is a carved dark-stone door with a skull face in relief and purple gems set along its edges. In the Human shot, the empty command card is a plain black grid. In the Night Elf shot, the same space is used by the inventory.
- What works, and why: the most sculptural piece in the console sits exactly where content is missing, so an empty state becomes the race's emblem instead of a blank grid. The emblem is cut from the same material as the console, so it reads as part of the wall.
- What doesn't: the Human console shows the alternative, a black grid of empty cells, which looks unfinished next to the Orc crest.
- An idea for disc: on the **capitol garrison** and the **battle ability bar**, an empty slot could show a carved relief tile in the faction's material instead of an empty dark box. The relief could be a symbol, not a unit (the "mystery over cameos" rule). The decoration would then appear when there's room for it, rather than always.

### Warcraft III — the day/night clock as the keystone of the top bar
- Image: `wc3-daynight-clock-four-races-compared.jpg` (four crops stacked: Orc, Night Elf, Human, Undead)
- What's there: at the top centre, a round gold-rimmed dial with a ring of small bead lights. The bead lights are yellow-gold by day and pale blue in the Undead shot, where the dial shows a night sky. The dial is identical in every race; its *surround* changes. Orc: black iron plates and wooden beams. Night Elf: green leaves fanning out behind. Human: grey stone with an iron scroll frame. Undead: bone horns and two purple orbs. The dial sits where the top bar's left arm (menu buttons) and right arm (resources) meet, about 7% of the screen width. *(From memory, not in the screenshots: the dial turns through the game's day/night cycle.)*
- What works, and why: the most ornate piece of the top bar is also the one that shows live state, and it sits at the structural centre where two arms join. It is a keystone in both senses.
- What doesn't: at 800x600 it is tiny, and the time of day is hard to read at a glance.
- An idea for disc: on the **map turn bar**, the centre could become a keystone medallion that carries the turn state: the turn number, whose move it is, and possibly the round. The text "Turn 1 · your move" would move into a sculpted dial. The two arms could be the resources on one side and movement on the other. The bar's one sculpted piece would then do a job.

### Warcraft III — the console's top silhouette against the game
- Image: `wc3-console-human-1.jpg`, `wc3-console-nightelf-1.jpg`, `wc3-console-undead-1.jpg`, `wc3-console-orc-1.jpg` (the top edge of each console)
- What's there: none of the four consoles has a straight top edge. Human: grey castle crenellations, a battlement with merlons, with the game visible between them. Night Elf: a fringe of overlapping green leaves hanging over the edge, with bark posts. Orc: tusks and iron spikes poking up. Undead: knobbly bone ridges with small spikes and skulls at the joints. The minimap tower and the command-card tower are taller than the middle section, so the console has a skyline.
- What works, and why: the HUD meets the game view as a silhouette, not a cut line. The game runs into the gaps of the edge, which makes the console feel like an object standing in front of the world rather than a mask over it. The silhouette alone tells you the race.
- What doesn't: the tall towers block a lot of the bottom corners.
- An idea for disc: give each **faction's panels** a top edge that isn't a straight border-image line. Jilliath could have a run of small tracery pinnacles, the Sylvan a root-and-leaf fringe, and Ral-Vitahl whatever the user picks. This is cheap in CSS with a mask-image or an overhanging PNG strip, and it removes the "rectangle with a corner sticker" look.

### Warcraft III — the portrait window, a different arch per race
- Image: `wc3-console-orc-nightelf-human-closeups.jpg` (three bands), `wc3-console-undead-closeup.jpg`
- What's there: the unit portrait sits in a tall arched niche, roughly 13% of the screen width by 20% of the height. Below it, two inset readouts show health (green) and mana (blue-white) as "650 / 775" numbers. The arch differs per race. Orc: wood with a shaggy fur trim over the arch, flanked by the tusks. Night Elf: a bark arch with leaves. Human: a stone arch with a thin gold rim. Undead: dark iron and stone with bone ribs. *(From memory, not in the screenshots: the portrait is a live 3D bust that talks and animates.)*
- What works, and why: the portrait is the one place where the console opens up into an arch, so it reads as a shrine for the selected unit. The numbers sit in their own inset plaques below it, never on the ornament.
- What doesn't: the arch crops the head tightly at low resolution.
- An idea for disc: the **battle unit card** portrait could sit in an arched niche cut into the card, rather than being a small square at the card's top right. An angel's wings could *form* the arch, with the wingtips meeting at the top. Wings that build the window are part of the frame. Wings stuck on a corner are what the user calls bolted on.

### Warcraft III Reforged — the HD Undead console
- Image: `wc3-reforged-console-undead-1.jpg` (bottom; Arthas, Level 4 Death Knight)
- What's there: this is the same layout redrawn at 1920x1080, and the console is now about 28% of the height but narrower than the screen. The portrait niche is a pointed gothic arch of dark iron with claw-like spikes curling over its top. Small skulls sit at the joints of the top edge, and violet gem studs run down the pillars. The minimap frame is weathered stone, the info panel's title "Level 4 Death Knight" is set in a gold-rimmed black plaque, and the inventory has a gold "Inventory" label. Ability buttons are framed squares with a green highlight on the active one.
- What works, and why: at higher resolution the ornament keeps the same rule. Skulls go only where two pieces join, gems only on the pillars, spikes only on the arch. The amount of detail rises evenly across the whole console, so no single piece looks more rendered than the rest.
- What doesn't: the console no longer spans the screen, and the corners show the bare world. Some players disliked this, as the next entry notes.
- An idea for disc: when sculpted pieces are added to a CSS frame, keep **one level of detail across the whole panel**. If the angel is rendered with fine marble veins and the frame is a flat dark border-image, the gap in detail alone makes the angel look stuck on. Either roughen the frame up to the angel or simplify the angel down to the frame.

### Warcraft III Reforged — floating panels and a hero bust breaking the frame
- Image: `wc3-reforged-blizzcon-preview-floating-panels.jpg`, `wc3-console-human-preview-vs-original-vs-reforged.jpg` (top band: BlizzCon preview; middle: original; bottom: shipped Reforged)
- What's there: the BlizzCon preview broke the console into separate low stone blocks: minimap, info, abilities, inventory. Between them a full-body 3D Arthas stands *in front of* the HUD line, his shoulders and head rising well above it. The original 2002 version is the continuous stone wall with crenellations. The shipped Reforged version went back to the continuous wall at higher resolution.
- What works, and why: the standing hero is the strongest example in this set of a figure belonging to the HUD. It overlaps the frame in depth, stands on it and casts a presence, instead of sitting in a box. The hero is also unique, a single piece.
- What doesn't: the split blocks lost the feeling of a single object. They read as a modern kit of floating rectangles, and the shipped game reverted to the wall. That is a useful lesson for the user's complaint: splitting into pieces made it feel more generic.
- An idea for disc: on the **battle screen**, the selected unit's figure or angel could stand *on* the top edge of the unit card and break above it, rather than appearing as a small portrait inside it. On the **capitol**, the faction's guardian statue could stand on the frame's base and overlap the painting's edge, in front of the painting and behind the frame's top rail.

---

## Heroes of Might and Magic III

### Heroes III — the adventure-map frame: a thin gold rule and red marbled leather
- Image: `homm3-adventure-map-1.jpg` (the frame round the map, and the right-hand column)
- What's there: the map view is framed by a very thin double gold rule, about 6px at 1080p, with a small ruby cabochon at each corner. The right column is about 18% of the width, and the bottom strip about 7% of the height. Both are dark red marbled leather with gold filigree only at the joins and corners. Every sub-panel is a recessed brown square framed with a thin gold line: hero list, town list, eight red command buttons, hero summary, army. *(From memory, not in the screenshots: this red is the player's colour, and the whole interface re-tints for blue, tan, green and the others.)*
- What works, and why: the ornament is minimal, and every panel is built from the same three materials: leather, gold rule and recessed brown. Nothing is a sculpture, so nothing can look stuck on. The richness comes from material and colour, not from figures.
- What doesn't: it is flat and very busy at 1080p, and the eight command buttons are hard to tell apart.
- An idea for disc: the **map side panels** could use a restraint test. Remove every corner piece and check whether the panel still reads as part of the kit through material alone (iron, black stone, marble). If it does, sculpture can return only at a few chosen points: a keystone, a portrait niche, the end turn. If it doesn't, the base material is the problem, not the angels.

### Heroes III — compass letters cast into the minimap frame
- Image: `homm3-adventure-map-1.jpg` (top right; minimap)
- What's there: the square minimap has a gold filigree frame on red leather. The letters N, S, E and W are set into gold scroll cartouches in the middle of each side, and the cartouches are part of the frame's curls. Small gold brackets sit at the corners. The minimap is about 15% of the width.
- What works, and why: the most decorative parts of the frame are also the only labels the minimap needs. The ornament *is* the legend.
- What doesn't: nothing much; the letters are slightly blurry in HD.
- An idea for disc: the **map screen** has no minimap, so the lesson carries over through placement. Put the information a panel needs into its ornament, for example the faction sigil on the warband panel's crest, or the turn number in the turn bar's keystone. Don't put generic flourishes there.

### Heroes III — the town painting as the whole screen
- Image: `homm3-town-necropolis-1.jpg` (top 62%), `homm3-town-castle-1.jpg` (top 60%), `homm3-town-inferno-painting-1.jpg` (the Inferno painting alone)
- What's there: the top of the town screen is one wide pre-rendered painting of the town. Necropolis is grey stone gothic towers, a graveyard full of headstones, a skull-topped pyramid and a red-lit gateway, under a dark sky with smoke. Castle is white towers with blue roofs and banners, timbered houses and a floating cloud palace. Inferno is a black castle in lava light with red-glowing windows and a fiery demon-god apparition in the sky. *(From memory, not in the screenshots: each building is a hotspot that names itself on hover and opens its screen on click, and buildings appear in the painting as they are built.)*
- What works, and why: the painting is the menu, so the town's identity carries the screen and the UI only has to be a strip beneath it. Faction identity lives almost entirely in the painting: the same strip is red for both Necropolis and Castle.
- What doesn't: the painting fixes a 4:3 frame. In HD it sits inside wide leather margins, as `homm3-town-necropolis-1.jpg` shows.
- An idea for disc: disc's **capitol** already has a painting of the city. If the painting were clickable, with hover outlines on the cathedral, the market or the barracks, the medallion tab rail could shrink. This is a presentation change: the existing tabs (City, Garrison, Research, Spells) would get hotspots in the painting. The user should decide if they want it.

### Heroes III — the town's two-row army strip with a filigree divider
- Image: `homm3-town-necropolis-1.jpg` (bottom centre), `homm3-town-castle-1.jpg` (bottom centre)
- What's there: two rows of seven creature portraits, each with a stack count in the bottom right. The top row is the town garrison; on the left of it, a hanging red-and-gold player banner stands in for "no hero in the garrison". The bottom row is the visiting hero's army, led by the hero's portrait. A gold filigree rail with repeated scroll motifs separates the rows. To the left is the town portrait, the town name ("Blackquarter") on a brown plaque, the gold income, and a 4x2 grid of dwelling icons with "+45"-style growth numbers. A big gold check-mark button sits bottom right. The strip is about 38% of the screen height.
- What works, and why: the two rows mirror each other with one ornamental line between them, so swapping units between garrison and hero is visually obvious. The empty-hero state is a banner, an object, rather than a blank.
- What doesn't: the filigree rail is the one obviously repeated motif, and its copies show.
- An idea for disc: on the **capitol garrison** tab, a visiting warband and the garrison could be two facing rows with one carved divider between them. A trim of the faction's material is better than a gold rail. When no warband is visiting, a single object could fill the row (a closed gate, a banner) instead of empty boxes.

### Heroes III — the fort overview: dwelling cards
- Image: `homm3-fort-overview-necropolis-1.jpg`
- What's there: under a red title bar reading "Castle", seven cards in a 2-2-2-1 grid fill the screen. Each card has three parts. On the left is the dwelling building, a small painted scene, with its upgrade name and "Available: N". In the middle is a full-figure painting of the creature against a dark backdrop. On the right is a stat column of six rows (Attack, Defense, Damage, Health, Speed, Growth), each with a small icon in a square. The empty spaces either side of the last card are filled with a dark embossed leather relief, not left blank.
- What works, and why: every card has the same structure, so the eye compares across them. The creature art is large and the numbers are small, so the screen is mostly pictures.
- What doesn't: there's a lot of red. The stat icons are tiny.
- An idea for disc: the **codex units page** could use this pattern of building, unit and numbers on one card. The unit art would be big and the stats a short icon column. Leftover cells in the grid could be filled with a dim relief, as Heroes does here, instead of an empty background.

### Heroes III — the mage guild as a room you look into
- Image: `homm3-mage-guild-dungeon-1.jpg` (the Dungeon town's mage guild)
- What's there: the whole screen is a painted interior: a stone wall with arched niches, a big arched window onto the underground town, a wooden bookcase, a long carved desk with a brass telescope, glass flasks and a book with a red ribbon marker. Each known spell is a small parchment scroll with an ink illustration, set *into* a niche, a shelf or the desk's lower compartments. The only UI is a one-line status strip ("Haste") and the resource bar.
- What works, and why: the spell list is furniture. Where a scroll sits says which guild level it belongs to: top niches, shelves, the desk. No frames are needed because the room is the frame.
- What doesn't: the scrolls are small, and some are hard to read at a glance.
- An idea for disc: the **capitol Spells tab**, and perhaps Research, could be a single painted room for each faction. A Jilliath scriptorium could have spells as illuminated pages on lecterns. The Sylvan could have something grown, if the user wants it. The room would replace the list on dark stone. This is a lot of art, so try it on one tab first.

### Heroes III — the battle screen's thin command strip
- Image: `homm3-battle-1.jpg` (bottom)
- What's there: the battlefield painting fills the frame. The only HUD is a single strip about 7% of the screen height. On the left are four square buttons with brown-on-brown embossed icons: options, surrender/flag, retreat, auto-combat. The battle log sits in a red-edged inset in the middle ("The Ballista does 4 damage. / Next round begins."), with small scroll arrows. On the right are three more embossed buttons: spellbook, wait, defend. Creature stacks show their count in small purple boxes at their feet ("52", "16"). The hero is drawn in the battlefield's top left corner on horseback.
- What works, and why: the battlefield gets about 93% of the screen. The command strip uses the same leather and embossing as everything else. The hero standing *in* the battlefield is a diegetic portrait.
- What doesn't: there's no turn-order display in the original. The embossed icons are low-contrast.
- An idea for disc: the **battle log** could live in a narrow inset in a bottom strip, as Heroes does, instead of a tall side panel. The ability bar would sit beside it in the same strip. The leaders of both squads could stand in the battlefield's corners as figures instead of only appearing in the unit card.

### Heroes III — the hero screen: a paper-doll silhouette
- Image: `homm3-hero-screen-1.jpg` (centre panel)
- What's there: on the left, four primary stats (Attack, Defense, Power, Knowledge) are shown as large icons over numbers, then a 2-column grid of skills. Each skill is an icon tile with a two-line label ("Expert / Wisdom"). On the right, a red silhouette of a robed figure outlined in gold sits on the leather, with square artifact slots placed around and over the body: head, neck, hands, torso, feet, and so on. Below it is a backpack row with arrows. The army runs along the bottom and the player banner sits on the right.
- What works, and why: the slots sit *where they go on a body*, so the layout explains itself. The silhouette is plain and flat, so it never competes with the item icons.
- What doesn't: there are many empty brown squares when the hero has little equipment.
- An idea for disc: the **leader tree** or a unit's detail in the **codex** could use a silhouette-based layout, with traits or ability slots placed on or around a faint figure of the unit type. Only do this if disc ever gets slots of this kind. It's a layout idea, not a mechanic.

### Heroes III — resources and date in one bottom strip
- Image: `homm3-adventure-map-1.jpg`, `homm3-town-necropolis-1.jpg`, `homm3-fort-overview-necropolis-1.jpg` (bottom row of each)
- What's there: on every screen, the bottom edge holds the same strip: seven resource icons with counts (wood, mercury, ore, sulfur, crystal, gems, gold), each in its own red cell, then "Month: 1, Week: 2, Day: 1" in a cell on the right. A one-line status/hover text bar sits right above it ("Lots of Obsidian Gargoyles", "Empty", "Exit Castle").
- What works, and why: the same strip is on every screen, in the same place, so it acts as the floor of the interface. The hover-text line is a cheap tooltip that never covers anything.
- What doesn't: the resource cells are all the same size, so a big gold number squeezes.
- An idea for disc: disc's **map turn bar**, the **capitol header** and the **battle** screen could all share one floor or ceiling strip. Gold, the second resource and the turn would sit in the same position on every screen, and a single hover-text line would sit beside them. A strip that persists across screens makes the HUD feel like one thing.

---

## Heroes of Might and Magic V

### Heroes V — initiative strip, silver portrait frame and radial action cluster
- Image: `homm5-battle-initiative-bar-1.jpg` (bottom)
- What's there: the battlefield is 3D, with a green grid showing the movement area. Bottom left is a large portrait of the active unit (about 20% of the height) in a silver frame with curled scroll corners and a stack-count badge ("9"). To its right is a long strip of small square portraits, each with a stack count, in the order the units will act. The first is the active unit, and allies and enemies are mixed. A one-line combat log ("Combat started.") sits under the strip. Bottom right is a round radial cluster: a large central shield button with four smaller round buttons around it (helmet, crossed swords, banner, cog), all in silver-grey metal. *(From memory, not in the screenshots: the strip is the ATB initiative queue, and the shield is Defend.)*
- What works, and why: the turn order is a plain row of faces read left to right, and the active unit is shown big at the strip's origin, so the strip seems to come out of the portrait. The radial cluster gives the main action a single obvious centre.
- What doesn't: the strip's portraits all look alike, and allies and enemies are told apart only by small borders.
- An idea for disc: disc's **turn-order strip** could start from the active unit's large portrait, so the queue grows out of it, rather than sitting separately at the top. The **ability bar** could centre on one larger main action with the others around it, instead of five equal squares.

---

## Darkest Dungeon

### Darkest Dungeon — the torch meter
- Image: `dd1-battle-hud-torch-1.jpg` (top centre)
- What's there: a black iron torch sconce sits at the top centre of the screen, with a burning orange flame. Behind it is a black spiked ring like a sun or a crown of thorns. A thin glowing orange line runs out horizontally from the torch to either side, across about 46% of the screen width, with small tick marks along it. The line is brighter close to the torch. The sconce is about 7% of the screen width. *(From memory, not in the screenshots: the torch is the party's light level, which falls as you explore and changes combat and rewards. The line shortens as the light fades.)*
- What works, and why: a game value is shown as a physical object, a torch, whose light also falls on the scene. The orange line doubles as the top border of the play area, so a gauge and a frame edge are the same thing. It's the only lit element at the top, which makes it the obvious focus.
- What doesn't: it means nothing until you learn it, because there's no number.
- An idea for disc: disc's **battle round** or a squad's morale-like value could be shown as an object, but only for a value disc already has. Inventing a torch mechanic would break the rules. The general move is that a line which is a border can also be a gauge. The battle screen's top edge could be a thin beam that fills or burns down with the round, if the round has a length. Otherwise, the end-turn or resolve control could be the one lit object.

### Darkest Dungeon — markers, health and stress under the figures
- Image: `dd1-battle-hud-torch-1.jpg` (under the figures), `dd1-camping-inventory-1.jpg` (same row)
- What's there: under each hero is a short red health bar, and under that a row of 10 tiny square pips. These are the stress pips, mostly empty grey, with filled white ones on the left. The active hero has a gold bracket on the floor under them, an open-topped square shape. Targetable enemies get a red bracket with three spikes rising from it, like a crown or caltrops. An enemy's health bar is a thicker red slab. Nothing has a frame; all of it sits directly on the dark floor.
- What works, and why: the squad information stays with the figure, so you never look away from the fight. The selection bracket and the target crown are drawn in the same thin-line style as the HUD panel below, so they belong to it.
- What doesn't: 10 pips at this size are hard to count.
- An idea for disc: on the **battle screen**, the squads' 3x3 tiles could carry the selection and target brackets as thin floor marks in the HUD's line style, instead of coloured boxes and plinths. The health bar under each figure could be a slim slab, with any second value as small pips.

### Darkest Dungeon — the bottom panel and its engraved reliefs
- Image: `dd1-battle-hud-torch-1.jpg` (bottom third), `dd1-affliction-hopeless-1.jpg` (bottom third)
- What's there: the bottom third of the screen is a near-black panel divided by thin grey double lines into compartments. On the left are the hero's portrait, name in a gold blackletter display face ("Wilma") and class ("Grave Robber"), then a row of 5 skill icons, then health (red heart, "20.0/20.0") and stress (dark mask icon, "10.0/100"). Below these is a stat list (ACC, CRIT, DMG, DODGE, PROT, SPD) in plain sans, and two equipment cards. On the right is the dungeon map grid with room nodes. Flanking the panel at the far left and far right are two **engraved reliefs**, mirrored: a skeletal knight with a halo of spikes, holding a sword, with a scroll banner inscribed in Latin-looking letters across its feet. They are printed dark grey on black at very low contrast. Small gold-trimmed tabs (a pawn, comedy/tragedy masks) sit on the panel's left edge.
- What works, and why: the reliefs give the panel ornament without competing with anything, because they're nearly the same value as the background. They read as an engraving *in* the panel rather than an object on it. There is only one relief, mirrored once; nothing else repeats. The panel itself is just lines on black, so the ornament never has to fight a busy frame.
- What doesn't: the panel is a lot of black, and on a dim monitor the reliefs vanish entirely.
- An idea for disc: the **battle screen**'s side panels (unit card, battle log) could carry one large, low-contrast relief each. It could be an angel engraved into the black stone, at maybe 10–15% contrast, rather than a high-contrast statue on the corner. An engraving can't look bolted on because it's cut into the surface. A mirrored pair, one per side, gives "more elements" without copies.

### Darkest Dungeon — the affliction moment
- Image: `dd1-affliction-hopeless-1.jpg` (centre)
- What's there: the game freezes and darkens. A huge illustration of the hero, screaming and clawing at her head, bursts out of a red-orange sunburst. Behind her is a black spiked ring, the same shape as the ring behind the torch. A black bar below names the state, "Hopeless", in the gold blackletter face. The bottom panel stays visible, and her stats show reduced values in red.
- What works, and why: a key state change gets a full-screen moment in the HUD's own vocabulary: the spiked ring, the gold blackletter title and a two-colour palette. It reuses the torch ring's shape, so the emblem means "something has happened to the light and the mind".
- What doesn't: it interrupts play every time.
- An idea for disc: one reusable "moment" layout for the rare big events disc already has, such as a leader falling, a city captured or a round won. It would use the same emblem shape as the turn bar's keystone, so the HUD has a recurring motif rather than a new frame for each popup.

### Darkest Dungeon — the hamlet: crest and banner header
- Image: `dd1-hamlet-roster-1.jpg` (top left; also on every hamlet screen)
- What's there: top left, a heraldic crest: a shield showing a tower, in red, white and gold, with a black crow perched on top and black wings spreading behind it. It is about 10% of the screen width. Out of the crest runs a torn black brush-stroke banner, about 40% of the width, carrying "The redhookjohn Estate" in large pale blackletter. The banner's right end frays out like dry paint.
- What works, and why: the banner seems to *come out of* the crest. The crest overlaps the banner's left end, so the two are one object. The banner's edge is painted, which matches the game's ink-and-brush art, so the header belongs to the world's drawing style rather than to a UI kit.
- What doesn't: the brush stroke is a strong style choice and won't suit every game.
- An idea for disc: the **capitol header** could have the faction's crest overlap the start of a single long title band that runs out of it. That would replace the separate "Capitol" plaque and the coin counter. This band could also be where the faction's material shows most.

### Darkest Dungeon — the roster list
- Image: `dd1-hamlet-roster-1.jpg` (right column), `dd1-estate-map-1.jpg` (right column)
- What's there: on the right is a column of hero cards, about 18% of the width, behind a "Roster Full" header with four small filter icons. Each card shows a square portrait, the name in gold blackletter, a row of stress pips, a weapon level and an armour level as small icons with numbers, and on the right a coloured heraldic shield with a number in it (red 5 and 6, green 3, blue 4, white 1) above a thin vertical bar. The card's left edge is coloured to match the shield. Chevron arrows at the top and bottom of the column scroll it. *(From memory, not in the screenshots: the shield is the hero's level, and the bar is experience.)*
- What works, and why: a whole unit fits in one compact row, and the coloured shield gives a level you can see without reading. The shield is a heraldic object, not a badge-shaped pill.
- What doesn't: the cards are dense, and the pips and small numbers blur together.
- An idea for disc: disc's **warband panel** on the map could render each unit as a row with a portrait, name, a slim health line and a small heraldic tier mark. Each tier could get its own shape, so a tier is read by shape instead of by text.

### Darkest Dungeon — a hamlet building panel: proprietor, slots, boarded slots
- Image: `dd1-hamlet-tavern-1.jpg`
- What's there: a big dark panel opens over the dimmed hamlet. The left half is a large painted portrait of the barkeep, leaning on the bar with a tankard, about 30% of the screen. A title block with a tankard icon reads "Tavern". The right half lists three activities (Bar, Gambling Hall, Brothel), each with a gold underline and a one-line flavour text. Beside each is a row of three slot cells framed in rough dark wood. Filled slots show the hero inside, doing the activity. Locked slots are **boarded up with planks**. A vertical column of square icons on the far left is a tab rail of all hamlet buildings, and the roster stays on the right.
- What works, and why: locked slots are shown as a physical object (planks), not a greyed-out box. The proprietor portrait makes each building a place with a person. The building tab rail is plain icons, and the art in the panel does the decorating.
- What doesn't: the panel covers the hamlet painting completely.
- An idea for disc: the **capitol tabs** could each have one large figure painted on the left, a keeper for the garrison, the research or the spells. Disc's locked research branches could be *sealed* in a faction way, such as a wax-sealed page for Jilliath or roots grown over for the Sylvan, instead of just dimmed.

### Darkest Dungeon — the bottom bar: gold, heirlooms, one call to action, objects as buttons
- Image: `dd1-hamlet-roster-1.jpg`, `dd1-estate-map-1.jpg` (bottom strip)
- What's there: the bottom strip is about 7% of the height. On the left is a heap of gold coins with a purple pouch and "22,700" in large display numerals, then four small heirloom icons with counts. In the centre, the one big action, "Embark" (or "Provision" on the map screen), is written in large red blackletter on a dark brush-stroke band. On the right are four **objects** used as buttons: a rolled scroll, a treasure chest, a red-bound book and a lit candle.
- What works, and why: there's exactly one call to action, it's centred, and it's the only red text. The menu buttons are things, not glyph icons, so each button is a small piece of the world.
- What doesn't: you have to learn which object does what.
- An idea for disc: disc's **end-turn button** on the map could be the single red-lettered or most lit action, centred in the bottom strip. The menu, codex and settings could become small faction objects, such as a sealed book for the codex or a candle for settings, rather than text buttons.

### Darkest Dungeon — the character sheet: a portrait behind the header, quirk crest
- Image: `dd1-character-sheet-1.jpg` (centre panel)
- What's there: a large dark panel opens over the hamlet. The hero's painted face, a jester's masked face, is cropped big and dim *behind* the name header ("Chester / Veteran Jester"), so the art becomes the header's background. A full-length figure stands at the left under a gothic arched window. In the middle, under "Quirks", positive quirks are listed in white on the left and negative ones in red on the right. A glowing comedy/tragedy mask crest sits between the two lists. The right side has "Combat Skills" with preferred-position dots (gold) and preferred-target dots (red), skill squares with level numbers, "Camping Skills", "Resistances" as icon rows with percentages, and "Diseases" over a faint germ-shaped watermark. Section titles sit on low, dark brush-stroke bands.
- What works, and why: the header is the portrait, not a box beside it. The good and bad lists face each other across one emblem, so the emblem is the hinge of the layout. Faint watermarks (the germ) mark sections without boxes.
- What doesn't: it's a lot of small text.
- An idea for disc: the **codex unit page** and the **battle unit card** could set the unit's portrait large and dim behind its name, so the card's top band *is* the art. Opposed lists, such as strengths against weaknesses or allies against enemies, could face each other across one central faction emblem.

### Darkest Dungeon — the estate map: named banners over a painted map
- Image: `dd1-estate-map-1.jpg` (centre)
- What's there: a painted map of a dark cliff island at dusk. Each dungeon is a short black banner with its name in blackletter ("Ruins", "Warrens", "Weald", "Cove", "Darkest Dungeon"). A red progress line sits under each name, a skull with a number sits at the right end, and a small icon marks a required item. Under the banners are round medallion nodes in green, orange or red with icons, one per expedition. A speech box from a hero ("I yearn for adventure!") floats bottom right. Four hero portraits for the party sit in a framed tray at the bottom centre.
- What works, and why: each location gets one compact label object (banner, progress line, skull level). The nodes are medallions that sit on the painting without frames. The party tray is the only framed thing in the middle.
- What doesn't: medallion icons of the same colour are hard to tell apart.
- An idea for disc: **map labels** ("Dungeon · 5 guards", "Capitol (yours)") could become small banners with the name, a skull or tier mark, and an owner-colour underline, instead of plain dark text boxes. The labels would then share one designed object.

### Darkest Dungeon — the camping screen: wax-seal quest marker and speech box
- Image: `dd1-camping-inventory-1.jpg`
- What's there: top left, a red wax seal with an embossed cup emblem marks the quest. Beside it is the quest title "Reclaim Relics of the Light" in gold blackletter, with "Gather 3 Holy Relics." in small grey sans below. A black speech box with a thin white double border and a pointed tail holds a hero's line. The bottom right panel is an inventory grid of item cards with small counts. Food, a shovel, a bust and gold are shown as drawn objects.
- What works, and why: the wax seal turns the quest into a document. The speech box uses the same thin double line as the bottom panel, so even the speech bubbles are part of the kit.
- What doesn't: there's little here that's new beyond the seal.
- An idea for disc: the **map's objective or turn messages** could be anchored by a seal object, with the faction sigil pressed in wax for Jilliath's inquisition. Speech or event boxes would use the same edge line as the panels.

### Darkest Dungeon II — the stripped battle HUD with turn order as faces
- Image: `dd2-battle-hud-1.jpg`
- What's there: there is almost no panel. The scene fades to black at the bottom, and the HUD floats on the black. Top right is "Round 1" in a large display face, then the turn order as four small portrait heads. Each head sits in a pointed chevron-topped frame, and the frame's top edge is blue or gold to mark the side. A down-arrow shows there are more. The torch is still at the top centre with its orange line. Under each figure are a red health slab, a dotted pip row and a small status shield. The active hero has a gold bracket on the floor; targetable enemies have blue brackets. Bottom left are the hero's name ("Audrey") in blackletter with a pencil-sketch portrait and plain stat text below. In the bottom centre, the hovered skill's name ("Thrown Dagger") and type ("Ranged") sit over a row of dots, four gold and four blue. *(From memory, not in the screenshots: these dots are the positions the skill can be used from and the positions it can hit.)* Below that is a row of square skill frames, with gold corner brackets on the selected one, and two diamond buttons for swap and pass.
- What works, and why: dropping the frames lets the art carry the screen, and the HUD is just type, thin lines and a few framed icons. The launch-and-target dots put a skill's position rules on one line. Turn order is faces only, which is very fast to read.
- What doesn't: without the panel the screen loses some of DD1's character, and the black void at the bottom is large.
- An idea for disc: in the **battle screen**, disc's target and area mini-grids already do the job of DD2's dots. Show them directly above the ability bar for the *hovered* ability, as DD2 does, instead of inside the unit card. Turn-order faces could take a chevron-topped frame whose top edge carries the side colour. That drops the red and blue letter tiles.

### Darkest Dungeon II — the torch line on the road
- Image: `dd2-travel-stagecoach-1.jpg`
- What's there: in the road view, the party's stagecoach drives away from the camera. A burning torch is mounted on its roof, and the same thin orange light line from the battle torch meter runs horizontally out from the flame. On the left is a dark panel with the region name ("The Tundra") in large faded blackletter, and a branching route map of triangle nodes joined by dotted chains. Top left are three wheel icons and three shield icons. Along the bottom are the party's portraits with names in blackletter and red health bars, each in a slanted dark tab. Bottom right reads "40 leagues to Inn", and a speech box shows a hero's line.
- What works, and why: the torch is now *in the world*, on the coach, and the gauge line comes out of a real object. The same motif appears in battle and on the road, which ties the two screens together.
- What doesn't: the left panel's text is very low-contrast.
- An idea for disc: give the **map** and **battle** screens one shared motif that appears on both. It could be the keystone medallion, a particular line or a sigil. When the player moves from map to battle, something recognisable carries over, and the HUD reads as one system.

### Darkest Dungeon II — the inn: names with brush-stroke health bars
- Image: `dd2-inn-1.jpg`
- What's there: four heroes sit in armchairs round a table by a fire. Under each is the name in gold blackletter, then a red brush-stroke smear with "31/31" printed across it, then a row of pips. The inn's name, "The Limping Mule", sits top left beside a hanging wooden tavern sign showing a hooded rider. The right panel is an item grid with category icons at the top. Along the bottom is a row of chevron-shaped arrow buttons with icons, ending in a faded "Rest".
- What works, and why: the health bar is drawn as a paint stroke, so it shares the game's brushwork. The tavern sign is the screen's emblem and hangs like a real sign.
- What doesn't: the chevron row at the bottom is very faint.
- An idea for disc: each **capitol tab** could have a hanging sign as its emblem instead of a round medallion. Health could be drawn in the faction's material, for example a gilded line for Jilliath, while it still reads as a bar.

### Darkest Dungeon II — the location title card
- Image: `dd2-location-title-card-1.jpg`
- What's there: a full-screen painted scene of a candle-covered altar under shafts of light. A very thin single-line frame is inset from the screen edge, with a small diamond notch at the middle of the top and bottom lines. The title, "Altar of Hope", sits in gold blackletter at the bottom centre between two thin horizontal rules.
- What works, and why: the frame is almost nothing, a hairline with two diamonds, which lets a painting be a screen without a heavy border. The diamonds give the hairline a centre.
- What doesn't: nothing; it does what it's meant to.
- An idea for disc: the **new-game screen** and **codex** headers, and transitions such as entering a dungeon or a city, could use a hairline frame with a single central mark. That would leave the heavy carved frames to the in-game HUD, so the two weights don't compete.

---

## Total War: Warhammer

### Total War: Warhammer — the porthole portrait on chains
- Image: `tww1-battle-vampire-counts-1.jpg` (bottom left), `tww-faction-bars-vc1-dwarfs1-vc3-compared.jpg` (left end of each band)
- What's there: the general's portrait is a round brass porthole, about 20% of the screen height in diameter, with a thick polished rim and a small brass shelf or bracket beneath it. Chains run from it up and off the screen's left edge, as if it hangs there. The rim changes per faction. In the Vampire Counts shot from the first game it is plain brass. The Dwarf version has a toothed, cog-like outer ring with spikes and smaller round brass buttons clustered round it. The Vampire Counts version in the third game is plain brass again, with a dark green backdrop behind the portrait.
- What works, and why: the portrait is a heavy object that is *held up* by something, chains, so it has weight and a reason to be where it is. The round form contrasts with the rectangular unit bar beside it.
- What doesn't: in the third game the faction differences in the porthole shrank to a backdrop colour.
- An idea for disc: the **battle unit card** portrait, or the **map warband** leader portrait, could be a round medallion visibly *hung* from the panel above it or held by a figure. Disc's angels could hold the portrait medallion between them, with hands on the rim. A figure holding something is attached; a figure placed next to something is not.

### Total War: Warhammer — the battle top bar ends: skeletons holding a book and a horn
- Image: `tww1-battle-vampire-counts-1.jpg` (top left and top right corners; top centre)
- What's there: the top-left button cluster (menu, encyclopedia, help and similar round brass buttons with red centres) ends in a cast brass winged skeleton. It has bat wings spread and holds up an open book. The top-right cluster (pause, slow, play, fast, faster) ends in a mirrored winged skeleton blowing a long trumpet that points at the speed buttons. In the top centre, the battle timer ("55:12") and the balance-of-power bar (yellow and red, with crossed swords in the middle) sit on a brass band. A shield with the faction's red dragon emblem caps it on the left, and a curling brass scroll ribbon on the right. All of it is the same brass.
- What works, and why: the end caps are *different* figures, a book on one side and a horn on the other, and each is doing something related to the buttons beside it: help or reading, and speed or signalling. They are the same cast material as the bar, so they read as the bar's ends rather than as statues next to it. This is the clearest example in the set of sculpture that is part of the structure and also has a job.
- What doesn't: it's dense; the round buttons are small.
- An idea for disc: on the **map turn bar** and the **battle** top bar, use **two different angels**, not one copied angel. One could hold a closed book next to Menu or Codex. The other could raise a trumpet or a bell next to End turn or Resolve. Each angel is in the same material as the bar and gestures at its control. This answers both halves of the user's note at once: the angels attach because they act, and there are fewer copies.

### Total War: Warhammer — the unit-card strip, three faction versions
- Image: `tww-faction-bars-vc1-dwarfs1-vc3-compared.jpg` (three bands: Vampire Counts in the first game's battle, Dwarfs in the first game's campaign, Vampire Counts in the third game's battle)
- What's there: a long horizontal strip of tall unit cards, about 64% of the width and 17% of the height. Each card has a painted unit image, a count on a green bar at the top, and a round type icon at the bottom. Under the strip is a brass tray with ability or order buttons. The strip's frame changes per faction:
  - **Vampire Counts, first game**: a purple fringe along the strip's bottom. The ends are brass, with bat wings folded down the lower corners and chains hanging to the tray, and skull bosses flank the button tray.
  - **Dwarfs, first game**: no purple. A red title plaque reads "Ungrim Ironfist", flanked by round skull-faced brass studs and arrowheads. The tray's ends are squared-off blocky brass shaped like a hammer head or an anvil.
  - **Vampire Counts, third game**: control groups are coloured tabs above the cards (red 1, orange 2, yellow 3, green 4, olive 5, 6), each with a lock icon, and unit counts sit on purple strips. Brass ends with skulls stay, but the bat wings are gone.

  On the right of each band is the magic or turn dial. Vampire Counts in the first game has a brass disc with a blue glass orb and the number "13". The Dwarfs have a cluster of eight round red-centred brass buttons around a big hourglass, with small number badges. The third game uses a brass disc with an hourglass, compass points, and "33" in the middle.
- What works, and why: the cards and their order stay the same, so players learn one layout. The faction shows in the frame's *ends and edges*: bat wings, cogs, the fringe colour. That is where ornament costs least and is seen most.
- What doesn't: the third game's version is more generic, and the colour-tab group labels add a lot of noise on top of the frame.
- An idea for disc: one ability bar and one turn strip for all factions, with faction ends. The bar's two end caps and its fringe colour would change per faction, and the cells stay the same. Each faction then needs only two pieces, a left end and a right end, which is a small set to commission.

### Total War: Warhammer — a radial dial cluster for the end turn
- Image: `tww-faction-bars-vc1-dwarfs1-vc3-compared.jpg` (right end of the middle band)
- What's there: a big round button with a brass hourglass on a dark red face, about 12% of the screen height. Seven smaller round brass buttons are arranged around it in a ring, with icons for a dragon, a gold pot, a helmet, a book and others, and small number badges ("3", "36", "4"). It is on the bottom right, chained to the screen edge.
- What works, and why: the end turn is the biggest, most central object, and all the secondary panels orbit it. Number badges on the ring give state without opening anything.
- What doesn't: eight round buttons of the same style are hard to tell apart.
- An idea for disc: disc's **map end-turn button** could become the centre of a small cluster, with menu, codex and leader tree as small satellites around it. That would replace a lone button floating at the bottom centre with a rail of separate buttons elsewhere.

### Total War: Warhammer III — Khorne: locked options chained shut
- Image: `tww3-khorne-unholy-manifestations-1.jpg`
- What's there: a dark blood-red panel with a brass header shaped like an axe blade or arrow, with spiky edges, reading "Unholy Manifestations". Beneath it is a short progress bar with skulls impaled on pins and red-gem end caps. Four tall cards follow. The first is unlocked: bright red, a Khorne rune ringed by small skulls, "Eternal War". The other three are dim, with their emblem faded, and two brass **chains cross diagonally in an X** over each card, with "Corruption required: 1000/2000/3000" printed across them. The panel's bottom corners are brass cut into the **shape of the faction rune** itself, and the "Perform" button is flanked by skull bosses.
- What works, and why: the lock is a physical object, chains, in the same brass as the frame. The corner pieces are the faction's sigil shape rather than generic scrolls, so the faction lives in the frame's corners.
- What doesn't: everything is red, so the only contrast comes from brightness.
- An idea for disc: locked **research branches** and **spells** in the capitol could be crossed with something physical in each faction's material, such as iron bands or seals. A panel's corner pieces could be cut as the faction's sigil instead of carrying a separate statue. A corner shaped like the sigil can't look bolted on.

### Total War: Warhammer III — Nurgle: a painted scene as a whole screen
- Image: `tww3-nurgle-plague-cauldron-1.jpg`
- What's there: the background is a full painting of a huge horned, green, grinning demon stirring a glowing green cauldron. Three round empty ingredient slots float over the cauldron's mouth, two filled with plague icons and one empty. Dark red side panels with bronze edges hold "Base Plague" (five round medallion icons) and "Symptoms" (a grid of icons), with a tooltip, on the left, and "Plague Effects" text on the right. A spiked bronze title plaque sits at the top ("Plague Cauldron"), with a red plaque button "Summon Plague Cultist" at the bottom.
- What works, and why: the action, combining symptoms, happens *in the painting*. The slots sit where the ingredients would go, so the scene explains the mechanic. The side panels are plain, so the painting stays the star.
- What doesn't: the tooltips and text panels are generic beside the painting.
- An idea for disc: a **capitol** tab where something is made or chosen, such as research or recruiting, could put its slots *into* the painting at the place where it happens. That might be a lectern, a forge, or a grove's heart for the Sylvan. The surrounding panels would stay plain.

### Total War: Warhammer III — Nurgle: building chains drawn as wreaths
- Image: `tww3-nurgle-building-wheels-1.jpg`
- What's there: instead of a tree, each building chain is a **circle**: a wreath of red Nurgle iconography (flies, skulls and leaves) with round building medallions placed around it, numbered I to VIII, and small tier cards. Buildings that can't be built are crossed out with red X marks. The circles sit in big tinted columns (red, purple, green) labelled by category, for example "Advanced Military". Below is a row of settlement cards with building slots. Small panels show Growth, Income, Control and Corruption in red header plaques, and a dark tooltip panel sits on the right.
- What works, and why: the layout's shape is the faction's idea, a cycle of growth and decay. The ornament (flies, skulls, vines) *is* the connecting line between the nodes. The decoration does the work of a tree diagram's lines.
- What doesn't: it's hard to read at first; circles are a less familiar structure than a tree.
- An idea for disc: the **Sylvan**, a grove of life and rot, are the natural candidate for a research or leader tree drawn as a growth ring or cycle. The lines between nodes would be roots or vines, which double as the decoration. Jilliath could use a vertical, hierarchical layout, such as a stained-glass window or a ladder. This would be the user's call per faction.

### Total War: Warhammer III — the Elector Counts: a circular map medallion
- Image: `tww3-empire-elector-counts-1.jpg`
- What's there: on the left is a round map of the Empire's provinces in flat political colours, set in a bronze ring engraved with Roman numerals I to XXIV like a dial. Round portrait medallions of the counts are pinned onto their provinces, each with a small heraldic badge. The emperor's portrait glows gold with a name banner. On the right is a red-cloth panel with **laced edges**, rope zig-zagged through brass pins down both sides, holding a heraldic shield, a portrait in a tall gilded frame, and plain text. A bronze title plaque with gryphon-like curls reads "Elector Counts".
- What works, and why: a political overview is turned into one object, a medallion map. The cloth panel's lacing is a cheap repeating edge that reads as *cloth* rather than as UI, which gives the panel a material.
- What doesn't: the map medallion is crowded and the portraits are small.
- An idea for disc: a **codex** or **map** overview of factions or cities could be a single round map medallion with the leaders pinned on. The lacing idea works for any panel that should read as cloth or vellum rather than stone, for example a Ral-Vitahl panel edged in stitched silk, if the user wants it.

### Total War: Warhammer — the Bretonnia skill tree on parchment
- Image: `tww1-bretonnia-skill-tree-1.jpg`
- What's there: a large parchment field shows a faint **watermark** in the middle: a pale engraving of a heraldic or knightly scene. Skills are laid out as rows of coloured ribbon banners (gold, red, blue). Each banner has a round icon medallion overlapping its left end and small pips on its right end, and thin arrows run between them. On the left is a "Character Stats" column with icon rows and small bar meters, then "Battle Effects" and "Campaign Effects" text lists, each under a header plaque with a round icon medallion on its left. At the top are the name plaques and two red tab ribbons ("Details", "Skills"), with gold coin-shaped badges for the level (30) and skill points (8). The frame is a dark red border with small brass corner pieces. A game logo sits bottom left; this is a marketing shot.
- What works, and why: the watermark gives the big empty parchment depth without adding clutter. The medallion overlapping each banner's end is a tiny case of overlap that makes the medallion and banner one piece. The banner colours sort the skills into lines.
- What doesn't: there's a lot of gold and red, and the banners are very busy.
- An idea for disc: the **leader tree** and **codex** pages could show a faint engraving watermark of the faction's emblem behind the nodes. Each node's icon could overlap the end of its label band. Every node would then be one composed object instead of an icon next to a text box.

### Total War: Warhammer — the race select: shields as tabs, parchment plaques
- Image: `tww1-new-game-race-select-1.jpg`
- What's there: a full-screen battle painting forms the backdrop. On top is a bronze header plaque reading "Select Race", with scrollwork and skull bosses at its ends. Below it is a tray holding five faction **shields** as the tabs: Empire (red and white with a gryphon), Dwarfs (blue with a gold emblem), Greenskins (a round red shield), Vampire Counts (black with a red dragon) and Warriors of Chaos (a dark kite shield with an eight-pointed star). The selected shield glows from behind. Below are a video still on the left and a parchment lore panel on the right with a raised title tab ("Warriors of Chaos"). Three parchment panels follow ("Faction Mechanics", "Top Units", "Playstyle"), each with a deckled torn edge and a raised header tab. A red "Continue" plaque button sits at the bottom.
- What works, and why: the tabs are the factions' own heraldic objects, so the menu is made of identity rather than generic buttons. Parchment with torn edges keeps the reading panels warm and readable against the dark art.
- What doesn't: there's a lot of separate panels; it reads like a form.
- An idea for disc: the **new-game screen** could use each faction's own heraldic object as its selector: a Jilliath angel-sigil shield, and whatever the user decides for Ral-Vitahl and the Sylvan. The surrounding panels could be in the selected faction's material, so the screen changes skin as you pick.

---

## King's Bounty

### King's Bounty: The Legend — a frieze with scroll banners, ivy and knotwork empty slots
- Image: `kb-legend-adventure-hud-1.jpg` (bottom strip)
- What's there: the bottom strip is about 15% of the height. It is a carved sandstone frieze with a blue enamel band inset along it. Large carved **stone scroll banners** curl up from it and wrap around its top edge, with inscribed lettering on them. **Ivy grows over the joins** where the banners meet the frieze. On the left is a resource box (gold, rage, mana), then a hero portrait set in a carved stone niche, then the name on a parchment strip ("Christian Tyler"), level, an XP bar and "Leadership: 2160". Five army slots follow; three hold unit cards with counts, and the two **empty slots show a carved Celtic knotwork tile** in the same blue-stone material. Four blue enamel buttons read Hero, Spells, Quest and Map. A small round porthole of blue sky with clouds sits at the far left corner.
- What works, and why: the scrolls and ivy overlap the frieze in depth. The scrolls wrap around it, and the ivy crosses its seams, so frieze, scrolls and plants read as one carved and grown object. Empty slots are knotwork, not voids.
- What doesn't: the colours are bright and fairy-tale, not gothic. The blue enamel looks plasticky.
- An idea for disc: for the **Sylvan**, growth crossing the seams of a panel, such as roots or rot creeping over joints, is the faction-appropriate version of the ivy. It ties pieces together by crossing them. For any faction, something that *crosses a seam*, like a chain, a banner or a vine, glues two pieces into one. Empty **garrison** and **warband** slots could show a carved tile, as above.

### King's Bounty: The Legend — the round minimap wrapped by a dragon
- Image: `kb-legend-adventure-hud-1.jpg` (bottom right)
- What's there: a round minimap, about 13% of the width, sits in a thick gold ring with small round compass medallions at N, E, S and W, and a "Menu" button set into its lower right. A gold dragon sculpture coils up the right side of the ring, its head rising above the strip, its wing and claw gripping the ring.
- What works, and why: the dragon grips the ring. Its claw is on the rim, so it is visibly holding the map, not posed beside it. It rises above the HUD's top line and gives the strip a silhouette.
- What doesn't: the gold dragon on a stone and enamel frieze mixes two materials.
- An idea for disc: if disc keeps a figure on a panel corner, the figure should *grip* the frame, with hands or wings over the rim, and break the panel's outline upward. It should not sit inside the corner square. On the **capitol**, the angel could clasp the top of the painting's frame and lean over it.

### King's Bounty: Armored Princess — hero corners in battle and a plain log
- Image: `kb-armored-princess-battle-hud-1.jpg`
- What's there: the battle is a 3D hex arena. The top left holds the player's hero portrait ("Amelie") with gold filigree and dragon-head ornaments around it, plus two round counters, one for rage and one for mana *(the meaning is from memory, not in the screenshots)*. The top right mirrors it for the enemy hero ("Arnold Heningem"), with a red name plate instead of a white one. Floating yellow damage numbers and red kill counts appear over the units. Bottom left is a plain text battle log on a dark gradient with coloured names ("Bone Dragons use the ability Poison Cloud..."), with two arrow buttons and a "Menu" button set in a vine-covered corner. Bottom right is a slim spell and ability strip with ivy on its frame.
- What works, and why: the two heroes sit in the top corners as mirrored opponents, so the screen shows who is fighting whom at a glance. The log is just text on a dark fade with no box, which keeps it light.
- What doesn't: the floating numbers clutter the arena badly.
- An idea for disc: the **battle screen** could show both squad leaders as mirrored medallions in the two top corners, with name plates in the side colour. The turn-order strip would sit between them along the top. The **battle log** could lose its tall panel and become text on a dark gradient fade.

---

## Age of Wonders

### Age of Wonders — a dragon draped over the menu panel
- Image: `aow1-dragon-menu-frame-1.jpg` (left half)
- What's there: a pop-up menu panel (Players, Overviews, Settings, End Game, Disk, Help) has round blue glowing icons on a translucent green-grey slab. A painted red dragon is **draped over the panel**. Its body perches on the top edge, its wings fan up behind into the map, and its tail coils down the panel's right side and past its bottom corner. The right side panels (World Map, Events) are plain stone-grey with a carved leaf border.
- What works, and why: the dragon is in front of the panel at the top and the tail is behind it at the side, so it overlaps in both directions. That reads as the creature physically using the panel as a perch. Its silhouette breaks the rectangle completely, and there's one dragon on one panel, not copies.
- What doesn't: the painted dragon is more detailed and saturated than the flat stone panels, which is exactly the "different render" risk. It works anyway because of the depth overlap.
- An idea for disc: try one angel with **front-and-behind overlap** on one panel. A wing could pass behind the frame while a hand or the robe's hem comes in front of it, and the figure would extend past the panel's outline. A test on one capitol corner would show whether depth overlap alone fixes the bolted-on feeling.

### Age of Wonders II — the diplomacy portrait on a stage
- Image: `aow2-diplomacy-portrait-arch-1.jpg` (centre)
- What's there: the speaking wizard's portrait ("Nimue") is framed by a small classical **portico** with teal columns, a lintel and curtains drawn back at both sides, like a stage. The name sits on a black plaque below. Left and right are rows of rival wizard portraits in square frames whose borders are the player colours (purple, yellow), with "War" in red under each. Below is a parchment message panel with a faint compass-rose watermark, "OK" on a stone plaque, and a column of icon buttons (book, key, crown, horn, cog). The frame posts are stone pillars with Celtic knotwork capitals.
- What works, and why: the portrait gets architecture, a stage with curtains, which says "this person is addressing you". The rivals are in plain frames, so the stage singles out who is speaking. The buttons are objects such as a key and a crown.
- What doesn't: the teal curtains clash with the stone-grey.
- An idea for disc: an **event or message** popup on the map, or the **codex** unit page, could set the speaker or unit portrait in a small architectural frame. For Jilliath that might be a tracery window or a pulpit; for Ral-Vitahl, a box at the opera, if the user wants it. That gives the portrait a meaning-bearing frame instead of a square.

### Age of Wonders: Shadow Magic — stone dragons perched on the frame joints
- Image: `aow-shadow-magic-city-screen-1.jpg`
- What's there: the city screen is slate-grey panels on both sides with the map in the middle. The panel frames are **carved stone pillars** with capitals at the top, joined by lintels with Celtic knotwork bands. Where the two side columns meet the bottom bar, two **grey stone dragons crouch on the lintel** facing outward with wings arched, flanking the city name tab ("Sadbam"). Left: "Available Productions" list rows (unit portrait, turns and gold). Right: city portrait, "Size: City", and building rows. Bottom: an event log, a production queue in numbered stone slots (2–5), and a race-happiness meter of coin rows.
- What works, and why: the dragons are carved **in the same grey stone** as the pillars and lit the same way, and they sit exactly on the joint where three frame pieces meet, which is a structural point. There are two, mirrored, flanking a label. They are the clearest case in the set of sculpture that matches the frame's material and sits on a joint.
- What doesn't: the slate panels are flat and a little dull.
- An idea for disc: if disc keeps angels on frames, carve them in the **same stone or iron as the frame**, lit from the same side, and place them only where frame pieces *join*: the corner where the header meets the side rail, or where the tab rail meets the painting. Two mirrored angels flanking the one label that matters, such as "Capitol" or the city name, would be stronger than four identical corners.

---

## Patterns across these strategy games

### How faction skins differ while the layout stays one family

- **Warcraft III changes everything except the layout.** The four consoles have identical recesses in identical places: minimap, mode buttons, portrait, info, inventory, command card, and the top bar with the clock. What changes is material (wood and iron, bark and leaves, stone and gold, bone and purple gems), the top silhouette (tusks, leaf fringe, crenellations, bone ridges), the portrait arch, the filler crest and the clock's surround. A player learns one HUD and gets four objects. *(From memory, not in the screenshots: the console art is a handful of large texture tiles per race, so a whole race skin is a small number of big pieces, not a kit of many small ones.)*
- **Total War: Warhammer changes the ends and the edges.** The unit strip, ability tray, porthole and dial are the same shapes for all factions. In the first game, faction identity lives in the strip's end caps (bat wings, cog plates), the fringe colour, the porthole rim and the top-bar end figures, such as the Vampire Counts skeletons with book and horn. The third game kept the shapes and mostly kept only colour, and its HUD reads as more generic for it. Separately, faction *mechanic* screens get fully bespoke art: the Nurgle cauldron, the Nurgle wreaths, the Khorne chains and rune corners. That's where each faction's identity is strongest.
- **Heroes III doesn't skin the HUD per faction at all.** *(From memory: it re-tints by player colour.)* Faction identity is carried entirely by the town painting and the creature portraits. The town screens prove that a big faction painting with a neutral strip under it is enough.
- **Darkest Dungeon** has one faction but keeps one vocabulary everywhere: black, thin double lines, gold blackletter, red for danger, and the spiked ring. Any screen is recognisable from a crop.
- **For disc**, this suggests one layout per screen with three faction versions of a few large pieces per faction. Those pieces are the top silhouette, the two end caps, the portrait niche, an empty-slot relief, and the keystone surround. Don't build a kit of many small ornaments copied round every panel. Which motifs each faction gets is the user's call. The briefs (an inquisition with angels; decadent nobles with arcane batteries; a grove of life and rot) suggest directions, but these should be offered as probes, not baked in.

### How battle HUDs present squads, turn order and abilities

- **Squads.** Darkest Dungeon puts health and stress under each figure on the floor, with no frames, and marks selection and targets with thin brackets in the HUD's line style. Heroes III and V put a stack count in a small box at each creature's feet. Total War lists every unit as a card in one long strip. King's Bounty puts the two heroes in the top corners as mirrored opponents. In each case the squad information either stays with the figure or forms one strip; none of them scatters it.
- **Turn order.** Heroes V shows a strip of faces that grows out of the active unit's large portrait. Darkest Dungeon II shows "Round 1" and a few chevron-framed faces in the top right, with the side colour on the frame's top edge. Heroes III shows none *(from memory, not in the screenshots: later community versions added one)*. Faces only is the common thread, never letters or coloured tiles.
- **Abilities.** Darkest Dungeon shows one row of skill squares tied to the selected hero's portrait and name. DD2 adds a hover readout with the skill name, type and launch-and-target dots right above the row. Heroes V uses a radial cluster with the main action in the centre. Heroes III uses a thin embossed strip with the log in the middle. Total War uses a small tray hanging under the unit strip. The best ones show the hovered ability's rules next to the bar, not in a far panel.
- **The battle log** is never a tall panel. In Heroes III it is a two-line inset in the command strip, in King's Bounty plain text on a dark fade, and in Heroes V one line under the turn strip.

### Ornament that is part of the structure, not bolted on

This is the user's problem. These are the patterns that showed up across the set, most useful first.

1. **Sculpture sits on structural points, not on finished corners.** In every convincing case, the sculpted piece stands where structure needs a piece anyway:
   - the Warcraft III tusks are the posts of the portrait recess, and the clock is the keystone where the top bar's two arms meet;
   - the Age of Wonders dragons crouch on the joint where three frame pieces meet;
   - the Total War skeletons are the terminals of the top bars;
   - the Darkest Dungeon crest is the anchor the title banner flows out of.

   A statue on the corner of a rectangle that was already complete is ornament *added to* a frame. The test: if you delete the sculpture, does the frame look broken or unfinished? If it doesn't, the sculpture was decoration on top.
2. **Figures act on the HUD.** The convincing figures are doing something to the interface:
   - the Total War skeleton holds a book next to the help buttons and blows a horn at the speed controls;
   - the King's Bounty dragon grips the minimap's rim;
   - the Age of Wonders 1 dragon perches on the menu's top edge with its tail behind it;
   - the Reforged preview's Arthas stands on the HUD line.

   An angel that only stands in a corner is posed; one that holds the plaque, raises the lantern over End turn or clasps the painting's frame is attached by its action.
3. **Overlap in depth, both ways.** Integration comes from pieces passing in front of *and* behind each other:
   - the dragon's body is in front of the panel while its tail is behind it;
   - the King's Bounty scroll banners wrap around the frieze, and the ivy crosses its seams;
   - Total War's medallions overlap the ends of their ribbon banners;
   - the Darkest Dungeon crest overlaps the start of its banner;
   - the Total War porthole hangs from chains that run off the screen.

   Anything that crosses a seam (a vine, chain, banner, wing or root) glues two pieces into one. A piece that only sits on top reads as a sticker.
4. **Same material, same light, same level of detail.** The Age of Wonders dragons are the same grey stone as the pillars. The Total War skeletons are the same brass as the bars. The Warcraft III skulls and gems are painted at the same texture density as the console. Where a figure is rendered in a different material, more finely, or lit from another direction, it reads as an import. The Age of Wonders 1 painted dragon on flat panels is the one exception, rescued only by its depth overlap. For disc this means checking that each angel uses the frame's own stone or iron palette, the same light direction as the border-image bevels, and the same grain. A finely veined marble angel on a flat dark border will look bolted on whatever its pose.
5. **Few unique pieces, used once each; tiling only for the quiet parts.** Count the sculpted pieces:
   - the Warcraft III Orc console has two tusks, one crest and one clock surround;
   - Darkest Dungeon has one relief, mirrored once, and one torch;
   - the Total War Vampire Counts battle top has two *different* end figures and one dragon shield;
   - Age of Wonders: Shadow Magic has one pair of dragons on one joint;
   - Heroes III has almost none, only the compass cartouches.

   What repeats in all of them is the low-key tiling: rivets, rope lacing, filigree rails, knotwork bands, crenellations. That answers "less copies of the same thing" directly. Four identical angels on four corners puts the loudest piece in the quiet role. Mirrored *pairs* are fine. The DD reliefs and the AoW dragons both pair, but each pair flanks one thing.
6. **Ornament that carries information isn't decoration.** The clock shows the time and the torch shows the light. The Heroes compass letters label the minimap, the Total War dial carries the magic or turn count, the Khorne corners are the faction sigil, and the Nurgle wreaths are the building chains' connecting lines. When the most decorated piece is also the readout, nobody perceives it as extra. A keystone with the turn, a crest with the faction sigil or a niche with the active unit gives disc's sculpture a reason to be there.
7. **Empty and locked states become objects.** The Warcraft III Orc crest fills the empty inventory, the King's Bounty knotwork tiles fill empty army slots, and Darkest Dungeon boards up locked slots. Khorne chains its locked options, and the Heroes III garrison shows a banner when no hero is present. These are the natural places for "more HUD elements" that aren't copies, because each state gets its own piece.
8. **Engraving instead of statue.** Darkest Dungeon's flanking reliefs are cut *into* the black at very low contrast, and the Bretonnia tree has a faint watermark engraved into the parchment. Something carved into a surface can't look stuck onto it. Disc could put large, dim angel reliefs into the black stone of the battle side panels, which adds richness without a new silhouette.

### How the HUD meets the game view

- **Silhouette edge** (Warcraft III, King's Bounty): the HUD's top edge is irregular, with crenellations, leaves, tusks, scroll banners and a dragon head, and the game shows through the gaps. The HUD reads as a solid object standing in front of the world.
- **Thin hard frame** (Heroes III): a hairline gold rule round the view, with one material for everything. It works because there's no sculpture to be inconsistent.
- **Fade to black** (Darkest Dungeon 1 and 2): the scene darkens toward the HUD, the panel is lines on black, and the ornament is engraved low in it. The HUD is *in the dark* of the scene.
- **Hanging objects** (Total War): brass pieces float over the 3D view with no backing panel, each hung from chains or brackets running off-screen, so each has a visible means of support.
- **The failure mode** (the Reforged preview): splitting one console into separate floating blocks made it read as a generic kit, and it was reverted. Disc's map screen currently has separate floating rectangles (warband, city, turn bar, end turn), which is the same risk.

### Text treatment

- Text always sits on a dedicated surface: black insets (Warcraft III, Darkest Dungeon), parchment plaques (Total War, King's Bounty), scroll strips, or brown recessed cells (Heroes III). It never sits directly on ornament or busy material.
- **Two faces, two jobs.** Darkest Dungeon uses a gold blackletter display face for names and titles and a plain sans for numbers and stats. Warcraft III uses gold-yellow labels with white values. Total War uses a classical serif, white on dark headers and dark brown on parchment. The display face is used sparingly: names, the one call to action, place titles.
- **One coloured word.** Darkest Dungeon's "Embark" is the only red text on the hamlet screen. Total War's balance bar and the Khorne panel use one hot colour. A single colour accent works as a pointer.

### Portrait frames

- Warcraft III: an arched niche cut into the console, a different arch per race (fur and tusks, bark and leaves, stone and gold, iron and bone), with readouts on their own plaques below.
- Total War: a round brass porthole hung on chains, with the rim style per faction in the first game.
- Heroes III: a plain square with a thin gold rule. Heroes V: a silver frame with scroll corners and a count badge.
- Darkest Dungeon: frameless. The painted portrait bleeds into black, and the name in blackletter sits beside it. In the roster it's a square with a coloured left edge matching the level shield.
- King's Bounty: a carved stone niche with ivy. Age of Wonders II: a stage with columns and curtains for whoever is speaking.
- The pattern is that the portrait frame is the one place where the frame's architecture changes shape. It becomes an arch, a porthole or a stage, and that change marks it as the most important window.

### Diegetic elements

- The Darkest Dungeon torch (a light-level gauge whose orange line is also the top border; in DD2 it is mounted on the stagecoach).
- The Warcraft III day/night clock.
- The Heroes III town paintings as menus and the mage guild room with spells as scrolls in niches.
- The Darkest Dungeon hamlet painting as the hub; objects as menu buttons (chest, book, candle, scroll); boarded-up locked slots; the wax quest seal; the hanging tavern sign in DD2.
- The Nurgle cauldron, with ingredient slots over the cauldron's mouth, and the Khorne chains on locked options.
- The Heroes III hero standing in the battlefield's corner.

These are the cheapest way to get "more HUD elements, less copies": each one is a unique object that also does a job.
