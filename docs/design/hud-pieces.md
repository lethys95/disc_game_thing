# HUD pieces, one at a time

The plan after the reset (`hud-kit.md`'s note at the top). The user, 2026-10-10: "you don't actually get more very
often when you write 450 lines instead of 150. It gets like... Washed out. So if you try to capture the entire screen
with the HUD [...] you get these gray slabs I think. So we have to think modularity." And: "Do not assume you can use
the prompts we used before. You don't even need the angels."

So every piece below is made on its own, from its own short prompt, and the screens are put together from the pieces
in CSS. The words come from `reference_material/elements.md`, the element-by-element reading of the references. None
of night one's prompt lines is reused.

## How a piece is made
1. **One piece, one prompt, about 25–50 words.** It names the object, its form, its material and at most two accent
   colours. It carries no mood or style words ("grim", "solemn", "desaturated"): style is the user's call
   (memory: no-silent-style), and it was those words, plus a grey material line in every prompt, that washed night
   one out. No similes ("like an old reliquary" was one): name the thing itself.
2. **Content faces the player.** Anything that will carry text or a portrait is asked for "seen straight on" or "seen
   from directly above, square to the viewer". Nothing that holds content is drawn at an angle.
3. **Frames are asked for empty**, their inside flat, so CSS can stretch them (border-image) and the content goes in
   front.
4. **Plain background for the cut.** Dark pieces on a plain white ground, light pieces (parchment, marble, wax) on a
   plain black one, so the edge is easy to find. The user does the cutting and the cleaning
   ("I'm fully capable of doing that and I have the eyes").
5. **Four seeds per piece**, on a contact sheet. Claude puts them up with the prompt as sent; the user picks and cuts.
6. **Hand-off:** the uncut candidates are in `art/candidates/ui/pieces/<piece>/`. A cut piece saved as
   `art/cut/ui/<piece>.png` is what Claude installs (as `assets/ui/pieces/<piece>.webp`) and places in CSS.
7. **Figures are rare and optional.** None of the pieces below is a figure. If a screen ever gets one, it is one, it
   does a job, and it is part of a structure (a corbel, a waterspout, a bracket), never a statue standing beside it.

The prompts live in `scripts/art/hud-pieces.ts` (one source); `shots/hud-pieces.html` shows each one as sent beside
its candidates.

## The pieces
Faction pieces are Jilliath's, from the provisional motifs (#76): red stained glass in lead, a crimson wax seal, the
silver rose, a reliquary vial of red, a bell for End turn. The shared pieces carry no faction.

### Shared structure
| # | Piece | Its job |
|---|---|---|
| 1 | plate | names and facts: the card's name, the Capitol's facts, titles; nine-sliced |
| 2 | frame | the edge of every panel; nine-sliced, the inside dark |
| 3 | button | the commands the player presses: the warm, touchable material against the iron |
| 4 | socket | an ability or item slot, the icon in front of its dark inside |
| 5 | rail | a thin bar along a screen's top edge for the turn order or the turn, instead of a heavy beam |

### Documents
| # | Piece | Its job |
|---|---|---|
| 6 | parchment | every document: rules, explanations, the unit sheet, the log, saves |
| 7 | roller | the turned rod a sheet hangs from or rolls onto (the unit sheet, the log, the gold on a scroll) |
| 8 | seal | confirm and cancel; locks |
| 9 | ribbon | tabs: the codex's kinds and shelves, the Capitol's tabs |
| 10 | book | the codex and the credits, lying square |

### Objects with a job
| # | Piece | Its job |
|---|---|---|
| 11 | bell | End turn, on the map (Jilliath's, #76) |
| 12 | closed book | Menu |
| 13 | vial | mana (Jilliath's vessel, #76) |
| 14 | coins | gold |
| 15 | candle | the battle's round, and the light that marks the selected thing |
| 16 | lamp gem | a toggle, lit and unlit (two prompts, the same seed) |

### Faction marks (Jilliath)
| # | Piece | Its job |
|---|---|---|
| 17 | portrait arch | the frame of every Jilliath face: the card, the turn order, the codex |
| 18 | rose window | the empty-slot mark: an empty grid cell, an empty socket |
| 19 | sealed band | the locked state: research not yet open |

### Paintings (not chrome, but made the same way)
| # | Piece | Its job |
|---|---|---|
| 20 | still life | the title screen: a place, not a panel (Arcanum's desk, Heroes III's mage guild); the menu's plaques stand over its dark side |

## How the screens are put together
Sketches, built in CSS from the pieces above; each is a layout the greybox can try before any art exists.
- **Battle.** The turn order on the rail (5) along the top, each face in a small arch (17) with the side's colour as a
  band below, the round as the candle (15) with its numeral. The unit card is a parchment sheet (6) hanging from a
  roller (7), the portrait in its arch overlapping the sheet's top edge (Disciples II's unit card), the name on a plate
  (1). The sockets (4) in a row on the sill, the log a parchment strip on a roller.
- **Map.** No beam. The turn on a small plate at the top centre, gold (14) and mana (13) beside it, End turn the bell
  (11) at the bottom centre, Menu the closed book (12). The side panels in the frame (2), their names on plates.
- **Capitol.** No header beam: the city painting full screen, the name on a plate, the tabs as ribbons (9) or objects,
  the facts on plates, the garrison and research in framed panels.
- **Codex.** The book (10) lying square, the kinds as ribbons (9) hanging from its top edge.
- **Title.** The still life (20), the name, the menu on plates (1) or buttons (3).
- **Menus.** A framed panel (2), toggles as lamp gems (16), saves on parchment (6), confirm and cancel as seals (8).

## Order
First the pieces that most screens need, so a single batch changes the most: plate (1), frame (2), button (3),
parchment (6), then the objects (11–15), then the faction marks, then the paintings. The first test of this workflow
is on four pieces (plate, parchment, seal, bell), to check that short prompts give colour and clean edges before the
rest is generated (memory: batch-when-proven).

## Test 1 (2026-10-10): plate, parchment, seal, bell
Sixteen candidates from the first short prompts (`shots/hud-pieces.html`). What it showed:
- **Colour and clean edges, yes.** Cream marble with amber studs, warm tan parchment, crimson wax, dark bronze: none of
  it grey, and each piece stands clear on its ground, square to the viewer.
- **But they read as studio photographs**: pristine marble like a bathroom tile, a plain modern hand bell. The prompts
  named object, form, material and colour, and left out two fields the catalogue has for every element: the
  **finish** (worn, chipped, tarnished, cracked) and the **ornament** (cast scrolls, engraving). Round 2 adds one
  phrase of each, still short.
- **Photographic or painted is the user's call** (style). Round 2 makes every piece twice, as is and with "Painted as
  game interface art." added, side by side.

## Round 2 (2026-10-10): finish and ornament added
The same four pieces, each prompt with one phrase of finish and one of ornament (the plate's ends became small cast
leaf scrolls holding the amber studs, the bell got an engraved band of leaves and a handle worn pale), and each made
twice: as is, and with "Painted as game interface art." Both read as game interface now. As is, they are closer to
photographs: aged marble, a real bronze bell. Painted, they are more stylised: crackled marble with rust-brown iron,
heavier wear. That choice is the user's. Every other piece's prompt has the same two phrases added since, and nothing
else has been generated: the user reads them first.
