# Engine bake-off: three.js vs Godot 4 (2026-09-28)

The user asked whether three.js can reach the quality wanted (lighting, foliage, animation), or whether the game belongs in a bigger engine (`decisions.md`, 2026-09-28). One scene, built to its best in both, with the same assets and the same placements (a shared random stream):
- a clearing: the game's forest ground texture, 60,000 grass blades swaying in the wind, 34 TRELLIS.2 trees and 26 bushes and rocks, also swaying;
- the game's sky panorama as sky and light, a sun with shadows, fog, ambient occlusion, a little bloom;
- two rigged soldiers playing an idle loop; one turns its upper body toward the other, off to its side, while hips and feet keep the animation (the user's question: "guy x shoots guy y, who isn't in front of him").

The soldier is the three.js examples' Mixamo `Soldier.glb` (not committed; `shared/` is ignored). Download it from the three.js repository (`examples/models/gltf/`) to rerun.

## Run
- three.js: `pnpm exec tsx spikes/engine/three/shot.ts out.png [wide|close|measure]`, or open `/spikes/engine/three/index.html` on the dev server to watch it move.
- Godot: `spikes/engine/godot/shot.sh out.png [wide|close]`. It runs in a private, invisible KWin session on the CPU's Radeon (Vulkan, RADV). Xvfb can't work: it has no DRI3, and without a display Godot quietly opens a window on the user's desktop. The script copies the few assets it needs into `godot/assets/` (ignored): Godot writes import files and extracted textures next to every asset it can see, so it must never see the repo's `assets/`.

Shots: `shots/` (`godot-*.jpg`, `three-*.jpg`).

## Findings
| | three.js (r186, WebGL) | Godot 4.7 (Forward+, Vulkan) |
|---|---|---|
| Look, as it comes | Needed hand fixes: colours given as sRGB, blade back faces flipped dark, and a hemisphere light faking the bounce of light off the ground. The fog doesn't reach the sky, which leaves a pale band on the horizon. | Bounce light (SDFGI, SSIL) makes the grass warm, and shadows read clearly. Fog blends into the sky. Good without tuning. |
| Look, tuned | Close to Godot on this scene. | Slightly richer: stronger shadows and colour. |
| Aiming the upper body | About 20 lines: turn the spine bones after the animation, shared along the chain. | The same 20 lines (a `SkeletonModifier3D`). Godot also ships look-at and IK modifiers, and animation state machines with blend spaces (with an editor). |
| Frame rate (integrated Radeon, 1600x900) | 32 fps | 29 fps without global illumination; 17 fps with it. Equal like for like. Either is easy on the user's RTX 3090 Ti. |
| Headless screenshot | 1–2 s | about 5 s |
| Scene code | 270 lines | 240 lines |

What Godot has that three.js doesn't:
- real-time global illumination (bounce light, which matters most for interiors, caves, torchlight and the city montage);
- volumetric fog;
- an editor, for placing things by eye;
- animation state machines;
- a particle editor;
- a mature desktop export.

What three.js has that Godot doesn't:
- the browser: the HTML and CSS UI kit, Playwright playtests that click through the real UI, instant reloads, and the user playing over Tailscale with no install;
- the working game (about 13,000 lines, plus tests).

As far as Claude knows, Godot's web export uses its lighter Compatibility renderer, so its global illumination wouldn't reach a browser build. Check before relying on it.

## Round 2: a cave with a bonfire (the user's test for lighting)
The user: "What if we are inside the dungeon which looks like a cave, and I want a bonfire." The same cave in both (`cave.py` builds `shared/cave.glb` in Blender from the game's ground textures): a rock chamber lit only by a flickering bonfire with shadows, moonlight through a hole in the roof, and the two soldiers.
- three.js: `cave.html` on the **WebGPU renderer**, with voxel bounce light (`VXGINode`, in the three.js release we already have), godrays, bloom and hand-made flame sprites. Headless Chromium runs WebGPU on the integrated Radeon through Vulkan (`shot.ts` limits Vulkan to the RADV driver).
- Godot: `cave.tscn`, with SDFGI, volumetric fog, glow and `GPUParticles3D` flames.
- `shot.ts … cave|cave-nogi|cave-measure`, `shot.sh … cave|cave-nogi`.

Result: the two look alike. Godot is warmer and more saturated, three.js more even; both are tuning. Bounce light adds a little in both (the fire's direct light dominates). Frame rate on the integrated Radeon: three.js 12 fps, Godot 25 fps. A trap in both: the log teepee's tip boxed in the fire light until the light was raised above it.

The three.js release (r186) also ships screen-space GI, light-probe grids (WebGL too), in-browser lightmap baking, SSR, TRAA and clustered lighting. Around it: pmndrs/postprocessing, three.quarks (particles), three-gpu-pathtracer.

## Claude's read
Nothing here is out of reach in three.js. The gap is global illumination and tooling, not a ceiling. For the map and the battlefield, three.js with care matches Godot. Where Godot would pull ahead is lit interiors, like the city montage, dungeons and torchlit scenes. There, the three.js answers are lightmaps baked in Blender (three.js supports them) or the newer WebGPU renderer's screen-space effects (untested here).

Switching would cost:
- rewriting the rules (about 6,500 lines) in C# or GDScript;
- rebuilding the view (about 6,500 lines) and the UI kit in Godot's own UI system (its 9-slice styles fit the kit);
- a new playtest harness.

It would also end browser play.

Recommendation (after round 2): stay on three.js and move the game's rendering to the WebGPU renderer, where the new lighting lives. Keep the rules engine-free, so a port stays possible (the user's suggestion). The user judges the pictures.
