# Music for every faction

- **What:** Suno tracks from the user: Ral-Vitahl, more Jilliath battle themes, map themes (#5).
- **Why:** Open-source music models aren't close (the user).
- **Done when:** Every slot has a Suno track.
- **Who:** The user makes; Claude installs.

## Notes
- 2026-10-11: a new slot, each faction's Capitol theme (`music/<faction>/capitol`), playing while your Capitol is open;
  a faction without one keeps its map theme there. Jilliath's is the user's "inquisition_faction_screen" (Suno, after
  about an hour of trying things).
- 2026-10-28: four overworld tracks from the user ("The Overworld's Weight", "Shadowed Overworld" twice, a new "Sylvan
  Grove Ambush"), `music/overworld/map-1…4`. On the map, music now runs one track after another from a bucket of the
  overworld tracks and your faction's own map theme (Capitol themes still loop in the Capitol). The user's tracks are
  FLAC, lossless, all thirteen (the user: "last time you added as ogg the quality suffered"); the ACE-Step
  placeholders stay Opus.
