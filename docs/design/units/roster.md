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
| Dustwing, Chrysalis, Lightdrinker, Eyespot, Pale Mother | the Drawn | Claude's own tribe | Claude: see `the-drawn.md` (the user liked the Lightdrinker) | — |

## 2. Identity, but no picked concept: needs concept art
| Unit | Faction · tier | Identity | Concept |
|---|---|---|---|
| Congregant | Jilliath 1 | user: "an angry mob […] not rugged knights" | cand. (anchors; "rather close": `baroque_congregant-1000`) |
| Paladin | Jilliath 2 | Claude's holy knight; the user: "cool if a bit forgettable" | cand. (anchors) |
| Apprentice | Nexus 1 | user: hooded and robed, gender ambiguous (semi placeholder) | cand. (rejected: "a depressed anime boy") |
| Etherborn | Nexus 3 | user: galaxy skin, noble robes, no face, hands in purple-pink arcane energy, female-shaped | picked: `etherborn-lined-turnaround-1001` |
| Soothsayer | carnival 2 | user, plus Claude's eye coat and coin veil; fully veiled, dark skin (user) | picked: `soothsayer-hooded-dark-turnaround-1000` |
| Omen | carnival 2 | user: twin flintlocks, blindfold, ragged trenchcoat with a pentagram; Claude's: top hat, gold grin | picked: `omen-grin-turnaround-1001`, pistols `omen-pistols-props-1000` |
| Fire Eater | carnival 1 | Claude: a carnival fire-breather, torch and flask, soot on worn motley | — |
| Packstalker, Hamstringer | gnolls 1 | Claude (round two: an antelope-skull helm; nomad wraps) | cand. (round two, not picked) |

## 3. No identity yet: needs a look in words first (the user's, or Claude's to propose)
| Unit | Faction · tier | What exists |
|---|---|---|
| Cleric | Jilliath 1 | a design (heal, weak shot), no look |
| Templar, Immortal | Jilliath 3–4 (preserve) | designs, no look |
| Fanatic, Chosen, Avatar of Vengeance | Jilliath 3–5 (consume) | designs, no look |
| Torturer | Jilliath 4 | design, no look |
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
| Grove support 1 | a name; Claude's Bloom plus the user's Water |
| Decay support 2 | a name; the user's direction (corpses), no unit sheet of its own |
| Regrowth 2, Regrowth 3 | names; the user's direction only (regeneration, then support); questions #10 |
| Spiritess 2 | a name beyond the branch's; the user's design (HoT, Burst mend, Water) |
| Jilliath mage 1 | a name and its branches; Claude's *Condemn*, accepted |

## Not in the game yet (for completeness)
The Wastes (Vexumphat) have no units: Claude's tier-1 pitches sit in `faction-stuff/wastes/`. Undesigned slots: the
Spiritess line's tier 4, the Grove mage's higher tiers, Nexus melee tier 3, Technician tier 2, Jilliath's tier-2
support and mage. More carnival units are expected.
