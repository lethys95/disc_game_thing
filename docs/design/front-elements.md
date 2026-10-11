# The title, the new game and the menu, element by element

The `greybox` skill for the screens outside a game and the in-game menu. These stay neutral: no faction skin
(`hud-kit.md`, "Faction skins").

## The title: what it's for
Most often first: continue the last game (every return); start a new game; load another save (now and then). Rarely:
the codex, settings, credits; the skirmish.

| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| The name | says what game this is | | keep (a placeholder until the user names the game) |
| Continue | back into the autosaved game | the most frequent job | keep, first, only when there is an autosave |
| New game | the new game screen | | keep |
| Load game | the saved games | | keep |
| Skirmish | one battle with two squads built by hand | testing squads; a mode of its own? | keep, flagged: a player mode or a tool? |
| Codex, Settings, Credits | | rare | keep, below a gap, quieter than the three that start a game |
| The parade of units behind | the world in the window | mood | keep; its look is the user's call |

## The new game: what it's for
Choose your faction (the decision), then your colour, your opponents and the map's size; march.

| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| Faction cards: two units, name, house, play style, mana, difficulty, a paragraph | choose the faction | the decision | keep; the chosen one lit |
| Your colour | your banners | telling sides apart | keep, swatches |
| Opponents: a row each, its colour, its faction, Remove; Add an opponent | who you play against | | keep |
| Map size | | | keep |
| Back, March | leave, start | | keep; March the primary |

## The in-game menu: what it's for
Most often: save; load. Sometimes: settings. Rarely: leave the game, export or import a save file.

| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| Save game | saves now | the most frequent job | keep, first |
| Saved games: name, what game it is, when; Load, Export, Delete | the saves | load | keep; **Delete asks first** (it can't be undone) |
| Import a save file | a file from elsewhere | moving saves between browsers | keep, quieter, at the list's foot |
| New game | leaves this game for the new game screen | | keep, labelled as leaving; **asks first** (play since the last save is lost) |
| Settings, Close | | | keep; Escape closes |

## Settings: what it's for
Rarely: change a preference. Five sections in one long scroll.

| Element | What it does | Why it's there | Verdict |
|---|---|---|---|
| Sections: Animation speed, Sound, Camera, Hotkeys, Display | | | **tabs**, browser-style as in research, so nothing scrolls: Game (speed, camera), Sound, Hotkeys, Display |
| Notes under settings ("also how long the AI pauses", the hotkey swap rule) | say what a setting does | it isn't obvious | keep, one line each |
| Restore defaults, Back | | | keep in the footer |

## The skirmish and the codex
- **Skirmish:** its two grids and its recruit list use the shared squad tile (the recruit menu's way: the face, name and
  tier; the sheet on a held right-click in place of a stats line); a plain right-click on a placed unit still removes it.
- **Codex:** the flat book the user accepted stays; its header plates and the screen's backdrop went flat.
