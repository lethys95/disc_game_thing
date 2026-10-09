# UI inventory: every separate element in the game today

Taken from the code on 2026-10-09 (`index.html`, `src/view/`, `src/style.css`). Style is deliberately ignored here:
this is the list of things that need a look, as they exist now. "Now" says how each is drawn today:
- **kit**: a painted piece from `assets/ui/`
- **css**: plain colours, lines or text
- **svg**: a small inline drawing
- **text**: a typed character
- **art**: a painting from the art pipeline (portraits, icons, cards)
- **3d**: an object in the scene

States are listed where an element has them (hover, selected, disabled, empty, and so on); each state is something to paint.

## A. Shared pieces (used on many screens)

| # | Element | What it is / where | States | Now |
|---|---|---|---|---|
| A1 | Large panel | the frame around a screen's main area (codex list and page, Capitol painting, rail, garrison, research, leader, credits) | — | kit (tracery frame) |
| A2 | Side panel | the battle's unit card and log, the map's warband and city panels | — | kit (angel corner frame) |
| A3 | Small panel | everything else framed (menus, prompts, rows on the garrison tab, new-game options, skirmish panels) | — | kit (iron filigree frame) |
| A4 | Main button | the large labelled buttons: Continue, New game, March, Fight, Back, End turn, Enter and others | hover, pressed, disabled, selected | kit (stone button) |
| A5 | Small button | inline actions: Invest, Learn, Research, Remove, Add an opponent, Upgrade, Choose a branch | hover, disabled, selected | kit (stone button, thinner) |
| A6 | Choice button | one of several options: faction, formation, map size, warband selector, codex shelf | hover, selected | kit (stone button with a glow) |
| A7 | Tab row | switching views inside a screen: codex Units, Abilities, Effects and Nodes; research Melee, Support, Mage and Joker | selected, disabled (Joker) | kit (stone button with a glow) |
| A8 | Screen backdrop | the wall behind every full screen | — | kit (carved stone, tiled) |
| A9 | Metal plate fill | the surface inside the Capitol header, rail and turn bar | — | kit (iron plate, tiled) |
| A10 | Header bar | across the top of the Capitol, leader and structure screens: title plaque, a readout, the back button | — | kit (plate and frame edge) |
| A11 | Title plaque | the screen's name on marble (Capitol; "Congregant, leader") | — | kit (marble plaque) |
| A12 | Fact plaque | short facts on marble (the Capitol rail: tier, healing, armour, garrison, warband, mine) | — | kit (marble plaque, small) |
| A13 | End banner | the large centred announcement with title, subtitle and buttons, for battle end and game end | — | kit (frame) |
| A14 | Section heading | a panel's sub-heading ("Equipment", "Saved games", "Evolution") | — | css (text and a hairline) |
| A15 | Title and subtitle type | a panel's title, with a small uppercase subtitle under it | — | css (Cormorant Garamond, Inter) |
| A16 | Note text | muted help and explanation lines | message (gold) | css |
| A17 | Divider | between parts of a panel | — | css hairline; kit (iron rod) on the battle card |
| A18 | Health bar | a frame, a fill and the number; on the unit card, warband members, garrison cells, enemy peek and city rows | full, hurt, fallen | css |
| A19 | Shield on a health bar | the shield amount laid over the health bar | — | css |
| A20 | Experience bar | a member's XP with what the next branch would be | filling, ready to branch | css |
| A21 | Gold amount | a coin and a number (turn bar, prices, Capitol header) | — | svg coin |
| A22 | Mana amount | a gem in the faction's colour and a number (turn bar, spells) | red, teal, green | svg gem |
| A23 | Spell charge mark | ⚡ beside costs and on ability tags | — | text |
| A24 | Movement pips | ●●●○ for movement left (turn bar, warband button, map labels) | filled, empty | text |
| A25 | Skull | death and lethal markers (lethal previews, the graveyard) | — | svg |
| A26 | Leader crown | ♛ before a warband leader's name | — | text |
| A27 | Chip | a small tag: link chips in the codex | — | css |
| A28 | Effect tag | a status on a unit ("Punished ×2", "Bleeding 30"), with its description on hover | — | css |
| A29 | Portrait thumbnail | small unit pictures in lists, rows, grid cells, the turn order and the parade | — | art |
| A30 | Missing-art placeholder | a square in the faction colour with initials, wherever art doesn't exist yet | per faction colour | css |
| A31 | Ability icon | the square picture of an ability (card, codex, ability bar) | — | art |
| A32 | Ability row | icon, name, charges and text, with its targeting grids (unit card, codex) | passive (dimmer name) | css |
| A33 | Targeting grid | two small 3x6 grids, TARGET and AREA, showing whom an ability can pick and what it hits | cell: off, on, the unit itself, the centre; the divide between the sides | css |
| A34 | Scaled number | a number that grows with ability power, dotted underline, with its formula on hover | — | css |
| A35 | Hover tooltip | the explanation on hovering abilities, chips, effects and the tarot stack | — | the browser's own (unstyled) |
| A36 | Scrollbar | in the log, codex list and page, warband and city panels, and setup | — | the browser's own |
| A37 | Text field | codex search | focus | css |
| A38 | Checkbox | settings toggles; skirmish "Let the AI play both sides" | on, off | the browser's own / css |
| A39 | Slider | volume and camera settings | — | the browser's own / css |
| A40 | Segmented control | the animation speed choice | selected | kit (small buttons) |
| A41 | Colour swatch | a player colour to pick (new game, skirmish) | selected | css |
| A42 | Colour dot | an opponent's colour beside its row | — | css |
| A43 | Faction-coloured selection glow | the red glow around a chosen faction card or row | — | css |
| A44 | Typefaces | Cormorant Garamond for headings and names, Inter for text and numbers | — | Google Fonts |

