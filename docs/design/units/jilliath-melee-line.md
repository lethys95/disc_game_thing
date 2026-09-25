# Inquisition Melee Line

> Provenance: largely hand-crafted by the user (redesign session, C# attempt, 2026-07-30). **Treat as canon** (user, 2026-09-25). Numbers are first-pass balance, not sacred.

The Jilliath melee line is built on a central dichotomy: **faith preserves vs faith consumes**. Tier 1 is a shared baseline that diverges at tier 2 into two branches — the Paladin line (self-preservation, defense, protection) and the Zealot line (self-sacrifice, fanaticism, martyrdom). The Paladin line is linear through all tiers. The Zealot line branches again at tier 3.

> [!note] Status
> Design spec from the 2026-07-28 redesign. Numbers are first-pass, not balanced.

## Tier 1: Congregant

| Stat | Value |
|------|-------|
| HP | 90 |
| Damage | 20 |
| Armor | 0 |
| Initiative | 50 |
| Cost | 40 gold |

The Congregant is the neutral baseline — a common faithful, not yet committed to the path of the Paladin or the Zealot. It is the cheapest melee unit and its strength comes from numbers.

**Congregation mechanic:** A Congregant gains +10 damage for each other Congregant in the same squad. Three congregants in the front line each deal 40 damage (20 base + 20 from two others). This creates a strategic tension: filling the front with congregants is cost-efficient and mutually reinforcing, but upgrading a congregant removes it from the buff network, and congregants in mid/back rows can buff but cannot attack (melee units only hit the front line).

## Tier 2: Divergence

The Congregant upgrades into one of two branches at tier 2.

### Paladin — faith preserves

| Stat | Value |
|------|-------|
| HP | 150 |
| Damage | 40 |
| Armor | 20 |
| Initiative | 50 |

The Paladin is the "doesn't die" unit. 20 armor means a Congregant's 20 damage is floored to 1 — the Paladin walls swarm units completely. Against big hits (like the Zealot's 70), armor is irrelevant and the Paladin takes 50. This is the intended armor design: strong against weak attacks, irrelevant against strong ones.

**Lay on Hands** — active ability, free action, once per combat. Heals self for 2× the Paladin's damage stat (80 HP at base). A free action means the Paladin can attack or defend on the same turn it heals. This is the Paladin's sustain tool — it can survive one big hit, then patch itself up and keep holding the line.

The Paladin line does not branch. It is a single linear path through all tiers.

### Zealot — faith consumes

| Stat | Value |
|------|-------|
| HP | 180 |
| Damage | 70 |
| Armor | 0 |
| Initiative | 50 |

The Zealot is a ticking clock. It deals 70 damage per attack but takes half of that (35) as self-damage each time it attacks. Five attacks kills itself (5 × 35 = 175). The Zealot either wins before it burns out, or it dies. There is no stalling with a Zealot.

**Restrictions:**

- **Must attack** — the Zealot is forced to attack each turn. It cannot wait, defend, or use non-attack abilities.
- **Cannot defend** — see `docs/design/combat.md`.

The self-damage is always half of current damage, so external buffs (Congregation, items, leader upgrades) are double-edged on Zealots — they increase output but also increase self-harm. This fits the theme: a buffed Zealot is more dangerous to everyone, including itself.

**Look (user, 2026-09-25, canon):** a mask covers the whole head. It has no features except two eye holes, wide and staring, with black behind them (no skin shows). On the mask's forehead, a burning outstretched hand with spread fingers. Otherwise the mask is featureless: ominous, strange and inhuman, so that it triggers "this is wrong, grotesque, deranged and twisted". Spiked, tattered armor. A serrated two-handed sword. Pale colors with a strong contrast of black, white and red.

## Tier 3

### Templar — Paladin line, tier 3

| Stat | Value |
|------|-------|
| HP | 200 |
| Damage | 60 |
| Armor | 20 |
| Initiative | 50 |

The Templar continues the Paladin line's theme of increasing self-defense. It retains **Lay on Hands** (heal for 2× damage = 120 HP, once per combat) and gains **Devotion Aura** — a passive that adds the Templar's armor bonus (+20) to adjacent allied units. The aura makes the Templar a force multiplier: place it in the center of the front line and the units beside it become nearly as hard to kill as the Templar itself.

