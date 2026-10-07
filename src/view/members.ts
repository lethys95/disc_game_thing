import { itemById } from "#rules/items";
import { NODES } from "#rules/nodes";
import { BEHAVIORS, elementsOf } from "#rules/abilities/index";
import { abilityText } from "#view/ability-text";
import { targetingGrids } from "#view/targeting";
import { effectDef } from "#rules/effects";
import type { Commitment } from "#rules/forks";
import { nextForm, xpToEvolve, xpToLevel } from "#rules/progression";
import { UNITS } from "#rules/units/index";
import { UPGRADES } from "#rules/upgrades";
import { LEADER_SKILLS } from "#rules/world/leaders";
import { isLeaderOf, maxHpOf, placementOf, recordOf } from "#rules/world/record";
import { ownStats } from "#rules/battle/engine";
import type { Stats } from "#rules/battle/types";
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
          : source.kind === "item"
            ? `the ${itemById(source.item).name} its leader wears`
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
/** What buffs add to its damaging hits, if anything: "+10 to its hits", "+25% to its hits". */
export function hitChange(s: Stats): string {
  const parts = [s.hitPercent !== 0 ? `${s.hitPercent > 0 ? "+" : ""}${s.hitPercent}%` : "", s.hitBonus !== 0 ? `${s.hitBonus > 0 ? "+" : ""}${s.hitBonus}` : ""].filter((p) => p);
  return parts.length > 0 ? `${parts.join(", ")} to its hits` : "";
}

/** `abilityPower`: what its abilities are described at (a veteran's is higher than its type's). */
export function unitDefCard(defId: string, abilityPower?: number): HTMLElement {
  const def = UNITS[defId];
  const card = element("div", "def-card");
  if (!def) return card;
  card.appendChild(art({ kind: "portrait", id: defId, frame: "bust" }, "card-portrait"));
  card.append(element("div", "title", def.name), element("div", "subtitle", `Tier ${def.tier}`));
  const s = def.stats;
  const facts = [`${s.maxHp} HP`, s.shield > 0 ? `${s.shield} shield` : "", `${s.armor} armor`, `${s.initiative} initiative`, `${s.abilityPower} ability power`, elementsOf(def).length === 0 ? "" : `deals ${elementsOf(def).join(", ")}`];
  if (def.spellCharges) facts.push(`${def.spellCharges} spell charges`);
  card.appendChild(element("div", "stats", facts.filter((f) => f).join(" · ")));
  for (const ref of def.abilities) {
    const behavior = BEHAVIORS[ref.id];
    if (!behavior || (behavior.kind === "active" && behavior.tags.includes("common"))) continue;
    const item = element("div", "ability");
    const grids = targetingGrids(defId, ref.id);
    item.append(...(grids ? [grids] : []), element("span", "name", ref.name ?? behavior.name), abilityText(ref, abilityPower ?? s.abilityPower));
    card.appendChild(item);
  }
  return card;
}

/**
 * A squad member's card for the hold-right-click peek: its type's card with the numbers it would fight with now
 * (marks, levels and the leader tree included), its health, and its track record.
 */
export function memberCard(m: SquadMember, leader: Leader | undefined): HTMLElement {
  const s = ownStats(placementOf(m, leader));
  const card = unitDefCard(m.defId, s.abilityPower);
  const def = UNITS[m.defId];
  const facts = [`${m.hp} / ${maxHpOf(m, leader)} HP`, s.shield > 0 ? `${s.shield} shield` : "", `${s.armor} armor`, `${s.initiative} initiative`, `${s.abilityPower} ability power`, hitChange(s), def && elementsOf(def).length > 0 ? `deals ${elementsOf(def).join(", ")}` : ""];
  if (def?.spellCharges) facts.push(`${def.spellCharges} spell charges`);
  card.querySelector(".stats")?.replaceWith(element("div", "stats", facts.filter((f) => f).join(" · ")));
  const title = card.querySelector(".title");
  if (title) title.textContent = `${isLeaderOf(m, leader) ? "♛ " : ""}${unitName(m.defId)}${m.level > 0 ? ` · level ${m.level}` : ""}`;
  for (const mark of recordOf(m, leader)) card.appendChild(element("div", "note", markText(mark)));
  return card;
}
