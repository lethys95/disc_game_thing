# Asset pipeline: research and plan

> Research on 2026-09-25 by three web-research agents (concept art, mesh generation, rigging and animation), cross-checked by Claude. Nothing here has been tested on this machine yet. Licenses and VRAM figures come from READMEs and model cards; re-check before shipping anything.

## Machine facts (checked)
- 2× RTX 3090 Ti (24 GB each; Ampere has no hardware FP8, so FP8 weights are upcast and run slower; GGUF Q8 is a good alternative), 123 GB RAM.
- ComfyUI 0.23 running at `127.0.0.1:8188` (install: `~/boot_launching_applications/ComfyUI`); scriptable through its HTTP API. Installed: Z-Image Turbo, Illustrious-XL, Wan 2.2 (t2v/i2v), LTX-2 / 2.3 video. No 3D nodes yet.
- Blender 5.2.2 works headless (`blender -b -P script.py`, glTF exporter available) after the user's system upgrade.

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
- **Territory-restricted** (excludes EU, UK, South Korea): Hunyuan3D 2.1 and **HY-Motion 1.0**. **The user is in Denmark (EU), so both are out.** Motion comes from CC0/CC BY libraries and hand-keyed poses.
- **Unclear**: Pixal3D (one report says MIT, the other found none stated), AniGen (MIT, but the bundled CUBVH code is non-commercial), LTX-2 commercial terms, Make-It-Animatable.

## Spike result: static props (M42, 2026-09-27)
**Works.** Krea-2 concept (one object, three-quarter view, flat grey background, even light: `scripts/art/props.ts`) → TRELLIS v1 (MIT; `~/programs/image-to-3d/run_trellis1.sh`, ~40 s and ~11 GB VRAM on GPU 1) → `scripts/art/prop_cleanup.py` (headless Blender: weld, drop specks, decimate, shrink textures, matte) → `assets/models/<slot>.glb`, which the map loads in place of its placeholder (`src/view/models.ts`). The Capitol (44k → 12k triangles) and the mage tower (8k → 6k) keep their silhouettes, thin spires and even the tower's floating crystal. Lessons: generators export fully metallic materials (near-black in our lighting: the cleanup sets them matte); fit models by height *and* width; some of the concept's lighting is baked into the texture.
Installed under `~/programs/image-to-3d` (29 GB): TRELLIS v1 works; **TRELLIS.2** is built but needs the user's gated DINOv3 access (request at huggingface.co/facebook/dinov3-vitl16-pretrain-lvd1689m, then `hf auth login`); Pixal3D's weights are gated off for the EU; Stable Fast 3D needs a login. TRELLIS.2's default background remover (RMBG-2.0) is non-commercial: use BiRefNet (MIT).

