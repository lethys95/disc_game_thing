import { autoplay } from "#rules/ai";
import { createBattle } from "#rules/battle/engine";
import type { Placement } from "#rules/battle/engine";
import type { Col, Row } from "#rules/battle/types";
import { EVOLUTIONS, FACTION_ROOTS, LINE_ARCHETYPE, UNITS } from "#rules/units/index";
import type { Playable } from "#rules/units/index";

/**
 * Tier-matched compositions (`pnpm sim:comps [tier…]`). The user (2026-09-30): not every unit has to be equal; what
 * matters is composition. At each tier, every squad a faction can field fights every other faction's squads, from
 * both sides. A squad: one branch per line (a fork is chosen for every unit of that kind), each line's unit at the
 * tier or at its line's end if the line stops sooner; three melee in front, and behind them a support and a mage,
 * two supports, two mages, or two more melee.
 */

const at = (defId: string, row: Row, col: Col): Placement => ({ defId, tile: { row, col } });

/** Every unit a line can have reached by `tier`, one per branch path: the path's unit at that tier or its last. */
function reached(root: string, tier: number): string[] {
  const next = EVOLUTIONS[root] ?? [];
  if ((UNITS[root]?.tier ?? 1) >= tier || next.length === 0) return [root];
  return [...new Set(next.flatMap((e) => reached(e.to, tier)))];
}

interface Squad {
  readonly faction: Playable;
  readonly name: string;
  readonly placements: readonly Placement[];
}

const short = (id: string) => UNITS[id]?.name ?? id;

function squads(faction: Playable, tier: number): Squad[] {
  const roots = FACTION_ROOTS[faction];
  const line = (archetype: string) => roots.filter((r) => LINE_ARCHETYPE[r] === archetype).flatMap((r) => reached(r, tier));
  const out: Squad[] = [];
  for (const melee of line("melee")) {
    const front = [at(melee, 0, 0), at(melee, 0, 1), at(melee, 0, 2)];
    out.push({ faction, name: `5 ${short(melee)}`, placements: [...front, at(melee, 1, 0), at(melee, 1, 2)] });
    for (const support of line("support")) {
      for (const mage of line("mage")) out.push({ faction, name: `3 ${short(melee)} + ${short(support)} + ${short(mage)}`, placements: [...front, at(support, 2, 0), at(mage, 2, 2)] });
      out.push({ faction, name: `3 ${short(melee)} + 2 ${short(support)}`, placements: [...front, at(support, 2, 0), at(support, 2, 2)] });
    }
    for (const mage of line("mage")) out.push({ faction, name: `3 ${short(melee)} + 2 ${short(mage)}`, placements: [...front, at(mage, 2, 0), at(mage, 2, 2)] });
  }
  return out;
}

interface Record_ {
  wins: number;
  games: number;
  held: number;
  byFaction: Map<Playable, { wins: number; games: number }>;
}

const FACTIONS: readonly Playable[] = ["jilliath", "nexus", "grove"];
const TAG: Readonly<Record<Playable, string>> = { jilliath: "J", nexus: "N", grove: "G" };
const pct = (w: number, g: number) => (g === 0 ? "  -" : `${Math.round((100 * w) / g)}%`.padStart(4));

const tiers = process.argv.slice(2).map(Number).filter((n) => n >= 1);
for (const tier of tiers.length > 0 ? tiers : [1, 2, 3, 4]) {
  const field = FACTIONS.flatMap((f) => squads(f, tier));
  const records = new Map<Squad, Record_>(field.map((s) => [s, { wins: 0, games: 0, held: 0, byFaction: new Map() }]));
  const tally = (squad: Squad, foe: Playable, won: boolean, held: boolean) => {
    const r = records.get(squad);
    if (!r) return;
    r.games++;
    if (won) r.wins++;
    if (held) r.held++;
    const f = r.byFaction.get(foe) ?? { wins: 0, games: 0 };
    f.games++;
    if (won) f.wins++;
    r.byFaction.set(foe, f);
  };
  let battles = 0;
  for (let i = 0; i < field.length; i++) {
    for (let j = i + 1; j < field.length; j++) {
      const a = field[i];
      const b = field[j];
      if (!a || !b || a.faction === b.faction) continue;
      for (const [attacker, defender] of [[a, b], [b, a]] as const) {
        const outcome = autoplay(createBattle([[...attacker.placements], [...defender.placements]]).battle).outcome;
        battles++;
        const held = outcome?.winner === 1 && outcome.withdrew === true;
        tally(attacker, defender.faction, outcome?.winner === 0, false);
        tally(defender, attacker.faction, outcome?.winner === 1, held);
      }
    }
  }
  const lines = [`Tier ${tier}: ${field.length} squads, ${battles} battles (win % against the other factions' squads, both sides; "held" = won as defender by outlasting the round limit)`];
  for (const faction of FACTIONS) {
    const own = field.filter((s) => s.faction === faction).sort((x, y) => (records.get(y)?.wins ?? 0) - (records.get(x)?.wins ?? 0));
    const total = own.reduce((acc, s) => ({ wins: acc.wins + (records.get(s)?.wins ?? 0), games: acc.games + (records.get(s)?.games ?? 0) }), { wins: 0, games: 0 });
    lines.push(`  ${faction} (all squads ${pct(total.wins, total.games).trim()})`);
    for (const s of own) {
      const r = records.get(s);
      if (!r) continue;
      const against = FACTIONS.filter((f) => f !== faction).map((f) => `vs ${TAG[f]} ${pct(r.byFaction.get(f)?.wins ?? 0, r.byFaction.get(f)?.games ?? 0)}`).join("  ");
      lines.push(`    ${pct(r.wins, r.games)}  ${against}${r.held > 0 ? `  held ${r.held}` : ""}  ${s.name}`);
    }
  }
  console.log(lines.join("\n"));
}
