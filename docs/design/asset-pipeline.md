# Asset pipeline: research and plan

> Research on 2026-09-25 by three web-research agents (concept art, mesh generation, rigging and animation), cross-checked by Claude. Nothing here has been tested on this machine yet. Licenses and VRAM figures come from READMEs and model cards; re-check before shipping anything.

## Machine facts (checked)
- 2× RTX 3090 Ti (24 GB each; Ampere has no hardware FP8, so FP8 weights are upcast and run slower; GGUF Q8 is a good alternative), 123 GB RAM.
- ComfyUI 0.23 running at `127.0.0.1:8188` (install: `~/boot_launching_applications/ComfyUI`); scriptable through its HTTP API. Installed: Z-Image Turbo, Illustrious-XL, Wan 2.2 (t2v/i2v), LTX-2 / 2.3 video. No 3D nodes yet.
- Blender 5.2.2 installed but broken by a partial upgrade (needs openexr 3.5); fix with `sudo pacman -Syu` (user).

## The honest problem
The AI steps have become good. The expensive steps are the ones between them: **retopology of characters**, **skinning around fused weapons and thin parts** (wings, halos, capes), and **stylized attack animation**. The research estimates 30–60 minutes of manual cleanup per unit. Claude can't do that in a GUI, and 40+ units makes it the real cost. So choose a pipeline that avoids those steps rather than one that grinds through them.

## Two routes to bake off
Run one unit (Paladin) through both, render it in the actual battle scene, and compare screenshots before committing.

### Route A: rigid-part 3D ("reliquary statues")
Build units as **rigid segments parented to bones** (helm, pauldrons, torso, arms, weapon) instead of one skinned mesh. There's no retopology and no skinning, and weapons and wings are separate parts by construction. It fits the art direction (statues, relics; Vexumphat is literally animated armor) and units are seen small.
1. Concept: Qwen-Image-2512 plus our style LoRA; front view in A-pose, flat background.
2. Parts: Qwen-Image-Edit-2511 isolates each part as its own image, or the whole unit is generated and split by connected parts in Blender.
3. Mesh: **TRELLIS.2** (MIT, PBR, ComfyUI-Trellis2 nodes; needs gated DINOv3 access on Hugging Face) per part; decimate to a few thousand triangles in Blender headless.
4. Rig: one canonical humanoid skeleton; parts are parented rigidly. Optionally **SkinTokens** (MIT, ~14 GB) or UniRig (MIT) for the few units that need real deformation (robes).
5. Motion: hand-keyed bold poses in bpy for attacks, defend, hit and death (a few keyframes each; small on screen, so pose beats fidelity), and CC0 or CC BY libraries (100STYLE, Mesh2Motion) for walk and idle, retargeted through a fixed bone map.
6. glTF 2.0 with named clips → three.js `AnimationMixer`.

### Route B: painted sprites in a 3D world (the D2 way)
Units as painterly animated sprites on billboards; the map, arena, lighting and effects stay 3D. Image models are far better at *style* than 3D generators, and battle units face one fixed direction (side 1 mirrors side 0).
1. Concept: the same as Route A, in the battle-facing three-quarter view.
2. Animation: image-to-video with **Wan 2.2** (Apache 2.0, installed) or LTX-2.3 (installed; check its license's commercial terms) → idle, attack, hit, death clips of about 1–2 s.
3. Frames: background removal (BiRefNet), pick 8–16 frames per clip, pack into sprite sheets.
4. three.js: textured quads with frame animation, and a normal map (generated or approximated) so the scene lighting still touches them.
- Risks: frame-to-frame identity drift, keeping every clip in the same style, the map needing more facings (mirroring may do), and loss of the rotatable battle camera (sprites look flat from the side; the camera would need a narrower orbit).

## Shared front end: consistent concept art
- Core: **Qwen-Image-2512** and **Qwen-Image-Edit-2511** (Apache 2.0; edit mode with a Multiple-Angles LoRA for turnarounds). **Z-Image** (Apache 2.0; Turbo is installed) as the easiest style-LoRA training base on 24 GB.
- Style LoRA: generate 200+ candidates from descriptor-only prompts (the art bible in `art.md`; no artist names), curate 20–40, train with ostris **ai-toolkit** (Z-Image) or **musubi-tuner** (Qwen-Image; `--fp8_base --blocks_to_swap`), repeat.
- Fixed prompt templates per asset type (unit, portrait, frame, icon, tile) with the faction accent color as a slot.
- Icons and UI: Qwen-Image-2512, then Qwen-Image-Layered (Apache 2.0) or BiRefNet to separate the background. Tiles: a seamless-tiling node, checked by tiling 3×3.
- The second GPU runs a second ComfyUI instance (`--cuda-device 1`) or holds the text encoders (ComfyUI-MultiGPU).
- Disk: roughly 150 GB of new models.

## License traps (don't ship output from these)
- **Non-commercial**: FLUX.2 [dev] and [klein] 9B, Qwen-Image 2.1, RigAnything, GVHMR / ComfyUI-MotionCapture, NVIDIA GEM, Ubisoft CHORD, MeshFlow, the Bandai Namco motion set, and HumanML3D/AMASS-derived text-to-motion models (MDM, MoMask, MotionGPT: legally unclear).
- **Territory-restricted** (excludes EU, UK, South Korea): Hunyuan3D 2.1 and **HY-Motion 1.0**, the best open text-to-motion model. Usable only if the user is outside those regions; open question.
- **Unclear**: Pixal3D (one report says MIT, the other found none stated), AniGen (MIT, but the bundled CUBVH code is non-commercial), LTX-2 commercial terms, Make-It-Animatable.

## Not found
- The Reddit community the user remembered ("aitopology"): Reddit was blocked to the research fetcher, and nothing by that name turned up. Ask the user for the link.

## Paid fallbacks (if a route stalls)
- **Tripo API**: auto-rig for biped, quadruped, avian and more, plus 90+ animation presets; about $0.30 per rig.
- **Meshy API**: humanoid rigging, about 700 animation presets.
- **Quad Remesher**: $79, if Route A ever needs real retopology.

## Next steps (when art work starts; the user postponed art)
1. User: fix Blender (`sudo pacman -Syu`), answer the region question, and request DINOv3 access on Hugging Face if we go with TRELLIS.2.
2. Download Qwen-Image-2512 and Qwen-Image-Edit-2511 (Q8 GGUF) and draft the style bible prompts.
3. Bake-off: Paladin through Route A and Route B, rendered in the battle scene. Decide.
4. Then the style LoRA, then batch production.
