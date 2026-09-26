import { hexKey } from "#rules/hex";
import type { Hex } from "#rules/hex";
import { tileAt, TERRAIN_COST } from "#rules/map";
import type { MovePlan, MoveTarget } from "#rules/world/movement";
import { cityById, lairById, leaderAt, playerOf } from "#rules/world/state";
import type { Leader, PlayerId, World, WorldEvent } from "#rules/world/state";
import { sightOf } from "#rules/world/vision";
import { castProblem, spellVictims } from "#rules/world/spells";
import { spellById } from "#rules/spells";
import { unitName } from "#view/members";

/** What the map's hint line says: the hover, the march, the news. Pure text over what the player knows. */

export function leaderName(leader: Leader): string {
  const figure = leader.squad.find((m) => m.tile.row === leader.leaderTile.row && m.tile.col === leader.leaderTile.col) ?? leader.squad[0];
  return figure ? unitName(figure.defId) : "Leader";
}

export interface HintContext {
  /** The world as the player knows it (`knownWorld`). */
  readonly known: World;
  readonly player: PlayerId;
  readonly leader: Leader | undefined;
  readonly hovered: Hex | null;
  readonly plan: MovePlan | null;
  /** The forecast line for attacking this target, or "thinking" while it's worked out. */
  readonly forecast: (leader: Leader, target: MoveTarget) => string;
}

/** The hint on the player's own turn. */
export function hintText({ known, player, leader, hovered, plan, forecast }: HintContext): string {
  if (!leader) return "You have no warbands. Elevate a garrison unit in your Capitol.";
  const own = hovered ? leaderAt(known, hovered) : undefined;
  if (own?.player === player && own.id !== leader.id) return `Click to select ${leaderName(own)}'s warband.`;
  const explored = hovered !== null && playerOf(known, player).explored.includes(hexKey(hovered));
  const tile = hovered && explored ? tileAt(known.map, hovered) : undefined;
  const terrain = hovered && !explored ? "unexplored land" : tile ? `${tile.terrain}${TERRAIN_COST[tile.terrain] === null ? " (impassable)" : `, costs ${TERRAIN_COST[tile.terrain]}`}` : "";
  if (!plan) return `${leaderName(leader)}: ${leader.movement} movement left. ${terrain ? `Hovering ${terrain}.` : "Click a hex to march."}`;
  const target = plan.target;
  if (target?.kind === "capture") return "Click to take the undefended city.";
  if (target?.kind === "leader") return `Click to attack the enemy warband. ${forecast(leader, target)}`;
  if (target?.kind === "garrison") {
    const city = cityById(known, target.cityId);
    const whose = city.owner === null ? "the bandit-held city" : city.kind === "capitol" ? "the Capitol" : "the city";
    return `Click to storm ${whose}. ${forecast(leader, target)}`;
  }
  if (target?.kind === "lair") {
    const lair = lairById(known, target.lairId);
    const reward = lair.reward ? ` Reward: ${lair.reward.gold} gold${lair.reward.joins ? ` and a ${unitName(lair.reward.joins)} joins you` : ""}.` : "";
    return `Click to attack the ${lair.kind === "camp" ? "bandit camp" : "dungeon's guards"}.${reward} ${forecast(leader, target)}`;
  }
  if (plan.steps === 0) return "Not enough movement left to go further. End your turn.";
  const total = plan.path.hexes.length;
  const walks = plan.steps === total ? `March there (${plan.path.cost} movement)` : `March ${plan.steps} of ${total} hexes this turn`;
  return `${walks}. Hovering ${terrain}.`;
}

/** The hint while aiming a spell: what a click on the hovered hex would do. */
export function castHint(world: World, spellId: string, hovered: Hex | null): string {
  const spell = spellById(spellId);
  const problem = hovered ? castProblem(world, spellId, hovered) : null;
  if (!hovered || problem) return `${spell.name}: ${spell.describe} Click a highlighted hex; right-click or Esc to stop.${problem && hovered ? ` (Here: ${problem}.)` : ""}`;
  if (spell.effect.kind === "damage") {
    const units = spellVictims(world, spellId, hovered).flat().filter((m) => m.hp > 0).length;
    return `Click to cast ${spell.name} here: ${units} unit${units === 1 ? "" : "s"} lose up to ${spell.effect.amount} HP.`;
  }
  return `Click to cast ${spell.name} here.`;
}

/** News for the player: its own, and what others do where it can see. */
export function newsText(events: readonly WorldEvent[], world: World, player: PlayerId): string {
  const sight = sightOf(world, player);
  const inSight = (hex: Hex | undefined) => hex !== undefined && sight.has(hexKey(hex));
  const lairSeen = (id: string) => inSight(world.lairs.find((l) => l.id === id)?.hex);
  const lines: string[] = [];
  for (const e of events) {
    if (e.type === "captured" && (e.player === player || inSight(world.cities.find((c) => c.id === e.cityId)?.hex)))
      lines.push(`${e.player === player ? "You take" : "The enemy takes"} the city.`);
    if (e.type === "xp" && e.player === player) lines.push(`Your survivors gain ${e.each} XP each.`);
    if (e.type === "evolved" && e.player === player) lines.push(`${unitName(e.from)} becomes ${unitName(e.to)}.`);
    if (e.type === "leveled" && e.player === player) lines.push(`${unitName(e.defId)} reaches level ${e.level}.`);
    if (e.type === "cleared" && (e.player === player || lairSeen(e.lairId))) lines.push(e.player === player ? "The bandit camp is cleared." : "The enemy cleared a bandit camp.");
    if (e.type === "leaderFell" && e.player === player) lines.push("One of your warbands fell.");
    if (e.type === "spellCast" && (e.player === player || inSight(e.at))) lines.push(`${e.player === player ? "You cast" : "The enemy casts"} ${spellById(e.spell).name}.`);
    if (e.type === "looted" && e.player === player) lines.push(`The dungeon yields ${e.gold} gold${e.joins ? ` and a ${unitName(e.joins)} joins you` : ""}.`);
  }
  return lines.join(" ");
}
