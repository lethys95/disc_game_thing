import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { BEHAVIORS, describeAbility } from "#rules/abilities/index";
import { EFFECTS } from "#rules/effects";
import { PLAYABLE } from "#rules/factions";
import { ITEMS, describeItem } from "#rules/items";
import { isMapSize } from "#rules/map";
import { NODES } from "#rules/nodes";
import { RESEARCH } from "#rules/research";
import { SPELLS, describeSpell } from "#rules/spells";
import { toSave, writeSave } from "#rules/save";
import { EVOLUTIONS, UNITS } from "#rules/units/index";
import type { Playable } from "#rules/units/index";
import { LEADER_SKILLS } from "#rules/world/leaders";
import type { WorldAction } from "#rules/world/state";
import { unitName } from "#view/names";
import { battleOptions, battleView } from "#scripts/mcp/battle-text";
import type { BattleChoice } from "#scripts/mcp/battle-text";
import { mapOptions, placeText } from "#scripts/mcp/map-options";
import { knownWorld } from "#rules/world/vision";
import { cityById, lairById, leaderById } from "#rules/world/state";
import { autoFight, fight, inFight, newTable, order, pickTarot, seatOver, seatSide } from "#scripts/mcp/table";
import type { Played, Table } from "#scripts/mcp/table";
import { lookText, statusLine, warbandLines } from "#scripts/mcp/world-text";

/**
 * The outside player's tools, as plain functions from a table to a reply: the MCP server and the command line both
 * call these. Every reply that leaves a decision ends with the numbered options and the revision they belong to.
 */

export interface Reply {
  readonly table: Table | null;
  readonly text: string;
}

type Choice = { readonly kind: "map"; readonly action: WorldAction } | { readonly kind: "battle"; readonly choice: BattleChoice } | { readonly kind: "auto" };

interface Listed {
  readonly text: string;
  readonly choice: Choice;
}

function listed(table: Table): Listed[] {
  if (seatOver(table)) return [];
  const side = seatSide(table);
  const battle = table.world.engagement?.battle;
  if (inFight(table) && side !== null && battle) {
    const fights = battleOptions(battle, side).map((o): Listed => ({ text: o.text, choice: { kind: "battle", choice: o.choice } }));
    return [...fights, { text: "Let the battle AI fight the rest of this battle for you.", choice: { kind: "auto" } }];
  }
  if (table.world.activePlayer !== table.seat) return [];
  return mapOptions(table.world, table.seat).map((o) => ({ text: o.text, choice: { kind: "map", action: o.action } }));
}

function gameOver(table: Table): string {
  const outcome = table.world.outcome;
  if (outcome) return outcome.winner === table.seat ? "GAME OVER: YOU WIN. Every other Capitol has fallen." : `GAME OVER: player ${outcome.winner} wins.`;
  return "GAME OVER: your Capitol's Guardian fell; you are out of the game.";
}

/** Where things stand now, and the numbered options. */
function screen(table: Table, full: boolean): string {
  if (seatOver(table)) return gameOver(table);
  const side = seatSide(table);
  const engagement = table.world.engagement;
  const parts: string[] = [];
  if (inFight(table) && side !== null && engagement) parts.push(battleView(engagement.battle, side, `BATTLE: ${engagementText(table)}`));
  else parts.push(full ? lookText(table.world, table.seat) : [statusLine(table.world, table.seat), ...warbandLines(table.world, table.seat)].join("\n"));
  const options = listed(table);
  parts.push(`OPTIONS (revision ${table.revision}; answer with act, giving the option's number and this revision):`);
  parts.push(options.map((o, i) => `${i + 1}. ${o.text}`).join("\n"));
  return parts.join("\n\n");
}

