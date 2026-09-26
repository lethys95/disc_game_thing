import { autoplay } from "#rules/ai";
import { hexDistance } from "#rules/hex";
import { applyWorldAction } from "#rules/world/actions";
import { chooseWorldAction } from "#rules/world/ai";
import { concludeBattle } from "#rules/world/battles";
import { createWorld } from "#rules/world/create";
import { planMove } from "#rules/world/movement";
import { capitolOf } from "#rules/world/state";
import type { World } from "#rules/world/state";
import { PRESETS } from "#view/squads";

let world: World = createWorld(2, [PRESETS.uncommitted, PRESETS.uncommitted], [{}, {}], ["jilliath", "jilliath"]);
for (let i = 0; world.turn <= 60 && !world.outcome && i < 20000; i++) {
  const battle = world.engagement?.battle;
  if (battle) { world = concludeBattle(world, autoplay(battle)).world; continue; }
  if (world.activeSide === 1 && world.turn === 60) break;
  world = applyWorldAction(world, chooseWorldAction(world)).world;
}
const cap = capitolOf(world, 0);
if (!cap) throw new Error("no capitol");
console.log(`turn ${world.turn} active ${world.activeSide}; capitol0 garrison ${cap.garrison.map((m) => m.defId).join(",")}; leaders at capitol: ${world.leaders.filter((l) => l.hex.q === cap.hex.q && l.hex.r === cap.hex.r).map((l) => l.id)}`);
for (const l of world.leaders.filter((x) => x.side === 1)) {
  const plan = planMove(world, l.id, cap.hex);
  console.log(`${l.id} dist ${hexDistance(l.hex, cap.hex)} move ${l.movement} squad ${l.squad.length} fell ${l.fellOnTurn} plan ${plan ? `steps ${plan.steps}/${plan.path.hexes.length} target ${JSON.stringify(plan.target)}` : "none"}`);
}
console.log("AI chooses:", JSON.stringify(chooseWorldAction(world)));
