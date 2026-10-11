# The warband's screens, element by element

The `greybox` skill for the leader's screen and the structures' screens (mercenary camp, merchant, mage merchant). Both
are about one warband; the Capitol's screen set the pattern (`capitol-elements.md`).

## What they are for
- **The leader's screen**, most often first: put on, take off and use items (after every dungeon or merchant);
  spend leader points (every few levels); look at the warband (any time).
- **A structure's screen**: buy what it offers for this warband (hires, items, spells); sell items (merchant); put on
  what was just bought (the merchant says "put it on from the leader's screen": one screen too many).

## The column (shared by both)
The Capitol's column, the same way: who, the purse, tabs, the way out; the warband in its window, since the warband is
the subject.

| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| Leader's name | whose warband | several warbands | keep, top plate |
| Purse | gold you hold | everything here costs gold | keep |
| Count ("5 / 5") | places filled of the leader's leadership | whether a hire fits | keep, beside the purse |
| The warband's 3×3 | the squad, its health; a held right-click for a unit's sheet | the subject of both screens | keep, the squad tile at the map's size (one grid) |
| Fact: leadership and move | | leadership is the count; move is on the map's column | **cut** |
| Fact: XP and points | | points matter only to the leader tree: shown on its tab | **cut** |
| Fact: worn and in the bag | | the Equipment tab shows them | **cut** |
| Tabs | the leader's screen: Leader tree, Equipment; a structure: its offer, Equipment | Equipment at a structure lets what was bought be put on at once | labelled rows as in the Capitol |
| Back to the map (the seal) | leaves | every visit ends here | a labelled button at the foot, as in the Capitol |

## Leader tree
| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| Tab label with points ("Leader tree · 2") | says points are waiting | the reason to open the tab | keep, on the tab |
| Explanatory note (a point per 100 XP, prerequisites) | teaches once | | **cut** to `maybe/tutorial` |
| Skill node: name, what it does | the skill | planning | keep; the text stays on the node, the skills are few |
| Rank | how far it's learned | | pips, filled per rank, as research's upgrades |
| Requirements | which skills come first | | drawn as the research trees are: left to right, a skill in the column after its needs, on their row, a line from each need, lit once learned; a skill whose needs aren't met is dimmed, its needs on hover |
| Learn button | spends a point | the job | **the node is the button**, as in research: click it, a dialog says what the next rank gives and asks to spend the point; learned ranks lit |

## Equipment
| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| Slots (headgear, body armour, weapon, utility ×2, banner) | what's worn, and where | the leader's gear | keep, one row per slot, empty ones quiet |
| Worn item | its name, what it does on hover, Take off | | keep; Take off on the row |
| Bag | carried items, Put on or Use | | keep as rows; Use for potions |

## The structures' offers
| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| Description of the structure | what it sells | teaches once | **cut** to `maybe/tutorial` |
| Mercenaries: each hire | hire it into the warband | the job | as the recruit menu: the squad tile it will be, name, level, price; its sheet on a held right-click (was a whole sheet inline per hire) |
| Merchant: always in stock, wares, when they change | buy | the job | keep as rows; "new wares on turn N" one quiet line |
| Merchant: your bag | sell, half price | | keep as rows |
| Mage merchant: spells | learn | the job | keep as rows, as the Capitol's Spells |
