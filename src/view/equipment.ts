import { describeItem, itemById, SLOT_CAPACITY, SLOT_NAMES } from "#rules/items";
import { leaderAbilityPower } from "#view/members";
import type { EquipmentSlot } from "#rules/items";
import { equipProblem } from "#rules/world/leaders";
import { useItemProblem } from "#rules/world/items";
import type { Leader, World, WorldAction } from "#rules/world/state";
import { element, orderButton } from "#view/dom";

const isSlot = (key: string): key is EquipmentSlot => key in SLOT_CAPACITY;

/**
 * A leader's equipment (`docs/design/warband-elements.md`, "Equipment"): a row per slot with what's worn and Take off,
 * then the bag with Put on or Use. The leader's screen and every structure show it, so what was bought can be put on at
 * once.
 */
export function equipmentPanel(world: World, leader: Leader, mayAct: boolean, act: (action: WorldAction) => void): HTMLElement {
  const box = element("div", "equipment");
  const power = leaderAbilityPower(leader);
  box.appendChild(element("div", "section", "Worn"));
  for (const slot of Object.keys(SLOT_CAPACITY).filter(isSlot)) {
    const worn = leader.worn.filter((id) => itemById(id).slot === slot);
    for (let i = 0; i < SLOT_CAPACITY[slot]; i++) {
      const id = worn[i];
      const row = element("div", `slot-row${id ? "" : " empty"}`);
      row.appendChild(element("span", "slot-name", SLOT_NAMES[slot]));
      if (id) {
        const item = itemById(id);
        row.append(element("span", "item", item.name), element("span", "note", describeItem(item, power)));
        row.appendChild(orderButton("small", "Take off", { mayAct, problem: null, explain: describeItem(item, power), give: () => act({ type: "unequip", leaderId: leader.id, item: id }) }));
      } else row.appendChild(element("span", "note", "empty"));
      box.appendChild(row);
    }
  }
  box.appendChild(element("div", "section", "Bag"));
  if (leader.bag.length === 0) box.appendChild(element("div", "note", "Nothing carried."));
  leader.bag.forEach((id) => {
    const item = itemById(id);
    const row = element("div", "slot-row");
    row.append(element("span", "item", item.name), element("span", "note", describeItem(item, power)));
    if (item.slot) row.appendChild(orderButton("small", "Put on", { mayAct, problem: equipProblem(leader, id), explain: describeItem(item, power), give: () => act({ type: "equip", leaderId: leader.id, item: id }) }));
    else if (item.use) row.appendChild(orderButton("small", "Use", { mayAct, problem: useItemProblem(world, leader.id, id), explain: describeItem(item, power), give: () => act({ type: "useItem", leaderId: leader.id, item: id }) }));
    box.appendChild(row);
  });
  return box;
}
