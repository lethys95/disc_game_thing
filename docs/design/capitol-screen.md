# The Capitol screen (user, 2026-09-27)

What the user wants to see first; open to growing later.

a. **Home view:** entering the Capitol shows the city itself. Later (far down the roadmap): people walking around, by faction. Inspiration: HoMM5's town screens, Age of Empires III's home city (lively, between matches), and the Unreal Gold intro/home screen.
b. **A tab menu on the right side**, neat, like a strategy game's menu. Reference: the user's desktop tab strip (square icon tiles in a row, the active one lit in an accent color).
c. **First tab, garrison:** recruit; the visiting and garrisoned squads side by side; the graveyard on the right (works fine as it is).
d. **Research:** tabs per archetype, much as now, but the tree more tree-like: starting from the top, with icons for the unit (or building on the home view).
e. **Spell research.**

Not limited to these: more Capitol functions can be added later.

## Built (M41, 2026-09-27)
- (a) Home view: the camera glides in close on the city itself on the map (drag to look around), with a small card of what matters; the map's own panels hide. Walking people and a proper city scene are for later.
- (b) A tab rail on the right: square tiles with a glyph (placeholders) and a label, the active one lit in gold.
- (c) Garrison: the grids, the city's tier and nodes, the graveyard on the right.
- (d) Research: each line grows down from its tier-1 unit; archetype tabs Melee, Support, Mage and Joker (empty until designed). The connectors only rise straight up so far.
- (e) Spells, as before. Ordinary cities get Home and Garrison.

## The city view the user means (2026-09-27)
Not the map camera close up (what M41 built as a stand-in): a **painted town screen**, like HoMM3's town view (`references/homm3-town.png`: the whole town as one scene, each building its own piece) or Disciples II's city screen (`references/disciples2-city.png`: a dark painted city filling the view, an ornate panel on the right with round buttons and stone plaques). "A side thing" for now.

## The user's sketch (2026-09-27, `references/city-view-sketch.png`)
The city view is **a framed panel**: the view sits in a proper frame under the name plaque, left of the tab column. Inside it: a **montage of the city from the inside**, like Unreal Gold's intro: its own scene, different props, people walking around. Far off; until then a static painting of the city in the frame is a fine placeholder. ("The red doesn't mean I want it in red.")


## Reference: Unreal's intro (user, 2026-09-29)
`/home/lethys/Videos/unreal_into.mkv` (outside the repo): the user's reference for how the Capitol screens could look, the montage of the city from the inside. The user's thought: generating video may be faster than gaussian splatting. **Not now**: don't start video generation; if video it is, the user wants to find a newer model first (the installed ones are clunky to fit in memory).

## How to make the montage (Claude, 2026-09-29, from the Unreal intro)
The intro (frames read with ffmpeg) is **not a video but the engine with a scripted camera**: one continuous ~54 s shot on a spline that loops (its end meets its start), slow glides with dutch angles rolling back to level, low angles up at towers, drifting past torches and flags. Low-poly geometry, made by darkness, flickering torchlight, fog and a storm sky.
- **Video generation** (camera-controlled models): quickest to something pretty, but a fixed clip (5–10 s pieces to stitch, morphing, seams), can't show the Capitol's state, one set per faction and state.
- **Gaussian splatting**: free camera, but needs a scene to capture (capturing a generated video compounds its artifacts), baked light, no state, large files.
- **A real-time scene with a camera spline** (what Unreal did): our gothic models, torchlight (the cave bake-off: `spikes/engine/`), fog, a looping path. Loops perfectly, matches the map, and can show the Capitol's real state (a built node appears in it, as in HoMM's town screens). Risk: close-ups show TRELLIS's softness; darkness and fog carry it, as they carried Unreal.
- **Claude's recommendation:** the real-time scene; generated imagery at most for a distant backdrop later. Spike: `spikes/montage/`.
- **Spike result (2026-09-29):** `spikes/montage/` renders the Jilliath Capitol's courtyard at night from the game's gothic models: a closed ring of buildings around a torchlit plaza, the keep behind, a storm sky; the camera circles inside the plaza looking out, drifting in height with a slow dutch roll, a 24 s seamless loop (`shots/capitol-montage.mp4`, rendered headless with `spikes/montage/render.ts`). First pass flew through buildings and torches; a camera that stays inside the empty plaza can't. Next, if the user likes it: people walking (needs animated characters), the Capitol's real buildings (built nodes appear), one layout per faction, and the screen itself playing it live.
- **Verdict (user, 2026-09-30): doesn't solve it.** "Awesome you created this loop", but (1) it doesn't show the inside of the castle, and (2) a close camera magnifies the models' flaws: "They work well from afar. I wouldn't put them under a magnifying glass." The generated models stay map-distance assets. Upscalers like DLSS (a native-only feature; not available to WebGPU in a browser) sharpen pixels, not the models' geometry or textures, so they wouldn't change this.
- **Open:** how the inside-the-castle view gets made. Claude's lead: generated images (what worked for the icons) as painted interiors, with light animated on top (torch flicker, drifting fog, embers, a slow pan), the way Disciples II's city screen was a painting. It needs a probe of interior subjects and framings for the user to judge.
