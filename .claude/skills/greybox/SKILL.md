---
name: greybox
description: Lay out a disc screen (or a panel of one) by what each element is for - write down what the screen is for and every element's job, cut what has none, then build the layout in the game in flat values with the real content and real actions, and show it to the user before anything is painted. Use for any new or reworked screen, panel or menu (the Capitol, the title, new game, settings, the codex, a faction's screens), and before `hud-paint-in` paints one.
---

# Greybox by job

The user, 2026-10-11: "try greyboxing, but being especially aware of what those elements are supposed to do. Like if
you're boxing out a button, what is that button and why is it relevant." Then, of the result: "I really enjoy what you
did here." The first worked example is the Capitol (`docs/design/capitol-elements.md`, `shots/capitol-greybox.html`).

Why it exists: the first painted screens were designed around their paintings and the interface fitted in after. The
user's review found facts that repeated the screen, a seal that said nothing about what it did, the same grid in three
sizes, and a graveyard more complicated than its job. The lesson the research had warned of: test the interface, then
paint around it. Painting comes after this skill, with `hud-paint-in`, once per faction skin on the same layout.

## 1. What is the screen for?
Write the player's reasons to open it, ranked by how often, from the rules and the actions (`src/rules/world/`, the
`WorldAction`s the screen can send), not from the current interface. The ranking decides the layout: the most frequent
job is the heart of the screen; rare ones are side panels; conditional ones (the fallen, a visiting warband) appear only
when they apply.

## 2. Every element, with its job
Collect the elements: what the screen shows now (its view code, `reference_material/ui-inventory.md`), what its jobs
need, and the user's own notes for it (`docs/design/`). For each, a row: **what it does**, **why it's there** (which
job, which decision it serves), **verdict**: keep, cut, merge, or show only when needed. Write it to
`docs/design/<screen>-elements.md` before drawing anything.

Questions that cut:
- Does it say anything the screen doesn't already say elsewhere? (The Capitol's fact plates didn't.)
- Does it say what it does? An object standing for a command (a seal for "back") needs a label until it is unmistakable.
- Is the same thing done the same way everywhere? (Raising the fallen became a drag, like moving units.)
- Does its empty state need space? (No one fallen: no graveyard.)
- Is it the shared component? (The squad tile, the unit sheet on a held right-click. The tile has two sizes: the map's
  for a single grid, a larger one wherever two grids trade units, the user's rule; always square.)
- Does a number belong here or on the held right-click? (Tier, HP and armor left the research nodes.)

An element without a job is flagged for the user, not cut silently: their reasons count (the City tab stays because the
user values a view into the city).

## 3. Build it in the game, in flat values
- The real screen, the real content, the real actions: no mock. Everything clickable works.
- Flat values only: the `--gbx-*` tokens in `src/style.css` (chrome dark and low in contrast; what is read or pressed
  light; wells black; the open or lit state the warm light). No ornament, no figures, no paintings except the world in
  the window.
- Fixed edges stay fixed across screens (the right-edge column, in the map column's place).
- Sizes in rem (`pnpm sizes`); text and labels plain.

## 4. Check every state
- Settings → Display → "Greybox interface" (`settings.greybox`, `body.greybox` in `src/style.css`) draws every
  painted piece flat at the same places, so a painted screen can be judged as a layout too. A painted piece added later
  gets its `body.greybox` overrides.
- `pnpm verify`; update playtests whose selectors the layout changed.
- Each state of the screen: empty, full, conditional sections present, a selected unit, a menu open, can't afford.
  States the routes can't reach get a temporary hook (a URL param and a campaign method), used for the screenshots and
  reverted before the commit (`git diff --stat` on the touched files shows nothing).
- Gestures tested end to end (the drag that raises a fallen unit, and the purse that paid for it).
- 720p, 1080p, 1440p; a narrow (5:4) and a wide (21:9) screen.
- Known traps: a held right-click sheet must open above any menu or prompt it explains (the peek is at the top of the
  stack); a global button rule can override a selected tab's colour (raise the selector); a hover rule can hide
  the selected state (exclude `.selected` from hover).

## 5. Show it
A page in `shots/<screen>-greybox.html`, linked over Tailscale: what the screen is for, the element table, the screen
in each state, what changed and why, and only the real decisions open for the user (not placeholders). Record the
user's verdicts in the elements doc and commit. When the user has judged the layout, it goes to `hud-paint-in`.
