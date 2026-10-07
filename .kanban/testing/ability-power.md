# Ability power

- **What:** A stat, *ability power* (percent), that scales abilities' magnitudes (heals, ability hits, shields,
  burns) instead of each unit carrying its own flat numbers. Levels raise it like health and damage.
- **Why:** The user (2026-10-06): "I think we need ability power or something similar. A stat which controls the
  power level of these abilities instead of flat numbers."
- **Done when:** The stat is in the rules and on every card. Units' own magnitude overrides are folded into their
  ability power where one number fits, the shifted numbers are listed for the user, and the user has looked.
- **Who:** Claude builds; the user judges the per-tier values (provisional #71).
- **Built (2026-10-06):** two commits. First the stat alone, every unit at 100: battle sims came out identical, and
  whole games differed only through veterans. Then the fold by tier (100, +25 a tier); seven numbers moved by 1–4.
  Table and sim effects: `docs/provisional.md` #71. See it on the battle card or in the codex (`?codex`, Ral-Vitahl,
  Maelstrom). Open for the user: the tier step (25), and whether items, spells or supports should raise it.
- **The user (2026-10-07):** +25 a tier makes upgrades "a bit insignificant"; Disciples II roughly doubled at tier
  2. Now 100 × tier, with the Apprentice keeping its Burst so Ral-Vitahl's opening holds (#71). Ways to raise it:
  `eventually/ability-power-sources`.
