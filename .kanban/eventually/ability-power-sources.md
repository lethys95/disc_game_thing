# Ways to raise ability power

- **What:** Items, spells and abilities that interact with ability power (buffs, auras, amps).
- **Why:** The user (2026-10-07): "there should be many ways of interacting with ability power, including items,
  abilities and spells. i think jilliath supports might already have enough on their plates thematically. maybe
  wastes can make use of amp effects. i can imagine nexus might want some too, to some extent."
- **How it plugs in:** a buff to ability power is an effect with a `stats` hook (like `extra_armor`), never a
  passive ability's own hook (`provisional.md` #71). Nothing else in the engine changes.
- **Done when:** the user's designs for these exist and are built: items (`items`), spells (`spells`), the Wastes'
  amps (`wastes-faction`), and whatever Nexus gets (`nexus-missing-tiers`). Not Jilliath's supports.
- **Who:** The user designs; Claude builds.
