# HUD references: what old gothic interfaces teach

Research the user asked for on 2026-10-09, after the second UI-kit batch: "I enjoy the angels, but there's a problem
they feel like they're boltes on, rather than actually part of it. also, i think we can have even more hud elements,
less copies of the same thing. i think you might need reference material." And: "I'm not asking you to copy, but we
need more ideas."

Five groups of games were studied from screenshots, one element at a time:
- Disciples (Sacred Lands, II, III, Liberation)
- Diablo (1 to 4)
- Icewind Dale and the other Infinity Engine games, with their heirs
- Strategy: Heroes of Might and Magic III and V, Warcraft III, Darkest Dungeon, Total War: Warhammer, King's Bounty and Age of Wonders
- Gothic RPGs: Path of Exile, Grim Dawn, Vampire: The Masquerade – Redemption, Arcanum, Divine Divinity, Blasphemous, Dungeon Keeper and Blood Omen

Every entry lives in `reference_material/`, with every single element described for prompts in `elements.md` (the notes are committed; the screenshots they name stay local and gitignored, and a locally generated `index.html` shows each entry beside its picture). This page keeps the lessons. The ideas below are directions, not features to transcribe; which motifs each faction gets is the user's call. The system built from them: `hud-kit.md`.

## Why disc's angels read as bolted on
Measured against the references, the current angels fail the same tests the convincing examples pass:
- **They do nothing.** Every convincing figure holds, carries, braces, clamps or crowns something functional. Disc's angels hold nothing.
- **They sit inside the rectangle.** They are clipped within the panel's border. They never cross the frame line and are never cut off by the screen edge, so each keeps a complete silhouette of its own, the mark of something placed on top.
- **They are copies.** The tracery frame has four identical angels, and the side panels have one mirrored pair. In the references, repetition stays in the quiet structure (studs, knotwork, niches). The figures are each different, one or two per screen.
- **They sit on finished corners, not on joints.** Ornament that convinces sits where structure needs a piece anyway: a keystone, a post, an end cap, the seam where two rails meet.
- **Their detail doesn't match the frame.** A finely rendered statue on a thin, flat bar shows its seams. In the references, figure and frame share one stone, one grime, one light, and a point of contact.

The test, found independently in three of the five groups: **delete the figure. If the frame isn't missing a part, the figure was bolted on.**

