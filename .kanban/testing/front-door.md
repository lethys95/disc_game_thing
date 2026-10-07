# The front door (M80)

- **What:** Title, New game, Skirmish, Codex, Credits.
- **Why:** The user asked for it (2026-10-06).
- **Done when:** The user has clicked through it.
- **Who:** The user looks.
- **Codex, round two (2026-10-07, the user's notes):** playable factions and neutral tribes on separate, labelled
  shelves ("not playable"); every tab is a searchable list grouped by faction, with one entry's page beside it;
  pages link to each other ("Who has it", "Comes from", "What it applies", "Gives"); a Nodes tab. Abilities declare the
  effects they apply (`applies`, checked against the code by `tests/applies.test.ts`).
- **Targeting grids (2026-10-07, the user's ask after Eiyuu Senki):** every ability on cards, the battle card and the
  codex shows a Target grid (5 sideways × the six lines of both sides, the unit circled) and an Area grid (5 × 5),
  read from the engine; rules text no longer spells out positions.
