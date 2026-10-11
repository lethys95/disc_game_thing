import { itemById } from "#rules/items";
import { NODES } from "#rules/nodes";
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
import { element } from "#view/dom";
import { unitSheet } from "#view/unit-sheet";

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

/** What buffs add to its damaging hits, if anything: "+10 to its hits", "+25% to its hits". */
export function hitChange(s: Stats): string {
  const parts = [s.hitPercent !== 0 ? `${s.hitPercent > 0 ? "+" : ""}${s.hitPercent}%` : "", s.hitBonus !== 0 ? `${s.hitBonus > 0 ? "+" : ""}${s.hitBonus}` : ""].filter((p) => p);
  return parts.length > 0 ? `${parts.join(", ")} to its hits` : "";
}

/** What a unit type is, before you have one (choosing a branch, a node in the research tree): its sheet at its own numbers. */
export function unitDefCard(defId: string): HTMLElement {
  const def = UNITS[defId];
  if (!def) return element("div", "unit-sheet-card");
  const s = def.stats;
  return unitSheet({
    defId, leader: false, level: 0, hp: null, maxHp: s.maxHp, shield: s.shield, armor: s.armor, initiative: s.initiative, abilityPower: s.abilityPower,
    hits: "", spellCharges: def.spellCharges ? { now: def.spellCharges, max: def.spellCharges } : null, xp: null,
    abilities: def.abilities.map((ref) => ({ ref, charges: "" })), effects: [], marks: [],
  });
}

/** Where a unit stands on its way to its next level or form, or null. */
function xpLine(m: SquadMember, commitment: Commitment | undefined): string | null {
  const needed = xpToEvolve(m.defId);
  if (commitment && needed !== null) {
    const next = nextForm(m.defId, commitment);
    return next ? `${m.xp} / ${needed} → ${unitName(next)}` : m.xp >= needed ? "Ready: choose a branch" : `${m.xp} / ${needed}`;
  }
  const perLevel = xpToLevel(m.defId);
  return perLevel === null ? null : `${m.xp} / ${perLevel} → level ${m.level + 1}`;
}

/**
 * A squad member's sheet for the held right-click: its numbers as it would fight now (marks, levels and the leader
 * tree included), its health, its progress and its track record.
 */
export function memberCard(m: SquadMember, leader: Leader | undefined, commitment?: Commitment): HTMLElement {
  const s = ownStats(placementOf(m, leader));
  const def = UNITS[m.defId];
  return unitSheet({
    defId: m.defId, leader: isLeaderOf(m, leader), level: m.level, hp: m.hp, maxHp: maxHpOf(m, leader), shield: s.shield, armor: s.armor,
    initiative: s.initiative, abilityPower: s.abilityPower, hits: hitChange(s), spellCharges: def?.spellCharges ? { now: def.spellCharges, max: def.spellCharges } : null,
    xp: xpLine(m, commitment), abilities: (def?.abilities ?? []).map((ref) => ({ ref, charges: "" })), effects: [], marks: recordOf(m, leader).map(markText),
  });
}
