# A minimap on the overworld

- **What:** A minimap of the overworld: the whole map at a glance (explored terrain, fog), where your warbands and
  cities are, what you know of the enemy's, and the camera's view on it; click to move the camera there.
- **Why:** The user (2026-10-11): "please make a task for creating a minimap in the overworld". Maps up to Huge are
  more than a screen; Disciples II keeps its minimap in the top of its command column
  (`reference_material/disciples/notes.md`).
- **Done when:** It's in the game, greyboxed by job first (the `greybox` skill: where it sits in the map column or
  beside it, what it marks), and the user has looked.
- **Who:** Claude builds; the user judges.

## Notes
- 2026-10-11: built, greyboxed by job (`docs/design/map-elements.md`, "The minimap"; `shots/minimap-greybox.html`):
  explored terrain in flat values, cities and warbands as you know them, the screen's footprint as a frame, a click
  moves the camera. In the bottom-left corner; whether it moves into the column is for the repaint. Waiting for the
  user to look.
