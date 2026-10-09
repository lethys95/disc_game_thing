# Armor and hit buffs as percentages

- **What:** Armor reduces a hit by a percentage (Disciples II's rule) instead of subtracting a flat amount; flat hit
  buffs and debuffs (Mutate, Punishment, Withered, Pecking order) become percentages too.
- **Why:** Hits now grow with tier (ability power, 100 × tier as a guideline), but armor and those buffs don't: 20
  armor halves a tier-1 hit of 20+ and barely touches a tier-3 hit of 60; a −10 Punishment matters at tier 1 and fades
  at tier 3, and now reaches every target of an area spell. Canon so far is flat (`design/pillars.md`, the user
  2026-09-25: "20 armor, 25 damage, 5 gets through").
- **The user (2026-10-07):** "True. We might do this." (both).
- **Armor: yes (the user, 2026-10-08):** "I think we should do pct armor gain, yes, but then we just need to think
  about diminishing returns. In disc2, armor is added flat. […] it climbs up to a 90% damage reduction. It's broken.
  […] So if we do pct armor like disc2 does, then we need to also do diminishing returns, like something like WoW
  does." Claude's proposal (not yet confirmed): armor stays points; reduction = armor ÷ (armor + 60) (20 → 25%,
  40 → 40%, 90 → 60%, 540 → 90%); the card shows the percent; a hit still deals at least 1. Flat hit buffs: not
  answered yet.
- **Built (2026-10-09, provisional #75):** armor ÷ (armor + 60), the user's yes; the percent shown beside the points.
  Flat hit buffs (Punishment, Mutate, Pecking order) stay flat: not answered.
- **Done when:** The user decides; if yes, built before the factions' lines are tuned against armor.
- **Who:** The user decides; Claude builds and reruns the composition matrix.
