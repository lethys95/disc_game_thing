# The board

**Where we're going.** A first complete version of the game, an *alpha*, and it is far off (the user, 2026-10-11: "we
have no 3d models, most of the music is not there, two factions are missing half of their units, the 4th is completely
absent, most UI is only greyboxed and none of the faction UIs are in, we only have three neutral tribes", and the
Unreal port beside it is not online). It needs every faction (Jilliath, Ral-Vitahl, the Sylvan, the Wastes) with every
unit line designed, built and painted, 3D figures, music, each faction's own interface, more neutral tribes, a map
that looks right, and a game playable from the title to victory. Balance comes once the lines exist.

**How the work flows.** Many tracks run at once. Unit and faction designs are the user's and come from theorycrafting
sessions together, which take time ("The unit designs are bottlenecked by me being able to come up with ideas. Other
tasks are more approachable by you"). Claude keeps the other tracks moving meanwhile: faction interfaces (paint-ins on
the judged greyboxes), 3D figures, tools, the map's look, installing the user's music, and preparing material for the
design sessions. Nothing waits on one track.

One story per markdown file. Status = which directory the file is in. Moving a story = `mv`. `ls .kanban/*/` is the
board view; `pnpm board` renders it to `shots/board.html` (served over Tailscale at `/shots/board.html`).

## Sections
- **todo/**: committed work, ranked by filename: `NN-slug.md`, lowest first, gaps of five (insert `12-…` between 10 and
  15 without renumbering). `ls todo/` IS the queue.
- **in-progress/**: actively being worked; keep it to 1–2 files.
- **testing/**: built but not yet seen working by the user. Nothing is done until the user has looked.
- **ongoing/**: standing concerns with no completion state.
- **eventually/**: committed direction, not soon.
- **maybe/**: ideas, unvetted; the capture point for mid-session sparks ("wouldn't it be great if […]").
- **done/**: archive; stories keep their findings.

## Conventions
- Filename is a kebab-case slug; in todo/ it carries the `NN-` rank. Reprioritize = rename. Cross-reference stories by
  slug, never by the numbered filename.
- Body: what, why, done-when, and **who**: *the user* (a design, a pick, a decision) or *Claude* (build, art, notes).
  Link docs inline.
- Claude: `ls` the board at session start; open only the stories being worked; capture every new idea as a maybe/
  story the moment it appears; move files as status changes; keep `docs/status.md` short and pointing here.
- The user edits and moves anything freely; the user's edits win.
