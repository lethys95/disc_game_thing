# Upscalers for generated art

- **What:** Look at AI upscalers for the generated art: the HUD pieces cut from a screen painted at 1536×864, and
  maybe portraits and icons (the user, 2026-10-09: "having a look at upscalers might be worth it eventually").
- **Why:** The HUD is painted as one picture for consistency, which "probably has a consequence on quality" (the
  user); its pieces are cut small. An upscale before a light per-piece refine could bring back detail without
  breaking the shared light and stone.
- **Done when:** A probe compares a cut piece upscaled (a model in the local ComfyUI, or another) against the plain
  cut and a per-piece repaint, at 1440p.
- **Who:** Claude, when the HUD pieces are being cut (step 4 of `design/hud-kit.md`).
