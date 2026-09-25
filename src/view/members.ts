import { effectDef } from "#rules/effects";
import type { Commitment } from "#rules/forks";
import { nextForm, xpToEvolve } from "#rules/progression";
import { UNITS } from "#rules/units/index";
import { UPGRADES } from "#rules/upgrades";
import { LEADER_SKILLS } from "#rules/world/leaders";
import { isLeaderOf, maxHpOf, recordOf } from "#rules/world/record";
import type { Leader, Mark, SquadMember } from "#rules/world/state";
import { element } from "#view/dom";

/** A squad member as the map's panels show it: name, health, progress, and its track record. */

export const unitName = (defId: string) => UNITS[defId]?.name ?? defId;

/** "+5 damage. From the Congregant upgrade at the Capitol.": one line of a unit's track record. */
export function markText(mark: Mark): string {
  const { effect, source } = mark;
  const text = effectDef(effect.def).describe({ def: effect.def, source: null, stacks: effect.stacks ?? 1, amount: effect.amount ?? 0 });
  const from =
    source.kind === "leaderTree"
      ? `the leader tree (${LEADER_SKILLS[source.skill]?.name ?? source.skill})`
      : `the ${unitName(UPGRADES.get(source.upgrade)?.unitType ?? source.upgrade)} upgrade at the Capitol`;
  return `${text} From ${from}.`;
}

/** With a commitment, the row also shows XP toward the next form. */
export function memberRow(m: SquadMember, leader: Leader | undefined, commitment?: Commitment): HTMLElement {
  const row = element("div", "member");
  row.appendChild(element("span", "name", `${isLeaderOf(m, leader) ? "♛ " : ""}${unitName(m.defId)}`));
  const max = maxHpOf(m, leader);
  const bar = element("div", "hp");
  const fill = element("div", "fill");
  fill.style.width = `${(100 * m.hp) / max}%`;
  bar.append(fill, element("span", "value", `${m.hp} / ${max}`));
  row.appendChild(bar);
  const needed = xpToEvolve(m.defId);
  if (commitment && needed !== null) {
    const next = nextForm(m.defId, commitment);
    const xp = element("div", `xp${m.xp >= needed ? " ready" : ""}`);
    const xpFill = element("div", "fill");
    xpFill.style.width = `${(100 * Math.min(m.xp, needed)) / needed}%`;
    const label = next ? `XP ${m.xp} / ${needed} → ${unitName(next)}` : m.xp >= needed ? "Ready: choose a branch to evolve" : `XP ${m.xp} / ${needed} → (branch not chosen)`;
    xp.append(xpFill, element("span", "value", label));
    row.appendChild(xp);
  }
  for (const mark of recordOf(m, leader)) row.appendChild(element("div", "mark", markText(mark)));
  return row;
}
