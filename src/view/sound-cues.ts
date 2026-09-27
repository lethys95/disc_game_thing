import { behavior } from "#rules/abilities/index";
import type { BattleEvent, Side } from "#rules/battle/types";
import type { PlayerId, WorldEvent } from "#rules/world/state";
import type { SoundKey } from "#view/sound";

/** Which sounds a step of play makes, and when (ms after it starts). By event and tag: no ability is named here. */
export interface Cue {
  readonly key: SoundKey;
  readonly delay: number;
}

/** A battle step: the swing or cast first, then what it did. `playerSide`: whose victory the stinger celebrates. */
export function battleCues(events: readonly BattleEvent[], playerSide: Side | null): Cue[] {
  const cues: Cue[] = [];
  let spell = false;
  for (const e of events) {
    switch (e.type) {
      case "ability": {
        const b = behavior(e.abilityId);
        const tags = b.kind === "active" ? b.tags : [];
        spell = tags.includes("spell");
        if (spell) cues.push({ key: "battle/cast", delay: 0 });
        else if (tags.includes("attack")) cues.push({ key: "battle/swing", delay: 0 });
        break;
      }
      case "damage":
        if (e.source !== null) cues.push({ key: spell ? "battle/spell-hit" : "battle/hit", delay: 220 });
        break;
      case "shieldHit":
        cues.push({ key: "battle/shield", delay: 200 });
        break;
      case "heal":
        cues.push({ key: "battle/heal", delay: 150 });
        break;
      case "death":
        cues.push({ key: "battle/death", delay: 380 });
        break;
      case "fled":
        cues.push({ key: "battle/fled", delay: 0 });
        break;
      case "battleEnd":
        if (e.outcome.winner !== null && playerSide !== null) cues.push({ key: e.outcome.winner === playerSide ? "stinger/victory" : "stinger/defeat", delay: 500 });
        break;
      default:
        break;
    }
  }
  return cues;
}

/** A map step, for the player at this screen: its own marches, fights, captures and purchases. */
export function worldCues(events: readonly WorldEvent[], player: PlayerId, mover: PlayerId): Cue[] {
  const cues: Cue[] = [];
  for (const e of events) {
    switch (e.type) {
      case "moved":
        if (mover === player) cues.push({ key: "map/march", delay: 0 });
        break;
      case "engaged":
        if (mover === player) cues.push({ key: "map/battle", delay: 0 });
        break;
      case "captured":
        if (e.player === player) cues.push({ key: "map/capture", delay: 0 });
        break;
      case "recruited":
      case "resurrected":
      case "upgraded":
      case "researched":
      case "spellLearned":
      case "cityUpgraded":
      case "nodeInvested":
        if (mover === player) cues.push({ key: "ui/coins", delay: 0 });
        break;
      case "spellCast":
        if (e.player === player) cues.push({ key: "battle/cast", delay: 0 });
        break;
      default:
        break;
    }
  }
  return cues;
}
