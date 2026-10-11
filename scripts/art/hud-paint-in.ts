import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";
import { paintIn } from "#scripts/art/comfy";

/**
 * Paints a HUD layout drawn as two greyboxes (`docs/design/hud-pieces.md`, "Box out, then paint in"). Each layout's
 * greyboxes live in `art/greybox/<layout>/`: `values.html` and `depth.html` are the sources, rendered to
 * `values.png` and `depth.png` at the paint size. The prompt names materials only; the greyboxes carry the layout.
 *
 *     pnpm tsx scripts/art/hud-paint-in.ts render <layout>     (the two greyboxes to values.png and depth.png)
 *     pnpm tsx scripts/art/hud-paint-in.ts <layout> [seed…]     (candidates into art/candidates/ui/paint-in/<layout>/)
 *
 * The process, step by step, is the `hud-paint-in` skill.
 */

interface Layout {
  /** The greybox pages' size in CSS pixels: the piece at its size in the game at 1080p. */
  readonly page: readonly [number, number];
  /** The paint size, a multiple of 64 near the page's aspect, about a megapixel. */
  readonly size: readonly [number, number];
  readonly prompt: string;
  readonly denoise: number;
  readonly depthStrength: number;
}

/** The 3x3 squad columns (the user, 2026-10-10: squads are 3x3 grids; "too much lighting"; adult angels). */
const LAYOUTS: Readonly<Record<string, Layout>> = {
  /** The Capitol's right column (hud-pieces.md, "The Capitol"): the map column's sibling, its compartments the city's. */
  "capitol-column": {
    page: [300, 864],
    size: [576, 1664],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A tall vertical game interface column seen straight on, painted as game interface art, in soft even light without glare, dull lighting. Blackened cast iron, old and worn, its sections joined by thin iron bands with a small faceted amber stud at each end. Every surface is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery cover all the iron between the parts, dark on dark, and no surface is left plain. Cream marble plates, blank. At the top a long marble plate and two small marble plates below it. In the middle, a two by two grid of four tall arched niches, each empty and dark, with a round ivory enamel boss inside each niche, blank; below them three long marble plates stacked. At the foot, a large round seal of deep red wax in a heavy ornate iron ring, held between two grown figures carved in deep relief in the same old dark iron, matte: on the left a kneeling hooded mason with a hammer at his belt, one hand on the ring, on the right a kneeling veiled abbess holding a large key, one hand on the ring. No text, no letters.",
  },
  /** The Capitol column, round 2: the fact plates dark iron (six marble plates were too bright), the abbess's veil iron. */
  "capitol-column-2": {
    page: [300, 864],
    size: [576, 1664],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A tall vertical game interface column seen straight on, painted as game interface art, in soft even light without glare, dull lighting. Blackened cast iron, old and worn, its sections joined by thin iron bands with a small faceted amber stud at each end. Every surface is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery cover all the iron between the parts, dark on dark, and no surface is left plain. Cream marble plates, blank. At the top a long marble plate and two small marble plates below it. In the middle, a two by two grid of four tall arched niches, each empty and dark, with a round ivory enamel boss inside each niche, blank; below them three long dark iron plates stacked. At the foot, a large round seal of deep red wax in a heavy ornate iron ring, held between two grown figures carved in deep relief in the same old dark iron, matte: on the left a kneeling hooded mason with a hammer at his belt, one hand on the ring, on the right a kneeling abbess holding a large key, one hand on the ring, her veil and robes the same dark iron as the rest. No text, no letters.",
  },
  /**
   * Jilliath's Capitol column, laid out by job (capitol-elements.md): name, gold and mana, four tab rows, the screen's
   * subject carved low, Back to the map as a plate. Gothic ornament named outright (blind tracery, cusped lancets,
   * trefoils, crockets): "interlaced knotwork" read as Norse (the user's review, 2026-10-11).
   */
  "jilliath-capitol-column": {
    page: [300, 864],
    size: [576, 1664],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A tall vertical game interface column seen straight on, painted as game interface art, in soft even light without glare, dull lighting. Blackened cast iron, old and worn, matte, divided by thin moulded iron ledges with a small faceted amber stud at each end. Behind the parts, gothic blind tracery in low relief, dark on dark: rows of narrow cusped lancet arches, trefoils and quatrefoils, crockets along the edges. Cream marble plates, blank: one long plate at the top, two small plates below it, one long plate at the foot. Between them, four long dark recessed iron panels stacked, each with a small round socket at its left end holding an ivory enamel face, blank. In the middle, a tall pointed blind arch, and inside it the west front of a gothic cathedral carved in low relief in the same dark iron, with twin spires, a rose window and a pointed portal, old and worn, matte, with no polish and no highlights. No text, no letters.",
  },
  /**
   * Jilliath's Capitol column, round 2: the judged layout's parts, with the painted Capitol's detail back (its prompt,
   * `capitol-column-2`, with "interlaced knotwork" swapped for gothic tracery): a stained glass lancet window under the
   * tabs, the mason and the abbess holding the Back plate. Round 1 kept the layout and lost the character.
   */
  "jilliath-capitol-column-2": {
    page: [300, 864],
    size: [576, 1664],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A tall vertical game interface column seen straight on, painted as game interface art, in soft even light without glare, dull lighting. Blackened cast iron, old and worn, its sections joined by thin iron bands with a small faceted amber stud at each end. Every surface is densely worked: scrolling ironwork, small rosettes, gothic tracery and quatrefoils cover all the iron between the parts, dark on dark, and no surface is left plain. Cream marble plates, blank. At the top a long marble plate and two small marble plates below it. Below them, four long dark recessed iron panels stacked, each with a round ivory enamel boss in a small arched niche at its left end, blank. In the middle, a gothic lancet window of lead and stained glass in deep red and amber, with tracery glass in its pointed head and tall leaded panes below. At the foot, a cream marble plate, blank, held between two grown figures carved in deep relief in the same old dark iron, matte: on the left a kneeling hooded mason with a hammer at his belt, one hand on the plate, on the right a kneeling abbess holding a large key, one hand on the plate, her veil and robes the same dark iron as the rest. No text, no letters.",
  },
  /**
   * Jilliath's panel frame, one painting used as a nine-slice border round every panel left of the column (the
   * garrison, the city's panel, the tab frame), at the column's density: the user's review found the wall twice as
   * blurred as the column and the two not joined.
   */
  "jilliath-frame": {
    page: [480, 320],
    size: [960, 640],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A rectangular game interface frame seen straight on, painted as game interface art, in soft even light without glare, dull lighting. A moulded frame of blackened cast iron, old and worn, matte. Along all four sides a running band of small gothic quatrefoils in low relief, dark on dark, between a thin outer roll moulding and a thin inner lip. At each corner a square iron boss with a small faceted amber stud. Inside the frame, a flat black empty field. No text, no letters.",
  },
  /** The battle's turn order (hud-pieces.md, "The turn order"): a strip hanging from the top edge, the acting unit large at its left. */
  "turn-strip": {
    page: [870, 104],
    size: [2688, 320],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A long narrow horizontal game interface strip seen straight on, hanging from the top edge of the screen, painted as game interface art, in soft even light without glare, dull lighting. Blackened cast iron, old and worn, joined by an upright iron band with a small faceted amber stud. Every surface is densely worked: interlaced knotwork, scrolling ironwork and small rosettes cover all the iron between the niches, dark on dark, and no surface is left plain. At the left, one large arched niche, empty and black, in a heavy ornate iron rim; to its right, a row of eleven small arched niches of equal size, each empty and black, in thin iron rims. Along the bottom edge, small pointed iron pendant finials hang down between the niches, and a larger one under the large niche. A plain iron cap closes each end. Pure black background below and around the strip. No text, no letters.",
  },
  /** The warband's column for the leader's and the structures' screens (hud-pieces.md, "The warband column"). */
  "warband-column": {
    page: [300, 864],
    size: [576, 1664],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A tall vertical game interface column seen straight on, painted as game interface art, in soft even light without glare, dull lighting. Blackened cast iron, old and worn, its sections joined by thin iron bands with a small faceted amber stud at each end. Every surface is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery cover all the iron between the parts, dark on dark, and no surface is left plain. Cream marble plates, blank. At the top a long marble plate and two small marble plates below it. In the middle, a gothic lancet window of lead and stained glass in deep red and amber, with tracery glass in its pointed head and a three by three grid of nine square panes below, each pane empty and black; below it three long dark iron plates stacked. At the foot, a large round seal of deep red wax in a heavy ornate iron ring, held between two grown figures carved in deep relief in the same old dark iron, matte: on the left a kneeling standard-bearer with a furled banner on a pole over his shoulder, one hand on the ring, on the right a kneeling hooded pilgrim leaning on a tall walking staff, one hand on the ring. No text, no letters.",
  },
  /** The Capitol's garrison tab (hud-pieces.md, "The Capitol's tabs"): tier and nodes, two squad windows, orders, the graveyard. */
  "capitol-garrison": {
    page: [1236, 864],
    size: [1280, 896],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A wide game interface wall seen straight on, painted as game interface art, in soft even light without glare, dull lighting. Blackened cast iron, old and worn, its sections joined by thin iron bands with a small faceted amber stud at each end. Every surface is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery cover all the iron between the parts, dark on dark, and no surface is left plain. Along the top, two long dark recessed iron panels, empty, each with a rectangular ivory enamel button at its right end, blank. Below them, side by side, two gothic lancet windows of lead and stained glass in deep red and amber, each with tracery glass in its pointed head and a three by three grid of nine square panes below, each pane empty and black; below each window a narrow dark iron strip and a long cream marble plate, blank. Under both windows, a long dark recessed panel, empty. On the right, behind an upright iron band, a tall pointed arched recess, empty and black, under a cream marble plate, blank, and at its foot a tomb chest of the same dark iron with a recumbent figure lying on its lid, a grown knight carved in deep relief, hands folded on his chest, old and worn, matte, with no polish and no highlights. No text, no letters.",
  },
  /** The frame for the Capitol's research and spells tabs: a title plate and one dark field the content scrolls in. */
  "capitol-tab": {
    page: [1236, 864],
    size: [1280, 896],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A wide game interface frame seen straight on, painted as game interface art, in soft even light without glare, dull lighting. Blackened cast iron, old and worn, its sections joined by thin iron bands with a small faceted amber stud at each end. Every surface of the frame is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery cover all the iron around the parts, dark on dark, and no surface of the frame is left plain. At the top centre, a long cream marble plate, blank. Below it, filling almost the whole frame, one large dark recessed panel, flat, smooth and empty, framed by a heavy moulded iron lip. No text, no letters.",
  },
  /** The tab frame, round 2 (round 1: a thin border round a blank slab): a faint interlace in the field, a heavier frame, corner bosses. */
  "capitol-tab-2": {
    page: [1236, 864],
    size: [1280, 896],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A wide game interface frame seen straight on, painted as game interface art, in soft even light without glare, dull lighting. Blackened cast iron, old and worn, its sections joined by thin iron bands with a small faceted amber stud at each end. Every surface of the frame is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery cover all the iron around the parts, dark on dark, and no surface of the frame is left plain. At the top centre, a long cream marble plate, blank. Below it, filling most of the frame, one large recessed panel of darker iron framed by a heavy moulded iron lip, with a round iron boss at each of its four corners; the panel's surface is covered in a shallow, faint interlace of rings, very low in contrast, dark on dark, and otherwise empty. No text, no letters.",
  },
  /** The battle's bottom bar (hud-pieces.md, "The battle bar"): the card, the round and the sockets, the log. */
  "battle-bar": {
    page: [1536, 200],
    size: [2432, 320],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A long horizontal game interface bar seen straight on, painted as game interface art, in soft even light without glare. Blackened cast iron worn bright on its raised edges, its three sections joined by upright iron bands with a small faceted amber stud at each end. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. On the left, a large arched portrait well, empty and black, beside a long marble name plate, a narrow dark recessed channel, a row of four small marble plates and a dark recessed strip. In the middle, a round marble medallion between two small round ivory sockets, and below them a row of seven square sockets, each empty and black. On the right, a wide dark inset window, empty, and a narrow upright slot. Low gothic tracery in the same dark iron behind and between them. At the left end, carved in low relief in the dark iron, a grown hooded herald in long robes, one hand raised to present the arched portrait well; at the right end, a grown hooded scribe in long robes, bent toward the dark window, writing with a long quill. No text, no letters.",
  },
  /** The battle bar again (the user, 2026-10-10: the figures "too perfect [...] like smoothed stone"; the left too white): figures engraved and worn, stat plates in iron, a plate over the log. */
  /** The battle bar, dense (the user, 2026-10-10: Disciples II's "Very very few surfaces are just smooth and plain"; a health globe its figure embraces; a stopped clock). */
  /** The dense bar, its globe again: red glass held close by a kneeling figure whose arm crosses its front. */
  /** The battle bar, mirrored (the user, 2026-10-10: the outer segments unequal, the scribe hovering, the candle out of place). */
  /** The battle bar as a duel (the user, 2026-10-10: the second globe shows the hovered unit; the log opens on demand). */
  /** The duel, its stat plates named as rectangles (round one turned them into round bosses). */
  /** The duel with wider portrait arches (the user, 2026-10-10: the frames "too small and can't fit the characters"), greyboxes in rem; "dull lighting" added. */
  "battle-bar-duel-dull": {
    page: [1536, 200],
    size: [2432, 320],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A long horizontal game interface bar seen straight on, symmetrical, painted as game interface art, in soft even light without glare, dull lighting. Blackened cast iron, old and worn, its three sections joined by upright iron bands with a small faceted amber stud at each end. Every surface is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery cover all the iron between the parts, dark on dark, and no surface is left plain. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. At each end, a large sphere of deep red glass set straight into a heavy ornate iron rim, with no stand, faintly glowing from within. Kneeling on the bar's bottom ledge at the left sphere's outer side, carved in deep relief in the same dark iron, a grown veiled woman in long robes with a folded feathered wing, one arm wrapped across the front of the sphere and the other laid over its top; mirroring her at the right sphere, carved the same way, a grown hooded figure with small curved horns and a folded bat wing, holding the right sphere the same way. Beside each sphere, a tall wide arched well, empty and black, and a long marble plate above a two by two grid of four small rectangular dark iron plates and a dark panel. In the middle, a round marble medallion between four small round ivory buttons, two on each side, and below them a row of seven square sockets, each empty and black. No text, no letters.",
  },
  /** The same, "dull lighting, no stone". */
  "battle-bar-duel-dull-nostone": {
    page: [1536, 200],
    size: [2432, 320],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A long horizontal game interface bar seen straight on, symmetrical, painted as game interface art, in soft even light without glare, dull lighting, no stone. Blackened cast iron, old and worn, its three sections joined by upright iron bands with a small faceted amber stud at each end. Every surface is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery cover all the iron between the parts, dark on dark, and no surface is left plain. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. At each end, a large sphere of deep red glass set straight into a heavy ornate iron rim, with no stand, faintly glowing from within. Kneeling on the bar's bottom ledge at the left sphere's outer side, carved in deep relief in the same dark iron, a grown veiled woman in long robes with a folded feathered wing, one arm wrapped across the front of the sphere and the other laid over its top; mirroring her at the right sphere, carved the same way, a grown hooded figure with small curved horns and a folded bat wing, holding the right sphere the same way. Beside each sphere, a tall wide arched well, empty and black, and a long marble plate above a two by two grid of four small rectangular dark iron plates and a dark panel. In the middle, a round marble medallion between four small round ivory buttons, two on each side, and below them a row of seven square sockets, each empty and black. No text, no letters.",
  },
  "battle-bar-duel-2": {
    page: [1536, 200],
    size: [2432, 320],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A long horizontal game interface bar seen straight on, symmetrical, painted as game interface art, in soft even light without glare. Blackened cast iron, old and worn, its three sections joined by upright iron bands with a small faceted amber stud at each end. Every surface is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery cover all the iron between the parts, dark on dark, and no surface is left plain. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. At each end, a large sphere of deep red glass set straight into a heavy ornate iron rim, with no stand, faintly glowing from within. Kneeling on the bar's bottom ledge at the left sphere's outer side, carved in deep relief in the same dark iron, a grown veiled woman in long robes with a folded feathered wing, one arm wrapped across the front of the sphere and the other laid over its top; mirroring her at the right sphere, carved the same way, a grown hooded figure with small curved horns and a folded bat wing, holding the right sphere the same way. Beside each sphere, a tall arched well, empty and black, and a long marble plate above a two by two grid of four small rectangular dark iron plates and a dark panel. In the middle, a round marble medallion between four small round ivory buttons, two on each side, and below them a row of seven square sockets, each empty and black. No text, no letters.",
  },
  "battle-bar-duel": {
    page: [1536, 200],
    size: [2432, 320],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A long horizontal game interface bar seen straight on, symmetrical, painted as game interface art, in soft even light without glare. Blackened cast iron, old and worn, its three sections joined by upright iron bands with a small faceted amber stud at each end. Every surface is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery cover all the iron between the parts, dark on dark, and no surface is left plain. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. At each end, a large sphere of deep red glass set straight into a heavy ornate iron rim, with no stand, faintly glowing from within. Kneeling on the bar's bottom ledge at the left sphere's outer side, carved in deep relief in the same dark iron, a grown veiled woman in long robes with a folded feathered wing, one arm wrapped across the front of the sphere and the other laid over its top; mirroring her at the right sphere, carved the same way, a grown hooded figure with small curved horns and a folded bat wing, holding the right sphere the same way. Beside each sphere, a tall arched well, empty and black, and a long marble plate above four small dark iron plates and a dark panel. In the middle, a round marble medallion between four small round ivory sockets, two on each side, and below them a row of seven square sockets, each empty and black. No text, no letters.",
  },
  "battle-bar-mirror": {
    page: [1536, 200],
    size: [2432, 320],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A long horizontal game interface bar seen straight on, symmetrical, painted as game interface art, in soft even light without glare. Blackened cast iron, old and worn, its three sections joined by upright iron bands with a small faceted amber stud at each end. Every surface is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery cover all the iron between the parts, dark on dark, and no surface is left plain. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. At the left end, a large sphere of deep red glass set straight into a heavy ornate iron rim, with no stand, faintly glowing from within; kneeling on the bar's bottom ledge at its left, carved in deep relief in the same dark iron, a grown veiled woman in long robes with a folded wing, one arm wrapped across the front of the sphere and the other laid over its top. At the right end, mirroring it, a large sphere of pale smoky grey glass with mist drifting inside, in the same heavy ornate iron rim; kneeling on the bottom ledge at its right, carved the same way, a grown hooded scribe in long robes with a quill tucked in his belt, one arm wrapped across the front of the sphere and the other laid over its top. Beside each sphere, a tall arched well, empty and black, and a long marble plate above dark iron panels. In the middle, a carved iron rosette between two small round ivory sockets, and below them a row of seven square sockets, each empty and black. No text, no letters.",
  },
  "battle-bar-globe": {
    page: [1536, 200],
    size: [2432, 320],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A long horizontal game interface bar seen straight on, painted as game interface art, in soft even light without glare. Blackened cast iron, old and worn, its three sections joined by upright iron bands with a small faceted amber stud at each end. Every surface is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery cover all the iron between the parts, dark on dark, and no surface is left plain. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. At the left end, a large sphere of deep red glass set straight into a heavy ornate iron rim, with no stand, faintly glowing from within; kneeling at its left, carved in deep relief in the same dark iron, a grown veiled woman in long robes with a folded wing, one arm wrapped across the front of the sphere and the other laid over its top, holding it close. Beside it, an arched portrait well, empty and black, a long marble name plate, a row of four small dark iron plates and a dark recessed panel. In the middle, a small glass sphere holding a single candle flame, in an iron ring between two small round ivory sockets, and below them a row of seven square sockets, each empty and black. On the right, a long marble plate over a wide dark inset window, empty, a narrow upright slot, and at the right end a grown hooded scribe in long robes carved in deep relief, writing with a long quill. No text, no letters.",
  },
  "battle-bar-dense": {
    page: [1536, 200],
    size: [2432, 320],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A long horizontal game interface bar seen straight on, painted as game interface art, in soft even light without glare. Blackened cast iron, old and worn, its three sections joined by upright iron bands with a small faceted amber stud at each end. Every surface is densely worked: interlaced knotwork, scrolling ironwork, small rosettes and tracery cover all the iron between the parts, dark on dark, and no surface is left plain. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. At the left end, a large round glass globe in a heavy ornate iron rim, dark and empty inside, embraced by a grown veiled woman in long robes carved in deep relief in the same dark iron, her body behind the globe and one arm curled over its top. Beside it, an arched portrait well, empty and black, a long marble name plate, a row of four small dark iron plates and a dark recessed panel. In the middle, a small glass sphere holding a single candle flame, in an iron ring between two small round ivory sockets, and below them a row of seven square sockets, each empty and black. On the right, a long marble plate over a wide dark inset window, empty, a narrow upright slot, and at the right end a grown hooded scribe in long robes carved in deep relief, writing with a long quill. No text, no letters.",
  },
  "battle-bar-worn": {
    page: [1536, 200],
    size: [2432, 320],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A long horizontal game interface bar seen straight on, painted as game interface art, in soft even light without glare. Blackened cast iron worn bright on its raised edges, its three sections joined by upright iron bands with a small faceted amber stud at each end. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. On the left, a large arched portrait well, empty and black, beside a long marble name plate, a narrow dark recessed channel, a row of four small dark iron plates and a dark recessed strip. In the middle, a round marble medallion between two small round ivory sockets, and below them a row of seven square sockets, each empty and black. On the right, a long marble plate over a wide dark inset window, empty, and a narrow upright slot. Low gothic tracery in the same dark iron behind and between them. At the left end, engraved shallowly into the iron face itself, a grown hooded herald in long robes, one hand raised to present the arched portrait well; at the right end, engraved the same way, a grown hooded scribe in long robes, bent toward the dark window, writing with a long quill. Both figures are old and worn almost smooth, the same dark corroded iron as the frame, pitted and rusted at the edges, matte, with no polish and no highlights. No text, no letters.",
  },
  "map-column-window": {
    page: [300, 864],
    size: [576, 1664],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A tall vertical game interface column seen straight on, painted as game interface art, in soft even light without glare. Blackened cast iron worn bright on its raised edges, its sections joined by thin iron bands with a small faceted amber stud at each end. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. In the middle, a gothic lancet window of lead and stained glass in deep red and amber: tracery glass in its pointed head, and below it a three by three grid of square panes, each empty and black. Behind the sockets, low gothic tracery in the same dark iron. At the foot, a large round disc of lit amber glass held up by two adult angels carved in low relief in the dark iron, tall robed figures with grown, solemn faces, their wings raised around it. No text, no letters.",
  },
  /** The window column with the user's duality at its foot (2026-10-10: "one of them be an angel, and the other a succubus"). */
  "map-column-duality": {
    page: [300, 864],
    size: [576, 1664],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A tall vertical game interface column seen straight on, painted as game interface art, in soft even light without glare. Blackened cast iron worn bright on its raised edges, its sections joined by thin iron bands with a small faceted amber stud at each end. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. In the middle, a gothic lancet window of lead and stained glass in deep red and amber: tracery glass in its pointed head, and below it a three by three grid of square panes, each empty and black. Behind the sockets, low gothic tracery in the same dark iron. At the foot, a large round disc of lit amber glass, and carved around it in low relief in the dark iron, an angel and a succubus: on the left a grown angel with feathered wings, kneeling and leaning in to rest her cheek and both hands against the glass; on the right a grown succubus with bat wings, small curved horns and a long tail, lying draped across the top of the disc, one arm trailing down over the glass. Their faces turn toward each other across it. No text, no letters.",
  },
  "map-column-lattice": {
    page: [300, 864],
    size: [576, 1664],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A tall vertical game interface column seen straight on, painted as game interface art, in soft even light without glare. Blackened cast iron worn bright on its raised edges, its sections joined by thin iron bands with a small faceted amber stud at each end. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. In the middle, a square iron lattice framed by a band of deep red stained glass: a three by three grid of square panes, each empty and black, with a small amber glass roundel where the bars cross. Behind the sockets, low gothic tracery in the same dark iron. At the foot, a large round disc of lit amber glass held up by two adult angels carved in low relief in the dark iron, tall robed figures with grown, solemn faces, their wings raised around it. No text, no letters.",
  },
  "map-column": {
    page: [300, 864],
    size: [576, 1664],
    denoise: 0.7,
    depthStrength: 1,
    prompt: "A tall vertical game interface column seen straight on, painted as game interface art, lit from the upper left. Blackened cast iron worn bright on its raised edges, its sections joined by thin iron bands with a small faceted amber stud at each end. Cream marble plates, blank. Round sockets with ivory enamel faces, blank. A large arched portrait well, and below it a row of five small arched portrait niches side by side, each empty and black. Behind the sockets, low gothic tracery and vault ribs in the same dark iron. At the foot, a large round disc of lit amber glass, with two small angels carved in low relief in the dark iron either side of it, their wings raised around it. No text, no letters.",
  },
};

