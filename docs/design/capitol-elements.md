# The Capitol screen, element by element

The user (2026-10-11): "try greyboxing, but being especially aware of what those elements are supposed to do. Like if
you're boxing out a button, what is that button and why is it relevant." Written before any box is drawn; the
greybox follows from it. Applies to every city screen (the Capitol adds Research and Spells).

## What the screen is for
A player opens a city to do one of these, most often first:
1. **Arrange units** between the garrison and a warband standing in the city (every visit).
2. **Recruit** into an empty place (most visits).
3. **Grow the city:** raise its tier, invest in its nodes (now and then).
4. **Bring back the fallen:** resurrect units, revive fallen leaders at the Capitol (only after losses).
5. **Research and spells** at the Capitol (now and then; their own tabs).
6. **Leave** (every visit).

So the squads are the screen; growth is a side panel; the fallen appear only when there are any.

## The elements
| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| City name | says which city this is | a player holds several cities | keep, small, top of the column |
| Purse | the gold you hold | every action here costs gold; the price and what you have must be read together | keep, next to the name |
| Mana | the faction's mana you hold | spells are learned here and cast with it; the user (2026-10-11): "show mana in the capitol view outside of just the spells screen as well. I don't think that's too much noise" | keep, beside the purse on every tab |
| Tabs: City, Garrison, Research, Spells | switch what the screen shows | the Capitol does four things, a city two | keep, **labelled** (icons alone don't say what they open); the open one unmistakable; a city's missing tabs not shown at all |
| City tab (the painting) | shows the city | the user's home view (`capitol-screen.md`, a); it does nothing else today | **keep** (the user, 2026-10-11: "HoMM5 and HoMM3, etc have them too. They're nice and give a view into the city. I value them"): its job is the view into the city |
| Back to the map | leaves | every visit ends here | keep as a plainly labelled button, always in the same place (bottom of the column); Escape does the same. Not a seal: a seal said nothing about what it does |
| Fact plates (garrison count, warband here, nodes) | repeat numbers shown elsewhere on the screen | nothing they say isn't on the grids or the growth panel | **cut** |
| Garrison grid | the city's defenders, 3×3 | the main job: arrange, recruit | keep, the squad tile; larger than on the map wherever two grids trade (the user, 2026-10-11: "slightly larger tiles on screens where there are two grids in general"), still square |
| Warband grid | the warband standing in the city | the other half of arranging | keep beside the garrison; when none is here, a quiet empty frame that says so, so the screen keeps its shape |
| Grid title and count ("Garrison 2/4") | whose grid, how many places it has | capacity decides whether you can recruit | keep, one line over each grid |
| Row labels (Back, Middle, Front) | which column is which row | placement matters in battle (melee in front) | keep, small, under the grid |
| Empty place | a click opens what can go there (recruits, the fallen) with prices | recruiting is done here, where the unit will stand | keep; shows it can be clicked on hover |
| Selected unit's orders | what can be done with that unit (Elevate to leader) | its numbers moved to the held right-click; only orders are left | a single line of buttons under the grids, only while a unit is selected |
| Hint line | how the grids work (drag, swap, click to recruit) | teaches once | keep, one line at the bottom, like the map's hint |
| Tier | the city's tier and what it gives (places, armor, healing) | explains the garrison's capacity and the defence | keep **once**, in the growth panel, with its upgrade (it was on the column and on the wall) |
| Upgrade tier | raise the tier, its price | growth | a button beside the tier, saying what the next tier gives |
| Nodes | each node feeding the city: name, level, what it yields | income, and the city's specialities | a list, so many fit (`maybe/more-nodes`), each with Invest and its price |
| Graveyard | the fallen, their price to raise | bring back the fallen | **only when someone has fallen**; the fallen as greyed tiles, dragged onto an empty place to raise (as units are dragged between grids), the price under each; fallen leaders with a Revive button. Its empty state takes no space |
| Tomb effigy, figures, ornament | none | (paint, later) | not in the greybox |

## What follows for the layout
- The column at the right edge (the map column's place, so the edge never moves): name and purse, the tabs as labelled
  rows, Back to the map at the foot.
- The garrison tab, left of it: the two grids side by side as the heart of the screen; the growth panel (tier and
  nodes) to their right; the graveyard as a strip under the grids when it has anyone; orders and the hint line under
  everything.
- Research and Spells keep their frame.

## The recruit menu
Opened by clicking an empty place in a grid. **What it's for:** putting a new unit into that place: choosing who, and
whether it's affordable (every recruit is a decision about gold and about the squad's shape).

| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| The units on offer (the faction's first tiers, then what a Tribal outpost here offers) | recruit that unit into this place | the job | keep, each as the squad tile (the face the unit will have in the grid), its name and price under it; held right-click opens its sheet, so you see what you're buying |
| Price | what it costs | the decision | under each unit, with the coin |
| Why not (can't afford, no room) | says what stops it | without it a dimmed choice is a puzzle | the unit dimmed, the reason on hover |
| "Resurrect X" entries | raise a fallen unit here | duplicated the graveyard | **cut**: the fallen are raised by dragging them from their strip, one way to do one thing; the strip shows whenever there are any |
| Stone slab buttons, the menu's frame | none | old kit | flat values |
| Title | says what this is | the menu opens over the grid | "Recruit into this place" |

## Research (the Capitol)
**What it's for**, most often first: buying upgrades for a unit type (gold, every few turns); choosing a fork's branch
ahead of time (free, permanent; the evolve prompt asks too, when a unit is ready); seeing what a line can become
(planning); the Capitol's own research (rare; one item now).

| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| Tabs: General, Melee, Support, Mage, Joker | switch between the Capitol's research and each archetype's lines | the lines don't fit together | browser tabs on top of the field, outside what scrolls (the user, 2026-10-11: "just 5 items you can flip between instead of them being inside the treeview"); the open tab joins the field; one without a line yet dark |
| Explanatory note | how branches and upgrades work | teaches once | **cut** (the user: "something you get in a tutorial, not something you have to look at all the time"; `maybe/tutorial`) |
| Tree of a line | each unit in its line from tier 1 down, joined to what it comes from | planning, and where each upgrade sits | keep; the branches you have unlocked lit, their joining lines too; branches no longer reachable greyed; drawn as real trees later (`todo/proper-trees`) |
| Node: portrait, name | which unit, and the way in | recognition; clicking it is the action | the portrait plainly clickable (it lights on hover); one choice of branch asks to confirm (free, permanent, the other branch closes); an unlocked one opens its upgrades. Replaces the Choose buttons (the user: "a bit obnoxious") |
| Node: ×count | how many you own | whether an upgrade is worth its gold now | keep, beside the name |
| Node: upgrades bought | which of its upgrades you have | at a glance, without opening it | a small pip per upgrade, filled when bought |
| Choose branch, Upgrade buttons on the node | | moved into the click: confirm or the upgrade dialog | **cut** from the node |
| General: research rows | name, what it does, Research and its price, or done | the Capitol's own research | keep as rows |

## Spells (the Capitol)
**What it's for:** learning spells for gold, which are then cast on the map with mana (the spell book in the map
column).

| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| Note ("placeholders until the real ones are designed") | says these aren't final | honest, for now | keep until the user designs spells (`todo/spells`) |
| Spell rows: name, mana per cast, what it does | which spell, what it costs to use | the decision to learn | keep |
| Learn and its gold price, or Learned | learns it | the job | a button; learned ones say so |

## The frame
Research, Spells, the leader's screen, the structures and the meeting share the frame (`view/frames.ts`): a title and
a field the content scrolls in. Its job is to say which screen this is and hold content that changes shape. Painted
Jilliath's way it read as Norse (the user's review); greyboxed it is a plain title plate and a dark field, for all of
them until they are judged and painted.