The Paladin line is linear: Congregant → Paladin → Templar → Immortal (T4, terminal).

### Immortal — Paladin line, tier 4, terminal

| Stat | Value |
|------|-------|
| HP | 260 |
| Damage | 80 |
| Armor | 20 |
| Initiative | 50 |

The capstone of the faith-preserves branch. The Immortal is the Paladin line's ultimate expression — a unit that cannot be killed through normal means.

**Divine Lay on Hands** — upgraded Lay on Hands. Two charges per combat instead of one. Can target self or an ally.

- **On self:** free action. Heals for 2× damage (160 HP).
- **On ally:** main action. Heals the target for 2× the Immortal's damage (160 HP). Costs the Immortal's main action for the turn.

The self-target free action preserves the Paladin line's identity — the Immortal can attack and heal itself on the same turn. The ally-target main action opens the line to a support role: the Immortal can sacrifice its own action to save an ally, but cannot also attack that turn.

**Devotion Aura** — retained from Templar. Adjacent allies gain +20 armor.

**Guardian Spirit** — passive, once per combat. If the Immortal would be reduced to 0 HP, it instead cannot drop below 1 HP for the rest of the turn. The death blow is negated, and the Immortal survives until the turn ends — giving it a window to heal (Divine Lay on Hands) or be healed by an ally. Once used, Guardian Spirit is spent for the rest of the combat; the next killing blow in a later turn will land. This makes the Immortal genuinely immortal once per fight: it can survive a death blow, heal back up, and keep fighting — but it can only cheat death once, so a second successful kill attempt will finish it.

## Tier 3 Zealot branches

The Zealot line diverges at tier 3 into two paths with asymmetric depth.

### Punishment branch — caps at tier 4

#### Punisher — tier 3

| Stat | Value |
|------|-------|
| HP | 200 |
| Damage | 45 |
| Armor | 0 |
| Initiative | 50 |

The Punisher drops the Zealot's forced-attack restriction — it is no longer compelled to attack every turn and can defend like any normal unit. The fanaticism is redirected from self-destruction into control.

Weapon: multi-headed flanged flail. The Punisher's attack hits the **entire enemy front line** in a single swing (all cells in the opposing front row). This is an AoE melee line attack, not a single-target strike.

**Punishment** — passive debuff applied on hit. Every enemy struck by the flail suffers -10 damage and -10 initiative for the rest of combat. The debuff is permanent, does not wear off, is stackable per hit, and applies to every unit caught in the swing. A front line hit twice by a Punisher is at -20 damage and -20 initiative until the fight ends.

The -10 initiative can drop an enemy across an action threshold (for example, from 50 to 40, potentially losing an action). This is the Punisher's core identity: it does not kill fast; it degrades the enemy's ability to fight back.

#### Torturer — tier 4, terminal

| Stat | Value |
|------|-------|
| HP | 220 |
| Damage | 60 |
| Armor | 0 |
| Initiative | 50 |

The Torturer escalates the punishment theme into domination. It retains the flail's AoE front-line attack and the Punishment debuff.

**Domination** — passive upgrade to Punishment. 50% of the Torturer's damage dealt is converted into a stackable bleed debuff instead of direct damage. The remaining 50% hits HP immediately; the bleed portion deals damage at the **start of the afflicted unit's turn** (before it acts), stacking per hit. The bleed stacks persist for the rest of combat. The Torturer's front-line swings deal immediate damage and plant a ticking debt — the enemy front line is simultaneously bled now and bleeding later. Because higher-initiative enemies act first, they take their bleed damage early in the round; as the Punishment debuff lowers their initiative over time, they slide later in the turn order, delaying their bleed proc but also delaying their ability to respond. The two effects compound: the enemy gets weaker and slower every turn.

**Hook** — active ability, once per combat, main action. Pulls a target from the second or third enemy row to the front row and stuns it for one round.

- Only works on units in the second or third row — never the front row.
- Requires a clear straight-line path from the Torturer to the target. If any unit occupies the cell(s) between the target and the front row, the hook cannot be cast.
- Cannot target the third row if the second row has a unit in the way; the hook hits the first unit in its path.
- Stuns the pulled target for one round; it cannot act on its next turn.
- This is a main action. Using Hook consumes the Torturer's action for the turn; it cannot also attack on the same turn.