/** Who fights whom, from the seat's side. */
function engagementText(table: Table): string {
  const world = table.world;
  const engagement = world.engagement;
  if (!engagement) return "";
  const attacker = world.leaders.find((l) => l.id === engagement.attackerId);
  const defender = engagement.defender;
  const known = knownWorld(world, table.seat);
  const target =
    defender.kind === "leader"
      ? placeText(known, table.seat, leaderById(world, defender.leaderId).hex)
      : defender.kind === "lair"
        ? placeText(known, table.seat, lairById(world, defender.lairId).hex)
        : placeText(known, table.seat, cityById(world, defender.cityId).hex);
  return attacker?.player === table.seat ? `your ${attacker.id} attacks ${target}` : `player ${attacker?.player ?? "?"}'s warband attacks ${target}`;
}

function reply(played: Played, full = false): Reply {
  const happened = played.lines.filter(Boolean);
  const text = [happened.length > 0 ? `WHAT HAPPENED\n${happened.join("\n")}` : "", screen(played.table, full)].filter(Boolean).join("\n\n");
  return { table: played.table, text };
}

export interface NewGame {
  readonly faction?: string | undefined;
  readonly opponents?: readonly string[] | undefined;
  readonly seed?: number | undefined;
  readonly size?: string | undefined;
  readonly battles?: "play" | "auto" | undefined;
}

const isPlayable = (key: string): key is Playable => PLAYABLE.some((p) => p === key);

export function startGame(args: NewGame, now: number): Reply {
  const faction = args.faction ?? "jilliath";
  if (!isPlayable(faction)) return { table: null, text: `Unknown faction "${faction}". Choose one of: ${PLAYABLE.join(", ")}.` };
  const opponents = args.opponents ?? ["nexus"];
  const unknown = opponents.find((o) => !isPlayable(o));
  if (unknown !== undefined || opponents.length < 1 || opponents.length > 5) return { table: null, text: `Opponents must be 1 to 5 of: ${PLAYABLE.join(", ")}.` };
  if (args.size !== undefined && !isMapSize(args.size)) return { table: null, text: "Size must be small, medium, large or huge." };
  const played = newTable({
    seed: args.seed ?? now % 100000,
    faction,
    opponents: opponents.filter(isPlayable),
    ...(args.size !== undefined && isMapSize(args.size) ? { size: args.size } : {}),
    battles: args.battles ?? "play",
  });
  return reply({ table: played.table, lines: [`A new game on map seed ${played.table.seed}: you are player 0, ${faction}, against ${opponents.join(", ")}.`, ...played.lines] }, true);
}

export const look = (table: Table): Reply => reply({ table, lines: [] }, true);

export function act(table: Table, option: number, revision: number): Reply {
  if (revision !== table.revision) return { table, text: `Those options were for revision ${revision}; the game is at revision ${table.revision} now.\n\n${screen(table, false)}` };
  const chosen = listed(table)[option - 1];
  if (!chosen) return { table, text: `There is no option ${option}.\n\n${screen(table, false)}` };
  try {
    const choice = chosen.choice;
    if (choice.kind === "map") return reply(order(table, choice.action));
    if (choice.kind === "auto") return reply(autoFight(table));
    const battle = choice.choice;
    return reply(battle.kind === "tarot" ? pickTarot(table, battle.hand, battle.card) : fight(table, battle.action));
  } catch (error) {
    return { table, text: `That can't be done: ${error instanceof Error ? error.message : String(error)}\n\n${screen(table, false)}` };
  }
}

/** A map order not in the list (a transfer to a chosen tile, a march to any hex), as the rules' own action object. */
export function raw(table: Table, action: WorldAction): Reply {
  try {
    return reply(order(table, action));
  } catch (error) {
    return { table, text: `That can't be done: ${error instanceof Error ? error.message : String(error)}\n\n${screen(table, false)}` };
  }
}

const matches = (query: string, ...keys: readonly string[]) => keys.some((k) => k.toLowerCase() === query);

