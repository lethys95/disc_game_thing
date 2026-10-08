# Unit roster: identity, concept art, portrait

> The user (2026-10-05): "We need identities for each unit we have, before we can create the pre-3D 2D concept art, and
> we need 2D concept art before you can do the portraits." The order: **identity** (a look, in words) → **concept** (a
> picked 2D image) → **portrait** (the card on the field and the icon everywhere else, made from the concept). Keep
> this table current; it's the to-do list for unit art. Sources per unit are in its design doc.

**Which art counts (user, 2026-10-05):** only art made in the 3D concept strategy, the Custodian's onward: the
Custodian, the Grove's Decay line, the gnolls, the Drawn. "We can't really trust any art that is older than sylvans and
custodian." Older picks (the Zealot's and Punisher's portraits) are stand-ins until portraits are made from the new concepts.

Portraits (card, bust, icon) come from the picked concept: `scripts/art/portraits.ts`, `shots/portraits.html`.

Legend: **Identity:** user = a look the user described; Claude = Claude's description (accepted or pending);
thin = a word or two (gender, "golem"); — = none. **Concept:** picked = the user picked one; Claude = Claude picked,
awaiting the user; cand. = candidates, none picked; — = none. **Portrait:** ✓ installed.

## 1. Identity and a picked concept: ready for a portrait
| Unit | Faction · tier | Identity | Concept | Portrait |
|---|---|---|---|---|
| Sproutling | Grove 1 | user (a small treant) | picked: `sproutling-stump-turnaround-1002` | ✓ |
| Moldling | Grove 2 | user (mycelium, skinny) | picked: `moldling-mycelium-hunched-turnaround-1000` | ✓ |
| Deadwood | Grove 3 | user (an animated dead tree) | picked: `deadwood-blasted-turnaround-1002` | ✓ |
| Bog Giant | Grove 4 | user (a swamp hulk, huge right arm) | picked: `bog-giant-hulk-turnaround-1002` | ✓ |
| Mulch Gorger | Grove 4 | user (a skull and plant matter) | picked: `mulch-gorger-heap-turnaround-1000` | ✓ |
| Psychopomp | Grove 3 | user (canon; rounds two to four, 2026-10-05) | picked: `psychopomp-short-turnaround-1002` (user, round six; backups short 1001, style-first 1000: the ears) | ✓ |
| Punisher | Jilliath 3 | the original executioner's hood, in iron grey (`punisher-concepts.md`) | picked: `punisher-iron-turnaround-1000` (user, round two); flail `punisher-flail-flanged-props-1001` | ✓ |
| Zealot | Jilliath 2 | user (canon mask, palette; wild eyes, 2026-10-05) | picked: `zealot-pyre-turnaround-1000` (user, round one of seven) | ✓ |
| Custodian | Nexus 1 | user ("a golem") + Claude's stone and brass | picked: `custodian-3d-1002` (3D), `custodian-1000` (portrait) | ✓ |
| Bonecracker | gnolls 1 | Claude (accepted) | picked: 1002 | ✓ |
| Cackler | gnolls 1 | Claude (accepted) | picked: `cackler-turnaround-1002` | ✓ |
| Matriarch | gnolls 2 | Claude (accepted) | picked: `matriarch-turnaround-1001` | ✓ |
| Packstalker | gnolls 1 | Claude (accepted) | picked: `packstalker-skullhelm-turnaround-1001`, spear `packstalker-spear-props-1001` | ✓ |
| Hamstringer | gnolls 1 | Claude (accepted) | picked: `hamstringer-wraps-turnaround-1000`, kit `hamstringer-kit-props-1000` | ✓ |
| Dustwing | the Drawn | Claude's own tribe | picked: `dustwing-turnaround-1000` | ✓ |
| Chrysalis | the Drawn | Claude's own tribe | picked: `chrysalis-cocoon-stance-1002` (a single view) | ✓ |
| Lightdrinker | the Drawn | Claude's own tribe | picked: `lightdrinker-deathshead-turnaround-1001` | ✓ |
| Eyespot | the Drawn | Claude's own tribe | picked: `eyespot-fan-turnaround-1000` | ✓ |
| Pale Mother | the Drawn | Claude's own tribe | picked: `pale-mother-turnaround-1002` | ✓ |

