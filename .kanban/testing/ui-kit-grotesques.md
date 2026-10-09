# A bigger, creative UI kit

- **What:** Grotesques built into the HUD (a stone angel carved into a corner), corner pieces, finials, keystones, faction variants (`docs/design/art.md`).
- **Why:** The current kit limits the design (the user, 2026-10-06).
- **Done when:** A kit the HUD and screens use throughout.
- **Who:** Claude generates when ComfyUI is free; the user judges.
- **The user again (2026-10-07), after the codex:** "We do need more UI elements though." ComfyUI is free again now.
- **Started (2026-10-09):** the user: "I'd like you to attempt to create more diversity in hud assets […] that
  requires less of me to find solutions." Claude's first batch: a stone angel and a horned grotesque carved into panel
  corners, a spire finial, a keystone, bar end caps, a divider, a cathedral-tracery frame for screens (so screens and
  the HUD stop sharing one frame). Generated with the existing kit's recipe, no new style words.
- **The user's test for it (2026-10-09):** "when you're done, i want you to review this work. are they actually hud
  elements? do they blend in? etc. because I'm interested in a random gargoyle somewhere. it'd be something that
  blends into a whole." Then: "im NOT interested in a random gargoyle". The pieces must belong to the panels they sit on, one whole, never an ornament stuck
  on top (the Capitol's gargoyle reads as a sticker, `docs/design/art.md`).
- **Built (2026-10-09), for the user to look at:** `shots/hud-kit.html` (before and after, Claude's review against
  the user's test). Kept: the angel corner as the side panels' whole frame (battle card and log, map warband and
  city), the tracery frame on the screens' large panels (codex, Capitol, leader, credits), end caps on the map's turn
  bar, a divider on the battle card. Rejected: the horned grotesque (it grips the frame: the random gargoyle), the
  keystone (brown, a third material; no arch), the finial (nothing to crown). The Capitol's gargoyle is removed.
- **Claude's own doubts, for the user:** the angel panels' plain bar sits next to the filigree frame that the
  ability tiles, turn bar and menus keep (two frame styles in one view; a plain frame cut from the angel image could
  unify them); the garrison tab carries 12 corner angels, where they start to read as a pattern.
