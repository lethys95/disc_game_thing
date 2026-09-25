# Art direction

> Chosen by Claude (2026-09-25), within the user's brief: dark, adult, possibly gothic, never made for kids. "Adult" means dark stories and themes, not explicit content. The user named Shichigoro-Shingo and Giger as mood references. We don't copy anyone's style and don't put artist names in generation prompts. The direction below is described by its own qualities.

## The direction: gothic reliquary
The world looks like **something sacred that has been used up**: devotional objects, armor, and bodies worn thin, fused, repaired, and repurposed. Beauty with a cost attached, which fits the factions (sacrifice, expedience, ramp, death).

- **Material first.** Tarnished metal, bone, lacquer, cracked stone, cloth heavy with age. Surfaces tell you what something has been through.
- **Organic and made things fused**, used sparingly: armor that has grown into its wearer, ribbed architecture, cables like tendons. Dread, not gore. It gets more intense per faction (Nexus and Wastes the most, Grove as rot and roots, Jilliath as relic and wound).
- **Muted world, one loud color.** Environments and bodies stay desaturated (umber, ash, bone, oxidized iron). Each faction's mana color is the only saturated accent: Jilliath red, Nexus teal (lightning), Grove green, Wastes yellow. At a glance, color means allegiance and magic.
- **Chiaroscuro.** Deep shadows, hard rim light, glow from the mana color. Scenes read as candlelight, storm-light, or furnace-light.
- **Vertical, ornate silhouettes**: spires, halos, banners, tall helms. Readable in shape even at thumbnail size.
- **Tone**: tragic and oppressive rather than edgy. People in this world believe in things, and it costs them.

## Practical constraints (so generation and 3D stay feasible)
- **Units are viewed at distance** on 3x3 grids, so each needs a strong silhouette plus its faction's accent color. Detail goes into portraits, not models.
- **Portraits and concept art**: painterly, high-detail, dark background. This is where the style lives most.
- **3D models**: mid-poly with painted textures; stylization forgives generated-asset flaws. Image-to-3D works best from full-body, neutral-pose, plain-background concept images, so generate those on purpose.
- **Scene rendering** (three.js): dark ambient, exponential fog, a strong key light plus rim light, emissive mana-color accents, restrained bloom. The mood should come through even with placeholder boxes.
- **UI**: dark, ornate-but-sparse frames. Serif display type for names; clean sans-serif for numbers.

## Pipeline (planned, not started)
Full research and the two candidate routes: `asset-pipeline.md`.

ComfyUI concept art → image-to-3D mesh → **Blender headless** (`blender -b -P script.py`: cleanup, decimate, normals, bake, rig/animate, turntable renders to inspect) → glTF 2.0 (+ Draco/KTX2) → three.js (`GLTFLoader`, `AnimationMixer` crossfades, bones for props, custom shaders for glow/dissolve/auras).
- Auto-rigging generated characters is the weakest link; expect the most iteration there.
- Blender 5.2.2 works headless. The user's view: don't model every unit ourselves in bpy; bpy is fine for placeholders and for processing generated assets.

## Status
Nothing generated yet. ComfyUI is on the box, but its models are outdated. Pick current models when art work starts (check what's current then; don't rely on memory).