## TRELLIS.2 works (2026-09-27)
With the user's DINOv3 access (downloaded by the user; runs are offline and never use a stored login: `HF_HUB_OFFLINE=1 HF_HUB_DISABLE_IMPLICIT_TOKEN=1` in `run_trellis2.sh`). On GPU 1: `512` pipeline 1.5 min, 4.3 GB peak; `1024_cascade` (default) 2.5–3 min, 13.7–16.4 GB peak, with the repo's low-VRAM mode and `expandable_segments`. Noticeably crisper geometry than v1 (the dungeon's arch blocks and stairs) and real roughness/metal maps at 2048 px. Background removal: BiRefNet (MIT), downloaded anonymously.

## Lead: video → gaussian splats (user, 2026-09-28)
The user saw someone generate a video with a MiniMax model and turn it into a gaussian splat for very detailed models, and wants to test it at some point. How it would go: a video model makes a smooth orbit of one object; frames → camera poses (COLMAP or similar) → a trained splat; three.js draws splats through existing libraries. Splats excel at fine and soft detail (foliage, fur) but bake their lighting, don't take part in normal shadows, are heavy, and aren't meshes (no decimation, no rigging): likelier for hero pieces (the city montage, showcase views) than every map prop. A local test path exists: Wan 2.2 image-to-video is already installed in ComfyUI. The MiniMax model's license and availability are unchecked.

## Lead: Image to 3D Lab (user, 2026-09-27)
A local browser UI (github.com/Bingeljell/image-to-3dlab, Apache-2.0) wrapping Pixal3D, TRELLIS.2, Hunyuan3D and Stable Fast 3D, plus Blender scripts (mesh cleanup, UV unwrap and rebake, normal/AO bakes, turntables, a Rigify workflow for quadrupeds). Its documented Linux/NVIDIA backends are only Pixal3D and Stable Fast 3D. Against our license list: Hunyuan3D (and its PBR repaint) is out in Denmark; Pixal3D's license is unclear; Stable Fast 3D is under Stability's community license (check the terms before shipping). The Apache-2.0 Blender scripts are useful regardless. Best first fit: static props (cities, structures, dungeon entrances, nodes) and map statues, which need no animation. The quadruped rigging may suit Grove creatures and tribes later.

## Community
- r/TopologyAI (https://www.reddit.com/r/TopologyAI), from the user, for AI retopology discussion. Reddit blocks the research fetcher, so read it through search snippets or ask the user.

## Paid fallbacks (if a route stalls)
- **Tripo API**: auto-rig for biped, quadruped, avian and more, plus 90+ animation presets; about $0.30 per rig.
- **Meshy API**: humanoid rigging, about 700 animation presets.
- **Quad Remesher**: $79, if Route A ever needs real retopology.

## Next steps (when art work starts; the user postponed art)
1. User: request DINOv3 access on Hugging Face if we go with TRELLIS.2.
2. Download Qwen-Image-2512 and Qwen-Image-Edit-2511 (Q8 GGUF) and draft the style bible prompts.
3. Bake-off: Paladin through Route A and Route B, rendered in the battle scene. Decide.
4. Then the style LoRA, then batch production.

## What the community posts add (user's handover, 2026-09-26)
Source: `docs/lethys-wrote-this-for-handover/inspiration-from-topology-ai.md` (posts collected by the user). Treat vendor demos with care (most evidence is from launch demos and early testers; costs like "$1,874 of tokens for an island" are real warnings). What applies to us:
- **Reference folder first.** A curated set of images that define the look, read by the agent before any asset work. We have keepers but no committed reference set; the user curates it once the direction settles.
- **Image first, then 3D.** "A house I don't like dies in seconds instead of after the model is done": pick 2D concepts before spending anything on meshes. Our `pnpm art` → pick → accept flow already works this way.
- **Split characters into parts** (helmet, weapon, armor, body) and generate them separately, then assemble in Blender. This is our Route A (rigid parts), and it sidesteps the skinning problems posters report (hair, fur, thin parts).
- **Multi-view input** improves image-to-3D: posters make turnarounds with a video model ("rotate it as a 3D model") before reconstruction. We have Wan 2.2 installed for exactly that.
- **Blockout first, dress later** (boxes for houses): what our statues and standees are.
- **AI in Blender is more capable than we assumed** at rigging, animation fixes, procedural scenes, wind, VFX and props, with iteration driven by screenshots of the result. Correction to "The honest problem" above: cleanup and rigging are workable by Claude in headless Blender (`blender -b -P`, rendering frames to inspect), with a few rounds of feedback; still the costliest step, but not a wall.
- **Procedural environment art is a cheap, safe win**: trees, rocks, map dressing, spell effects, wind, lighting. No likeness or style risk comparable to characters.
- Tools named in the posts: Tripo P2 / 3DAIStudio / Meshy (cloud, paid per generation; check terms and EU availability before relying on them), Blender MCP (drives a running Blender GUI; headless scripts do the same for us and live in git).

Plan (proposed 2026-09-26): after M13, a **3D spike**: the Zealot keeper → multi-view (Wan 2.2 turntable) → image-to-3D (local and EU-usable first, e.g. TRELLIS.2; a cloud generator as comparison) → Blender headless (cleanup, split into rigid parts, rig, attack/hit/death/idle) → glTF → the battle scene beside the standees. Separately and cheaply: procedural map dressing (trees, rocks) from Blender or three.js.

## Experiment: a Grove tree built by an agent in Blender (2026-09-26)
The user asked to see how far iterative AI work in Blender goes. A subagent ran 8 build → render → critique iterations on a procedural "life and death intertwined" Grove tree (brief: readable at map scale, ≤ 4k triangles, glTF). Result: `art/blender/grove-tree/` (script, `.glb` of 3,056 triangles, notes, renders). It reads as half alive, half dead at map scale and holds up across random seeds; the styling is generic low-poly, not the ink direction. Its lessons, worth keeping for any 3D work:
- Judge at the player's pixel size (a render with the game camera's exact scale); close-ups flatter everything.
- Silhouettes come from contrasting gestures (stilt roots, a drooping mass vs a reaching arm), and value contrast (dark bark vs bone-pale dead wood) beats hue at small sizes. An accent color works in 2–3 places, not everywhere.
- Canopy recipe: merged spheres → voxel remesh → noise displacement → decimate, colored afterwards.
- Separate random streams for structure and decoration, so tweaking one doesn't reshuffle the other.
- Verify a glTF export by re-importing it into an empty scene and rendering from the file alone.
- Blender 5.2 headless renders EEVEE, Workbench and Cycles; bloom now goes through `scene.compositing_node_group`.
Next steps it proposed: ink treatment (hard black in crevices, outlines on big shapes), canopy gaps, variants (sapling, dead) and a check in the real map renderer.

## Lesson: what TRELLIS.2 can't rebuild (2026-09-29, the Wastes Capitol test)
Mist in a concept became solid grey sheets fused to the building, and thin filigree and needle spires came out as lumps: the generator can't tell fog from stone, and sub-voxel detail melts. Concepts for image-to-3D ask for **no mist, smoke or fog** (the game adds its own) and **bold, thick forms**; with that, the Scorn-inspired Capitol kept its silhouette, spires and bone sculpting from every side (`scripts/art/wastes.ts`, "solid"). Part of the "soft, cheerful" look the user noticed comes from the concepts' framing too ("hand-painted, chunky"); faction-specific framings ("dark, eerie, muted") steer away from it.

## Lesson: painted shadows become the texture (2026-09-29)
The user saw the gothic buildings' darkness "only built into the textures, rather than... a result of lighting". Right: a concept's shading becomes the model's base color, so shadows painted into it ("deep shadows in its recesses") stayed dark under any light (the Leech pits' texture averaged 28/255). Concepts now ask for flat, shadowless light and true material colors, and `prop_cleanup.py` lifts a still-too-dark base color toward a target mean with a gamma curve (0.3 in sRGB; `scripts/art/rebuild-props.sh`). The darkness of the gothic look should come from the scene's lighting and grade, not the albedo.
- Albedo lift, verdict (user, 2026-09-29): **no lift**. On the gothic ground the lifted buildings looked washed out; unlifted they keep their contrast. `prop_cleanup.py` keeps the option (a fifth argument); `rebuild-props.sh` passes none.

