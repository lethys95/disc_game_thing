import { manaColorOf, spellById, spellsOf } from "#rules/spells";
import { FACTIONS } from "#rules/factions";
import { learnSpellProblem } from "#rules/world/spells";
import { playerOf } from "#rules/world/state";
import type { PlayerId, World, WorldAction } from "#rules/world/state";
import { element, gold, mana, orderButton } from "#view/dom";

/** Spells in the view: the Capitol's Spells tab (learning) and the map's spell bar (casting). */

/** The Capitol's Spells tab: the faction's spells, to learn for gold. A spell tree comes later (pillars.md). */
export function spellsTab(world: World, side: PlayerId, mayAct: boolean, act: (action: WorldAction) => void): HTMLElement {
  const player = playerOf(world, side);
  const panel = element("div", "spells-tab panel");
  panel.appendChild(element("div", "note", "Spells are cast on the map and paid in mana. These are placeholders until the real ones are designed."));
  for (const spell of spellsOf(player.faction)) {
    const row = element("div", "spell-row");
    const text = element("div", "spell-text");
    const head = element("div", "name", spell.name);
    head.append(" · ", mana(spell.cost, manaColorOf(spell, player.faction)), " per cast");
    text.append(head, element("div", "note", spell.describe));
    row.appendChild(text);
    if (player.spells.includes(spell.id)) row.appendChild(element("div", "note", "Learned"));
    else {
      const problem = learnSpellProblem(world, spell.id);
      row.appendChild(orderButton("small", ["Learn · ", gold(spell.learnCost)], { mayAct, problem, explain: "", give: () => act({ type: "learnSpell", spell: spell.id }) }));
    }
    panel.appendChild(row);
  }
  return panel;
}

/** Why a learned spell can't be picked right now (before choosing a target), or null. */
function readyProblem(world: World, side: PlayerId, id: string): string | null {
  const player = playerOf(world, side);
  const spell = spellById(id);
  if (player.cast.includes(id)) return "already cast this turn";
  if (player.mana[manaColorOf(spell, player.faction)] < spell.cost) return "not enough mana";
  return null;
}

/** The map's spell bar: the learned spells; picking one starts targeting. */
export function spellBar(world: World, side: PlayerId, mayAct: boolean, casting: string | null, pick: (id: string | null) => void): HTMLElement | null {
  const player = playerOf(world, side);
  if (player.spells.length === 0) return null;
  const bar = element("div", "spell-bar");
  const title = element("div", "title", "Spells ");
  const color = FACTIONS[player.faction].mana;
  title.appendChild(mana(player.mana[color], color));
  bar.appendChild(title);
  for (const id of player.spells) {
    const spell = spellById(id);
    const problem = readyProblem(world, side, id);
    bar.appendChild(orderButton(`small${casting === id ? " selected" : ""}`, [`${spell.name} · `, mana(spell.cost, manaColorOf(spell, player.faction))], { mayAct, problem, explain: spell.describe, give: () => pick(casting === id ? null : id) }));
  }
  return bar;
}
