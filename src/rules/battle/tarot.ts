import type { BattleEvent, Ctx, Side } from "#rules/battle/types";

/**
 * Tarot (the user, 2026-10-05: `design/combat.md`): a unit with "Tarot x" draws x cards as the fight begins and its
 * side picks one in secret. Each card is a task; done, it pays the whole side. Cards are "mostly randomly generated":
 * a task and a reward drawn from the battle's seed, so the same battle deals the same hand (the No RNG pillar). The
 * tasks, rewards, names and numbers are Claude's, provisional (`provisional.md` #66).
 */

export type TarotTask =
  | { readonly kind: "killBefore"; readonly round: number }
  | { readonly kind: "bigHit"; readonly damage: number }
  | { readonly kind: "noLossBefore"; readonly round: number }
  | { readonly kind: "slay"; readonly target: string }
  | { readonly kind: "heal"; readonly amount: number }
  | { readonly kind: "doubleKill" };

export type TarotReward =
  | { readonly kind: "might"; readonly percent: number }
  | { readonly kind: "mend"; readonly percent: number }
  | { readonly kind: "expose"; readonly armor: number }
  | { readonly kind: "smite"; readonly damage: number };

export interface TarotCard {
  readonly task: TarotTask;
  readonly reward: TarotReward;
}

export interface TarotHand {
  readonly side: Side;
  /** The unit whose keyword drew the hand. The card pays its whole side, whatever becomes of it. */
  readonly unitId: string;
  readonly cards: readonly TarotCard[];
  chosen: number | null;
  state: "open" | "fulfilled" | "failed";
  /** Healing done so far (Temperance), or kills this round (Wheel of Fortune). */
  progress: number;
}

