import { describeParts } from "#rules/abilities/index";
import type { AbilityRef } from "#rules/battle/types";
import { element } from "#view/dom";

/**
 * An ability's rules text with the numbers ability power grew marked (the user, 2026-10-07: "if we could be
 * transparent in tooltips about what numbers look like after scaling"): hovering one tells its scaling, the way
 * League of Legends does (the user's comparison): a share of the unit's ability power.
 */
export function abilityText(ref: AbilityRef, abilityPower: number): HTMLElement {
  const text = element("div", "text");
  for (const part of describeParts(ref, abilityPower)) {
    if (!("base" in part)) {
      text.append(part.text);
      continue;
    }
    const number = element("span", "scaled", part.text);
    number.title = `${part.base}% of ability power (${part.abilityPower} here)`;
    text.append(number, element("span", "formula", ` (${part.base}% × ${part.abilityPower})`));
  }
  return text;
}

/** The same for a plain tooltip: the text, then what ability power made of each number it grew. */
export function abilityPlain(ref: AbilityRef, abilityPower: number): string {
  const parts = describeParts(ref, abilityPower);
  const text = parts.map((part) => part.text).join("");
  const grown = parts.flatMap((part) => ("base" in part ? [`${part.text} is ${part.base}%`] : []));
  return grown.length === 0 ? text : `${text}\n(Of ability power ${abilityPower}: ${grown.join(", ")})`;
}
