import { NODES } from "#rules/nodes";
import { BEHAVIORS, describeAbility } from "#rules/abilities/index";
import { effectDef } from "#rules/effects";
import type { Commitment } from "#rules/forks";
import { nextForm, xpToEvolve, xpToLevel } from "#rules/progression";
import { UNITS } from "#rules/units/index";
import { UPGRADES } from "#rules/upgrades";
import { LEADER_SKILLS } from "#rules/world/leaders";
import { isLeaderOf, maxHpOf, recordOf } from "#rules/world/record";
import type { Leader, Mark, SquadMember } from "#rules/world/state";
import { art } from "#view/art";
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
      : source.kind === "levels"
        ? `${source.levels} level${source.levels === 1 ? "" : "s"} past the end of its line`
        : source.kind === "node"
          ? `the ${NODES[source.node].name} of the city it was recruited in`
          : `the ${unitName(UPGRADES.get(source.upgrade)?.unitType ?? source.upgrade)} upgrade at the Capitol`;
  return `${text} From ${from}.`;
}

/** With a commitment, the row also shows XP toward the next form. */
export function memberRow(m: SquadMember, leader: Leader | undefined, commitment?: Commitment): HTMLElement {
  const row = element("div", "member");
  row.appendChild(element("span", "name", `${isLeaderOf(m, leader) ? "♛ " : ""}${unitName(m.defId)}${m.level > 0 ? ` · level ${m.level}` : ""}`));
  const max = maxHpOf(m, leader);
  const bar = element("div", "hp");
  const fill = element("div", "fill");
  fill.style.width = `${(100 * m.hp) / max}%`;
  bar.append(fill, element("span", "value", m.hp > 0 ? `${m.hp} / ${max}` : "Fallen: revive at the Capitol"));
  row.appendChild(bar);
  const perLevel = xpToLevel(m.defId);
  if (commitment && perLevel !== null) {
    const xp = element("div", "xp");
    const xpFill = element("div", "fill");
    xpFill.style.width = `${(100 * Math.min(m.xp, perLevel)) / perLevel}%`;
    xp.append(xpFill, element("span", "value", `XP ${m.xp} / ${perLevel} → level ${m.level + 1}`));
    row.appendChild(xp);
  }
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

/** What a unit type is, before you have one: portrait, stats and abilities (for choosing a branch). */
export function unitDefCard(defId: string): HTMLElement {
  const def = UNITS[defId];
  const card = element("div", "def-card");
  if (!def) return card;
  card.appendChild(art({ kind: "portrait", id: defId }, "card-portrait"));
  card.append(element("div", "title", def.name), element("div", "subtitle", `Tier ${def.tier}`));
  const s = def.stats;
  const facts = [`${s.maxHp} HP`, s.shield > 0 ? `${s.shield} shield` : "", `${s.damage} damage${def.damageType === "fire" ? " (fire)" : ""}`, `${s.armor} armor`, `${s.initiative} initiative`];
  if (def.spellCharges) facts.push(`${def.spellCharges} spell charges`);
  card.appendChild(element("div", "stats", facts.filter((f) => f).join(" · ")));
  for (const ref of def.abilities) {
    const behavior = BEHAVIORS[ref.id];
    if (!behavior || (behavior.kind === "active" && behavior.tags.includes("basic"))) continue;
    const item = element("div", "ability");
    item.append(element("span", "name", ref.name ?? behavior.name), element("div", "text", describeAbility(ref)));
    card.appendChild(item);
  }
  return card;
}