## Principles
1. **Sculpture replaces a structural part.** Divine Divinity's angel wings are the action bar's top rail and its dragons are the end caps. Warcraft III's tusks are the posts of the portrait window and its clock is the top bar's keystone. Blood Omen's skulls are column capitals. Vampire: Redemption's mourners are a panel's side posts.
2. **Figures have a job and a pose that shows it.** Diablo's statues are pedestals (D1), embrace the orbs (D2), wrap them (D3), clamp the bar (D4). In Disciples II, two crouching figures brace the command wheel. Icewind Dale II's statue cradles an orb, and its small figures present shields carrying the armour and hit-point numbers.
3. **Cross the frame line, both ways.** Path of Exile's spear and arm pass in front of the globe's rim. Age of Wonders' dragon sits on a panel's top edge with its tail behind it. The Disciples II wheel covers its figures' arms. One overlap in front and one behind sells the depth.
4. **Let the screen edge crop the sculpture.** Diablo II's statues and Icewind Dale II's statue lean in from outside the screen. Something cut off by the edge belongs to a bigger structure the player can't fully see.
5. **One material, one light, one detail density, and a point of contact.** The statue is carved from the frame's own stone or metal, lit from the same side, and touches what it holds.
6. **One loud piece per screen, quiet ornament everywhere else.** Disciples II has roughly one sculpted feature per screen. Diablo II's HUD has exactly two sculptures. Icewind Dale II gives each full screen its own hero piece. Diablo 4 gives each screen one centrepiece. Pillars 2's four identical corner rosettes are the counterexample, and look applied.
7. **Repeat the structure, never the carving.** Vampire: Redemption's pilaster blocks each carry a different emblem. Path of Exile's two globe statues are different people. Blood Omen's tab statues share a style, and each holds a different object.
8. **Ornament sits on the joints.** Baldur's Gate II sets gems where rails meet, and Icewind Dale sinks its orb into the corner where two frame arms join. Disciples II puts the same small stud at every seam, so the seams look deliberate and the panels read as one machine.
9. **Fixed material roles.** In Disciples II, iron is structure, marble shows system readouts, parchment carries voices and documents, and paintings show the world. Diablo 4 assigns iron, pale stone and red lacquer the same way. A lot of ornament stays readable because each material always means one thing.
10. **Shape means function.** Icewind Dale uses a shield for armour, a spiked disc for hit points, a closed eye for rest, ovals for spell levels, and round versus square sockets. Arcanum gives each resource its own instrument: tube, dial, thermometer. This is the direct route to "more HUD elements, fewer copies".
11. **Every ornament has a function.** In Disciples II, wax seals are the confirm and cancel buttons, the gold total sits on a scroll's roller, bookmarks are the spell-level tabs, a row of crowns sets difficulty (the chosen one lit), lit gems are toggles and glass vials are the diplomacy gauges.
12. **The empty state is ornament.** Unavailable buttons in Disciples II stay as dark sockets, empty grid cells show a carved knot, and dead units become skulls in place. The machine never changes shape; it only lights up.
13. **Relief as the wall.** Path of Exile 2 cuts its inventory slots into a low grey relief of enthroned kings, and Darkest Dungeon engraves faint reliefs into its black. Ornament cut into the surface can't look attached.
14. **Faction skins: same layout, a few big pieces swapped.** Warcraft III's four consoles keep identical recesses. Each changes material, top silhouette, portrait arch, filler crest and the clock's surround. Total War: Warhammer swaps end caps, edges and end figures, and its third game, which kept mostly colour, reads as generic. Disciples II keeps the chrome neutral and lets portrait frames and paintings carry the race.
15. **The HUD's edge can be ragged.** Disciples II's thorns spill from the battle bar into the scene, and its paintings have no frame where they meet the HUD. The HUD's edge is the window's edge. Across Diablo's history the slab disappeared but the sculpture survived, floating in front of the world.
16. **Organic ornament is a material, not an attachment.** In Vampire: Redemption, blood pools and drips over a frame's edge. Icewind Dale's frame is a wall with roots grown over it, and Warcraft III's Night Elf console is bark and leaves. Planescape: Torment plumbs every slot together with pipes.

## Ideas for disc, by screen
Directions to choose from, not decisions. Each names the reference that suggested it.

