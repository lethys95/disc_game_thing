import type { Battle, BattleEvent, Side } from "#rules/battle/types";
import type { PlayerId, WorldEvent } from "#rules/world/state";
import { deathChain, HEAL_CHAIN, hitChain, spellChain, useChain } from "#view/sound-slots";
import type { FixedSound } from "#view/sound-slots";

/**
 * Which sounds a step of play makes, and when (ms after it starts). Each sound is a chain of slots
 * (`view/sound-slots.ts`): an ability's own sound first, its family's after. No ability is named here.
 */
export interface Cue {
  readonly chain: readonly string[];
  readonly delay: number;
  /** Plays for exactly this long (looping if the sound is shorter): a march lasts as long as the walk. */
  readonly duration?: number;
}

const fixed = (key: FixedSound, delay = 0, duration?: number): Cue => (duration === undefined ? { chain: [key], delay } : { chain: [key], delay, duration });

/**
 * A battle step: the ability's use first, then what it did. `battle` is the state after the step (a dead unit's
 * type for its cry). `playerSide`: whose victory the stinger celebrates.
 */
export function battleCues(events: readonly BattleEvent[], battle: Battle, playerSide: Side | null): Cue[] {
  const cues: Cue[] = [];
  let ability: string | null = null;
  for (const e of events) {
    switch (e.type) {
      case "ability":
        ability = e.abilityId;
        cues.push({ chain: useChain(e.abilityId), delay: 0 });
        break;
      case "damage":
        if (e.source !== null) cues.push({ chain: hitChain(ability), delay: 220 });
        break;
      case "heal":
        cues.push({ chain: ability ? hitChain(ability) : HEAL_CHAIN, delay: 150 });
        break;
      case "shieldHit":
        cues.push(fixed("battle/shield", 200));
        break;
      case "death":
        cues.push({ chain: deathChain(battle.units[e.unitId]?.defId ?? ""), delay: 380 });
        break;
      case "fled":
        cues.push(fixed("battle/fled"));
        break;
      case "battleEnd":
        if (e.outcome.winner !== null && playerSide !== null) cues.push(fixed(e.outcome.winner === playerSide ? "stinger/victory" : "stinger/defeat", 500));
        break;
      default:
        break;
    }
  }
  return cues;
}

/**
 * A map step, for the player at this screen: its own marches (as long as the walk, `stepMs` a hex), fights,
 * captures and purchases.
 */
export function worldCues(events: readonly WorldEvent[], player: PlayerId, mover: PlayerId, stepMs: number): Cue[] {
  const cues: Cue[] = [];
  for (const e of events) {
    switch (e.type) {
      case "moved":
        if (mover === player) cues.push(fixed("map/march", 0, e.path.length * stepMs));
        break;
      case "engaged":
        if (mover === player) cues.push(fixed("map/battle"));
        break;
      case "captured":
        if (e.player === player) cues.push(fixed("map/capture"));
        break;
      case "recruited":
      case "resurrected":
      case "upgraded":
      case "researched":
      case "spellLearned":
      case "cityUpgraded":
      case "nodeInvested":
        if (mover === player) cues.push(fixed("ui/coins"));
        break;
      case "spellCast":
        if (e.player === player) cues.push({ chain: spellChain(e.spell), delay: 0 });
        break;
      default:
        break;
    }
  }
  return cues;
}
