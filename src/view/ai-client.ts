import type { Action, Battle } from "#rules/battle/types";
import type { MoveTarget } from "#rules/world/movement";
import type { World, WorldAction } from "#rules/world/state";
import type { AiRequest, AiResponse, ForecastSummary } from "#view/ai-protocol";

/** The view's handle on the AI worker: every question is a promise. */
export class AiClient {
  private readonly worker = new Worker(new URL("./ai.worker.ts", import.meta.url), { type: "module" });
  private readonly pending = new Map<number, (response: AiResponse) => void>();
  private next = 0;

  constructor() {
    this.worker.addEventListener("message", (event: MessageEvent<AiResponse>) => {
      const resolve = this.pending.get(event.data.id);
      this.pending.delete(event.data.id);
      resolve?.(event.data);
    });
  }

  private ask(build: (id: number) => AiRequest): Promise<AiResponse> {
    const id = this.next++;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.worker.postMessage(build(id));
    });
  }

  async chooseAction(battle: Battle): Promise<Action | null> {
    const response = await this.ask((id) => ({ id, kind: "battle", battle }));
    return response.kind === "battle" ? response.action : null;
  }

  async chooseWorldAction(world: World): Promise<WorldAction> {
    const response = await this.ask((id) => ({ id, kind: "world", world }));
    return response.kind === "world" ? response.action : { type: "endTurn" };
  }

  async forecast(world: World, leaderId: string, target: MoveTarget): Promise<ForecastSummary> {
    const response = await this.ask((id) => ({ id, kind: "forecast", world, leaderId, target }));
    return response.kind === "forecast" ? { winner: response.winner, standing: response.standing } : { winner: null, standing: [0, 0] };
  }
}
