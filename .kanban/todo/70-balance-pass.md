# Balance pass

- **What:** Whole-game sims (`pnpm sim:world`, `scripts/balance/openings.ts`, `pnpm sim:comps`) once the lines are in. Parked inputs in `docs/design/audit-2026-10-06.md`: Capitol and Guardian strength, a resurrection penalty, a late gold sink, an AI that takes even fights.
- **Line lengths (the user, 2026-10-07):** "I'm worried that Jilliath is getting too strong in that its lines are too
  long in each branch. We purposefully end part of nexus' melee branch at t2. Jilliath has t4 and t5 all over the
  place. That's not great. But lets worry about that when we have all factions done next to each other." Jilliath's
  branches end at t4 (mage, Punisher), t5 (Avatar of Vengeance, maybe the guardian angels); Ral-Vitahl's Cyclops and
  Mutant end at t2.
- **Whole games shifted (2026-10-07, provisional #73):** with supports evolving, the world test's strong six-unit
  start now loses 7 of 8 seeds to a Paladin and a Congregant that build up (was about half).
- **Why:** Balancing before the units exist is backwards (the user, 2026-10-06).
- **Done when:** The factions win roughly evenly in whole games; no cold wars; gold has a use.
- **Who:** Claude measures and proposes; the user decides rules.
