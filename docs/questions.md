# What Claude needs from the user

Kept short: only what is the user's to decide, most blocking first. Answer inline or in conversation; Claude moves answers into the design docs (`docs/design/`) and deletes them here. Placeholder numbers and rules that need no answer live in `docs/provisional.md`.

## Unit designs (the main bottleneck)
1. **Going wide (user, 2026-09-27):** a foundation across factions before deepening Nexus. What unblocks the most: Jilliath's tier-2 support and mage branches (your directions are in `design/factions/jilliath.md`), then first units for the Grove and the Wastes (Claude's pitches are in your sheets under `faction-stuff/sylvan/` and `faction-stuff/wastes/`, marked "(Claude)": cut, rename or veto), then tribes (`design/tribes.md`). One line at a time is fine.
2. **Names for the fire side of Jilliath's mage line** (placeholders in the game): Fire mage 3–4, Martyr mage 4, and
   the spells *Fire on all* and *Beam*. And where the deflecting secret lives, now that the support line is
   angels (`.kanban/testing/jilliath-mage-line.md`).
3. **The joker line** per faction (`design/pillars.md`): whenever an idea comes.

10. **The Regrowth line's damage (the composition matrix, 2026-09-30, `provisional.md` #61):** Regrowth 3 "supports and attacks weakly" (your design), and the Grove has no damage dealer past its tier-1 mage. So Regrowth squads win 0–17% against Jilliath's tier 3 (Templars' 20 armor turn its 32 into 12) while Decay squads win 92%. A tier-2 Grove mage would give it a partner; or Regrowth 3 hits harder; or it stays the Grove's weak matchup. Your call.
11. **Who gets the new keywords (2026-10-05, `provisional.md` #65, #66):** Tarot x, Crit x, Evasion x, Explode (your "boomer […] on melee line": which faction's?), Ignite and Soak, and which units deal lightning or water damage. All exist and are tested; no unit carries them yet. More statuses beyond wet, burn and electrocuted whenever you have them.
12. **Biomes by content (2026-10-05, your decision: environments postponed):** which structures and tribes belong in which biome (your example: the carnival in the desert, not bandits). Claude's tribe fits are in `design/environments.md`; the biomes to add are the brainstorm's list. Your call when you get to it.
13. **Unit portraits:** 35 units have card, bust and icon in the game (13 Jilliath units added 2026-10-09, from the picked concepts) (`shots/portraits.html`; the gnolls' Packstalker and Hamstringer and the five Drawn added 2026-10-07). Anything to change?

## Look and sound
4. **The map's look:** "actual grass", and which way terrain goes (`design/map-look.md`). Reference images or games whose map look you like would help most.
5. **Music:** the placeholder tracks are ACE-Step takes; you mentioned Suno for final AI music. Direction per faction, or references?

## Access
9. **Hugging Face access for TRELLIS.2** (the better mesh generator; TRELLIS v1 works meanwhile): request access at https://huggingface.co/facebook/dinov3-vitl16-pretrain-lvd1689m, then run `! hf auth login` here. Only if you want it.

## Rules
6. **Biomes: node pools and tribes (your idea; the desert exists now, M77):** which nodes each biome's cities can spawn, and which tribe guards its camps. Rule effects only with care (you, 2026-09-30). Done provisionally for tribes: the desert's camps and dungeons are gnolls (#63); open: node pools, and whether the desert's tribal outposts should recruit gnolls. Claude's pitches for pools are in `design/brainstorm/biomes.md`, not canon.
7. **Spells:** should mana nodes have a color of their own (D2's typed crystals), so capturing one gives that color? And what gates the spell tree: Capitol tier, research, mana spent? The real spells are yours to design whenever you like (placeholders now).
8. **Items:** yours to design whenever you like (placeholders now); the merchant and dungeons sell and give whatever exists.
