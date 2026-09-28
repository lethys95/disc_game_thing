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

## Claude's read
Nothing here is out of reach in three.js. The gap is global illumination and tooling, not a ceiling. For the map and the battlefield, three.js with care matches Godot. Where Godot would pull ahead is lit interiors, like the city montage, dungeons and torchlit scenes. There, the three.js answers are lightmaps baked in Blender (three.js supports them) or the newer WebGPU renderer's screen-space effects (untested here).

Switching would cost:
- rewriting the rules (about 6,500 lines) in C# or GDScript;
- rebuilding the view (about 6,500 lines) and the UI kit in Godot's own UI system (its 9-slice styles fit the kit);
- a new playtest harness.

It would also end browser play.

Recommendation: stay on three.js. Revisit if the animated-units spike or a lit interior (the city montage) hits the wall above. The user judges the pictures.