## B. Title and front door

| # | Element | What it is | States | Now |
|---|---|---|---|---|
| B1 | Game name | the title over the screen | — | css text |
| B2 | Portrait parade | a row of unit portraits behind the menu | — | art |
| B3 | Title menu | Continue (only with a save), New game, Load game, Skirmish, Codex, Settings, Credits | hover | kit buttons in a column |
| B4 | Vignette | darkened edges over the title | — | css gradient |
| B5 | New game header | "New game" and its subtitle | — | css text |
| B6 | Faction card | one per playable faction: two unit pictures, name, epithet, traits line, a paragraph | selected (glow) | kit frame, art |
| B7 | New-game options panel | colour swatches, opponent rows, Add an opponent, map size | — | kit frame |
| B8 | Opponent row | colour dot, faction choices, Remove | — | kit buttons |
| B9 | Footer | Back, March | — | kit buttons |
| B10 | Skirmish header | "Skirmish" and its subtitle | — | css text |
| B11 | Skirmish squad panel | one per side: faction buttons, swatches, formation buttons, a 3x3 grid, a count line | active side | kit frame |
| B12 | Skirmish grid cell | a tile to place a unit on | empty, filled, front row | css |
| B13 | Recruit palette | a scrolling list of every unit: picture, name, tier, stats, abilities | selected (the brush) | kit frame, css rows |
| B14 | Problem line | why a squad can't fight yet | — | css text |
| B15 | Skirmish footer | Back, the AI checkbox, Fight | — | kit buttons |
| B16 | Credits page | title, sections, two-column rows (what, who), Back | — | kit tracery frame |

## C. The map

| # | Element | What it is | States | Now |
|---|---|---|---|---|
| C1 | Turn bar | top centre: turn, whose move, gold and income, mana and income, movement pips | — | kit frame and plate |
| C2 | Turn bar end caps | carved brackets on both ends of the turn bar | — | kit |
| C3 | Menu button | hangs under the turn bar | hover | kit button |
| C4 | Warband panel | left: title, warband selectors, members, Leader tree button | — | kit angel frame |
| C5 | Warband selector | one per warband: name, unit count, movement pips | selected | kit button |
| C6 | Member row | name (crown for the leader, level), health bar, XP bar with the coming branch | XP ready | css |
| C7 | Leader tree button | opens the leader screen | ready (points to spend) | kit button |
| C8 | City panel | right: title, a row per city (name, facts, Enter), sections, the fallen | — | kit angel frame |
| C9 | City row | city name, a line of facts, Enter | — | css, kit button |
| C10 | Hint line | bottom centre: what the hovered hex or the march would do, and news | — | css text |
| C11 | End turn button | bottom centre | hover, disabled (AI turn) | kit button |
| C12 | Branch prompt | when a unit can branch: title, text, a button per branch | — | kit frame |
| C13 | Enemy peek | hovering an enemy: title, formation as a mini 3x3 with names and health, row labels, notes | unknown units (fog) | kit frame, css grid |
| C14 | Game-end banner | "Victory/Defeat on turn N", a title, Play again | — | kit frame |
| C15 | Site label | floating name over a place: "Capitol (yours)", "Dungeon · 5 guards", "Bandits · 4" | neutral, owned (player colour) | css tag |
| C16 | Warband label | floating over a warband: name, unit count, movement pips, in the owner's colour | own, enemy | css tag |
| C17 | Warband ring | the ring on the ground under a warband's figure | selected | 3d torus |
| C18 | Hex highlights | glow on hexes: reachable, path walked this turn, path later, attack target | four kinds | 3d (ground shader) |
| C19 | Fog | unexplored land under clouds | explored, unexplored | 3d |
| C20 | Node link | the line between a node and its city, recoloured when it changes hands | owner colour | 3d |
| C21 | Placeholder structures | mercenary tent, merchant stall, mage tower (models standing in for art) | — | 3d |

