# Jilliath: mage line

## The line
- **Role in the faction:** open.
- **Ends at tier:** open.
- **Forks:** open.
- **Theme:** (Claude, proposal) "putting your thumb in the wound, making a bad situation worse" (faction notes): a caster
  that finishes what the melee line starts, rather than a second source of burst.

## Tier 1

### Acolyte
- **Evolves into:** open.
- **Role:** (Claude) finisher.
- **Intent:** (Claude) weak against a fresh enemy, strong against a wounded one. It rewards the Congregant swarm and the
  Zealot for opening wounds, and gives the enemy an ultimatum: heal now or lose the unit.
- **Stats (Claude):** health low · damage low · armor none · initiative medium · fire damage (the red mana).
- **Abilities:**
  - *Condemn* (main action, every turn; placeholder name): ranged, one enemy. Deals its damage plus a share of the health
    the target is already missing. (You: fine, but careful it isn't too weak to begin with. Claude:) 25 fire damage plus
    30% of what's missing, so it's a fair hit on a fresh unit too.
- **Strong against / weak against (Claude):** wounded, tanky targets and anything the melee line already hit / fresh
  squads and a first strike, where it's the weakest unit in the fight.
- **Open questions:** name; whether it's the start of the resurrection or vengeance side of the faction.
- **Status:** in game as `acolyte`, the Acolyte (the user, 2026-10-07; numbers provisional).

## The user's direction (2026-10-06, the backline brainstorm)
"I think I'm fine with faith side of mage line being focused around holy damage, and fire side around fire damage. And
then whatever we can do within those boundaries. Like we can expand on that a lot. Faith castigation is good. I'm also
thinking repentance as a incapacitate mechanic. What offensive can we take inspiration from other games with holy […]
As for fire - Maybe we should actually have a look at boros instants and sorceries in mtg as inspiration for the
fanaticism line. I think you can do plenty, but we need to be creative. We'll put the martyrdom caster on a separate t4
branch in fanaticism, where the user would in the regular fanaticism branch probably play further around with the fire
stuff we're building into now. I did read what you wrote with your ideas by the way. I think we might change pyre to
'burn at the stake'. And I think that could be something that deals damage that stacks for every allied unit which are
left in the queue before restart, but skips their turn (as if they're contributing to burning an enemy at the stake).
That's like a finisher. Usually support units will be slower than casters, at least they were in disc2. Needs to be
used well, but essentially might just remove troublesome enemies outright but at a cost that might be very steep. Lets
call that first mage unit in fanaticism doomsayer. […] We can use judgement if you change it to 'all enemies who dealt
damage last turn'. Fanaticism casters should probably also stack burn on enemies. I'm thinking t3 will likely strike all
enemies for small damage but putting burn on all enemies."

The tree as it stands:
- **Tier-1 mage** (Condemn; name open), forking at tier 2 on **faith vs fanaticism**:
  - **Faith: holy damage.** *Castigation* (less damage, but whoever it hits deals less) is good. *Judgement*: strikes
    **all enemies who dealt damage last turn**. *Repentance*: an incapacitate. Tiers and the rest open; inspiration
    from holy attacks in other games.
  - **Fanaticism: fire damage, and its casters stack burn.**
    - **Doomsayer** (tier 2, the user's name): *Burn at the stake*, a finisher. Its damage stacks once for every
      allied unit still waiting in the round's queue, and each of those allies gives up its turn, "as if they're
      contributing to burning an enemy at the stake". It can remove a troublesome enemy outright, at a steep cost.
      (Supports are usually slower than casters, so they're often still in the queue.)
    - **Tier 3:** strikes all enemies for small damage and burns them all.
    - **Tier 4 forks:** the regular branch plays further with fire; a separate branch is the **martyrdom caster**
      (the beam through a line of three that backfires on every shot).
  - Inspiration for the fire side: Boros (red-white) instants and sorceries in Magic.

## Round two of the brainstorm (the user, 2026-10-06)
- **Faith (holy):** castigation and judgement (all enemies who dealt damage last turn) keep. **Repentance:** keep,
  "incapacitate for three turns. Free action. Unit wakes up early if damaged or healed by anyone or anything." Cut as
  copies or too strong: Hammer of Wrath, the exposed mark, Conversion, Swords to Plowshares ("OP"), dazzling light,
  holy nova.
- **Fanaticism (fire):** Doomsayer's burn at the stake keep ("very thematically pleasing and also useful"); tier 3's
  fire on all with burn keep; tier 4 regular branch: **detonate the burn** keep; the fire spreading on death maybe;
  the martyrdom caster keep. Justice Strike (burned by its own strength) and Arrows of Justice (only the aggressors)
  maybe. Cut: Lightning Helix ("the mage line having both damage and healing is owned by sylvans"), Boros Charm ("too
  much complexity").
- The deflecting secret may live on a holy off-branch here or in the support tree (see support.md).

## Round three, in conversation (the user, 2026-10-07)
- **The faith side's theme:** the user: "We also have a design issue, in that we don't really know exactly what theme
  faith mage line should actually have. I don't really know." Claude's reading of what the user kept: every holy piece
  answers the enemy's aggression (Judgement hits whoever struck, Castigation weakens whoever it hits, Repentance takes
  a unit out until anyone touches it, the secret turns a blow back), so **justice: the faith mage protects the squad
  by punishing and restraining the aggressor**, where the fanaticism mage consumes. The user: "Okay." (Provisional.)
- **Order:** "I'm pretty certain judgement is t4 holy magic. I'm also comfortable putting repentence on t3, but I'm
  not sure I'd say it's enough, given that mages is intended to be offense, and it likely needs more tools."
- **The secret:** "It really could be in both brackets" (mage or support). Open.

The tree as built (Claude, provisional; names other than the user's are placeholders):
- **Faith:** Holy mage 2 (Castigation) → Holy mage 3 (+ Repentance; more offense open) → Holy mage 4 (+ Judgement).
  Each tier keeps the last one's spells, like the melee line.
- **Fanaticism:** Doomsayer (Condemn, Burn at the stake, burn on its hits) → Fire mage 3 (+ fire on all) → forks:
  Fire mage 4 (+ detonate) or Martyr mage 4 (+ the beam, backfiring: Fanaticism's self-damage).

## The faith side is the priests (the user, 2026-10-07)
- **What "theme" meant:** "we basicaly have these different branches, right? And so the question becomes what the
  difference between a holy mage and a priest(healer) is. Like, we have the groundstones of the fanaticism line with
  doomsayer, plenty of stuff to grab onto there. But holy? Mmh." The answer: Jilliath is angels come back to earth and
  the humans who follow them (`design/factions/jilliath.md`); "We can actually 'just' have the holy mage line be
  priests, and then we hand over angels to the entirity of the support branch." (This replaces Claude's "justice"
  reading above.)
- **Names:** "t2 holy would probably be cleric then, t3 pontiff, t4 archon. If t1 mage isn't named, make it acolyte."
  Built: **Acolyte** (tier 1) → **Cleric** (2) → **Pontiff** (3) → **Archon** (4); the Doomsayer's side as before.
- **The Pontiff's other upgrade:** "I think we can just have castigate be AOE on t3 in a square 2x2 as the other
  upgrade. Yes, that's not balanced right now, but that's probably the right move." Built: from the Pontiff on,
  Castigation strikes a 2×2 square (the Archon keeps it).
