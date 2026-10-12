---
name: audit-docs
description: Audit disc's board and docs against the code and the git history - every todo card, docs/status.md, questions.md, roster.md and the roadmap - then fix what has drifted (stale counts, answered questions, finished work still listed as open, running work not on the board, comments that state status). Runs in a background subagent by default. Use when the user asks to audit, sync or update the docs or cards, asks whether the board matches where we are, or when a session starts after a long gap.
---

# Auditing the docs and the board

The repo is the only memory between sessions, and it drifts: a card says "35 portraits" when there are 60, a
question waits on something the user answered a week ago, the roadmap still says "next up" about work long done.
This audit makes the board and the docs tell the truth about the code.

## 0. Hand it to a subagent first
Unless you are already a subagent, start one with the Agent tool: `general-purpose`, in the background, no model
override (subagents inherit Opus; never Haiku). Give it this file's path and the user's words, and tell it to follow
steps 1–5 and return the step 5 report. One agent, not a fan-out (memory: subagent fan-out cost). Keep working on
something else, or tell the user it's running, and relay its report when it lands: what changed, and what's the
user's to decide. If the Agent tool isn't available, or the user wants it done inline, run steps 1–5 yourself.

## 1. Read what the docs claim
- The board: `ls .kanban/*/`, every `todo/` and `in-progress/` card in full; the first and last lines of each card in
  `testing/` and `eventually/`.
- `docs/status.md`, `docs/questions.md`, `docs/roadmap.md` (its tail), `docs/design/units/roster.md`.
- `git log --oneline` back to the date in status.md's **Updated** line: is every commit since reflected?

## 2. Check each claim against the code
Grep for it; don't trust a doc to confirm another doc. Where to look:
| Claim | Source of truth |
|---|---|
| A line's tiers, evolutions, placeholder names | `src/rules/units/{jilliath,nexus,grove,neutral}.ts` (`evolutions`, `tier`, `name`) |
| Who carries a keyword or damage type | ability ids and `damageType` in `src/rules/units/` and `src/rules/abilities/` |
| Spells, items | `src/rules/spells.ts`, `src/rules/items.ts` against `docs/design/items.md` ("Taken" = designed by the user) |
| Which units have portraits | `assets/art/portrait/*.webp` against the unit ids |
| Tribes, biomes on the map | `TRIBES`, `TRIBES_OF_BIOME` in `src/rules/world/state.ts` |
| Save version | the latest "save N" in git log |
Also:
- **Cited numbers and slugs:** every `questions #N` a card cites exists and still means that question
  (`git log -S` on questions.md finds the answer when it's gone); every slug a card cites is a card.
- **Work in flight:** `ps aux` for a running generation or mesh build, `git status` for untracked output. Running
  work belongs in `in-progress/`.
- **Status in code comments:** comments that say "not on the map yet" or "placeholder until…" are claims too.
- **Designed but unbuilt:** a design doc the user signed off with nothing in the code is Claude's to build, not
  the user's to design. Say so on the card.

## 3. Fix the cards
- Rewrite a stale card in the board's shape (what, why, done when, who). Concrete lists beat counts that rot.
- Move cards whose status changed (`mv`; the user's moves win). Finished but unseen by the user → `testing/`.
- A todo card's rank changes only for a clear reason, and you say why in the report.
- Detail that lives only in the roadmap's prose moves into its card; the roadmap keeps milestones as history and
  points at the board for what's next.

## 4. Fix the docs
- `questions.md`: delete what's answered (the answer goes to `docs/design/` or `decisions.md` if it isn't there),
  merge what overlaps, update what has moved. **Never renumber**: cards cite the numbers.
- `roster.md`: each unit in the group its art state puts it in (identity → concept → portrait).
- `status.md`: rewrite it whole, under ~50 lines, its "Next" in the board's todo order.
- A stale code comment: fix it. A real bug found on the way (wrong text, dead reference): fix it when it's small and
  `pnpm check` covers it; otherwise make it a card.
- The project's rules hold: no invented design, no game numbers in docs (memory: one source of truth), cuts in
  quotes of the user as […].
- Code touched → `pnpm check` (read the exit code), and the playtest for that screen. Then commit:
  "Board and docs audited against the code: …".

## 5. Report
In a few lines: what was stale and is now fixed (by card or doc), anything moved or reranked and why, bugs found,
and what's waiting on the user (questions, picks, things in `testing/`). The user reads the report, not the diff.
