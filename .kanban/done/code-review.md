# The code review's findings (2026-10-11)

- **What:** An objective review of the codebase by a read-only subagent (the user asked for one, 2026-10-11), its
  claims spot-checked by Claude. Ranked by cost:
  1. **Mechanic state back in the engine:** tarot (a `Battle` field, three hooks only it uses, `checkTarot` and the Omen
     loop in `applyAction`, `chooseTarot`, AI special cases), Hysteria's counters on `Slot`, Judgement's `struck` on
     `BattleUnit`; `damage.ts` names `"bleeding"`. Against `architecture.md`. Fix: generic per-side/per-slot trait state
     and a "pending choice" hook; a test that fails when engine/damage/AI name an ability or effect id.
  2. **Rules text written by hand outside battle repeats numbers and is already wrong:** Hatchet "for 30" (scales with
     ability power), Cathedral "heal 30", Foundry's formula twice; the city screen's wall armor missed the Quarry's (fixed 2026-10-11: `wallArmorOf` in rules).
     Fix: `describe` from own data for items, spells, nodes, research; rules functions (`wallArmorOf`) for the view.
  3. **A faction's content in ~8 string-keyed registries:** `UNITS` merged by spread with no duplicate or key/id check,
     presets picked by ternary chains, `effects.ts` (981 lines) holding every faction. Fix: an integrity test, presets as
     `Record<Playable, …>`, effects split by faction.
  4. **CSS fragile:** one 101 KB file, the battle bar's coordinates typed twice for the mirrored cards, ~219 raw hex
     colours, two token families (`--gb-*`, `--gbx-*`) with unused tokens, greybox overrides kept by hand, one px.
  5. **Unenforced conventions:** type predicates as disguised casts (`isSave`, `PLAYABLE` filters ×3), dead code
     (`memberRow`, `MANA_NAMES`, `GROUND_VARIANTS`), doc drift (`engineering.md` names a deleted script and
     `questions.md` for provisional rules), ~50 dated provenance comments in `src` and history in CSS comments.
  Kept as solid: the typing discipline, `boundaries.test.ts`, the hook-based trait/effect model, `describe` on battle
  content, reach derived from the engine, save versioning, event-driven animation and log, `knownWorld` fog.
- **Why:** Most of this compounds as three factions' content arrives (findings 1–3 above all).
- **Done when:** Each finding fixed or consciously declined, with a guard test where one fits.
- **Who:** Claude; the user sets the priority against the UI work.
- **Order (the user, 2026-10-11):** "Lets continue this streak with the UI, but the very next thing after UI should be
  fixing 1-3. However, 1-3 are very important, so we want to see them done before we add new units." Findings 1–3
  come right after the current UI pass and before any new unit is built; 4–5 can follow.
- **Finding 1, done (2026-10-11):** Hysteria, Judgement and bleed out of the engine; the guard test; tarot kept as a
  battle system with its draw loop in `tarot.ts` and the preview leak closed (`decisions.md`).
- **Finding 2, done (2026-10-11):** items (`describeItem`, at the leader's ability power), spells (`describeSpell`), nodes
  (their marks' and gifts' own numbers), research (its constant) compute their text; the city screen's wall armor reads
  `wallArmorOf`; `tests/rules-text.test.ts` guards it. Effects lost their "(from a Foundry)" suffixes, which the unit
  sheet's track record already says.
- **Finding 3, done (2026-10-11):** each faction's units file holds its units, roots, costs, line kinds and evolutions
  (`FactionUnits`), joined with a duplicate guard; `tests/catalogue.test.ts` checks keys, evolutions, roots and abilities;
  presets are one record per faction with `presetOf`, the ternary chains gone; `effects.ts` split into `effects/` by
  faction (`shared.ts` for the shapes), the `fortifies` flag gone; `factions.ts` says what adding a faction takes;
  architecture and engineering docs updated. Findings 1–3 done; 4 (CSS) and 5 (conventions) remain.
- **Finding 5 (2026-10-11):** done: one typed `PLAYABLE` list (`factions.ts`) for the three copies of a filter that cast,
  `GROUND_VARIANTS` and `MANA_NAMES` deleted, the docs' drift fixed (in finding 3's commit). Declined, for the user to
  overrule: `isSave` checks only the header by design (the save version, pinned to the world's shape by a snapshot
  test, vouches for the rest; validating the whole world would be a large parser for no gain), and the dated "the user,
  …" comments, which quote the design intent a rule comes from (the *why*), not a task or a fix.
- **Finding 4 (2026-10-11):** done: `style.css` split by screen into `src/styles/` in cascade order (screenshots
  pixel-identical before and after), unused tokens deleted, the last px in rem. Declined: mirroring the right card's
  coordinates (they're measurements of the painting, and its globes aren't symmetric) and converting ~219 raw colours
  or merging `--gb-*`/`--gbx-*` now (the faction skins will re-theme these screens; converting first is churn).
  **All five findings handled.**
