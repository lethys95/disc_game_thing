import { itemById } from "#rules/items";
import { manaColorOf, spellById } from "#rules/spells";
import { hireCost, MERCHANT_STAPLES, resalePrice, STRUCTURES } from "#rules/structures";
import { maxHpOf } from "#rules/world/record";
import { member, playerOf } from "#rules/world/state";
import type { Leader, MageMerchant, MercenaryCamp, Merchant, Structure, World, WorldAction } from "#rules/world/state";
import { buyItemProblem, buySpellProblem, hireProblem, sellItemProblem } from "#rules/world/structures";
import { element, gold, mana, orderButton } from "#view/dom";
import { tabFrame } from "#view/frames";
import { warbandColumn } from "#view/warband-column";
import type { KeyLayer } from "#view/input";
import { unitName } from "#view/members";
import { squadTile } from "#view/squad-tile";
import { equipmentPanel } from "#view/equipment";

export interface StructureScreenOptions {
  readonly act: (action: WorldAction) => void;
  readonly close: () => void;
}

/** A warband visiting a map structure (`rules/structures.ts`): what it offers in the frame, the warband's column on the right. */
export class StructureScreen implements KeyLayer {
  private tab: "offer" | "equipment" = "offer";
  private shownAt = "";

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
    const at = `${leader.id}:${structure.kind}`;
    if (this.shownAt !== at) this.tab = "offer";
    this.shownAt = at;
    this.root.hidden = false;
    this.root.replaceChildren();
    const name = STRUCTURES[structure.kind].name;
    const offer = element("div", "offer");
    switch (structure.kind) {
      case "mercenaries":
        offer.appendChild(this.hires(world, leader, structure, mayAct));
        break;
      case "merchant":
        offer.append(...this.wares(world, leader, structure, mayAct));
        break;
      case "mage":
        offer.append(...this.spells(world, leader, structure, mayAct));
        break;
    }
    const tabs = [
      { id: "offer", label: name, selected: this.tab === "offer" },
      { id: "equipment", label: "Equipment", selected: this.tab === "equipment" },
    ];
    const select = (id: string) => {
      this.tab = id === "equipment" ? "equipment" : "offer";
      this.show(world, leader, structure, mayAct);
    };
    const body = this.tab === "offer" ? offer : equipmentPanel(world, leader, mayAct, this.options.act);
    this.root.append(warbandColumn(world, leader, tabs, select, () => this.options.close()), tabFrame(this.tab === "offer" ? name : "Equipment", body, null));
  }

  /** The hires as the recruit menu shows recruits: the tile each will be, its name, level and price; its sheet on a held right-click. */
  private hires(world: World, leader: Leader, camp: MercenaryCamp, mayAct: boolean): HTMLElement {
    const row = element("div", "offers");
    camp.stock.forEach((hire, index) => {
      const recruit = { ...member(hire.defId, { row: 0, col: 0 }), level: hire.level };
      const problem = mayAct ? hireProblem(world, leader.id, index) : "not your turn";
      const item = element("button", `offer${problem ? " refused" : ""}`);
      item.append(squadTile({ ...recruit, hp: maxHpOf(recruit, undefined) }, undefined), element("span", "name", `${unitName(hire.defId)}${hire.level > 0 ? ` · level ${hire.level}` : ""}`), gold(hireCost(hire)));
      item.title = problem ?? "Hire: it joins the warband at full health, on the first free spot for its kind. Hold right-click for its sheet.";
      item.addEventListener("click", () => {
        if (!problem) this.options.act({ type: "hire", leaderId: leader.id, index });
      });
      row.appendChild(item);
    });
    if (camp.stock.length === 0) row.appendChild(element("div", "note", "No one left to hire."));
    return row;
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
