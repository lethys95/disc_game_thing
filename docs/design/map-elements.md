# The map column and the battle bar, element by element

The `greybox` skill for the two pieces still painted and never questioned by job. Both were kept when the user
reviewed (the column's grid "I like the overworld one more"; the turn order "the game is more readable now"; the knobs
in the bar "the right choice"), so this pass looks for what lacks a job or a label, not for a new layout.

## The map: what it's for
Every turn: move warbands (in the world; the column shows the selected one), see the purse, end the turn. Often: open a
city, look at a warband. When it applies: spend leader points, visit a structure or meet a warband, cast a spell. Rarely:
the menu.

| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| Menu | opens the menu | saves, settings, leaving | keep, top left; labelled |
| Turn medallion | the turn's number; red when it isn't yours | pacing ("new wares on turn 7"), whose turn | keep |
| Gold and income | gold now and per turn | every purchase | keep |
| Mana and income | mana now and per turn | spells | keep |
| Warband plate: name, count, movement | which warband is shown, how full, how far it can still go | the warband being moved | keep; clicking it shows the next warband (said on hover) |
| The warband's 3×3 | the squad and its health; click for the leader's screen; a held right-click for a sheet | the subject of every march | keep (the user's favourite grid) |
| Leader socket | opens the leader's screen; glows when points wait | points, equipment | keep; **labelled "Leader"** where the glyph alone doesn't say it |
| End turn | ends the turn | every turn | keep, the raised middle socket; **labelled** where the hourglass alone doesn't say it |
| Here socket | visit the structure stood on, or meet a warband next to it; dark when nothing applies | the conditional actions, in a socket that never moves | keep; its label is the action ("Visit the merchant") |
| City plate | the Capitol, how many in its garrison; click to enter | the most visited place | keep; other cities in the drawer |
| Spell book (the gem) | opens the learned spells in the drawer | casting | keep; **labelled "Spells"** where the gem alone doesn't say it |
| Drawer | spells, other cities, further meetings | what the column has no window for | keep for now; three unrelated jobs in one panel, flagged for when cities multiply |
| Hint line | what a click on the map would do | teaches in context | keep |

## The battle: what it's for
Every action: pick an ability, pick a target, read what it will do. Often: compare the acting unit with the one
hovered, see the turn order. Sometimes: hand the battle to the AI, resolve it at once, read the log, look at tarot cards.

| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| Turn order | the acting unit, then the next eleven | planning the round | keep (the user: "more readable") |
| Left card: globe, portrait, name, four stats, effects | the acting unit | what it can do now | keep; the name without the tier (done) |
| Right card | the unit under the pointer (or pinned) | comparing, and the target's health before a hit | keep |
| Round medallion | the round's number | effects and tarot tasks count rounds | keep |
| Resolve now, Auto-battle | the AI plays the rest, at once or watched | skipping a decided fight | keep; their glyphs (», A) are stand-ins: **labelled** where the glyph doesn't say it |
| Tarot | the held cards | tarot tasks | keep |
| Log | opens the battle's log | what happened | keep; ☰ a stand-in, labelled likewise |
| Seven ability sockets, arrows past seven | the abilities; the one a click would use lit | the job | keep (done this session) |
| Hint line | the chosen ability and its targets; the numbers over the heads | | keep (done) |

## The minimap (2026-10-11, the user: "a task for creating a minimap in the overworld")
**What it's for**, most often first: where am I looking (the camera on the whole map); where are my warbands and cities
(finding one off screen); where is the enemy, as far as I know (the fog decides); jumping the camera somewhere (a click).
Maps run up to Huge, many screens wide.

| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| The land | every explored hex in its terrain's flat value; unexplored hexes dark | where things are, and what's still unknown | keep; terrain as values, not textures (it must read at a glance) |
| Cities | a square in its holder's colour (neutral grey), larger for a Capitol | the places that matter most | keep |
| Warbands | a dot in their player's colour: yours always, others only where you see them now | finding your own, spotting threats | keep; the fog is the rules' (`knownWorld`), never more |
| The camera's view | a frame: the ground the screen shows, left of the column, its far edge held where the view meets the horizon | orientation | keep; a ring first, which misstated how much the camera sees |
| A click | moves the camera there | the jump | keep; the camera keeps its angle |
| Lairs | a small dark diamond with a light rim, while guarded, as last seen | where the fights and rewards are | keep (the user, 2026-10-11: "I do want them as small marks"); no hue, since every hue is a player's |
| Structures | a small light triangle with a dark rim, as last seen | where to hire, buy, learn | keep (the same) |
| Nodes | | they belong to their city | **left out** for now |
| Where it sits | | | the bottom-left corner of the map, clear of the column, the hint line centred between the two; the painted column has no window for it (Disciples II keeps its minimap at the top of its column: flagged for when the column is repainted) |