/** Renders `values.html` and `depth.html` at the page size and scales them to the paint size; the depth goes grey. */
async function render(name: string, layout: Layout): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: layout.page[0], height: layout.page[1] } });
  for (const kind of ["values", "depth"] as const) {
    await page.goto(`file://${resolve(`art/greybox/${name}/${kind}.html`)}`);
    await page.waitForLoadState("load");
    const shot = await page.screenshot();
    const scaled = sharp(shot).resize(layout.size[0], layout.size[1], { fit: "fill" });
    await (kind === "depth" ? scaled.grayscale() : scaled).png().toFile(`art/greybox/${name}/${kind}.png`);
    console.log(`art/greybox/${name}/${kind}.png`);
  }
  await browser.close();
}

const args = process.argv.slice(2);
const rendering = args[0] === "render";
const [name, ...rest] = rendering ? args.slice(1) : args;
const layout = name === undefined ? undefined : LAYOUTS[name];
if (name === undefined || layout === undefined) throw new Error(`name a layout: ${Object.keys(LAYOUTS).join(", ")}`);
if (rendering) {
  await render(name, layout);
  process.exit(0);
}
const seeds = rest.length > 0 ? rest.map(Number) : [1, 2, 3, 4];
const out = `art/candidates/ui/paint-in/${name}`;
await mkdir(out, { recursive: true });
for (const seed of seeds) {
  const started = Date.now();
  const png = await paintIn({ ...layout, seed, values: `art/greybox/${name}/values.png`, depth: `art/greybox/${name}/depth.png` }, `disc/paint-in-${name}`);
  await writeFile(`${out}/${name}-${seed}.png`, png);
  console.log(`${out}/${name}-${seed}.png (${((Date.now() - started) / 1000).toFixed(1)} s)`);
}
