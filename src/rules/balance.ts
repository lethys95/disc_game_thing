/**
 * Provisional numbers that aren't a unit's stats or an ability's params, in one place for balancing.
 * None of these are canon unless noted; see docs/provisional.md.
 */

/** Initiative per action in a round (actions = floor(initiative / this), at least 1). */
export const INITIATIVE_PER_ACTION = 15;

/**
 * A battle that reaches this many rounds is over: the attacker (side 0) withdraws and the defender holds the field;
 * the attacker's survivors leave alive. Provisional (provisional.md #52): healing and shield restores can otherwise
 * outlast the damage forever.
 */
export const BATTLE_ROUND_LIMIT = 30;

/** Punishment's stack cap (user: "balance it"; the value is provisional). */
export const PUNISHMENT_MAX_STACKS = 3;

/** What one spent once-per-combat charge is worth to the AI, so it doesn't burn heals on scratches. */
export const AI_CHARGE_VALUE = 40;

// The world.
/** A new leader's Leadership: how many units its warband holds, itself included (user: "5 total makes sense"). */
export const STARTING_LEADERSHIP = 5;
export const LEADER_MOVEMENT = 4;
/**
 * Fog of war (pillars.md): how far each thing a player holds sees, in hexes. Provisional (provisional.md): a warband
 * sees half its march, a city its neighbours, a Capitol a little further. Terrain doesn't block sight.
 */
export const WARBAND_SIGHT = 2;
export const CITY_SIGHT = 1;
export const CAPITOL_SIGHT = 2;
export const STARTING_GOLD = 100;
export const CAPITOL_INCOME = 50;
export const MINE_INCOME = 25;
/**
 * Share of max HP restored at the start of its side's turn to every unit resting in a city it holds (the garrison and
 * a warband standing there), per city tier (user, 2026-09-27: "+5% regen per city upgrade"). The Capitol too.
 */
export const CITY_HEALING_PER_TIER = 0.05;
/**
 * City tiers (user, 2026-09-26: "upgrade the city: more garrison slots, a small armor bonus to the garrison and the
 * visiting squad"). Every number here is provisional. Index = tier. A Capitol's Guardian takes no slot.
 */
export const CITY_SLOTS: readonly number[] = [0, 3, 4, 6, 8];
export const CITY_MAX_TIER = CITY_SLOTS.length - 1;
/** Armor for a city's defenders per tier above the first ("a small armor bonus": armor subtracts from every hit). */
export const CITY_ARMOR_PER_TIER = 2;
/** Gold to reach a tier: this × the tier. */
export const CITY_UPGRADE_COST = 150;

/** Resurrection's floor price per tier (the Congregant's canon 40 gold at tier 1). */
export const RESURRECTION_BASE = 40;
/** Canon: immediate resurrection is expensive and the price decays each turn. 3× base, minus one base per turn. */
export const RESURRECTION_PREMIUM = 3;
/** A Blacksmith node's owner hits this much harder with damaging abilities (user: "+10 or something"). */
export const BLACKSMITH_BONUS = 10;

// Progression.
/** Per level past the end of a line: this share of the unit's base max HP and damage (user: D2's rule; the size is provisional). */
export const LEVEL_BONUS_PERCENT = 5;

/** What `level` levels add to a base stat. */
export const levelBonus = (base: number, level: number): number => Math.round((base * level * LEVEL_BONUS_PERCENT) / 100);

/** XP a unit of each tier needs to evolve. */
export const XP_TO_EVOLVE: Readonly<Record<number, number>> = { 1: 100, 2: 250, 3: 500, 4: 1000 };

// The leader tree (user's v1 skills; every number here is provisional).
/** The whole 3x3 grid (user: "max 9 or 8"). */
export const MAX_LEADERSHIP = 9;
/** XP a leader earns per point in its tree. */
export const LEADER_XP_PER_POINT = 100;
/** User: "+10% health". */
export const LEADER_EXTRA_HEALTH = 10;
/** Share of max HP the Squad healing skill restores at the start of its side's turn. */
export const LEADER_HEALING = 0.1;
/** User: "the squad deals +5% damage". */
export const LEADER_AURA = 5;

/** Provisional (#19): a cleared bandit camp regrows after this many turns, stronger the later the game. */
export const CAMP_REGROWTH_TURNS = 8;
/** Game turns from which regrown camps are medium, then strong. */
export const CAMP_MEDIUM_FROM = 20;
export const CAMP_STRONG_FROM = 40;

/** Node investment (user: "possibly invest into the nodes around the cities"; provisional): cost × the next level. */
export const NODE_INVEST_COST = 100;
/**
 * Mana (pillars.md, "Spells": typed mana pays for spells cast on the map). Provisional: a Capitol yields a trickle of
 * its owner's color, a mana node more per level, always in its holder's color.
 */
export const CAPITOL_MANA = 5;
export const MANA_NODE_INCOME = 10;
export const NODE_MAX_LEVEL = 3;

/** Gold per tier for a unit-type upgrade (placeholder; the user tunes upgrade prices after playtests). */
export const UPGRADE_PRICE_PER_TIER = 50;