## D. Battle

| # | Element | What it is | States | Now |
|---|---|---|---|---|
| D1 | Turn order strip | top centre: "Round N", then a chip per unit in acting order | — | css |
| D2 | Turn order chip | a unit's small portrait with its side's colour | now (bigger, raised, "now"), next ("next"), hovered | css, art |
| D3 | Unit card | bottom left: portrait, name, pinned line, subtitle (side, tier, place), health bar, stats, effects, abilities | pinned | kit angel frame |
| D4 | Stat row | name and value | raised (gold), lowered (red), shield, spell charges | css |
| D5 | Pinned line | "Pinned · click it again to release" | — | css text |
| D6 | Battle log | right: round headers and entries | entry kinds: round start, death (red), heal (gold), battle end | kit angel frame, css text |
| D7 | Hint line | over the ability bar: what to do now | — | css text |
| D8 | Ability slot | one per ability: a button with the icon filling it, plus a slot number, name, spell cost, charges left and hotkey | hover, selected, disabled | kit frame (filigree) and art |
| D9 | Overload toggle | under a spell that can be overloaded: "Overload +N ⚡" | on, off | css button |
| D10 | Resolve now / Auto-battle | top right buttons | hover, selected (auto on) | kit buttons |
| D11 | Battle-end banner | Victory / Defeat / None survive, "after N rounds", buttons (rematch, back to the map) | — | kit frame |
| D12 | Tarot stack | the held cards as a small fanned stack, a button | hidden when none | art minis |
| D13 | Tarot fan | full-screen: heading, fanned cards, caption, footer buttons | — | css |
| D14 | Tarot card | painting with a name plate on the front, a back | focused, chosen, dropped, face down | art |
| D15 | Tarot caption | the focused card's arcana, task, reward, timing and state | open, done, failed | css text |
| D16 | Unit standee | the portrait card standing on its tile: frame in the owner's colour, round base | fallen | 3d, art |
| D17 | Health bar over a unit | floating: fill in the side's colour, shield, the previewed loss or gain | — | css (floating) |
| D18 | Action preview | on the bar while aiming: −damage, +heal, −shield, "spared", a skull if lethal | harm, heal, death | css, svg |
| D19 | Spell charge pips | over a caster's bar | full, spent | css |
| D20 | Floating numbers | damage, heals and shields rising from a unit when they happen | harm, heal, shield, note | css |
| D21 | Battle tiles | the 3x3 slabs under each squad | base, candidate target, affected by the area, current unit, focused | 3d |
| D22 | Unit glow | a standing figure's glow; dark when fallen, back when raised | standing, fallen | 3d |

## E. Capitol, leader and structure screens

