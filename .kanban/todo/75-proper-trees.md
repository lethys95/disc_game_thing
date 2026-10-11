# Proper trees instead of tiles

- **What:** The research tree (the Capitol's Research tab, each faction's evolution lines) and the leader tree (the
  leader's screen) drawn as real trees, not as a grid of tiles: the branches visible as branches, each unit or skill
  a node hung on them, the connections the structure rather than lines drawn between cards.
- **Why:** The user (2026-10-11): "making proper trees instead of tiles". Both trees are now cards in a grid inside the
  painted frame (`shots/capitol-tabs.html`, `shots/warband-screens.html`); Disciples II's development tree joins its
  buildings with iron girders, so the tree belongs to the screen's architecture (`reference_material/disciples/notes.md`).
- **Done when:** Both trees read as trees at a glance, in the game, and the user has looked.
- **Who:** Claude builds (layout and drawing, the `hud-paint-in` skill where painted parts help); the user judges.
- **Compare first (the user, 2026-10-11):** top-down against left-to-right. Claude raised it because the lines already
  run off the bottom at 720p and the screen is wider than tall; the user: "maybe not a bad idea. I think we should
  compare." Build both, show them side by side, the user picks.
- **Round 1 built (2026-10-11):** portraits on branches in both layouts, a toggle to compare (`shots/trees.html`). The
  user: "Left to right might be fine, but right now there's a lot of real estate not really being used [...] Maybe it'll
  be good once nudged into place." Round 2: across fills the field (five tier columns over its width, branches sharing
  its height, larger portraits). Waiting on the pick; then the toggle goes and the leader tree follows.
- 2026-10-11, round 3: the user, on left to right, wanted it to use the vertical space better. The portraits now grow
  with the room their branch and tier get (about 190 px at 1080p with three branches, from 128), set from script
  since container query heights resolve to zero in that grid. `shots/trees.html`. Still waiting on the pick.
