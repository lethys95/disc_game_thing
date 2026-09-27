import { itemById } from "#rules/items";
import { manaColorOf, spellById } from "#rules/spells";
import { hireCost, MERCHANT_STAPLES, resalePrice, STRUCTURES } from "#rules/structures";
import { leadershipOf } from "#rules/world/leaders";
import { maxHpOf } from "#rules/world/record";
import { member, playerOf } from "#rules/world/state";
import type { Leader, MageMerchant, MercenaryCamp, Merchant, Structure, World, WorldAction } from "#rules/world/state";
import { buyItemProblem, buySpellProblem, hireProblem, sellItemProblem } from "#rules/world/structures";
import { button, element, gold, mana, orderButton } from "#view/dom";
import type { KeyLayer } from "#view/input";
import { leaderName } from "#view/map-text";
import { memberCard, memberRow } from "#view/members";

export interface StructureScreenOptions {
  readonly act: (action: WorldAction) => void;
  readonly close: () => void;
}

/** A warband visiting a map structure (`rules/structures.ts`): what it offers on the left, the warband on the right. */
export class StructureScreen implements KeyLayer {
  constructor(
    private readonly root: HTMLElement,
    private readonly options: StructureScreenOptions,
  ) {}

  open(): boolean {
    return !this.root.hidden;
  }

  /** Escape closes the screen. */
  key(e: KeyboardEvent): boolean {
    if (e.key !== "Escape") return false;
    this.options.close();
    return true;
  }

  hide(): void {
    this.root.hidden = true;
  }

  show(world: World, leader: Leader, structure: Structure, mayAct: boolean): void {
    this.root.hidden = false;
    this.root.replaceChildren();
    const header = element("div", "capitol-header");
    header.append(element("div", "title", STRUCTURES[structure.kind].name), gold(playerOf(world, leader.player).gold, "purse"));
    header.appendChild(button("action", "Back to the map", () => this.options.close()));

    const offer = element("div", "capitol-trees panel");
    offer.appendChild(element("div", "note", STRUCTURES[structure.kind].describe));
    switch (structure.kind) {
      case "mercenaries":
        offer.append(...this.hires(world, leader, structure, mayAct));
        break;
      case "merchant":
        offer.append(...this.wares(world, leader, structure, mayAct));
        break;
      case "mage":
        offer.append(...this.spells(world, leader, structure, mayAct));
        break;
    }

    const side = element("div", "capitol-hall panel");
    side.appendChild(element("div", "section", `${leaderName(leader)}'s warband`));
    side.appendChild(element("div", "note", `${leader.squad.length} / ${leadershipOf(leader)} units`));
    for (const m of leader.squad) side.appendChild(memberRow(m, leader, playerOf(world, leader.player).commitment));

    const body = element("div", "capitol-body");
    body.append(offer, side);
    this.root.append(header, body);
  }

  private hires(world: World, leader: Leader, camp: MercenaryCamp, mayAct: boolean): HTMLElement[] {
    return camp.stock.map((hire, index) => {
      const row = element("div", "offer-row");
      const recruit = { ...member(hire.defId, { row: 0, col: 0 }), level: hire.level };
      row.appendChild(memberCard({ ...recruit, hp: maxHpOf(recruit, undefined) }, undefined));
      row.appendChild(
        orderButton("small", ["Hire · ", gold(hireCost(hire))], {
          mayAct,
          problem: hireProblem(world, leader.id, index),
          explain: "Joins the warband at full health, on the first free spot for its kind.",
          give: () => this.options.act({ type: "hire", leaderId: leader.id, index }),
        }),
      );
      return row;
    });
  }

  private wares(world: World, leader: Leader, merchant: Merchant, mayAct: boolean): HTMLElement[] {
    const offer = (id: string) => {
      const item = itemById(id);
      return this.row(item.name, item.describe, orderButton("small", ["Buy · ", gold(item.price)], {
        mayAct,
        problem: buyItemProblem(world, leader.id, id),
        explain: item.use ? "Into the leader's bag; use it from the leader's screen." : "Into the leader's bag; put it on from the leader's screen.",
        give: () => this.options.act({ type: "buyItem", leaderId: leader.id, item: id }),
      }));
    };
    const rows: HTMLElement[] = [element("div", "section", "Always in stock"), ...MERCHANT_STAPLES.map(offer)];
    rows.push(element("div", "section", "Wares"), element("div", "note", `New wares replace these on turn ${merchant.restocksOn}.`));
    if (merchant.wares.length === 0) rows.push(element("div", "note", "Sold out until then."));
    rows.push(...merchant.wares.map(offer));
    rows.push(element("div", "section", "Your bag"));
    if (leader.bag.length === 0) rows.push(element("div", "note", "Nothing carried. Worn items must come off (the leader's screen) before they sell."));
    for (const id of leader.bag) {
      const item = itemById(id);
      rows.push(
        this.row(item.name, item.describe, orderButton("small", ["Sell · ", gold(resalePrice(item.price))], {
          mayAct,
          problem: sellItemProblem(world, leader.id, id),
          explain: "Half its price.",
          give: () => this.options.act({ type: "sellItem", leaderId: leader.id, item: id }),
        })),
      );
    }
    return rows;
  }

  private spells(world: World, leader: Leader, mage: MageMerchant, mayAct: boolean): HTMLElement[] {
    const faction = playerOf(world, leader.player).faction;
    return mage.stock.map((id) => {
      const spell = spellById(id);
      const text = element("div", "spell-text");
      const head = element("div", "name", spell.name);
      head.append(" · ", mana(spell.cost, manaColorOf(spell, faction)), " per cast");
      text.append(head, element("div", "note", spell.describe));
      const row = element("div", "spell-row");
      row.appendChild(text);
      if (playerOf(world, leader.player).spells.includes(id)) row.appendChild(element("div", "note", "Learned"));
      else {
        row.appendChild(
          orderButton("small", ["Learn · ", gold(spell.learnCost)], {
            mayAct,
            problem: buySpellProblem(world, leader.id, id),
            explain: "Cast it from the map's spell bar, with your own mana.",
            give: () => this.options.act({ type: "buySpell", leaderId: leader.id, spell: id }),
          }),
        );
      }
      return row;
    });
  }

  private row(name: string, describe: string, action: HTMLElement): HTMLElement {
    const text = element("div", "spell-text");
    text.append(element("div", "name", name), element("div", "note", describe));
    const row = element("div", "spell-row");
    row.append(text, action);
    return row;
  }
}