| # | Element | What it is | States | Now |
|---|---|---|---|---|
| E1 | Capitol header | city name on a plaque, gold, Back to the map | — | kit |
| E2 | Tab rail | the column on the right: four tabs and the city's fact plaques | — | kit tracery frame |
| E3 | Rail tab | round medallion with an emblem and a label: City, Garrison, Research, Spells | hover, selected | kit medallion and emblem |
| E4 | City painting | the city seen from inside, slowly drifting, in its frame | per faction or city | art |
| E5 | Fortification row | "Tier N", what the tier gives, Upgrade | can't afford | kit frame |
| E6 | Nodes row | each node: name, level, income, Invest | — | kit frame |
| E7 | Squad grid | a section title ("Garrison · 1/4"), the BACK, MIDDLE and FRONT labels, 3x3 cells | — | css |
| E8 | Grid cell | a garrison or warband tile; units drag between cells | empty ("+"), filled (portrait, name, health), selected, dragged over | css |
| E9 | Grid menu | the small menu under a clicked cell: what can go there, one button per choice | choice unavailable (with its reason), nothing can go here | kit frame, kit small buttons |
| E10 | Graveyard | fallen units with a skull, resurrect | empty ("Nobody has fallen yet") | kit tracery frame |
| E11 | Research row | Capitol research: name, text, Research and its price | done | css |
| E12 | Evolution tree | top-down tree of unit nodes with elbow connector lines | — | css, svg lines |
| E13 | Tree node | portrait, name ×count, stats line, branch choice, upgrade | closed, chosen branch, bought upgrade | css |
| E14 | Spells tab | the faction's spells: name, mana cost, text, Learn; the cast bar | learned, selected for casting | kit frame |
| E15 | Leader header | "Name, leader" plaque, XP and points readout | — | kit |
| E16 | Leader tree | skill nodes: name, rank, text, requirements, Learn | learned | css |
| E17 | Equipment slots | Headgear, Body armour, Weapon, Utility ×2, Banner | empty, filled | css rows |
| E18 | Bag | carried items | empty | css |
| E19 | Structure offer row | mercenaries, wares or spells for sale with a price and a button | can't afford | css, kit button |
| E20 | Structure sections | "Always in stock", "Wares", "Your bag", the warband | — | css |

## F. Codex

| # | Element | What it is | States | Now |
|---|---|---|---|---|
| F1 | Codex header | "Codex", the tabs, Back | — | css text, kit buttons |
| F2 | Shelves | labels ("Playable factions", "Neutral tribes · not playable") and a button per faction or tribe | selected | kit buttons |
| F3 | List panel | search field, group headings, rows | — | kit tracery frame |
| F4 | List row | thumbnail, name, tier | hover, selected (red edge) | css |
| F5 | Group heading | uppercase gold label inside the list | — | css |
| F6 | Page panel | the open entry | — | kit tracery frame |
| F7 | Page top | bust portrait, name, subtitle, stats | — | art, css |
| F8 | Page ability rows | as A32, with targeting grids | — | css |
| F9 | Links | "Branches into" and other cross-references as small buttons or chips | hover | kit buttons, css chips |

## G. Menus and settings

| # | Element | What it is | States | Now |
|---|---|---|---|---|
| G1 | Menu panel | the in-game menu and settings over the screen | — | kit frame |
| G2 | Settings sections | Animation speed, Sound, Camera, Hotkeys, Display | — | css headings |
| G3 | Slider row | a label, a slider, a value | — | css |
| G4 | Check row | a label and a checkbox | — | css |
| G5 | Hotkey row | an action, its key, Change | waiting ("Press a key (Esc cancels)") | kit small buttons |
| G6 | Save row | a saved game's text, Load, Delete, Export | — | css, kit small buttons |
| G7 | Menu buttons | Save game, New game, Restore defaults, Back | — | kit buttons |
| G8 | Frame-rate readout | a corner box with frames per second (a setting) | — | css |

## H. Not in the game yet, but common in the references
These don't exist, so nothing needs painting yet:
- a custom cursor
- a loading or between-turns screen
- a minimap
- styled tooltips, instead of the browser's own
- empty-slot artwork
- portrait frames per faction
- a resource instrument per faction (gold and mana are an inline coin and gem)

## Totals
- A shared pieces: 44
- B title and front door: 16
- C map: 21
- D battle: 22
- E Capitol, leader and structures: 20
- F codex: 9
- G menus: 8

That's 140 entries. Many are text or layout, not paintings. The ones that ask for a painted piece, counting each state that changes the look, come to roughly:
- frames: 3, now one shared filigree, one angel and one tracery
- buttons: about 4 kinds × 3–4 states
- plaques: 2
- bars: health, shield, XP, and the floating health bar with its preview
- markers and glyphs: coin, gem, charge, pips, skull, crown
- the turn order chip with its now and next states
- the ability slot with its tags
- the targeting grid cells
- grid cells, empty and filled
- the tab medallions and emblems
- the tarot plate and back
- the map labels
- the hex and tile highlights
- the end banners
- the backdrop and plate textures

Everything in **art** (portraits, ability icons, tarot faces, city paintings) has its own pipeline and isn't chrome.
