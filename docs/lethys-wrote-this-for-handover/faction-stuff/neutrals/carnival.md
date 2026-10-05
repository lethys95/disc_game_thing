# Neutrals: the carnival

> **The user's tribe (2026-10-05).** "I'm thinking of a nomadic swindler carnival type neutral tribe/faction. I have
> two units in mind so far, both of the stronger type. Not all of this faction will be interacting with tarot, but
> these two will." The tribe's name is a placeholder ("the carnival") until the user names it. Numbers
> `provisional.md` #67.

## Soothsayer (tier 2)
- **The user:** "Soothsayer will add tarot 5 on entry. Otherwise has basic fire which is fairly strong, but always
  deferred by 1 turn. Also has curse ability which makes targets deal 35% less damage for 3 turns."
- **Look (user):** "She'll look like a soothsayer does, likely walking around with that one ball hovering in one of her
  hands, a hand of cards in the other. Robes, veil around mouth, loose robes."
- **Claude's reading:** *Tarot 5* (the keyword). *Foretell* (her attack, ranged): the hit lands at the start of her
  next turn (if she's dead by then, it never does). *Curse* (main action): one enemy deals 35% less damage for its next
  3 turns. "Targets" could mean several: say if Curse should hit an area.

## Omen (tier 2)
- **The user:** "Visually uses twin flintlocks blinded by bands over his eyes. Ranged unit. Every tarot he triggers,
  trigger twice. Whenever he or a tarot he triggers, kills a unit, use tarot 3 (i.e. we draw more)."
- **Claude's reading:** a ranged attack. When his action fulfils a tarot card, its reward pays twice. For each enemy
  that dies during his action (his shot, or a reward he set off), his side draws a fresh hand of 3 and picks one.

## Fire Eater (tier 1; the name is Claude's, at the user's invitation)
- **The user:** "some melee torch unit which spits out fire in a cone. Probably just 3 tiled aoe with one additional in
  front, meaning he'll hit the middle line in the tiles directly across from him, as well as each unit in the front line
  (if he's in the front). It's not a full 5 tile front, it's 3, so he wouldn't hit the unit in the opposite extreme if
  he's placed to the side. Also this fire attack he uses applies burn. You can give him an appropriate name."
- **Built:** *Spit fire* (his attack, melee, fire): the enemy front-row tiles in his column and the two beside it, and
  the middle-row tile in his column; everyone hit burns (Ignite).
- **Look (Claude):** a carnival fire-breather with a torch and a flask, soot and scorch on worn motley.

## Camps (Claude)
Not on the map yet ("nomadic": maybe they roam). Groups for the sims and `?fight=carnival`: two Fire Eaters (weak);
two Fire Eaters and the Soothsayer (medium, level 2); two Fire Eaters, the Soothsayer and Omen (strong, level 4).

**Status:** in game as `soothsayer`, `omen`, `fire_eater`, `cutpurse`, `snakeoiler` (`?fight=carnival`); numbers `provisional.md` #67.

## More units (user, 2026-10-05)
- **Cutpurse:** "very basic unit probably. Just high initiative and crit 4 I think."
- **Snakeoiler:** "backline support unit. One-time use sleep potion which incapacitates for one turn. Unit wakes up if
  it takes damage, and is put back into the queue. Otherwise just a moderate healing potion throw to allies, or a weak
  one-target explosive (not aoe) on a single target enemy, also ranged any target."
- **Built (Claude's numbers):** Cutpurse (tier 1) 75 HP, 18, initiative 70, Crit 4. Snakeoiler (tier 1) 65 HP,
  initiative 45: *Healing draught* (an ally heals 30), *Explosive flask* (its attack: one enemy anywhere takes 18 fire),
  *Sleep potion* (once: one enemy loses its next turn unless hurt first; woken, it keeps its place in the queue; the same
  rule as the Drawn's Mesmerize, under its own name). Groups now: weak Cutpurse, Fire Eater, Snakeoiler; medium two
  Cutpurses, Fire Eater, Snakeoiler, Soothsayer; strong Cutpurse, two Fire Eaters, Snakeoiler, Soothsayer, Omen.
