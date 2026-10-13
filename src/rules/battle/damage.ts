import { ARMOR_HALF } from "#rules/balance";
import { allTraits, traitsOn } from "#rules/battle/traits";
import type { Ctx, HitSpec, Packet } from "#rules/battle/types";

/** The share of a hit that armor takes off, in percent (rounded, for the view). */
export function armorReduction(armor: number): number {
  return Math.round((100 * Math.max(0, armor)) / (Math.max(0, armor) + ARMOR_HALF));
}

/**
 * The damage pipeline (docs/design/architecture.md §3). Every hit goes through the same ordered stages, and
 * mechanics join in through their hooks:
 * power → outgoing → conversion → incoming → armor → pools → mitigation → HP → reactions.
 */
export function hit(ctx: Ctx, sourceId: string, targetIds: readonly string[], spec: HitSpec): void {
  const tally = ctx.tally.get(sourceId) ?? { dealt: 0, kills: 0 };
  ctx.tally.set(sourceId, tally);
  for (const targetId of targetIds) {
    if (!ctx.unit(targetId).alive) continue;
    // Read again for each target: a one-shot mark that fired on the first target is gone for the next.
    const own = traitsOn(ctx, sourceId);
    const strikes = own.reduce<{ count: number; percent: number } | null>((found, t) => found ?? t.hooks.strikes?.(ctx, t.self, spec) ?? null, null);
    const power = strikes ? Math.max(1, Math.round((spec.power * strikes.percent) / 100)) : spec.power;
    for (let strike = 0; strike < (strikes?.count ?? 1) && ctx.unit(targetId).alive; strike++) {
      const packet: Packet = { source: sourceId, target: targetId, amount: power, type: spec.type, tags: spec.tags, riders: [], pierce: 0, intercepted: false };
      for (const t of own) t.hooks.outgoing?.(ctx, t.self, packet);
      for (const t of own) t.hooks.convert?.(ctx, t.self, packet);
      const taken = receive(ctx, packet, tally);
      for (const rider of packet.riders) ctx.addEffect(targetId, rider);
      tally.dealt += taken;
      if (!ctx.unit(targetId).alive) tally.kills += 1;
      for (const t of own) t.hooks.afterHit?.(ctx, t.self, targetId, taken);
    }
  }
}

/**
 * The target's side of the pipeline. Returns what the hit took from the target: pools soaked plus HP removed. A share
 * an ally intercepts goes through that ally's own side of it and into the attacker's `tally`.
 */
function receive(ctx: Ctx, packet: Packet, tally: { dealt: number; kills: number }): number {
  const target = ctx.unit(packet.target);
  if (!packet.intercepted && packet.amount > 0) intercept(ctx, packet, tally);
  const theirs = traitsOn(ctx, target.id);
  for (const t of theirs) t.hooks.incoming?.(ctx, t.self, packet);
  // Immunity is the only true zero; armor otherwise floors a hit at 1 (docs/design/pillars.md).
  if (packet.amount <= 0) return 0;
  const armor = Math.max(0, ctx.stats(target.id).armor - packet.pierce);
  packet.amount = Math.max(1, Math.round((packet.amount * ARMOR_HALF) / (armor + ARMOR_HALF)));

  const beforePools = packet.amount;
  const absorbers = theirs.filter((t) => t.hooks.absorb).sort((a, b) => b.absorbPriority - a.absorbPriority);
  for (const t of absorbers) t.hooks.absorb?.(ctx, t.self, packet);
  const soaked = Math.min(target.shield, packet.amount);
  if (soaked > 0) {
    target.shield -= soaked;
    packet.amount -= soaked;
    ctx.emit({ type: "shieldHit", unitId: target.id, amount: soaked });
  }
  const pooled = beforePools - packet.amount;

  for (const t of theirs) t.hooks.mitigate?.(ctx, t.self, packet);
  return pooled + (packet.amount > 0 ? lose(ctx, target.id, packet.amount, packet.source) : 0);
}

function intercept(ctx: Ctx, packet: Packet, tally: { dealt: number; kills: number }): void {
  const side = ctx.unit(packet.target).side;
  for (const t of allTraits(ctx)) {
    const guard = ctx.unit(t.self.unitId);
    if (guard.id === packet.target || guard.side !== side || !guard.alive) continue;
    const share = Math.min(packet.amount, t.hooks.intercept?.(ctx, t.self, packet) ?? 0);
    if (share <= 0) continue;
    packet.amount -= share;
    const taken: Packet = { ...packet, target: guard.id, amount: share, riders: [], intercepted: true };
    tally.dealt += receive(ctx, taken, tally);
    if (!guard.alive) tally.kills += 1;
    return;
  }
}

/** Direct HP loss (also the pipeline's last stage). Returns the HP actually removed: overkill isn't damage dealt. */
export function lose(ctx: Ctx, targetId: string, amount: number, sourceId: string | null): number {
  const target = ctx.unit(targetId);
  if (!target.alive || amount <= 0) return 0;
  const removed = Math.min(amount, target.hp);
  target.hp -= amount;
  ctx.emit({ type: "damage", unitId: targetId, amount: removed, source: sourceId });
  if (target.hp > 0) {
    for (const t of [...traitsOn(ctx, targetId)]) t.hooks.hurt?.(ctx, t.self, removed);
    return removed;
  }
  if (traitsOn(ctx, targetId).some((t) => t.hooks.preventDeath?.(ctx, t.self))) {
    target.hp = 1;
    ctx.emit({ type: "deathPrevented", unitId: targetId });
    return removed;
  }
  target.hp = 0;
  target.alive = false;
  target.killedBy = sourceId;
  ctx.emit({ type: "death", unitId: targetId });
  // Its own traits hear of its death too (a Matriarch's heir), then everyone still standing.
  for (const t of [...traitsOn(ctx, targetId), ...allTraits(ctx)]) t.hooks.remains?.(ctx, t.self, targetId, "died");
  return removed;
}