## Lead: Meshy for characters (user, 2026-09-29)
https://www.meshy.ai/ (paid, cloud, third party): image-to-3D **with auto-rigging and animations**, said to work well for characters, which is our blind spot (TRELLIS.2 gives static meshes; nothing local rigs them yet). The user's framing: "if we can't find a different way." So the order: try the local route first in the animated-units spike (TRELLIS.2 mesh → Blender auto-rig/Rigify, or a rig transferred from a stock skeleton), and fall back to Meshy if that doesn't hold up. Before using it: its license terms for shipped game assets, and the account is the user's (Claude never signs in or uses the user's credentials; the user runs it, or hands over exported files).

## Lead: UniMate for animation (user, 2026-09-30)
https://github.com/Friedrich-M/UniMate (code MIT, checkpoints on Hugging Face; its UniML3D training data carries Mixamo, Objaverse-XL and Truebones licenses: check what that means for shipped clips). Text-to-motion for **any skeleton without retraining**: bipeds, quadrupeds, birds, sea and insect-like creatures. Input: an already rigged model and a prompt; output: motion (`.npy`, per joint per frame) and rendered previews. So it's the **animation** step, not rigging: it needs a skeleton first. The README reading says skeletons from its dataset are what's shown; how well it generalizes to our own rigs is the thing to test. Fits the Grove's creatures and tribes, where Mixamo-style humanoid clips don't reach.

**Rigging** stays the open step. The user (2026-09-30): people report Opus 5.5 rigging successfully in Blender through an MCP (possibly with Higgsfield tooling, possibly marketing), and rigging is likely work for maximum reasoning effort. We already drive Blender headless (`blender -b -P`), which does what the MCP does and lives in git. Order for the animated-units spike: a unit model (TRELLIS.2, in a neutral pose) → rig in Blender (Claude, max effort; UniRig/SkinTokens as helpers) → motion (UniMate, or stock clips for humanoids) → glTF clips in three.js. Meshy stays the paid fallback for the rig.