The Hook's purpose is to drag a ranged or support unit out of safety and into the front line, where it becomes a valid target for melee attacks — including the Torturer's own AoE flail swing on a subsequent turn. A Torturer that hooks a backline caster into the front, then swings the flail the next turn, can debuff and bleed a unit that was never supposed to be in melee range.

### Self-sacrifice branch — extends to tier 5

#### Fanatic — tier 3

The martyrdom path begins here. This melee-only unit has **280 HP** and **110 damage** (single-target).

**Fanaticism** — passive. The Fanatic must attack each turn; each damage dealt also deals self-damage equal to **50% of the damage dealt**.

**Hysteria** — passive. When the Fanatic defeats an enemy, it immediately makes a free extra attack that suffers **double** the Fanaticism self-damage penalty. The first trigger applies a 100% penalty and the second applies a 200% penalty. Hysteria can trigger up to twice per turn, each time doubling the penalty. The unit can only target melee units in the front line.

| Stat | Value |
|------|-------|
| HP | 280 |
| Damage | 110 |
| Armor | 0 |
| Initiative | 50 |

#### Chosen — tier 4

The self-sacrifice branch's next tier. This melee-only unit has **320 HP**, **150 damage**, and **Initiative 60**. It retains the Fanaticism and Hysteria passives exactly as the Fanatic: self-damage equals 50% of damage dealt, and free extra attacks on kills have doubled self-damage penalties, up to two triggers per turn. Unlike the Fanatic, its attacks deal fire damage instead of weapon damage.

| Stat | Value |
|------|-------|
| HP | 320 |
| Damage | 150 |
| Armor | 0 |
| Initiative | 60 |

#### Avatar of Vengeance — tier 5

The faction's ultimate capstone. This melee-only unit has **400 HP**, **150 damage**, and **Initiative 60**. It suffers self-damage equal to half of the damage it deals.

**Fanaticism Aura** — all units on the battlefield suffer Fanaticism and Hysteria: no unit can defend, and each unit takes self-damage equal to half of the damage it deals.

| Stat | Value |
|------|-------|
| HP | 400 |
| Damage | 150 |
| Armor | 0 |
| Initiative | 60 |

The punishment line is shorter (tier 4 cap) because punishment is a utility, not an identity. The self-sacrifice line extends to tier 5 because martyrdom is the Inquisition's ceiling — the deeper the commitment to spending oneself, the higher the tier climbs.

## Tree Shape

```text
                         Congregant (T1)
                        /              \\
                 Paladin (T2)      Zealot (T2)
                    |            /            \\
               Templar (T3)  Punisher        Fanatic
                    |          (T3)            (T3)
              Immortal (T4)    |               |
                            Torturer         Chosen
                             (T4)            (T4)
                               |               |
                          (dead end)    Avatar of Vengeance
                                            (T5)
```

The Paladin line is a single spine: Congregant → Paladin → Templar → Immortal, tier 4 terminal. The Zealot line forks at tier 3: the punishment branch is a shorter utility path (Punisher → Torturer, tier 4 terminal), while the self-sacrifice branch is the faction's deepest commitment (Fanatic → Chosen → Avatar of Vengeance, tier 5).

## Branch Investment

Divergence points are permanent faction investments, not per-unit choices. At each branch point, the player spends gold in the tech tree to unlock a branch. Once invested, the branch is committed — the player cannot go back and unlock the other side.

- **Tier 2 split:** Invest in the Paladin line or the Zealot line. Once the gold is spent, every Congregant upgraded is locked into that branch.
- **Tier 3 Zealot split:** Invest in Punishment or Self-sacrifice. The same rule applies: gold spent, no refund, no rechoice.

This means faction strategy is decided early and committed. You cannot field both Paladins and Zealots, or both Punishers and Fanatics. The tech-tree investment is the faction's doctrinal choice, and it is irreversible.

Source: old Godot attempt vault (`disc_obsidian/mechanics/faction_mechanics/inquisition_mechanics/melee-line.md`), originally commit `e0044e5` there.
