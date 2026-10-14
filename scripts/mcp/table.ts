import { chooseAction, chooseTarotCards, autoplay } from "#rules/ai";
import { applyAction, chooseTarot } from "#rules/battle/engine";
import type { Action, Battle, BattleEvent, Side } from "#rules/battle/types";
import { commitmentOf } from "#rules/forks";
import { FORMATIONS } from "#rules/units/presets";
import type { Playable } from "#rules/units/index";
import { applyWorldAction } from "#rules/world/actions";
import { chooseWorldAction } from "#rules/world/ai";
import type { BattleMemo } from "#rules/world/ai";
import { concludeBattle } from "#rules/world/battles";
import { defaultColors } from "#rules/world/colors";
import { createWorld } from "#rules/world/create";
import type { PlayerSetup } from "#rules/world/create";
import { playerOf } from "#rules/world/state";
import type { PlayerId, World, WorldAction } from "#rules/world/state";
import { defaultMapSize } from "#rules/map";
import type { MapSize } from "#rules/map";
import { newsText } from "#view/map-text";
import { masked } from "#view/secrecy";
import { battleLog } from "#scripts/mcp/battle-text";

/**
 * A game with one seat taken by an outside player (an LLM over MCP); the map AI plays every other seat. Plain data,
 * so it can be written to disk between calls and picked up again by the server or the command line.
 */
export interface Table {
  readonly seed: number;
  readonly seat: PlayerId;
  /** `play`: the seat fights its own battles, order by order; `auto`: the battle AI fights them for it. */
  readonly battles: "play" | "auto";
  readonly world: World;
  /** Counts the seat's orders: an option number is only good for the listing made at the same revision. */
  readonly revision: number;
}

export interface TableSetup {
  readonly seed: number;
  readonly faction: Playable;
  readonly opponents: readonly Playable[];
  readonly size?: MapSize;
  readonly battles: "play" | "auto";
}

/** What the seat's order (or the turns that follow it) led to, as lines to read. */
export interface Played {
  readonly table: Table;
  readonly lines: readonly string[];
}

export function newTable(setup: TableSetup): Played {
  const factions = [setup.faction, ...setup.opponents];
  const colors = defaultColors(factions);
  const setups = factions.map((faction, i): PlayerSetup => {
    const squad = [...(FORMATIONS[faction][0]?.squad ?? [])];
    return { squad, faction, commitment: commitmentOf(squad.map((p) => p.defId)) ?? {}, color: colors[i] ?? "white" };
  });
  const world = createWorld(setup.seed, setups, setup.size ?? defaultMapSize(setups.length));
  return advance({ seed: setup.seed, seat: 0, battles: setup.battles, world, revision: 0 }, []);
}

/** The side the seat fights on in the current engagement, or null when it isn't in one. */
export function seatSide(table: Table): Side | null {
  const engagement = table.world.engagement;
  if (!engagement) return null;
  if (engagement.players[0] === table.seat) return 0;
  return engagement.players[1] === table.seat ? 1 : null;
}

/** The seat's fight waits for it: an engagement it's in, while it fights its own battles. */
export const inFight = (table: Table): boolean => table.battles === "play" && seatSide(table) !== null;

export const seatOver = (table: Table): boolean => table.world.outcome !== null || playerOf(table.world, table.seat).eliminated;

/** A map order of the seat's. Throws with the rules' reason when it can't be given. */
export function order(table: Table, action: WorldAction): Played {
  if (inFight(table)) throw new Error("a battle is on: give battle orders");
  if (table.world.activePlayer !== table.seat) throw new Error("not your turn");
  const step = applyWorldAction(table.world, action);
  const news = newsText(step.events, step.world, table.seat);
  return advance({ ...table, world: step.world, revision: table.revision + 1 }, news ? [news] : []);
}

/** An order for the seat's unit whose turn it is in the current battle. */
export function fight(table: Table, action: Action): Played {
  const { battle, side } = seatBattle(table);
  if (battle.current === null || battle.units[battle.current.unitId]?.side !== side) throw new Error("not your unit's turn");
  const step = applyAction(battle, action);
  return advance(withBattle({ ...table, revision: table.revision + 1 }, step.battle), battleLog(masked(step.events, step.battle, side), step.battle, side));
}

export function pickTarot(table: Table, hand: number, card: number): Played {
  const { battle, side } = seatBattle(table);
  if (battle.tarot[hand]?.side !== side) throw new Error("not your hand");
  return advance(withBattle({ ...table, revision: table.revision + 1 }, chooseTarot(battle, hand, card).battle), []);
}

