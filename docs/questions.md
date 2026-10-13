# What Claude needs from the user

Kept short: only what is the user's to decide, most blocking first. Answer inline or in conversation; Claude moves answers into the design docs (`docs/design/`) and deletes them here. Placeholder numbers and rules that need no answer live in `docs/provisional.md`. Numbers stay put when a question goes, since the board cites them.

## Unit designs (the main bottleneck)
1. **The lines that stop short** (the board's todo, in order): the Grove's mage past tier 1 (`grove-mage-line`; see
   #10), Ral-Vitahl's melee tier 3 and the Technician's tier 2 (`nexus-missing-tiers`), the Spiritess line's tier 4
   (`grove-support-tier-4`), then the Wastes' first units (Claude's pitches in `faction-stuff/wastes/`, marked
   "(Claude)": cut, rename or veto). One line at a time is fine.
2. **Names for the fire side of Jilliath's mage line** (placeholders in the game): Fire mage 3–4, Martyr mage 4, and
   the spells *Fire on all* and *Beam*. And where the deflecting secret lives, now that the support line is
   angels (`.kanban/testing/jilliath-mage-line.md`).
3. **The joker line** per faction (`design/pillars.md`): whenever an idea comes.

10. **The Regrowth line's damage (the composition matrix, 2026-09-30, `provisional.md` #61):** Regrowth 3 "supports and attacks weakly" (your design), and the Grove has no damage dealer past its tier-1 mage. So Regrowth squads win 0–17% against Jilliath's tier 3 (Templars' 20 armor turn its 32 into 12) while Decay squads win 92%. A tier-2 Grove mage would give it a partner; or Regrowth 3 hits harder; or it stays the Grove's weak matchup. Your call.
11. **Who gets the unowned keywords (2026-10-05, `provisional.md` #65, #66):** Evasion, Explode (your "boomer […] on melee line": which faction's?) and Soak exist and are tested, and no unit carries them. Tarot and Crit sit only on carnival units (and the Deck of cards); should a faction carry them too? More statuses beyond wet, burn and electrocuted whenever you have them.
13. **Unit portraits:** 60 units have card, bust and icon in the game, the five tribes' 25 among them (`shots/portraits.html`, `shots/jilliath-portraits.html`, `shots/tribe-portraits.html`). Anything to change?

## Look and sound
4. **The map's look:** "actual grass", and which way terrain goes (`design/map-look.md`). Reference images or games whose map look you like would help most.
5. **Music:** the placeholder tracks are ACE-Step takes; you mentioned Suno for final AI music. Direction per faction, or references?

## Rules
6. **Biomes: node pools and structures (your idea; tribes placed 2026-10-12, `provisional.md` #82):** which nodes each biome's cities can spawn, and whether a biome's structures (merchants, mercenary camps, mage merchants) differ. You asked for more nodes before choosing: round two of the node brainstorm (twelve, each with a biome it fits) is in `design/brainstorm/nodes.md`, beside round one; Claude's pool pitches are in `design/brainstorm/biomes.md`. Neither is canon. Also open: whether the desert's tribal outposts should recruit gnolls. Rule effects only with care (you, 2026-09-30).
7. **Spells:** what gates the spell tree: Capitol tier, research, mana spent? The real spells are yours to design whenever you like (placeholders now, `spells`).
8. **Items:** your sixteen taken items are in the game (`testing/items`). Open: a name for the "Gold item"; the four placeholders (Iron helm, Plate armor, Swift charm, War banner) to replace or cut; War drum, Mercenary's writ, Recruiter's cap and the later consumables are still unread (`brainstorm/items.md` §6–7).
