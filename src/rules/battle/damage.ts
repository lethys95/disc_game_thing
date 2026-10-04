import { allTraits, traitsOn } from "#rules/battle/traits";
import type { Ctx, HitSpec, Packet } from "#rules/battle/types";

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
    const packet: Packet = { source: sourceId, target: targetId, amount: spec.power, type: spec.type, tags: spec.tags, bleed: 0 };
    for (const t of own) t.hooks.outgoing?.(ctx, t.self, packet);
    for (const t of own) t.hooks.convert?.(ctx, t.self, packet);
    const taken = receive(ctx, packet);
    if (packet.bleed > 0) ctx.addEffect(targetId, { def: "bleeding", source: sourceId, amount: packet.bleed });
    tally.dealt += taken;
    if (!ctx.unit(targetId).alive) tally.kills += 1;
    for (const t of own) t.hooks.afterHit?.(ctx, t.self, targetId, taken);
  }
}

/** The target's side of the pipeline. Returns what the hit took: pools soaked plus HP removed. */
function receive(ctx: Ctx, packet: Packet): number {
  const target = ctx.unit(packet.target);
  const theirs = traitsOn(ctx, target.id);
  for (const t of theirs) t.hooks.incoming?.(ctx, t.self, packet);
  // Immunity is the only true zero; armor otherwise floors a hit at 1 (docs/design/pillars.md).
  if (packet.amount <= 0) return 0;
  packet.amount = Math.max(1, packet.amount - ctx.stats(target.id).armor);

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

/** Direct HP loss (also the pipeline's last stage). Returns the HP actually removed: overkill isn't damage dealt. */
export function lose(ctx: Ctx, targetId: string, amount: number, sourceId: string | null): number {
  const target = ctx.unit(targetId);
  if (!target.alive || amount <= 0) return 0;
  const removed = Math.min(amount, target.hp);
  target.hp -= amount;
  ctx.emit({ type: "damage", unitId: targetId, amount: removed, source: sourceId });
  if (target.hp > 0) return removed;
  if (traitsOn(ctx, targetId).some((t) => t.hooks.preventDeath?.(ctx, t.self))) {
    target.hp = 1;
    ctx.emit({ type: "deathPrevented", unitId: targetId });
    return removed;
  }
  target.hp = 0;
  target.alive = false;
  ctx.emit({ type: "death", unitId: targetId });
  for (const t of [...allTraits(ctx)]) t.hooks.remains?.(ctx, t.self, targetId, "died");
  return removed;
}
