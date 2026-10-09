/**
 * The battle `?fight&steps=N` shows, for the Unreal arena (`unreal/`): the same squads, seed and AI steps, written as
 * JSON with everything the arena draws. Seven steps by default: the player is to act then, so the three.js page
 * holds still for its screenshot (after six, the AI moves 450 ms in). Units without a portrait stand as the three.js placeholder statues, exported
 * from the same code as glb files for the Unreal import (`unreal/Scripts/editor/import_assets.py`).
 *
 * Usage: pnpm exec tsx scripts/unreal/export-battle.ts [out dir, default unreal/Import] [steps, default 7]
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { chooseAction, chooseTarotCards } from "#rules/ai";
import { applyAction, createBattle, effectiveStats, legalActions, NO_CONTEXT } from "#rules/battle/engine";
import type { Battle, BattleUnit, Side } from "#rules/battle/types";
import { EFFECTS } from "#rules/effects";
import { PRESETS } from "#rules/units/presets";
import type { PlayerColor } from "#rules/world/colors";
import { fallbackKeys } from "#view/art-slots";
import { COLOR_HEX, colorPair, threeColor } from "#view/colors";
import { buildFigure } from "#view/figures";

/** GLTFExporter reads its blobs through the browser's FileReader, which Node lacks; only its binary path is used. */
class BlobReader {
  result: ArrayBuffer | null = null;
  onloadend: (() => void) | null = null;
  readAsArrayBuffer(blob: Blob): void {
    void blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
}
Object.assign(globalThis, { FileReader: BlobReader });

const outDir = process.argv[2] ?? "unreal/Import";
const steps = Number(process.argv[3] ?? 7);

/** `?fight` with no other parameters (`src/main.ts`): Faith against Fanaticism, the player on side 0, open plains. */
const squads = [PRESETS.preserve, PRESETS.punishment] as const;
const playerSide: Side = 0;
const colors: readonly [PlayerColor, PlayerColor] = colorPair(["jilliath", "jilliath"]);
const setting = { terrain: "plain", biome: "temperate", backdrop: [] as string[] };

/** The opening and the fast-forward of `App.run`: the AI picks every tarot hand, then plays `steps` actions. */
function play(): Battle {
  let battle = chooseTarotCards(createBattle(squads, { ...NO_CONTEXT, seed: 0 }).battle, undefined);
  for (let i = 0; i < steps && !battle.outcome; i++) {
    const action = chooseAction(battle);
    if (!action) break;
    battle = applyAction(battle, action).battle;
  }
  return battle;
}

/** The art file a unit's card shows, as an `assets/art` key, or "" when it has none and stands as a statue. */
function portraitOf(unit: BattleUnit): string {
  return fallbackKeys({ kind: "portrait", id: unit.defId }).find((key) => existsSync(`assets/art/${key}.webp`)) ?? "";
}

function exportGlb(object: THREE.Object3D): Promise<ArrayBuffer> {
  return new GLTFExporter().parseAsync(object, { binary: true }).then((result) => {
    if (!(result instanceof ArrayBuffer)) throw new Error("GLTFExporter returned JSON for a binary export");
    return result;
  });
}

const battle = play();
const units = Object.values(battle.units);
const current = battle.current ? battle.units[battle.current.unitId] : undefined;
// `App.selectDefault`: on the player's turn the unit's first plain attack is selected, and its targets light up.
const attack = current?.side === playerSide ? legalActions(battle).find((o) => o.tags.includes("attack") && o.enhancement.kind === "none") : undefined;

await mkdir(join(outDir, "statues"), { recursive: true });
/** Import entries, in the shape of `prepare-assets.ts`'s manifest. */
const statues: { source: string; folder: string; name: string; kind: "model" }[] = [];
const exported = [];
for (const unit of units) {
  const portrait = portraitOf(unit);
  // Statues: light for the side on the left (the player's), dark for the other (`BattleScene.addFigure`).
  const palette: Side = unit.side === playerSide ? 0 : 1;
  const owner = colors[unit.side];
  const statue = portrait === "" ? `${unit.defId}_${palette}_${owner}` : "";
  if (statue !== "" && !statues.some((s) => s.name === `SM_${statue}`)) {
    const source = join(outDir, "statues", `${statue}.glb`);
    await writeFile(source, Buffer.from(await exportGlb(buildFigure(unit.defId, palette, threeColor(owner)))));
    statues.push({ source: resolve(source), folder: "/Game/Statues", name: `SM_${statue}`, kind: "model" });
  }
  exported.push({
    id: unit.id,
    defId: unit.defId,
    name: unit.name,
    side: unit.side,
    row: unit.tile.row,
    col: unit.tile.col,
    hp: unit.hp,
    maxHp: effectiveStats(battle, unit.id).maxHp,
    shield: unit.shield,
    maxShield: unit.base.shield,
    alive: unit.alive,
    // Off the field: fled, or away for now (Spiritwalk).
    absent: unit.fled || unit.effects.some((e) => EFFECTS.get(e.def)?.absent === true),
    leader: unit.leader,
    portrait,
    statue,
  });
}

const view = {
  setting,
  left: playerSide,
  colors: colors.map((c) => COLOR_HEX[c]),
  currentUnitId: current?.id ?? "",
  candidates: (attack?.choices ?? []).map((c) => ({ side: c.anchor.side, row: c.anchor.tile.row, col: c.anchor.tile.col })),
  units: exported,
};
await writeFile(join(outDir, "battle.json"), JSON.stringify(view, null, 2));
await writeFile(join(outDir, "statues.json"), JSON.stringify(statues, null, 2));
console.log(`${join(outDir, "battle.json")}: ${units.length} units after ${steps} steps, ${statues.length} statues; current ${current?.id ?? "none"} (side ${current?.side ?? "-"})`);
