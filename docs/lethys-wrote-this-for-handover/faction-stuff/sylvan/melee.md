# Grove: melee line

> **Pitch (Claude, 2026-09-27): everything below marked (Claude) is a proposal for you to cut, rename or veto.**
> Faction-wide hook: Grove units gain more per level past the end of their line. **User, 2026-09-29: 50% more** (7.5% instead of 5%), not twice: "if it becomes too much, people might opt to pick whichever line ends the fastest", and see less of the game. Built.

## Tier 1

### Grove melee 1 (placeholder name)
- **Role (Claude):** the persistent front; outlasts rather than outhits.
- **Intent (Claude):** "starts slow, but is persistent": a front-liner that heals itself a little every turn (life), so
  long fights and the healing line favour it. Animalistic look fits (a beast-kin brawler, a bark-skinned warden).
- **Stats (Claude):** health high · damage low · armor none · initiative low.
- **Abilities (Claude):**
  - *Regrowth* (passive): at the start of its turn it heals a small share of its max HP.
  - *Attack*.
- **Strong against / weak against (Claude):** chip damage and long fights / burst, and anything that stops healing
  (a Negate, the fungal corpse explosion's cousin on the other side).
- **Status:** idea (Claude's pitch).

## The line (user, 2026-09-29)
"One of the main branches out in self-regen, the other into delaying damage taken. The former would be life and the latter would be death. We can branch out like that at t2. I think t1 is fine with just being some regen."
- **Tier 1:** some regeneration (matches the pitch above).
- **Tier 2 fork: life vs death.**
  - **Life:** health regeneration at tier 2. At tier 3, more support and utility for the backline: "would probably not attack as much either, probably spend time just buffing or healing or defending."
  - **Death:** delays the damage it takes at tier 2; overall "more to do with debuffing enemies". At tier 3, a **withering** effect on enemies that hit it, reducing their damage.
- **Answers (user, 2026-09-29):** the branches are **Regrowth** and **Decay**. Decay has **no regeneration**, and delays **a share (a percentage)** of the damage it takes. The difference in play: "the decay tank would probably be more difficult to kill, [but] he does need a support back line to help out, whereas regrowth front might be less tanky, but can actually help out the rest of the team." Maybe a **tier 4 on Decay that turns aggressive**, so the melee line can be a win condition.
- **Faction flavor (user):** the Grove is Golgari (MTG): withering, rot, the balance of life and death, life from the dead, regrowth, the cycle. The Wastes' death is a different kind: ghosts, shades, phantasmagoria, mystery, spooky.
- **Built (M71):** placeholder names Grove melee 1, Regrowth 2/3, Decay 2/3 (`rules/units/grove.ts`); numbers `provisional.md` #57.
- Claude's read: the Wastes melee's death wards (the user: "will mostly play around with death wards") are binary (cheat death once) where the Grove's death branch spreads damage over time, so the two stay distinct.

## Tier 4 (user, 2026-09-29)
- **The Regrowth line ends at tier 3.**
- **Decay tier 4:** "a unit which can actively use the withering on itself and turn it into damage dealt somehow. The more it suffers, the more it lashes back", so the line can be a win condition, fairly late game.
- Claude's reading and proposal: the rot it carries (its delayed damage) fuels an active ability that deals it out. Open (user's call): is the rot consumed or kept; one target or the front row; main or free action.
