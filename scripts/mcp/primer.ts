import { ARMOR_HALF, BATTLE_ROUND_LIMIT, CITY_HEALING_PER_TIER, LEADER_XP_PER_POINT, MAX_LEADERSHIP, RESURRECTION_PREMIUM, STARTING_LEADERSHIP } from "#rules/balance";

/** What an outside player needs to know to play, sent as the MCP server's instructions. Numbers come from the rules. */
export const RULES_PRIMER = `You are playing disc, a turn-based fantasy strategy game (in the spirit of Disciples II), as player 0 against the game's own AI.

HOW TO PLAY THROUGH THESE TOOLS
- new_game starts a game; look shows everything you know; act takes a numbered option. Every reply ends with OPTIONS and a revision number: answer with act(option, revision). The numbers change after every act, so always use the latest listing.
- When you end your turn, the other players move; their visible moves and any attack on you are reported under WHAT HAPPENED.
- order gives a map order that is not listed (march to any hex, rearrange units between squads). describe explains any unit, ability, effect, item or spell.

HOW TO WIN
- Every player has a Capitol guarded by its Capitol Guardian. A player whose Guardian falls is out. The last player standing wins.

THE MAP
- Hex map with axial coordinates (q,r) and fog of war: you see around your warbands and cities, and remember places as last seen.
- Warbands march with movement points each turn (terrain costs differ; mountains and water are impassable). Marching onto an enemy warband, a guarded city or a lair starts a battle; onto an undefended city takes it.
- Gold comes each turn from your Capitol, the nodes (gold mines and others) of cities you hold, and some items. Holding more cities means more nodes and more gold.
- Recruit your faction's first-tier units in any city you hold, into its garrison or into a warband standing there. A warband holds as many units as its Leadership (${STARTING_LEADERSHIP} at first, up to ${MAX_LEADERSHIP}). A Capitol garrison unit can be elevated to lead a new warband.
- Units resting in a city you hold heal ${Math.round(CITY_HEALING_PER_TIER * 100)}% of their max HP per wall tier at the start of your turn.
- Lairs: camps of neutral tribes (cleared, they grow back later) and dungeons (a one-time reward). Structures: a merchant (items), a mercenary camp (hire units), a mage (spells); stand on one to trade.
- Dead units go to your graveyard. Resurrect them at the Capitol: dear at first (${RESURRECTION_PREMIUM}x), cheaper each turn you wait. If a warband's own leader falls but the squad wins, the warband lives on but must revive its leader at the Capitol.
- Leaders earn a leader-skill point per ${LEADER_XP_PER_POINT} XP (movement, health, leadership, healing, an aura).

BATTLES
- Two squads on 3x3 grids. Places are written F1-F3 (front row), M1-M3 (middle), B1-B3 (back). Units act in initiative order; fast units act more than once a round.
- A melee unit must stand in its own front line, and hits enemy front-line units at most one column away (the front line is the frontmost row that still has a living unit). Ranged attacks and spells reach anyone. Keep fragile casters and healers behind sturdy melee units.
- Armor takes a share off each hit (at ${ARMOR_HALF} armor half gets through). Defend halves damage until the unit acts again; Wait moves the unit to the end of the pass.
- After ${BATTLE_ROUND_LIMIT} rounds the attacker withdraws. Survivors share XP. At full XP a unit evolves into its next form; at a fork you choose its branch (once, for every unit of that kind).
- Each battle option shows a preview (=> ...) of the damage, healing and deaths it causes. Map attack options show the battle AI's forecast of the whole fight: WIN or LOSS, and how many would stand. A LOSS forecast means you would probably lose that fight.

ADVICE
- Early on: take neutral cities near you (more gold), clear camps your forecast says you win, keep your warband full, and never leave your Capitol empty when an enemy is near.
- Don't attack when the forecast says LOSS. Rest wounded warbands in a city. Spend your gold every turn.
`;
