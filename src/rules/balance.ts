/**
 * Provisional numbers that aren't a unit's stats or an ability's params, in one place for balancing.
 * None of these are canon unless noted; see docs/questions.md.
 */

/** Initiative per action in a round (actions = floor(initiative / this), at least 1). */
export const INITIATIVE_PER_ACTION = 15;

/** Punishment's stack cap (user: "balance it"; the value is provisional). */
export const PUNISHMENT_MAX_STACKS = 3;

/** What one spent once-per-combat charge is worth to the AI, so it doesn't burn heals on scratches. */
export const AI_CHARGE_VALUE = 40;

// The world.
/** A new leader's Leadership: how many units its warband holds, itself included (user: "5 total makes sense"). */
export const STARTING_LEADERSHIP = 5;
export const LEADER_MOVEMENT = 4;
export const STARTING_GOLD = 100;
export const CAPITOL_INCOME = 50;
export const MINE_INCOME = 25;
/** Share of max HP restored at the start of its side's turn to every unit resting in its own Capitol. */
export const CAPITOL_HEALING = 0.25;
/** Garrison size, Guardian included. */
export const GARRISON_LIMIT = 6;
/** Resurrection's floor price per tier (the Congregant's canon 40 gold at tier 1). */
export const RESURRECTION_BASE = 40;
/** Canon: immediate resurrection is expensive and the price decays each turn. 3× base, minus one base per turn. */
export const RESURRECTION_PREMIUM = 3;
/** A Blacksmith node's owner hits this much harder with damaging abilities (user: "+10 or something"). */
export const BLACKSMITH_BONUS = 10;

// Progression.
/** Per level past the end of a line: this share of the unit's base max HP and damage (user: D2's rule; the size is provisional). */
export const LEVEL_BONUS_PERCENT = 5;

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

/** Gold per tier for a unit-type upgrade (placeholder; the user tunes upgrade prices after playtests). */
export const UPGRADE_PRICE_PER_TIER = 50;
