# The board

**Where we're going.** The first complete version of the game, an *alpha*: the three playable factions (Jilliath,
Ral-Vitahl, Sylvan) each with every unit line designed, built and painted (identity → concept → portrait), playable
from the title screen to victory against the AI. Then a balance pass, then look and sound (UI kit, map, music). The
Wastes, 3D figures and the rest come after (`eventually/`).

**Why this order (2026-10-06):** most units don't exist yet, so balancing first is backwards (the user). Unit designs
are the user's, and they gate everything after them: building, art, balance. The board makes that queue visible.

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
