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
- **The user (2026-10-30):** "I accept every icon but curse, prey, storm capacitor. I think all of those could have
  icons which better signal what they're about. Like, when I think of the word \"prey\" I don't think of shields".
  New subjects from what each does (Curse: a pinned hex doll; Prey: a hyena's jaws on a fleeing stag; Storm capacitor:
  a jar of stored lightning arching over three shields), and the same fix for the not-yet-made Cursed and Prey effects
  and the Storm capacitor item. The test okayed, the other 86 effects and 20 items run as one batch.
- **Batch in (2026-10-31):** Curse and Storm capacitor redone and installed (a pinned hex doll; a jar of lightning
  arching over three shields); Prey's stag came without its hyena, so round two leads with the hunter. All 20 items
  installed; 62 of the 86 effects installed. The other 24 came out as generic emblems, mostly crosses: where the
  subject was a wound (a cut, a bite, a vein), the recipe's "rather than gory" turned it into an emblem. Round two
  says each through an object instead (a dagger dripping blood, fangs dripping venom, a broken tusk).
- **The user (2026-10-31), on the jar over three shields:** "Can't you just make a tesla coil? Like, what does a storm
  capacitor have to do with shields?" Icons show the thing, not its effect. A tesla coil, installed for the ability
  (1000) and the item (the ability's 1001: the item seeds lost the coil's winding).
- **Round two in (2026-10-31):** 19 of the 24 effects and Prey (a stag leaping inside a hyena's jaws) installed; 83 of
  88 effects have icons. Round three for five: Negated (a plain hourglass, like Wait), Gorged (a bare skull), Wet (no
  water), Seared (a clothes iron), Death ward (its heartbeat a modern monitor trace).
- **Done but for the user's look (2026-10-31):** every effect (100, the 12 added since the list too) and every real
  item (20) has an icon; round three fixed Negated, Gorged, Wet, Seared and Death ward, and Overflow plating was redone
  onto a shield. The four placeholder items wait on the user (questions #8). In battle an effect's icon box runs wider
  than the square icon and showed a pale ground at its sides: effect and item icons now sit on a transparent ground.
  Review page `shots/icons-2.html`.