**Battle**
1. The ability bar's top rail is a figure's spread wings, with the slots beneath (Divine Divinity).
2. The ability bar's two ends are two different figures with jobs, such as one holding a book and one raising a bell or horn (Total War: Warhammer).
3. The turn order is a strip of faces growing out of the active unit's large portrait (Heroes V), or a scroll unrolled from a figure's hands (Icewind Dale II's presenting figures).
4. The turn order shows faces only, with the side's colour on the frame edge, never letters or coloured tiles (Darkest Dungeon II).
5. The battle log is a few lines inset in the bottom bar or a scroll on rollers, not a tall panel (Heroes III, Disciples II).
6. The unit card's armour sits on a shield and its health in a disc or seal, each its own instrument (Icewind Dale II).
7. The hovered ability's rules appear right above the bar, not in a distant panel (Darkest Dungeon II).
8. Unavailable abilities show as dark empty sockets (Disciples II).
9. Empty grid tiles show a carved knot or rose (Disciples II).
10. Dead units leave a skull or relic in place (Disciples II).
11. Selection and target brackets are drawn in the HUD's own line style (Darkest Dungeon).
12. Faint reliefs are engraved into the black of the card and log (Darkest Dungeon, Path of Exile 2).
13. The round counter is an object that changes, such as a candle burning down or a dial (Darkest Dungeon's torch, Warcraft III's clock).

**Map**
14. The turn number sits in a keystone where the top bar's two arms meet (Warcraft III).
15. End turn is an object a figure holds: a bell, a seal, an hourglass, an orb (Icewind Dale II, Disciples II).
16. Gold sits on a scroll roller or in a purse, mana in vials or reliquaries, each with its own shape (Disciples II, Vampire: Redemption, Blasphemous, Arcanum).
17. Warband portraits sit in frames coded by faction (Disciples II's silver skull, iron lion and twisted roots).
18. The side panels hang from architecture at the screen edges, pillars with clasps, instead of floating as boxes (Diablo II: Resurrected).
19. The top bar's edge sprouts thorns or tracery into the sky above the map (Disciples II).
20. The Menu button is a book or key held by a figure (Total War: Warhammer).
21. Ornament sits only at the bar's ends, thin between them (Path of Exile, Grim Dawn).

**Capitol**
22. The tab rail is a row of niches with a different figure in each, holding its tab's object (a key, a sword, a book, a scale) instead of four identical medallions (Blood Omen).
23. The emblem of the clicked tab becomes the header of the panel it opens (Diablo 3).
24. Each tab gets one hero piece of its own (Diablo 4, Path of Exile, Icewind Dale II).
25. Upgrades appear on a scroll with a before/after arrow and a wax seal to confirm (Disciples II).
26. The city painting has no frame of its own where it meets the HUD; the HUD's edge is the window (Disciples II).
27. Marble stays the material of readouts; documents move to parchment (Disciples II).
28. The garrison's empty slots carry a faction crest or relief (Warcraft III's filler crest).
29. Locked upgrades are boarded or chained shut (Darkest Dungeon, Total War's Khorne).

**Codex and text screens**
30. Small angels or knights are drawn as marginalia in the page's own ink: a gentler home for figures on text screens (Pathfinder).
31. Entries open with illuminated capitals (Baldur's Gate).
32. The unit list's portraits sit in frames coded by faction (Disciples II).
33. Tooltip headers change with type or rarity while the body stays the same (Path of Exile).
34. Some tooltips have no box at all, only a strong display face and colour-coded lines (Diablo II: Resurrected).

**Title, new game and menus**
35. The title is a place, not a panel: a still life, a table, a campfire scene (Arcanum, Dungeon Keeper 2, Diablo II).
36. The new-game screen keeps one shared foreground and swaps the central monument and the light per faction (Disciples II's race select).
37. Difficulty or map size is chosen with a row of objects, the chosen one lit (Disciples II's crowns).
38. Toggles are gems that light up (Disciples II).
39. Confirm and cancel are seals (Disciples II).
40. The pause between turns, or a loading screen, is a sculpted door (Diablo 4).

**Frames, everywhere**
41. One small joint piece sits at every seam of every panel (Disciples II's studs, Icewind Dale II's mosaic seam).
42. A per-faction inlay runs along the seams while the frame stays shared, such as glass, a glowing conduit or moss; motifs are the user's call (Icewind Dale II).
43. Every panel gets one distinct figure, not one figure in every corner (Diablo, Disciples II).
44. Repeated structure, varied content: the same niche or block, a different emblem each time (Vampire: Redemption).
45. Figures cross the frame line, one overlap in front and one behind (Path of Exile, Age of Wonders).
46. Figures are cropped by the screen edge (Diablo II, Icewind Dale II).
47. Paired figures on the two sides tell a story without text, such as holy against fallen (Diablo's angel and demon).
48. Faction skins swap a few large pieces: the top silhouette, two end caps, the portrait niche, the empty-slot relief, the keystone surround (Warcraft III, Total War: Warhammer).
49. A faction's own screen gets fully bespoke art (Total War's Nurgle cauldron).
50. For an organic faction, rot, moss or sap stains and grows over the frame, and roots are the rails (Vampire: Redemption, Icewind Dale, Warcraft III's Night Elves).
51. For a machine-minded faction, pipes join the slots into a circuit (Planescape: Torment).
52. A HUD element is an object in the scene, such as a banner standing in the menu's world (Diablo 3).

## Other games in the style worth a look
Suggested by the research, not yet studied:
- Disciples II's era and genre: Might and Magic VI–VIII, Heroes of Might and Magic IV, Warlords Battlecry III, Etherlords II, Warhammer: Dark Omen, Shadow of the Horned Rat, Mark of Chaos
- Gothic RPGs: Temple of Elemental Evil, Pool of Radiance: Ruins of Myth Drannor, Neverwinter Nights 1, Gothic 1 and 2, Arx Fatalis, Legend of Grimrock, Thief (the light gem), Legacy of Kain: Soul Reaver, Clive Barker's Undying, Dark Messiah, Sacred, Darkstone, Nox, Lionheart
- Newer: Lords of the Fallen, Blackguards, Vagrus – The Riven Realms, Tainted Grail: Conquest, Banner Saga, Pentiment (an illuminated-manuscript interface, close to Jilliath), Battle Brothers, Pathologic 2
