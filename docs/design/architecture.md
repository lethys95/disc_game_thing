# Rules architecture: traits, effects, abilities, damage

> Written 2026-09-25 after a self-review found the rules engine growing special cases (26 per-effect checks in the engine, hard-coded ability ids, AI weights per mechanic). The user asked for a design that can take complicated mechanics without that happening again: "bad architecture was one of the fundamental killers of the other projects."

## The test: hard cases the model must handle without engine changes
Already in the game:
- Armor (flat, floor 1); Defend (halves only what gets past the shield); shields (a pool, not halved by Defend, refilled only by shield restoration, full each battle).
- Lent shields that perish when the *lender's* next turn starts (Equalize).
- Stacking with a cap (Punishment ×3), stacking without a cap (Mutate), accumulating magnitude (bleed).
- Timed effects on different clocks: until the bearer's next turn (Defend, Stun), until the round ends (Guardian Spirit's reprieve), all battle (Punishment, bleed).
- Replacements: a cancelled ability (Counter), a prevented death (Guardian Spirit), damage turned into bleed (Domination).
- Reactions: on hit (Punishment), after attacking (Zeal, Fanaticism), on a kill (Hysteria), on a shield overcharge (Mutate).
- Auras: positional (Devotion Aura), battlefield-wide rule changes that grant and forbid abilities (Fanaticism Aura), dynamic (Congregation).
- Per-target bonuses (Marauder vs armor); abilities with fixed power (Burst) vs power from the unit's damage (Attack).
- Hidden information (Counter's mark is secret from the marked side).

Asked for or implied by the design:
- **Blacksmith node**: a world-level source (owning a city node) makes abilities deal +10 damage in battle. Fixed-power spells too, not just the damage stat.
- **Fire shield**: a pool that only absorbs fire damage.
- Items and equipment granting abilities or stats; leader upgrades; overworld spells buffing a warband for N world turns; city upgrades giving stationed units armor and regeneration.
- Immunities ("immunity is the only true zero"), resistances, damage types beyond weapon/fire.
- Dispels and cleanses, by kind or by source.

## The model

### 1. Traits: one hook interface for everything that changes the rules
A **trait** is a bundle of hooks. Passive abilities are traits. Effects (buffs, debuffs, marks, shields) are traits with state and a lifetime. Context from the world (a node, an item, a spell) arrives as traits too. The engine never names a specific mechanic; it asks every relevant trait at fixed points:

| Hook | Asked of | Used by |
|---|---|---|
| `stats(subject, stats)` | every trait on the battlefield (auras see other units) | Congregation, Devotion Aura, Punished, Mutated, context bonuses |
| `grants(subject)` / `restrict(subject, allowed)` | every trait | Fanaticism Aura, Must Attack |
| `outgoing(packet)` | the attacker's traits | Marauder (+10 vs armor), Blacksmith (+10), Domination (split into bleed) |
| `incoming(packet)` | the target's traits | immunities, resistances |
| `absorb(packet)` → amount | the target's traits, in priority order | fire shield (fire only), shield pool (anything) |
| `mitigate(packet)` | the target's traits | Defend (halve) |
| `turnStart(unit)` → `skip`? | traits on the unit whose turn starts | Stun, bleed tick |
| `anyTurnStart(actor)` | all traits | lent shields expiring when their lender acts |
| `beforeAbility(action)` → `cancel`? | the actor's traits | Counter |
| `afterHit`, `afterAttack`, `onKill` | the attacker's traits | Punishment, Zeal, Fanaticism, Hysteria |
| `preventDeath` | the dying unit's traits | Guardian Spirit, its reprieve |
| `restored(pool, overflow)` | the target's traits | Mutate |
| `aiValue(unit)` | every trait | the AI's valuation of a mark, a mutation, a shield |

Adding a mechanic means writing a trait. The engine and the AI don't change.

### 2. Effects: definitions and instances
An **effect definition** (registered by id, like abilities) holds the hooks plus metadata:
- `stacking`: `unique` (re-applying refreshes it), `stack` (up to an optional cap), or `independent` (one instance per source; loans).
- `lifetime`: `battle`, `untilOwnTurn` (ends when the bearer's next turn starts), `untilRoundEnd`, `untilSourceTurn` (ends when the source's next turn starts), or `permanent` (world-level; survives battles).
- `visibility`: `public`, or `hiddenFromBearerSide` (Counter's mark). The view reads this flag; nothing checks effect names.
- `onExpire`: cleanup, e.g. a lent shield takes back what's left of the loan.

Every definition also carries `describe`: its rules text, computed from its own numbers, so the words can't drift from the rule.

An **effect instance** on a unit is plain data: `{ def, source, stacks, amount }`. It stays serializable, so battles can still be cloned, forecast and saved.

### 3. Damage is a typed packet through an ordered pipeline
`{ source, target, amount, type, tags }` goes through:
1. **Power**: the ability's power (a param, or the unit's damage stat).
2. **Outgoing**: the attacker's traits add or multiply, filtered by the ability's tags and the target (Blacksmith +10 on `damage` abilities; Marauder +10 against armor).
3. **Conversion**: traits may split off part of the packet (Domination turns half into bleed).
4. **Incoming**: the target's immunities (to 0) and resistances.
5. **Armor**: flat subtraction, floor 1 (unless immune).
6. **Absorb**: pools in priority order; a typed pool only takes matching damage (fire shield → shield pool).
7. **Mitigate**: what got through the pools (Defend halves it; the user's rule that shields don't benefit from Defend).
8. **Apply** to HP, then `preventDeath` if it would kill.
9. **Reactions**: `afterHit`, `onKill`, then `afterAttack` once for the whole ability.

Direct losses (bleed, self-sacrifice) skip steps 2–7 by design: they're costs, not hits.

### 4. Abilities: behavior plus params and tags
An ability on a unit is `{ id, params }`; `params` are numbers (power, charges, amounts), so variants and balance tuning don't need new code. Divine Lay on Hands is Lay on Hands with `{ charges: 2, allies: 1 }`. Each ability declares **tags** (`attack`, `melee`, `ranged`, `spell`, `damage`, `heal`, `basic`) and a damage type. Modifiers target tags, and the UI and AI use tags (default action = the `attack`-tagged one; `basic` actions aren't listed on unit cards). Nothing outside `abilities/` names an ability id.

### 5. Context from the world enters battle as traits
`createBattle` takes a context per side and per unit:
- **Side traits**: owning a Blacksmith node, a faction-wide spell.
- **Unit traits**: equipment, leader upgrades, a world-level effect like a curse lasting N world turns.

The world computes the context from what it owns. The battle doesn't know what a city is. City nodes become data (`gold mine`: income; `blacksmith`: a side trait), so new node kinds are additive.

### 6. Hidden information
Visibility lives on definitions (`hiddenFromBearerSide` on the effect, `secretTarget` on the ability). The view's mask reads those flags. The AI sees everything for now; real multiplayer would need the rules to produce per-side views.

## Code layout
```
src/rules/battle/   engine (turn flow, actions), damage pipeline, traits (hooks, registry, effect lifetimes), context
src/rules/abilities/ core, jilliath, nexus, neutral (behaviors + passive traits)
src/rules/effects.ts effect definitions
src/rules/units/    catalogue by faction
src/rules/world/    state, movement, economy, battles-to-world, map AI
src/rules/balance.ts provisional numbers that aren't per-unit or per-ability params
```
