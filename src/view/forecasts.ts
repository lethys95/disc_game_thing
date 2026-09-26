import type { MoveTarget } from "#rules/world/movement";
import type { Leader, World } from "#rules/world/state";
import type { AiClient } from "#view/ai-client";

/**
 * The deterministic forecast of a fight, played by the AI on both sides, for the hint line. Computed in the worker:
 * the text says "thinking" until it arrives, then `onReady` asks for a re-render. Only the latest question counts.
 */
export class Forecasts {
  private latest: { readonly key: string; text: string } | null = null;

  constructor(
    private readonly ai: AiClient,
    private readonly onReady: () => void,
  ) {}

  /** Forget the current forecast: the world changed. */
  clear(): void {
    this.latest = null;
  }

  /** `known` is the world as the mover knows it: a forecast never uses what the fog hides. */
  text(known: World, leader: Leader, target: MoveTarget): string {
    const key = `${known.turn}:${leader.id}:${leader.hex.q},${leader.hex.r}:${JSON.stringify(target)}`;
    if (this.latest?.key === key) return this.latest.text;
    const asked = { key, text: "AI forecast: thinking…" };
    this.latest = asked;
    void this.ai.forecast(known, leader.id, target).then((result) => {
      if (this.latest !== asked) return;
      // The mover is side 0 of the forecast battle.
      asked.text = result.winner === 0 ? `AI forecast: victory, ${result.standing[0]} of yours standing.` : `AI forecast: defeat, ${result.standing[1]} of theirs standing.`;
      this.onReady();
    });
    return asked.text;
  }
}
