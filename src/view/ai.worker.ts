import { autoplay, chooseAction } from "#rules/ai";
import { chooseWorldAction } from "#rules/world/ai";
import { forecast } from "#rules/world/battles";
import type { AiRequest, AiResponse } from "#view/ai-protocol";

/** Runs the AI and battle forecasts off the main thread, so thinking never freezes the UI. */
addEventListener("message", (event: MessageEvent<AiRequest>) => {
  const request = event.data;
  let response: AiResponse;
  switch (request.kind) {
    case "battle":
      response = { id: request.id, kind: "battle", action: chooseAction(request.battle) };
      break;
    case "world":
      response = { id: request.id, kind: "world", action: chooseWorldAction(request.world) };
      break;
    case "resolve":
      response = { id: request.id, kind: "resolve", battle: autoplay(request.battle) };
      break;
    case "forecast": {
      const result = forecast(request.world, request.leaderId, request.target);
      const standing = (side: 0 | 1) => Object.values(result?.units ?? {}).filter((u) => u.alive && u.side === side).length;
      response = { id: request.id, kind: "forecast", winner: result?.outcome?.winner ?? null, standing: [standing(0), standing(1)] };
      break;
    }
  }
  postMessage(response, {});
});
