# Jilliath: support line

## The line
- **Role in the faction:** open.
- **Ends at tier:** open.
- **Forks:** open.
- **Theme:** open. (Claude, for later tiers:) Jilliath has "the most healing of any faction, with side effects (martyrdom)";
  that's where this line could go once it forks.

## Ideas
- (You, 2026-09-26) An ability like WoW's *Beacon of Light* on one of this line's units.
- (You, 2026-09-26) Resurrection is likely a Jilliath mechanic; it may live here.

## Tier 1

### Jilliath support 1 (was Cleric; unnamed until the angels are worked out)
- **Evolves into:** open.
- **Role:** healer.
- **Intent:** (you) a simple single-target heal. (Claude:) the first unit that keeps the front line standing; a squad with a
  Cleric wins long fights it would otherwise lose, but it adds nothing to a fight's damage.
- **Stats (Claude):** health low · damage none · armor none · initiative medium.
- **Abilities:**
  - *Heal* (main action, every turn): restores health to one wounded ally, more the more it is missing (you, 2026-09-26).
    Can't restore shields (Nexus rule). (Claude:) 20 plus 30% of what's missing.
  - *Shoot* (main action): a weak ranged attack (you: not D2's attack-less healer).
- **Strong against / weak against (Claude):** attrition and chip damage / burst that kills before healing matters, and
  anything that reaches the back row.
- **Status:** in game as `jilliath_support_1` (unnamed since 2026-10-07; numbers provisional).

## The user's direction (2026-10-06, the backline brainstorm)
"I can imagine the offensive side of the support line will work maybe a bit like discipline priests in wow, in that they'll heal by damaging. We might actually just straight up yoink the atonement kit they use, I think. Then we can split within fanaticism further to bring in transfusion in a different subline. Faith will likely be more basic. Resurrection only lives under faith. I also want to be careful with the self-damage. Not everything under fanaticism needs to use this mechanic."
And: "Penance as you wrote it is confusing to me, and I don't know what it does. It might not be worth it."

The tree as it stands (names and numbers open):
- **Cleric** (tier 1), forking at tier 2 on **faith vs fanaticism** (the game's duality):
  - **Faith:** "more basic". Claude's ideas the user saw: inner fire (an ally's armour against the next hit, the
    user's own idea) at tier 2, a beacon (the user's Beacon of Light) at tier 3. **Resurrection lives only here**
    (tier 4 in Claude's draft).
  - **Fanaticism:** heals by damaging, after World of Warcraft's discipline priest and its *Atonement*: the unit's
    damage to enemies heals allies it has marked. It splits again further up: one subline goes on with atonement,
    the other brings in *transfusion* (healing paid with its own health). Self-damage sparingly: "not everything
    under fanaticism needs to use this mechanic."
  - Penance (Claude's): cut.

## Round two of the brainstorm (the user, 2026-10-06)
- **Atonement** (fanaticism): keep, "probably not 1 to 1. Should damage less than it heals." Its tier-3 subline with
  wider atonement: keep. The **transfusion** subline: keep. A tier 4 for one subline: not the capstones Claude offered
  ("I think we can do better. Atonement at t3 already has more targets. What else can we do with this. Maybe this is
  where deflection palm kicks in?").
- **Faith:** inner fire and the beacon cut ("too cut and paste from wow"); its tier 2 and 3 are open again.
  **Resurrection** (tier 4): keep, "at 50% health to begin with. It's possible we go up to 100%." **The unit is an
  angel** ("we should have the final side of faith support (resurrection) be an angel").
- **A secret on the holy side** (the user): "we can actually have an off branch on the holy side of either support or
  damage use a secret which has deflecting palm […] It's neat and kind of cheeky to put a single secret in there when
  it's otherwise a nexus mechanic. Just maybe don't call it deflecting palm." The secret: the next hit on a chosen
  ally is prevented and dealt back to whoever struck.

## The support line is angels (the user, 2026-10-07)
"We hand over angels to the entirity of the support branch." The tier-1 support was the Cleric; that name went to the
tier-2 priest, and "t1 support is currently called cleric, so we just need it to be unnamed until we can figure out
what to do with the angels in the support branch." In the game as `jilliath_support_1` ("Jilliath support 1").
- **Guardian vs vengeance (the user, 2026-10-07):** faith is guardian angels, fanaticism vengeance angels (from the
  user's 2024 mana note, "Vengeance angels, Fanatics"): "guardian vs vengeance, sure. We can do that."
- **Inspiration: MTG's angels.** The user: "I might actually have a look at how mtg handles different kinds of angels
  thematically. They've done a ton of angels with all sorts of themes." Claude's round four,
  `shots/jilliath-angels.html`: MTG's angel themes, each with what the card does and a first translation into disc,
  plus the tier-1 question (an angel already, or a human who ascends at tier 2).

## The angels' look and the line's reach (the user, 2026-10-07)
- **Names:** "As for words for angels - I don't think we have many. Seraph, angel - valkyrie if you stretch, but I'm
  not a fan of using valkyrie like that. So we'll probably just not call all of them something to do with an angel,
  and we'll make some stuff up probably."
- **Tier 1:** "t1 angel will be the most basic. Probably in a very humble position. Hooded, closed off, praying.
  Something like that." (In `LOOKS`, `scripts/art/prompts.ts`.)
- **Faith, the later tiers:** "I can imagine making one of them on the holy side with wings of stained glass or
  inspired by it in colors and shape. Probably one of the later tiers. Maybe the last tier will just be pure light. Or
  like have some vfx be its surface shifting into the colors of a moving sky, like it's completely out of place, light
  spiking through the clouds in its skin. It's hard to explain what I have in mind here, but I think it could be
  interesting and difficult."
- **Faith to tier 5:** "We should probably honestly go to t5 with faith support I think. It's possible. I think
  there's a lot of room to be creative and it's at the very root of what the faction is actually about. Like the very
  edges of the support branch showcases to some extent who is pulling the strings and the reason why the inquisition
  was pushed into motion."
- **Fanaticism:** "Not necessarily super sure how to move on too much from the fanaticism side thematically except
  maybe blood tipped wings on one or more of them. Basically how can you display that the angels have become annoyed
  and decided to take matters into their own hands."

The tree as it stands (names open):
- Tier 1 (the humble, praying angel), forking on guardian (faith) vs vengeance (fanaticism):
  - **Guardian:** ? (t2) → ? (t3) → ? (t4) → ? (t5, maybe: pure light, a moving sky in its skin). The resurrecting
    angel somewhere in t4–t5; stained-glass wings on a later tier.
  - **Vengeance:** atonement (t2) → wider atonement (t3) → ? (t4) / transfusion (t3). Blood-tipped wings, maybe.
- **Tier 5 and tier 4, elaborated (the user, 2026-10-07):** "it'd probably be like a silhuette. It kind of 'breaks the
  game's graphics' in that sense. Unit looks out of place in a way that makes it look out of place. Surface of that
  silhuette is just a moving sky/clouds. God rays spikes out and shines out of her skin every once in a while. There is
  only this skin. No clothing, just the silhuette of sky and godrays. It'll be very strange to look at if done
  correctly I think. t4 can be stained glass." Where the resurrecting angel sits (t4 or t5): "I'm not sure."

## Names (the user, 2026-10-07)
"Lets have t2 fanaticism support be called paragon, and t2 faith emissary. Lets have t1 be called seraph. The three
will be the most typical angels." And: "t3 faith - guardian, t4 faith - shepherd, t5 faith - godkin. t3a - empyreal,
t3b - reclaimer (until I figure out something better, not sure about this one)", where "t3a t3b I mean fanaticism
branch". Reading (Claude): t3a is the wider-atonement subline, t3b the transfusion one, in the order the tree lists
them.

The tree with names (abilities past atonement, transfusion and resurrection open):
- **Seraph** (t1, in game as `seraph`), forking on guardian (faith) vs vengeance (fanaticism):
  - **Guardian:** Emissary (t2) → Guardian (t3) → Shepherd (t4, stained glass) → Godkin (t5, the sky silhouette).
    The resurrecting angel is the Shepherd or the Godkin (open).
  - **Vengeance:** Paragon (t2, atonement) → Empyreal (t3a, wider atonement) → ? (t4) / Reclaimer (t3b, transfusion;
    name provisional).
- **Round four's page** (the user): "I've really enjoyed this format in other turns, but this angel one here is a miss,
  I think. It's okay." The picks were "very bland ones. Not maelstrom angel, not filigree, not goldnight castigator.
  Just a lot of regular sera angel adjacent ones." The format stays; the user is working through MTG's angels on their
  own sheet.
- **The Reclaimer (the user, 2026-10-07):** "reclaimer is transfusion... And maybe even lifesteal if we think about
  reclaiming. 'What was given can be taken away' type stuff. Idk. Worth playing around with, though it's a bit
  vampire-y. Though she did have an issue with not being able to give herself health back after having lost it to
  her heals. So by having massive but double edged heals + some lifedrain on enemies as attack. I mean that makes for
  a pretty neat thing I think. So maybe that's just what we're going for. Of course we're not making a literal
  vampire, just want to make that clear. It's an angel, but on the fanaticism line." So: **massive heals paid with
  her own health (transfusion), and an attack that drains life from enemies to win it back.** An angel, not a vampire.
  (Empyreal is therefore the wider-atonement tier 3.)
- **The two sides' roles (the user, 2026-10-07):** "Overall I think faith might become more about buffs and moderate
  heals, where as reclaimer will have the strongest heal of them all but with a downside. Faith will probably usually
  be the safe choice in the end, fanaticism being used in more aggressive compositions. But yeah, go ahead and create."

Built (Claude's readings, provisional numbers: `provisional.md` #73):
- **Emissary** (t2, faith): a placeholder, the Seraph's Heal and Shoot at tier-2 strength, so the fork has both sides.
- **Paragon** (t2): *Atonement*, its attack: hits an enemy, and its most wounded ally heals 150% of the damage dealt.
  It heals only through Atonement.
- **Empyreal** (t3a): Atonement healing its three most wounded allies, each for 100% of the damage dealt.
- **Reclaimer** (t3b): *Transfusion*, the strongest heal, paid for with half of what it heals from her own health; and
  *Reclaim* (placeholder name, from the user's "reclaiming"), an attack that heals her for what it deals.
