# The Unreal 5 port, alongside three.js

- **What:** The game in Unreal 5.8, in its own repo, `../disc_unreal` (plan and steps: its `docs/plan.md`). Unreal is a
  view that follows the three.js game: the battle, the map, then the interface. This repo's TypeScript rules stay the
  only rules; the Unreal repo reads them and the assets from here and never writes here.
- **Why:** The user (2026-10-09): "Actual 3d quality […] UE is the king of 3d." Velocity stays in three.js; agents
  port in parallel ("a continuous effort"). A separate repo so it doesn't mix with the TypeScript cycle (the user).
- **Done when:** The Unreal version plays from the title to victory and the three.js view can retire. The user decides
  when.
- **Who:** Claude builds (parallel agents); the user judges the look.
