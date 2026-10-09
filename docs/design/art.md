# Art direction

> **Not settled.** The user corrected it for Nexus (2026-09-27): a haughty noble house, opulent and immaculate, "definitely not worn, weathered and repaired" (`factions/ral-vitahl.md`). The "used up" look below is Claude's proposal and doesn't apply faction-wide.
>
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
Nothing generated yet. **Model chosen by the user (2026-09-25): Krea 2** (12B DiT, Krea 2 Community License: free until $1M revenue). Findings, 2026-09-25:
- The user downloaded **Krea 2 Raw** (`~/Downloads/krea/Krea-2-Raw`, diffusers layout: Qwen3-VL text encoder, Qwen-Image VAE). Its card says Raw is "not recommended for inference": it's the base for fine-tuning and LoRAs. **Krea 2 Turbo** is the inference checkpoint, and Krea trains LoRAs on Raw to use them on Turbo. That's our style-LoRA route later.
- The local ComfyUI (0.23, 2026-06-02) predates Krea 2 (2026-06-22): it has only the paid cloud nodes (`Krea2ImageNode`, `Krea2StyleReferenceNode`), no local loader. Local options: a ComfyUI update (if native support has landed since) or the diffusers `Krea2Pipeline`.
- Hardware: 2× RTX 3090 Ti (24 GB each), 128 GB RAM. 12B in bf16 is ~24 GB for the transformer alone, so fp8 or CPU offload (or text encoder on the second GPU).
- ComfyUI already has native background removal (`LoadBackgroundRemovalModel` + `RemoveBackground`, no model installed yet).
- The user updated ComfyUI to 0.37, which loads Krea 2 natively (CLIP type `krea2`). We use Comfy-Org's repackaged files (public, downloaded anonymously into ComfyUI's model folders): `krea2_turbo_fp8_scaled` (13 GB, fits one card), `qwen3vl_4b_fp8_scaled`, `qwen_image_vae`. Graph as ComfyUI's own Turbo blueprint: 8 steps, cfg 1, euler/simple. ~15 s per image.
- Tooling: `pnpm art <batch> [seeds]` (`scripts/art/`): prompt templates per asset kind in `prompts.ts`, candidates plus a manifest (prompt, seed, model) and a contact sheet in `art/candidates/<batch>/` (not committed; keepers will be).
- First batch (style anchors, 11 subjects × 2 seeds) came out cohesive: the material look and palette land. Weak: the mana accent is too timid (the Nexus teal almost vanishes), icons are all tarnished-metal monochrome (they'd blur together at 48 px), the Apprentice drifts toward anime, and the Zealot reads tired rather than burning. Order still: style anchors → icons → portraits → UI ornaments.

## User verdict on the first batch (2026-09-25)
- Overall: "very forgettable", "kinda boring", "a bit generic". The style needs fishing. The user's taste: Giger and Shichigoro-Shingo (never named in prompts; we describe qualities).
- Liked: **all icons**, **the ornaments** ("seriously awesome"), both Punishers, both Custodians. Favourites: `custodian-1000`, `punisher-1001`.
- Disliked: the Zealot ("a depressed tired old man"; zealots should be "batshit insane"), the Apprentice ("a depressed anime boy"). Paladins "cool if a bit forgettable".
- Congregants came out as rugged knights; they're meant to be an **angry mob** (their passive stacks with numbers).
- "It's not intended that everyone is supposed to be sad just because the universe is dark." Cause: the global prompt said "solemn, tragic and oppressive"; emotion now belongs to each subject.

## Style sweep (2026-09-25), awaiting the user's pick
Same three subjects (a frenzied Zealot, a Congregant mob, the Custodian as control) across looks described by qualities (`scripts/art/prompts.ts` `STYLES`): reliquary (the old look), biomechanical, engraving, ornate ink, religious icon painting, baroque oil; then two blends, biomechanical + ornate ink and biomechanical + engraving. Mood now lives in each subject, which fixed "everyone is sad". Claude's read: the blends and biomechanical are the most distinctive; the icon-painting look fights the game (it turns everything into a literal icon); baroque is strong but generic. Contact sheets: `art/candidates/{sweep,blends}/contact-sheet.png`.

## User verdict on the sweep (2026-09-25)
- Not sold. The references (Giger, Shichigoro-Shingo) were about **stroke and style, not theme**: "We're doing a fantasy thing, not biomechanical." Biomechanical and the blends are out.
- Best of the sweep: the ornate Custodian (still worse than `custodian-1000`). Baroque is "closer to being good" but not it; the front figure of `baroque_congregant-1000` is "rather close to what we're looking for".
- **Palette (user):** pale, with an explicit strong focus on contrasting **black, white and red**.
- Comparisons must share framing: the Custodian's grey background came from the full-body template (meant for image-to-3D), not from the style.
- The user designed the Zealot's look (`units/jilliath-melee-line.md`); it's the next test subject.

## The Zealot test (2026-09-25)
The user's design and palette held fixed; only the stroke varies (`pnpm art zealot`, `pnpm art zealotMask`): painterly realism, ink brush, pen-and-ink, airbrush. Full-body: the palette lands in all four, but the mask came out wrong (the hand smeared over the whole face, not burning, slit eyes). A head-and-shoulders pass with a more exact mask description fixed that: a burning hand on the forehead, black eye holes, a blank face. Remaining gaps: the eye holes aren't yet wide and staring enough, and the painterly masks still carry a nose ridge.

## User's picks from the Zealot test (2026-09-25)
- Picks: `zealot_inkBrush` 1000 (but its sword is broken), **1001**, 1002, `zealot_painterly` 1001, 1002. "We can straight up just use zealot inkBrush 1001", or very close. The mask close-ups: none liked.
- So the look is: **bold black ink brush and washes, dry-brush edges, lots of untouched pale paper; a pale palette with hard black and one or two strong faction colors.**
- The user's worry: does it scale? Next test: the Grove's Psychopomp (`units/sylvan-psychopomp.md`), a completely different message in the same style. Grove colors from the user: greens, with purples for pulses.

## Scaling test: Zealot + Psychopomp (2026-09-25)
`pnpm art pairing`: same framing (single full-body figure on pale paper), same palette structure (pale, hard black, only the faction's colors saturated: Jilliath red; Grove moss green with violet pulses), same strokes; only subject and mood differ. Regenerating a picked image from its manifest (prompt + seed) is pixel-identical (checked on `zealot_inkBrush-1001`). First pass: every Psychopomp had closed eyes and the ink one's spirits were cute blobs (kept in `art/candidates/units/jilliath/zealot-probes/pairing-closed-eyes/`); saying "eyes wide open, violet irises, spiralling pupils" and "spectral echoes of her own face" fixed both.
- User (2026-09-25): "these are pretty great". Pick: **`psychopomp_inkBrush-1003`** ("clearer that this is definitely not a human"). Together with `zealot_inkBrush-1001` these two define the style.
- Next (user, tomorrow): look for existing Krea 2 LoRAs. Leads: Krea's own collection trained on Raw for use on Turbo (huggingface.co/collections/krea/krea-2-loras); ComfyUI's Turbo blueprint ships `krea2_darkbrush` (Comfy-Org/Krea-2, `loras/`); the style-reference blueprint uses `krea2_style_reference` with an int8 Turbo, which could take our two keepers as references.

## Art slots (2026-09-26)
The game now has art slots (`docs/engineering.md` → Art). Installed from the user's picks: `portrait/zealot` (inkBrush-1001), `portrait/custodian` (anchors 1000), `portrait/punisher` (anchors 1001), the four liked icons (`ability/lay_on_hands`, `flail`, `plus_burst`, `defend`) and `ornament/frame-corner` (on every panel). The Custodian, Punisher, icons and ornament are in the first batch's style, not ink brush; they stand in until redone. A test generation of `effect/punished` from rules text alone came out abstract: slots need the user's `LOOKS` to become readable.
- User (2026-09-26): readability problem: figures are too close to the background color (the Zealot's white mask vs the pale paper, separated by one line). Later fix: figure/ground contrast (a darker or tinted ground, or a strong dark rim), not now. Descriptions of looks: the user will supply them ("it requires some creativity and some vision").

## Status of the direction (user, 2026-09-26)
**Not settled.** Yesterday's ink-brush work was theorycrafting, not a final art direction; there's a lot of art work still ahead. The keepers stand as references, nothing more. **Paper standees** (flat portrait cards on the 3D battlefield) are a stand-in for battle figures, **not what ships**.

## Environment (user, 2026-09-26)
Regular trees, maybe with autumn colors; withered trees for the Grove's decay. Not every tree shows the life/death dichotomy; no skeleton trees. The agent-built Grove tree (`spikes/grove-tree/`) was a nice test, too literal.

## UI references (user, 2026-09-27)
Disciples II's city screen (`references/disciples2-city.png`): the ornate right-hand panel (carved metal and stone, round buttons, pale marble plaques for names and pictures). Also Diablo II's HUD; gargoyles, statues and arches fit.


## The props' framing was Claude's, not the user's (2026-09-29)
Every map model and ground texture was generated with "stylized dark fantasy, hand-painted textures, chunky readable shapes", which Claude wrote into `scripts/art/props.ts` (M42) and `ground.ts` without the user. The user: the game is meant to be mature, for adults; cheerful buildings don't fit the story or the HUD. A style probe (`scripts/art/style-probe.ts`, `shots/style-probe.png`) shows the same props as grounded, gothic and painterly; the user picks, then everything is regenerated from the scripts (about an hour of GPU time). The map's bright, warm lighting (M58) is also Claude's choice, for the user to judge alongside.

**Decided (user, 2026-09-29): gothic.** "Gothic is correct. Definitely gothic." The buildings' framing: dark gothic fantasy in the manner of Disciples II's art, rich, brooding and ornate, deep shadows, desaturated with dark accents, dramatic and grim; serious and adult, not cartoonish (`scripts/art/props.ts` `GOTHIC`). Terrain waits until the user has seen it in gothic; the map's lighting mood is next, as a probe.

## Ability icons (2026-09-29)
All 43 abilities without art got icons in the recipe of the four the user liked (gothic reliquary emblem on black, one accent by faction: Jilliath blood red, Nexus teal, Grove moss green, neutral ember): `scripts/art/icons.ts`, subjects are Claude's readings. Seed 1000 of each installed. **User (2026-09-30):** "The icons look awesome, and I wouldn't hesitate to use any of them."

## Units: cards on the field and icons everywhere (user, 2026-10-05)
- "We should probably use the 2D cards as placeholders for units when we have them": a unit with a portrait stands on
  the battlefield as its painted card until its model exists.
- "We actually need icons for each unit. They're relevant in all other situations than in the battlefield itself or
  when moving around in the overworld": squad overviews in cities and the Capitol, unit views, and the battle's turn
  order (now blocks of colour with initials).
- **Consistency (user, 2026-10-05):** "We might actually have issues with consistency in portraits." Text-only
  portraits would drift from each other (the three that exist already differ: Custodian and Punisher painterly, the
  Zealot from the ink probes) and from the picked concepts. The user: "I think we can do an image to image workflow for
  the krea model […] insert our initial image, indicate that what we want is an icon/portrait of it, then generate a new
  image from that […] the current workflow is [not] going to be able to help us in that regard." Not to generate yet.
- **What's possible (Claude, 2026-10-05):** Krea-2's text encoder is a vision model (Qwen3-VL), and ComfyUI ships an
  *Image Style Reference (Krea-2 Turbo)* blueprint: reference images through `TextEncodeQwenImageEditPlus` and
  Kontext-style reference latents, with a `krea2_style_reference` LoRA (not installed; a public file in Comfy-Org's
  Krea-2 repo). It's trained for style, so whether it keeps a creature itself while reframing it is to be tested.
  Simpler and needing nothing new: crop the head (icon) or the figure (card) from a picked concept, then Krea
  image-to-image at moderate denoise with a portrait prompt. The proposed test: both routes on a few picked units, side
  by side, once the user says go.
- **The test (2026-10-05; the user: "You can begin 1. Don't just start everyone at once. Try out the workflow first"):**
  on the Punisher only (`scripts/art/portraits.ts`, `shots/portrait-test.html`).
  - **Image-to-image works.** The source is the picked concept's front view, with its grey turned to the old
    portraits' dark grey. It's repainted with a short prompt (who he is, what he holds) and the painted gothic line
    plus the first batch's chiaroscuro and rim light.
  - **The card:** at 0.75 and 0.9 the model re-poses the T-pose by itself (arms down, the flail over his shoulder)
    and keeps the hood, cassock, mantle, chain belt and bracers. It's the old portrait's look with the picked design.
    At 0.6 the T-pose still shows.
  - **The icon:** a head-and-shoulders crop at 0.45–0.75 keeps him, and still reads at 64 px.
  - **About 14 s an image.**
  - **The reference blueprint, without its LoRA, failed:** a dotted halftone mess, with the flail sheet pasted in
    beside him. It was dropped from the code (git keeps it).
  - **Not settled:**
    - the portrait style (painted, after the liked first batch) is the user's call;
    - the card's flail came out as balls, not the picked flanged heads;
    - nothing is installed yet.
- **Three framings (the user, 2026-10-05):** "for the icon in grid in squad view and the battlefield queue, we need
  smaller more zoomed in versions. This one [the head-and-shoulders] works on holding right click menu." So:
  - the **card** (the whole figure): the standee on the field;
  - the **bust** (head and shoulders): the unit card;
  - the **icon**, cut from the bust and zoomed on the face: the turn order, squad grids and lists.

  The Punisher's are installed: card 0.75, bust 0.6, and the icon cut from that bust. Seen in a battle (`?fight`):
  the icon in the turn order and the card on his standee. The unit card wasn't opened in the shot.
- **The Bog Giant test (2026-10-05):** a body with nothing human about it. Its identity is a small pale face low in
  black bark, not a silhouette, and that's what repainting loses first.
  - **The bust** holds at 0.3–0.4 (the pale face and chest kept, now painted). From 0.5 up, gold filigree grows over
    the bark and the face changes.
  - **The card** drifts even at 0.3: the bark turns into swirling carved roots and the face reads as a skull-mask.
    The silhouette, the arm, the reeds and the pale chest hold. "Bone-white" made a plain skull.
  - **Likely cause:** the painted line's "ornate". The concept prompts had it too, but in a 3D render it stays in
    the materials, while in a painting it becomes ornament. That word is part of the user's gothic recipe, so it's
    the user's call.
  - **Lesson:** strengths are per unit. A T-pose needs 0.75+ to re-pose; a body already standing needs 0.3–0.4.
- **The batch (2026-10-05; the user: "you can work in batches now"):** the card, bust and icon are installed for the
  Punisher, Zealot, Psychopomp, Sproutling, Moldling, Deadwood, Bog Giant, Mulch Gorger, Bonecracker, Cackler and
  Matriarch. The picks are Claude's, recorded in `scripts/art/portraits.ts`; the overview is `shots/portraits.html`.
  - **Fixes on the way:**
    - The gnolls came out brown and spotted until their pale grey striped fur was named.
    - The Psychopomp's ears came back with "elven". The prompt dropped it and named the hood's fur around her face.
    - Some crops needed placing by hand: the Cackler (its staff's skull is as high as its head), Deadwood (its face
      is the split in its trunk) and the Bog Giant.
  - **"Ornate" vs plain:** at 0.3–0.4 there's almost no difference, except on the Bog Giant, which uses plain.
  - **The Custodian is not installed:** the user's favourite `custodian-1000` stays until the user chooses. The new
    candidates are on the page.
- **The user on the batch (2026-10-05):** "well done =)".
  - **The bust:** "what the point of the bust actually is […] the bust rarely makes for good icon material." The icons of
    the Zealot, Sproutling, Moldling, Deadwood, Cackler and Matriarch would be better from the card ("especially
    matriarch, she looks incredibly cool in the card"). The Psychopomp's icon is better from the bust; the Bog
    Giant's bust icon "works really well".
  - **White outlines:** "it basically comes from how (assuming) a magic wand type tool was selected for colors […] most
    visible with the bog giant […] In some of the pictures AI has […] turned [it] into highlights instead" (the
    Bonecracker); the Mulch Gorger has "a strange outline".
  - **The Psychopomp's card** "could really use a pose of some sort […] she just looks sort of bland in the card, which
    goes against her costume."
  - **The Custodian:** switch to the new one ("we've moved away from that design into something slightly less
    humanoid").
- **Changes (Claude):**
  - **One painting per unit:** the bust (the unit card) and the icon are cut from the card by default; a separately
    painted bust only for the Psychopomp and the Bog Giant.
  - **No white outline:** the cutout's edge pixels take the colour of the figure just inside them, and flat grey
    pockets enclosed by the figure become ground.
  - **The Psychopomp:** two card poses, the user's casting reference (palms down, back arched) and a raised hand.
  - All cards were repainted from the cleaned sources.
- **Round two of the portraits (2026-10-05):** all twelve repainted from the cleaned sources and installed, the
  Custodian switched to its 3D design (the user).
  - **Busts and icons:** cut from the card (centred on the face), except the Psychopomp's and the Bog Giant's, which
    come from their painted busts.
  - **The Psychopomp's card:** Claude's raised-hand pose. The user's arched casting pose didn't come through as an
    arch.
  - **The Zealot's card:** came out almost the same as the one the user liked.
  - **Kept images:** the script now moves any earlier image of the same name to `earlier/`. Before that fix this run
    overwrote round one's candidates of the same names; the installed round-one files are still in git.
  - Overview: `shots/portraits.html`.
- **Touch-ups (the user, 2026-10-05):** the Psychopomp's bust and icon now come from her card too ("for
  consistency"), so every unit's three framings are one painting except the Bog Giant's. The Bonecracker's and
  Moldling's icons were widened so the mouth isn't cut off, and the Mulch Gorger's was centred.
- **Photon (2026-10-05):** the user installed Tenzen's Photon (proprietary, free, local), which added an MCP server
  (`photon` in `~/.claude.json`) and six `photon-*` skills. The MCP tools load only in a session started after that.
  The CLI (`~/.photon/bin/photon`) works anyway.
  - **First job:** the Psychopomp's icon, centred on her face. Photon rendered the head region to measure it, then
    cropped, resized and exported. The game's file comes from `portraits.ts` with the same crop, so it stays
    reproducible; the two match within resampling.
  - **Cackler:** its icon was lowered a little so the chin isn't cut off.
- **The Omen, Soothsayer and Etherborn (2026-10-06):** portraits from their picked concepts (cards at 0.9, posed:
  the Omen with a flintlock, the Soothsayer with the eye orb hovering over one hand and cards in the other, the
  Etherborn with arcane fire). Bust and icon cut from the card; installed. Fifteen units have portraits now.
- **The Packstalker, Hamstringer and the five Drawn (2026-10-07):** cards at 0.9 (the Packstalker with its spear, the
  Hamstringer with a javelin and its bundle), the Chrysalis at 0.6 (at 0.3–0.4 it stayed a 3D render; at 0.5–0.6 its
  wire turns to thorny silver vines, the split darker). Round two for two Drawn: the Lightdrinker came out round and
  owlish until "gaunt and menacing, not cute" and a skull mask with mandibles were named; the Pale Mother had a cat's
  face with a pink nose until "a moth's face […] no nose". Bust and icon cut from the card; installed. 22 units.

## HUD and UI elements: more, and more creative (the user, 2026-10-06; for when ComfyUI is free)
"We need more UI elements for HUD and more. Maybe some more creative bits. Like maybe a gargoyle of an angel or
something baked into the corner of the hud in a natural way. The current gargoyle you see in the capitol hud is too
literal. Think 'grotesque'. Stone part of a building shaped like an angel, but built into the hud instead, in the same
gothic/fantasy type vibe we're looking for. Right now the hud elements we have are arguably limiting us design wise by
quite a bit, and we don't really need to be restrained at all."
- The direction: architectural sculpture grown into the interface, not ornaments set on it. A stone angel, a
  grotesque, carved into a HUD corner as if the panel were part of a cathedral. The current gargoyle (a standalone
  figure on the Capitol's rail) reads as a sticker.
- The kit (`assets/ui/`: frame, plaque, button, medallion, gargoyle, backdrop, plate, icons) is too small to design
  with. A broader set: corner pieces that wrap two panel edges, finials and spires for tops, a keystone for headers,
  carved caps for the battle's ability bar and turn order, per-faction variants.
- Generated in the `krea-images` flow once ComfyUI is free, then cut out (`scripts/art/ui_cut.py`).
- **First batch built (2026-10-09), for the user to judge** (`shots/hud-kit.html`). The test the user set: "are they
  actually hud elements? do they blend in? […] im NOT interested in a random gargoyle". Kept: a hooded angel whose
  wings are the side panels' top and side bars (one image is the whole frame, mirrored on the right), a tracery frame
  with angel statues as its corners for the screens' large panels, carved brackets at the ends of the map's turn bar, an
  iron divider on the battle card. Rejected: a horned grotesque gripping a corner (on the frame, not of it), a keystone
  (a third stone colour, and no arch to close), a finial (nothing vertical to crown). The Capitol's gargoyle is gone.