/** Hands the rest of the seat's current battle to the battle AI. */
export function autoFight(table: Table): Played {
  const { battle } = seatBattle(table);
  return advance(withBattle({ ...table, revision: table.revision + 1 }, autoplay(battle)), []);
}

function seatBattle(table: Table): { battle: Battle; side: Side } {
  const side = seatSide(table);
  const battle = table.world.engagement?.battle;
  if (side === null || !battle) throw new Error("no battle of yours is on");
  return { battle, side };
}

const withBattle = (table: Table, battle: Battle): Table => {
  const engagement = table.world.engagement;
  return engagement ? { ...table, world: { ...table.world, engagement: { ...engagement, battle } } } : table;
};

/** The seat's tarot hands still to pick from: the fight waits for them. */
export const openHands = (battle: Battle, side: Side): number[] => battle.tarot.flatMap((h, i) => (h.side === side && h.chosen === null ? [i] : []));

/**
 * Plays everything that isn't the seat's to decide: the other side's battle orders, battles the seat isn't in, the
 * other players' turns. Stops when the seat must decide (its turn, its unit's turn, a tarot hand) or its game is over.
 */
function advance(start: Table, lines: string[]): Played {
  // One BattleMemo per call: a turn's forecasts repeat, a game's grow without bound.
  const memo: BattleMemo = new Map();
  let table = start;
  for (let guard = 0; guard < 100000; guard++) {
    const world = table.world;
    if (seatOver(table)) break;
    const engagement = world.engagement;
    if (engagement) {
      const side = seatSide(table);
      if (side === null || table.battles === "auto") {
        const done = autoplay(engagement.battle);
        table = concluded(table, done, side, lines);
        continue;
      }
      const battle = engagement.battle;
      if (battle.outcome) {
        table = concluded(table, battle, side, lines);
        continue;
      }
      const theirs: Side = side === 0 ? 1 : 0;
      const picked = chooseTarotCards(battle, theirs);
      if (openHands(picked, side).length > 0) {
        table = withBattle(table, picked);
        break;
      }
      const current = picked.current;
      if (current && picked.units[current.unitId]?.side === side) {
        table = withBattle(table, picked);
        break;
      }
      const action = chooseAction(picked);
      const next = action ? applyAction(picked, action) : { battle: autoplay(picked), events: [] as BattleEvent[] };
      lines.push(...battleLog(masked(next.events, next.battle, side), next.battle, side));
      table = withBattle(table, next.battle);
      continue;
    }
    if (world.activePlayer === table.seat) break;
    const step = applyWorldAction(world, chooseWorldAction(world, memo));
    const news = newsText(step.events, step.world, table.seat);
    if (news) lines.push(news);
    for (const e of step.events) if (e.type === "turnStarted" && e.player === table.seat) lines.push(`The other players have moved (you hear only of what happens in your sight). Turn ${e.turn}, your turn: +${e.income} gold.`);
    if (step.world.engagement && seatSide({ ...table, world: step.world }) === 1) lines.push(attackedText(step.world));
    table = { ...table, world: step.world };
  }
  return { table, lines };
}

function concluded(table: Table, battle: Battle, side: Side | null, lines: string[]): Table {
  const step = concludeBattle(table.world, battle);
  if (side !== null) lines.push(battleResult(battle, side));
  const news = newsText(step.events, step.world, table.seat);
  if (news) lines.push(news);
  return { ...table, world: step.world };
}

function battleResult(battle: Battle, side: Side): string {
  const outcome = battle.outcome;
  const units = Object.values(battle.units);
  const standing = (s: Side) => units.filter((u) => u.side === s && u.alive).length;
  const theirs: Side = side === 0 ? 1 : 0;
  const dead = units.filter((u) => u.side === side && !u.alive && !u.fled).map((u) => `${u.name} [${"FMB"[u.tile.row] ?? "?"}${u.tile.col + 1}]`);
  const lost = dead.length > 0 ? ` You lost: ${dead.join(", ")}.` : " You lost nobody.";
  if (!outcome || outcome.winner === null) return `The battle ends with both sides destroyed.`;
  if (outcome.winner === side) return `VICTORY: ${standing(side)} of yours still stand.${lost}`;
  return `DEFEAT${"withdrew" in outcome ? " (the attacker withdrew after the round limit)" : ""}: ${standing(theirs)} of theirs still stand.${lost}`;
}

function attackedText(world: World): string {
  const engagement = world.engagement;
  if (!engagement) return "";
  const where = engagement.defender.kind === "garrison" ? "a garrison of yours" : "one of your warbands";
  return `You are attacked: an enemy warband falls on ${where}.`;
}