/** Rules text for anything in the game, by id or name: a unit, ability, effect, item, spell, node, research, skill. */
export function describe(name: string): string {
  const query = name.trim().toLowerCase();
  const found: string[] = [];
  for (const def of Object.values(UNITS)) {
    if (!matches(query, def.id, def.name)) continue;
    const s = def.stats;
    const evolves = (EVOLUTIONS[def.id] ?? []).map((e) => unitName(e.to));
    found.push(
      [
        `Unit ${def.name} (${def.id}): ${def.faction}, tier ${def.tier}. ${s.maxHp} HP${s.shield > 0 ? `, shield ${s.shield}` : ""}, armor ${s.armor}, initiative ${s.initiative}, ability power ${s.abilityPower}%${def.spellCharges ? `, ${def.spellCharges} spell charges` : ""}.`,
        ...def.abilities.map((ref) => `  - ${ref.name ?? BEHAVIORS[ref.id]?.name ?? ref.id}: ${describeAbility(ref, s.abilityPower)}`),
        evolves.length > 0 ? `  Evolves into: ${evolves.join(" or ")}.` : "",
      ].filter(Boolean).join("\n"),
    );
  }
  for (const [id, b] of Object.entries(BEHAVIORS)) if (matches(query, id, b.name)) found.push(`Ability ${b.name} (${id}), at 100% ability power: ${describeAbility({ id }, 100)}`);
  for (const e of EFFECTS.values()) if (matches(query, e.id, e.name)) found.push(`Effect ${e.name} (${e.id}): ${e.describe({ def: e.id, source: null, stacks: 1, amount: 0 })}`);
  for (const item of ITEMS) if (matches(query, item.id, item.name)) found.push(`Item ${item.name} (${item.id}), ${item.price} gold${item.slot ? `, worn as ${item.slot}` : ""}: ${describeItem(item, 100)}`);
  for (const spell of SPELLS) if (matches(query, spell.id, spell.name)) found.push(`Spell ${spell.name} (${spell.id}), ${spell.cost} mana per cast, ${spell.learnCost} gold to learn: ${describeSpell(spell)}`);
  for (const [id, node] of Object.entries(NODES)) if (matches(query, id, node.name)) found.push(`Node ${node.name}: level 1: ${node.describe(1)}; level 2: ${node.describe(2)}; level 3: ${node.describe(3)}.`);
  for (const r of RESEARCH) if (matches(query, r.id, r.name)) found.push(`Research ${r.name} (${r.cost} gold): ${r.describe}`);
  for (const [id, skill] of Object.entries(LEADER_SKILLS)) if (matches(query, id, skill.name)) found.push(`Leader skill ${skill.name} (up to rank ${skill.maxRank}${skill.requires.length > 0 ? `, needs ${skill.requires.join(", ")} first` : ""}): ${skill.describe}`);
  return found.length > 0 ? found.join("\n\n") : `Nothing called "${name}". Use a name as the game writes it (a unit, ability, effect, item, spell, node, research or leader skill).`;
}

export function loadTable(path: string): Table | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    return isTable(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** The table file is only ever written by `storeTable`: its header is checked, its world trusted. */
function isTable(value: unknown): value is Table {
  if (typeof value !== "object" || value === null) return false;
  const record: Record<string, unknown> = { ...value };
  return typeof record["seed"] === "number" && typeof record["seat"] === "number" && typeof record["revision"] === "number" && typeof record["world"] === "object";
}

/**
 * Keeps the table for the next call, and the world as a disc save beside it (`watch`), which the browser can load to
 * watch the game. A save is only written between battles: a save holds the map, not a fight in progress.
 */
export function storeTable(path: string, watch: string, table: Table, now: Date): void {
  if (path === watch) throw new Error("the table and the watched save must be different files");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(table));
  if (table.world.engagement) return;
  mkdirSync(dirname(watch), { recursive: true });
  writeFileSync(watch, writeSave(toSave(table.world, table.seed, now)));
}