| Godkin | Jilliath 5 (support) | user (a silhouette of moving sky) | picked: `godkin-bare-turnaround-1001` (user: "has captured what I intended") | — |
| Pontiff | Jilliath 3 (mage) | Claude's crown of candles (user: "looks good") | picked: `pontiff-candles-turnaround-1001` (seed Claude's) | — |
| Acolyte | Jilliath 1 (mage) | Claude's (red blindfold, lantern) | picked: `acolyte-branded-turnaround` (user: "as he is now"; seed 1001 Claude's) | — |
| Shepherd | Jilliath 4 (support) | user (stained glass) | picked: `shepherd-glass-turnaround-1001` (user, round one: "I think iteration just gets worse with shepherd") | — |
| Reclaimer | Jilliath 3 (support) | user (after MTG's Platinum Angel: an inhuman segmented shell, bulkier) | picked: `reclaimer-platinum-heavy-turnaround-1000` (user: "probably the best one") | — |
| Doomsayer | Jilliath 2 (mage) | Claude's (a street prophet, yoke and bells) | picked: `doomsayer-plain-turnaround-1001` (user), scroll `doomsayer-scroll-props-1000` (Claude's, the user's leave) | — |
| Templar | Jilliath 3 (preserve) | Claude's knight, the user's rose shield | picked: `templar-rose-turnaround-1001`, shield `templar-shield-props-1001` (user) | — |
| Immortal | Jilliath 4 (preserve) | Claude's (white marble mended with gold; crest, halo, cape) | picked: `immortal-kintsugi-turnaround-1000` (user: "he looks awesome"); weapon open | — |
| Emissary | Jilliath 2 (support) | user ("closer to the stereotypical angel") | picked: `emissary-robed-turnaround` (user: "looks great"; seed 1000 or 1001 open) | — |

## 2. Identity, but no picked concept: needs concept art
| Unit | Faction · tier | Identity | Concept |
|---|---|---|---|
| Congregant | Jilliath 1 | user: "an angry mob […] not rugged knights" | cand. (anchors; "rather close": `baroque_congregant-1000`) |
| Paladin | Jilliath 2 | Claude's holy knight; the user: "cool if a bit forgettable" | cand. (anchors) |
| Apprentice | Nexus 1 | user: hooded and robed, gender ambiguous (semi placeholder) | cand. (rejected: "a depressed anime boy") |
| Etherborn | Nexus 3 | user: galaxy skin, noble robes, no face, hands in purple-pink arcane energy, female-shaped | picked: `etherborn-lined-turnaround-1001` | ✓ |
| Soothsayer | carnival 2 | user, plus Claude's eye coat and coin veil; fully veiled, dark skin (user) | picked: `soothsayer-hooded-dark-turnaround-1000` | ✓ |
| Omen | carnival 2 | user: twin flintlocks, blindfold, ragged trenchcoat with a pentagram; Claude's: top hat, gold grin | picked: `omen-grin-turnaround-1001`, pistols `omen-pistols-props-1000` | ✓ |
| Fire Eater | carnival 1 | Claude: a carnival fire-breather, torch and flask, soot on worn motley | — |

## 3. No identity yet: needs a look in words first (the user's, or Claude's to propose)
| Unit | Faction · tier | What exists |
|---|---|---|
| Seraph | Jilliath 1 (support) | user: "hooded, closed off, praying"; Claude's draft adds to it |
| Emissary, Guardian, Paragon, Empyreal, Reclaimer | Jilliath 2–3 (support) | designs; Claude's drafts (the Paragon's blood-tipped wings are the user's) |
| Shepherd, Godkin | Jilliath 4–5 (support) | user: stained glass; a silhouette of moving sky with god rays |
| Acolyte, Cleric, Pontiff | Jilliath 1–3 (mage, priests) | designs; Claude's drafts |
| Archon | Jilliath 4 (mage) | user: "one foot into the world of angels"; Claude's draft |
| Doomsayer, Fire mage 3, Fire mage 4, Martyr mage 4 | Jilliath 2–4 (mage, fire) | designs; Claude's drafts |
| Templar, Immortal | Jilliath 3–4 (preserve) | designs; Claude's drafts |
| Fanatic, Chosen, Avatar of Vengeance | Jilliath 3–5 (consume) | designs; Claude's drafts |
| Torturer | Jilliath 4 | design; Claude's draft |

Every Jilliath unit above (2026-10-08): the user's answers to Claude's drafts in `jilliath-identities.md` (all angels
female except the Avatar of Vengeance; the fire casters need names first).
| Technician | Nexus 1 | design, no look |
| Cyclops | Nexus 2 | design; "scheme = automata" (dichotomies) |
| Mutant | Nexus 2 | design; "mutants will be the melee line" |
| Justiciar, Thaumaturge | Nexus 2 | designs; the user: scheme female, overload male (semi placeholder) |
| Backlasher, Maelstrom | Nexus 3 | designs, no look |
| Brigand, Marauder, Bandit, Hedge Mage | bandits 1 | the user's one-line designs, no look |
| Cutpurse, Snakeoiler | carnival 1 | the user's designs, no look |
| Capitol Guardian | — | the canon role (the chess king), no look |

## 4. Stubs: placeholder names or thin designs (identity waits on the design)
| Unit | What's missing |
|---|---|
| Grove mage 1 | a name; the user's two-sided nuke idea, Claude's tier-1 version (*Cycle*); its look field is empty |
| Grove support 1 | a name; Claude's Bloom plus the user's Wellspring (was Water) |
| Decay support 2 | a name; the user's direction (corpses), no unit sheet of its own |
| Regrowth 2, Regrowth 3 | names; the user's direction only (regeneration, then support); questions #10 |
| Spiritess 2 | a name beyond the branch's; the user's design (HoT, Burst mend, Wellspring) |

## Not in the game yet (for completeness)
The Wastes (Vexumphat) have no units: Claude's tier-1 pitches sit in `faction-stuff/wastes/`. Undesigned slots: the
Spiritess line's tier 4, the Grove mage's higher tiers, Nexus melee tier 3, Technician tier 2. More carnival units are expected.