## Paid character routes (research agent, 2026-09-30; nothing signed up for or paid)
Evidence is mostly vendor docs and vendor-adjacent blogs; Reddit threads didn't surface. Prices from vendor docs.
- **Tripo API** (recommended first): image-to-3D (20–30 credits), smart retopo (30), rig (25), retarget per animation (10), $0.01/credit pay-as-you-go, 2,000 free API credits on a new key. Rig v2.5 (Feb 2026) rigs bipeds **and** quadrupeds, hexapods, birds, serpents, aquatic: the only API that rigs non-humanoids. Presets are generic (idle, walk, run, slash, hurt, fall); creature presets look locomotion-only. Paid output: full commercial rights. GLB/FBX. https://developers.tripo3d.ai/en/pricing, https://developers.tripo3d.ai/en/docs/animations-rig
- **Meshy API** (humanoid fallback): rigging by API is humanoid only (quadrupeds only in its web app); a richer combat library (35 weapon attacks, 10 hit reactions, 11 deaths), 3 credits per clip; API needs Pro ($20/mo, ~$0.02/credit). Rig input must be textured, ≤300k faces, facing +Z. https://docs.meshy.ai/en/api/rigging
- Others: Rodin (strong hard-surface, no rig, ~$0.40–0.80/gen), 3D AI Studio (aggregator, markup), Anything World (auto-rig for low-poly, generic motions), Kaedim (rigged output at $1,200/mo: out), Higgsfield (wraps Meshy/Tripo: no reason to use it directly), Mixamo (free humanoid auto-rig, unmaintained, flaky since 2025), AccuRIG 2 (free, humanoid, Windows GUI), Cascadeur (keyframe animation, the user's hands). Hunyuan3D's license excludes the EU.
- **Claude rigging via Blender MCP:** weak evidence. A TikTok shows a Rigify rig placed by script (no weights or deformation shown); the one written evaluation (MindStudio, May 2026) calls weights/IK rigging "not realistic". Placing bones is plausible; skin weights on a messy generated mesh (capes, plates) is unproven.
- **Cheap first test:** one armored character through Tripo (~125 credits ≈ $1.25, inside the free credits) and Meshy (~$1 plus the $20 month), four clips each, judged in three.js screenshots (weapons and capes). Everything past the account is API-driven (the user's key in an environment variable); the account, payment and final approval are the user's. Weapons as separate meshes on the hand bone are likely safer than rigging them.

### Tripo's own character case study, and a Reddit route (user, 2026-09-30)
- **Tripo's studio workflow** (https://www.tripo3d.ai/blog/game-industry-character-workflow; the fetcher got a 403, read with curl): a stylized knight, concept to Unreal in one artist-day, under 30k triangles, quad topology, 600+ credits. Quality comes from **splitting the concept into parts** (their Character and Head Extraction image templates) and generating each with its own budget (Smart Mesh P2.0, Quad, e.g. 3,000 polygons for the head), textures at 4K/8K, then PBR maps. Then the craft work: reassembling the parts at the right scale, fixing holes, re-UV (mirror half), baking the generated textures onto the new UVs, a Substance pass. **Their own words on rigging:** "not yet at industry standard within this pipeline. Custom rigging remains the recommendation." Concept advice matches our prop lesson: clear silhouette, no heavy shadows hiding form, PBR-like material cues; **T-pose if rigging matters**, A-pose for armor.
- **A Reddit answer** (images on Imgur, which blocks the fetcher; the user saw them): Tripo Smart Mesh P2.0 from multi-view images, then Tripo's rig, 52k triangles; "GPT Astra" (an OpenAI agent, doing what Claude does in headless Blender) split the meshes, fixed UVs and swapped materials for CC0 textures; a Mixamo animation on top; about an hour, with visible faults (a hand, a scarf split wrongly). Capes: a spring-bone chain instead of cloth simulation.
- **For us:** units are seen small, so the Reddit-sized route (one mesh or a few parts, auto-rig, stock clips) may be enough; the studio route's Phase C is where Claude would work (Blender scripts: split, UV, bake, weights). Our portrait recipe's chiaroscuro and deep shadows are wrong for 3D concepts: a unit's 3D concept needs the props' flat, shadowless light, in a T-pose.
- **Cost estimate (Claude, 2026-09-30; API list prices from the research above, $0.01/credit):** light route per unit ≈ 240 credits with retries (image-to-3D + retopo ~60, ×2.5 for failed tries; rig 25, ×1.5; five clips at 10) ≈ **$2.50**; studio route (parts) ≈ 600–1,000 credits ≈ **$6–10**. 38 units today: ~$90 light, ~$230–380 studio; a full roster of ~100 units (four factions of ~20, plus tribes): ~$250 light, ~$600–1,000 studio. Unknowns: Smart Mesh P2.0, 4K/8K texture and PBR prices weren't in the research, and the case study's 600 credits are web-app credits, which may be priced differently. The 2,000 free credits cover about eight light-route units.
