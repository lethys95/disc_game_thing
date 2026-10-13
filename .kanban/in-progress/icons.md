# Icons for abilities, effects and items

- **What:** 67 of 114 abilities and all 78 effects show placeholders (`pnpm art report`); items have no art slot at
  all yet. `pnpm art generate` makes candidates from `scripts/art/prompts.ts` (Krea-2, the `krea-images` skill).
- **Why:** The user (2026-10-13): "there's the option of creating icons for items and abilities, both of which have a
  lot of missing ones."
- **Done when:** Every ability, effect and item has its own icon, in the style of the 47 ability icons that exist.
- **Who:** Claude makes them (test on a few first, then batches: memory `batch-when-proven`); the user judges.
- **Started (2026-10-13):** subjects for the 69 abilities without an icon in `scripts/art/icons.ts` (the recipe the
  47 existing ones came from), two seeds each, running in the background. Items are an art slot kind now (an icon
  beside each item on the leader's and merchants' screens). Effects and items have never had icons: a test of two each
  (Burning, Stunned, Twin knives, Salt of the old kings) runs after the abilities, before the rest.
- **2026-10-13:** 63 of the 69 abilities in (Claude's picks); six missed (Transfusion, Castigation, Fire on all, Beam,
  Hamstring, Regenerate) and run again with new subjects. The effect and item test holds the look (Burning, Stunned,
  Twin knives, Salt of the old kings, in the game). Waiting for the user's okay on the test before the other 86 effects
  and 20 items (subjects written in `scripts/art/icons.ts`). Review page `shots/icons.html`.
- **2026-10-13, later:** every ability has its icon (the six redone over up to four rounds; Beam is the weakest,
  flames rather than a column). Effects and items: the test is in, the rest wait for the user's okay.