/** A small seeded generator (mulberry32): the same seed always draws the same cards. */
function generator(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mixes a string into a seed (FNV-1a). */
export function seedOf(seed: number, text: string): number {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h;
}

const TASKS = ["killBefore", "bigHit", "noLossBefore", "slay", "heal", "doubleKill"] as const;
const REWARDS = ["might", "mend", "expose", "smite"] as const;

/** `count` cards for the hand of `unitId`, each with a different task while there are tasks left. */
export function dealHand(ctx: Ctx, unitId: string, count: number, seed: number): TarotCard[] {
  const random = generator(seedOf(seed, unitId));
  const pick = <T>(first: T, ...rest: T[]): T => [first, ...rest][Math.floor(random() * (rest.length + 1))] ?? first;
  const side = ctx.unit(unitId).side;
  const allies = ctx.living(side);
  const enemies = ctx.living(side === 0 ? 1 : 0);
  const left = [...TASKS];
  const cards: TarotCard[] = [];
  for (let i = 0; i < count; i++) {
    const kind = left.length > 0 ? left.splice(Math.floor(random() * left.length), 1)[0] ?? "doubleKill" : pick(...TASKS);
    const strongestHit = Math.max(1, ...allies.map((u) => ctx.strongestHit(u.id)));
    const toughest = [...enemies].sort((a, b) => ctx.stats(b.id).maxHp - ctx.stats(a.id).maxHp || (a.id < b.id ? -1 : 1))[0];
    const task: TarotTask =
      kind === "killBefore" ? { kind, round: pick(2, 3) }
      : kind === "bigHit" ? { kind, damage: Math.round((strongestHit * pick(1.2, 1.5)) / 5) * 5 }
      : kind === "noLossBefore" ? { kind, round: pick(3, 4) }
      : kind === "slay" && toughest ? { kind, target: toughest.id }
      : kind === "heal" ? { kind, amount: Math.round((allies.reduce((sum, u) => sum + ctx.stats(u.id).maxHp, 0) * 0.15) / 5) * 5 }
      : { kind: "doubleKill" };
    const rewardKind = pick(...REWARDS);
    const reward: TarotReward =
      rewardKind === "might" ? { kind: rewardKind, percent: pick(15, 25) }
      : rewardKind === "mend" ? { kind: rewardKind, percent: pick(20, 30) }
      : rewardKind === "expose" ? { kind: rewardKind, armor: pick(5, 10) }
      : { kind: rewardKind, damage: pick(15, 25) };
    cards.push({ task, reward });
  }
  return cards;
}

/** The arcana a task is named for. */
export const TASK_NAMES: Readonly<Record<TarotTask["kind"], string>> = {
  killBefore: "Death",
  bigHit: "The Tower",
  noLossBefore: "Strength",
  slay: "Judgement",
  heal: "Temperance",
  doubleKill: "Wheel of Fortune",
};

/** The card art each task is shown with (`assets/tarot/<slug>.webp`, the user's 2026-10-05 deck art). */
export const TASK_ARCANA: Readonly<Record<TarotTask["kind"], string>> = {
  killBefore: "death",
  bigHit: "tower",
  noLossBefore: "strength",
  slay: "judgement",
  heal: "temperance",
  doubleKill: "wheel-of-fortune",
};

export function describeTask(task: TarotTask, name: (id: string) => string): string {
  switch (task.kind) {
    case "killBefore":
      return `Kill an enemy before round ${task.round} ends.`;
    case "bigHit":
      return `Land a single hit of ${task.damage} or more.`;
    case "noLossBefore":
      return `Lose no one before round ${task.round} ends.`;
    case "slay":
      return `Kill ${name(task.target)}.`;
    case "heal":
      return `Heal your side for ${task.amount} in all.`;
    case "doubleKill":
      return "Kill two enemies in the same round.";
  }
}

export function describeReward(reward: TarotReward): string {
  switch (reward.kind) {
    case "might":
      return `your side deals ${reward.percent}% more damage for the rest of the fight`;
    case "mend":
      return `your side heals ${reward.percent}% of its max HP`;
    case "expose":
      return `the enemy loses ${reward.armor} armor for the rest of the fight`;
    case "smite":
      return `every enemy takes ${reward.damage}`;
  }
}

/** What a card is worth to the AI: how likely the task, times how much the reward is. Rough, provisional. */
export function cardValue(card: TarotCard): number {
  const odds: Readonly<Record<TarotTask["kind"], number>> = { killBefore: 0.7, bigHit: 0.5, noLossBefore: 0.6, slay: 0.5, heal: 0.4, doubleKill: 0.4 };
  const worth = card.reward.kind === "might" ? card.reward.percent * 2 : card.reward.kind === "mend" ? card.reward.percent * 1.5 : card.reward.kind === "expose" ? card.reward.armor * 4 : card.reward.damage * 2;
  const round = card.task.kind === "killBefore" ? card.task.round : 3;
  return odds[card.task.kind] * worth * (card.task.kind === "killBefore" ? round / 3 : 1);
}

/**
 * Checks every chosen, open card against what just happened; pays the ones done, fails the ones lost. `actor`: the unit
 * whose action it was (null between actions): its traits say how many times a card it fulfils pays (Omen: twice).
 */
export function checkTarot(ctx: Ctx, hands: readonly TarotHand[], events: readonly BattleEvent[], actor: string | null): void {
  hands.forEach((hand, index) => {
    const card = hand.chosen === null ? undefined : hand.cards[hand.chosen];
    if (!card || hand.state !== "open") return;
    const enemy: Side = hand.side === 0 ? 1 : 0;
    const sideOf = (id: string) => ctx.unit(id).side;
    let done = false;
    let lost = false;
    for (const event of events) {
      if (event.type === "roundStart") {
        if (card.task.kind === "doubleKill") hand.progress = 0;
        if (card.task.kind === "killBefore" && event.round > card.task.round) lost = true;
        if (card.task.kind === "noLossBefore" && event.round > card.task.round) done = true;
      }
      if (event.type === "death") {
        const theirs = sideOf(event.unitId) === enemy;
        if (card.task.kind === "killBefore" && theirs && ctx.battle.round <= card.task.round) done = true;
        if (card.task.kind === "noLossBefore" && !theirs) lost = true;
        if (card.task.kind === "slay" && event.unitId === card.task.target) done = true;
        if (card.task.kind === "doubleKill" && theirs) {
          hand.progress += 1;
          if (hand.progress >= 2) done = true;
        }
      }
      if (event.type === "damage" && card.task.kind === "bigHit" && event.source !== null && sideOf(event.source) === hand.side && sideOf(event.unitId) === enemy && event.amount >= card.task.damage) done = true;
      if (event.type === "heal" && card.task.kind === "heal" && sideOf(event.unitId) === hand.side) {
        hand.progress += event.amount;
        if (hand.progress >= card.task.amount) done = true;
      }
    }
    // A slay target that fled or vanished can't be killed any more.
    if (card.task.kind === "slay" && !done && !ctx.unit(card.task.target).alive) lost = true;
    if (lost && !done) {
      hand.state = "failed";
      ctx.emit({ type: "tarot", side: hand.side, hand: index, state: "failed" });
    } else if (done) {
      hand.state = "fulfilled";
      const payouts = actor === null || ctx.unit(actor).side !== hand.side ? 1 : Math.max(1, ...ctx.traits(actor).map((t) => t.hooks.tarotPayouts?.(ctx, t.self) ?? 1));
      ctx.emit({ type: "tarot", side: hand.side, hand: index, state: "fulfilled", payouts });
      for (let i = 0; i < payouts; i++) pay(ctx, hand.side, actor ?? hand.unitId, card.reward);
    }
  });
}

/**
 * A fresh hand mid-fight (Omen: kills during his action draw more): dealt from the battle's seed and the number of hands
 * so far, so it's as fixed as the first.
 */
export function drawHand(ctx: Ctx, hands: TarotHand[], unitId: string, count: number, seed: number): void {
  const side = ctx.unit(unitId).side;
  hands.push({ side, unitId, cards: dealHand(ctx, unitId, count, seedOf(seed, `hand ${hands.length}`)), chosen: null, state: "open", progress: 0 });
  ctx.emit({ type: "tarotDrawn", side, hand: hands.length - 1 });
}

function pay(ctx: Ctx, side: Side, source: string, reward: TarotReward): void {
  const enemy: Side = side === 0 ? 1 : 0;
  switch (reward.kind) {
    case "might":
      for (const u of ctx.living(side)) ctx.addEffect(u.id, { def: "tarot_might", amount: reward.percent, source });
      return;
    case "mend":
      for (const u of ctx.living(side)) ctx.heal(u.id, Math.round((ctx.stats(u.id).maxHp * reward.percent) / 100));
      return;
    case "expose":
      for (const u of ctx.living(enemy)) ctx.addEffect(u.id, { def: "tarot_exposed", amount: reward.armor, source });
      return;
    case "smite":
      for (const u of ctx.living(enemy)) ctx.lose(u.id, reward.damage, source);
      return;
  }
}
