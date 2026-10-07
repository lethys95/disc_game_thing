# Grove: support line

> **Pitch (Claude, 2026-09-27): everything below marked (Claude) is a proposal for you to cut, rename or veto.**
> Faction-wide hook, from "ramp on the strategic level, strong endgame": Grove units gain **twice as much per level**
> past the end of their line (10% instead of 5%), so an old Grove army outgrows everyone, while a young one is plain.

## Tier 1

### Grove support 1 (placeholder name)
- **Role (Claude):** healing over time.
- **Intent (Claude):** "healing over time effects": where Jilliath's Cleric heals at once, this one plants a heal that
  lands over three turns, more in total but slower. Rewards thinking a turn ahead; punished by burst.
- **Stats (Claude):** health low · damage very low · armor none · initiative medium.
- **Abilities (Claude):**
  - *Bloom* (main action): an ally heals a small amount at the start of each of its next three turns.
  - *Shoot*, weak.
- **Status:** idea (Claude's pitch).

## Direction (user, 2026-09-29)
The worry: the mage line partly heals and the Regrowth melee heals, so what makes the support unique? The answer: **corpses**. "That Grove kind of bounces around the support role, but even the support role bounces around to the other roles. It becomes more dynamic and blurry."
- **One side: the Psychopomp line**, "with some spiritual stuff" (to be figured out; the Psychopomp's look is canon, `design/units/sylvan-psychopomp.md`).
- **Decay side:** weaker healing in general, but uses **corpses** for extra effects: **growth from corpses heals allies**, and **corpse explosion** (the canon mage idea: fungal infestation damaging units next to the corpse each turn; it prevents resurrection).
- **The aggressive plan** (with the aggressive caster): nuke the enemy line's weakest link, then corpse-explode it to exploit the gap.
- **The late plan:** the Decay tier-4 melee as the win condition, which needs a backline that heals.
- **The synergy:** the caster's ally-target (heal, then damage over time) **stacks with the Decay melee's rot**, loading the tier 4 for a bigger Lash out.
- Open (user's call): is the Psychopomp the support's tier 1, or one branch? Whose corpses count (enemies, allies, both)? Is a corpse used up once consumed (Claude: yes)?

## Answers (user, 2026-09-29)
1. **Tier 1 is basic**; the Psychopomp is a higher tier. The other branch is the **"Spiritess" branch: crowd control**, more moderate healing plus CC. Its idea: **Spiritwalk**, a double-sided banish: on an enemy it phases them out (they heal up and become invulnerable, but can't act); on an ally, it heals them the same way, and they're phased out under the same conditions. Still being played with.
   - **Faction identity (user):** "a lot of units heal some, but there isn't a super dedicated healer like Jilliath's support line."
2. **Corpses from both sides** count. The **offensive corpse explosion only on enemy corpses**; the **healing growth on corpses of either side**. It counters Jilliath's resurrection.
3. **A corpse is used up** once consumed.
- Claude's provisional reading (#58): only the explosion destroys the dead for good (the canon fungal infestation "prevents resurrection"); growth on an allied corpse doesn't cost it its place in the graveyard.

## The Spiritess branch (user, 2026-09-29)
- **Tier 2, Spiritess:** healing as a **semi-HoT, like WoW's Regrowth** (a heal now and more over time), and a **Swiftmend-like** ability that **instantly consumes the HoTs** on an ally for a massive burst heal. It **stacks with the Regrowth melee's HoT effects**: more synergy.
- **Tier 3, Psychopomp:** brings **Spiritwalk**. A spiritwalking unit **doesn't count as present**: it can't be targeted and doesn't hold up the enemy's melee line ("otherwise it just makes the melee line incapable of acting because their only target is invulnerable. That'd be busted").
- **Tier 4:** other ways of buffing or debuffing; probably **AoE healing**, which the faction has none of yet, "maybe even healing for everyone... some overgrowth stuff". Not settled.

## Water primary fire (user, 2026-10-05)
"Sylvan support regrowth line should have water based damage/healing on their primary fire. Primary fire deals damage
if targeting enemies, heals if targeting allies. Healing is much more than the damage on primary fire. Applies wet if
targeting enemy, only applies wet on allies if they're already burning (otherwise healing gets punished too hard by
nexus I feel)."
- **Claude's reading:** the support line has no branch called Regrowth; its healing side is the Spiritess branch (the
  user likened its heal to WoW's Regrowth). So the water primary fire goes to the tier-1 support, the Spiritess and the
  Psychopomp; the Decay support keeps its plain Shoot. Say if the Decay side should have it too.
- **Built:** *Wellspring* (named *Water* until 2026-10-07; the user: "Water is the element. It needs a different name. I'll let you pick, just don't pick 'water'") replaces Shoot: ranged, water damage. On an enemy: the unit's damage, and it's wet. On an ally (or
  itself): heals 3× the unit's damage, and puts out a fire (wet only if it was burning). Numbers `provisional.md` #67.
