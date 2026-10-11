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
| Tabs: City, Garrison, Research, Spells | switch what the screen shows | the Capitol does four things, a city two | keep, **labelled** (icons alone don't say what they open); the open one unmistakable; a city's missing tabs not shown at all |
| City tab (the painting) | shows the city | the user's home view (`capitol-screen.md`, a); it does nothing else today | **keep** (the user, 2026-10-11: "HoMM5 and HoMM3, etc have them too. They're nice and give a view into the city. I value them"): its job is the view into the city |
| Back to the map | leaves | every visit ends here | keep as a plainly labelled button, always in the same place (bottom of the column); Escape does the same. Not a seal: a seal said nothing about what it does |
| Fact plates (garrison count, warband here, nodes) | repeat numbers shown elsewhere on the screen | nothing they say isn't on the grids or the growth panel | **cut** |
| Garrison grid | the city's defenders, 3×3 | the main job: arrange, recruit | keep, the squad tile, the same size as on the map |
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
