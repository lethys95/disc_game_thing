import { BEHAVIORS, elementsOf } from "#rules/abilities/index";
import { armorReduction } from "#rules/battle/damage";
import type { AbilityRef } from "#rules/battle/types";
import { UNITS } from "#rules/units/index";
import { abilityRow } from "#view/ability-text";
import { art } from "#view/art";
import { element } from "#view/dom";

/** What one unit's sheet shows: the same sheet for a unit type, a squad member, a hire and a unit in battle. */
export interface SheetData {
  readonly defId: string;
  readonly leader: boolean;
  readonly level: number;
  /** Health now and at most; null for a unit type, which has only its maximum. */
  readonly hp: number | null;
  readonly maxHp: number;
  readonly shield: number;
  readonly armor: number;
  readonly initiative: number;
  readonly abilityPower: number;
  /** "+10%, +5 to its hits" from effects, or empty. */
  readonly hits: string;
  readonly spellCharges: { readonly now: number; readonly max: number } | null;
  /** "40 / 100 → Paladin", or null. */
  readonly xp: string | null;
  readonly abilities: readonly { readonly ref: AbilityRef; readonly charges: string }[];
  /** Effects on it in battle, already drawn. */
  readonly effects: readonly HTMLElement[];
  /** Its track record, a line each. */
  readonly marks: readonly string[];
}

/**
 * A unit's sheet (the held right-click everywhere; Disciples II's unit card as the model, the user, 2026-10-11): a
 * parchment sheet hanging from a rod, the portrait framed at its left with the name under it, the numbers as a list of
 * labels and values at its right, the abilities below. Layout in flat values for now; painted later.
 */
export function unitSheet(data: SheetData): HTMLElement {
  const def = UNITS[data.defId];
  const sheet = element("div", "unit-sheet-card");
  sheet.appendChild(element("div", "rod"));
  const top = element("div", "top");
  const left = element("div", "left");
  left.append(art({ kind: "portrait", id: data.defId, frame: "bust" }, "sheet-portrait"), element("div", "sheet-name", `${data.leader ? "♛ " : ""}${def?.name ?? data.defId}`));
  const facts = element("dl", "facts");
  const fact = (label: string, value: string) => {
    if (value) facts.append(element("dt", "", label), element("dd", "", value));
  };
  fact("Tier", String(def?.tier ?? 1));
  if (data.level > 0) fact("Level", String(data.level));
  fact("Health", data.hp === null ? String(data.maxHp) : data.hp > 0 ? `${data.hp} / ${data.maxHp}` : "Fallen");
  if (data.shield > 0) fact("Shield", String(data.shield));
  fact("Armor", data.armor > 0 ? `${data.armor} (${armorReduction(data.armor)}%)` : "0");
  fact("Initiative", String(data.initiative));
  fact("Ability power", String(data.abilityPower));
  if (data.hits) fact("Hits", data.hits);
  if (data.spellCharges) fact("Spell charges", `${data.spellCharges.now} / ${data.spellCharges.max}`);
  if (def && elementsOf(def).length > 0) fact("Deals", elementsOf(def).join(", "));
  if (data.xp) fact("XP", data.xp);
  top.append(left, facts);
  sheet.appendChild(top);
  if (data.effects.length > 0) {
    const effects = element("div", "sheet-effects");
    effects.append(...data.effects);
    sheet.appendChild(effects);
  }
  const abilities = element("div", "sheet-abilities");
  for (const { ref, charges } of data.abilities) {
    const behavior = BEHAVIORS[ref.id];
    if (!behavior || (behavior.kind === "active" && behavior.tags.includes("common"))) continue;
    const head = [element("span", "name", ref.name ?? behavior.name), ...(charges ? [element("span", "charges", ` ${charges}`)] : [])];
    abilities.appendChild(abilityRow(data.defId, ref, head, data.abilityPower));
  }
  sheet.appendChild(abilities);
  for (const mark of data.marks) sheet.appendChild(element("div", "sheet-mark", mark));
  return sheet;
}
