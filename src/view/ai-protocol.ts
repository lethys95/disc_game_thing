import type { Action, Battle, Side } from "#rules/battle/types";
import type { MoveTarget } from "#rules/world/movement";
import type { World, WorldAction } from "#rules/world/state";

/** Messages between the view and the AI worker. Battles and worlds are plain data, so they cross as they are. */
export type AiRequest =
  | { readonly id: number; readonly kind: "battle"; readonly battle: Battle }
  | { readonly id: number; readonly kind: "world"; readonly world: World }
  | { readonly id: number; readonly kind: "forecast"; readonly world: World; readonly leaderId: string; readonly target: MoveTarget }
  | { readonly id: number; readonly kind: "resolve"; readonly battle: Battle };

export type AiResponse =
  | { readonly id: number; readonly kind: "battle"; readonly action: Action | null }
  | { readonly id: number; readonly kind: "world"; readonly action: WorldAction }
  | { readonly id: number; readonly kind: "forecast"; readonly winner: Side | null; readonly standing: readonly [number, number] }
  | { readonly id: number; readonly kind: "resolve"; readonly battle: Battle };

export interface ForecastSummary {
  readonly winner: Side | null;
  readonly standing: readonly [number, number];
}
