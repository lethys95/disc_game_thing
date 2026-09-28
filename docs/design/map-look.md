# The map's look and terrain (user, 2026-09-27)

- The map is far from how it should look: "I'd like there to be actual grass."
- Open design choice: terrain unique to each faction, D2-style (terrain changes with the cities nearby) or HoMM3-style (each neutral belongs to the terrain of its castle).
- **Idea (user):** several terrain types, and a city's possible nodes depend on its terrain: haunted woods might spawn a witch hut, a regular forest the Cathedral, and so on.
- **Biomes (user, 2026-09-27):** "I do like the idea of different biomes with different nodes, cities, etc." More biomes than forests will be needed later; a forest to begin with is fine.

## The user's read of the dressed map (2026-09-27, M43–M44)
- Foliage needs work.
- There's a lighting problem.
- The props are rather low poly (the dungeon especially): we'll very likely need TRELLIS.2.
- Many hills and rocks look "just dumped in": they don't sit into the ground.
- WASD panning should glide smoothly.
- The user will playtest after the UI elements.

## First pass on the user's notes (M50, 2026-09-28)
- Lighting: the sky panorama also lights the scenes (image-based light, environment intensity 0.6) and ambient occlusion shades where things meet; the flat ambient light is halved.
- Grounding: each terrain prop sinks a share of its height into the ground (hills most, hiding their rim); hills now cover their hex without poking through its sides.
- Foliage: forests have eight trees and underbrush per hex, on a lighter floor. The tree models read dark from above (deep green textures); M55 regenerated them in fresh, sunlit greens.
- Low poly: every model is TRELLIS.2 now (M49).

