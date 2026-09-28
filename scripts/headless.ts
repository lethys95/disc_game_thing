/**
 * How the headless browser (screenshots, playtests) reaches a GPU: OpenGL on the CPU's integrated Radeon
 * (`/dev/dri/renderD130`, Mesa), so testing never loads the NVIDIA cards; the desktop's card failed after many test
 * contexts (2026-09-28). `HEADLESS_RENDER_NODE` picks another node; `HEADLESS_SOFTWARE=1` renders on the CPU.
 */
export const HEADLESS_GPU_ARGS: readonly string[] =
  process.env["HEADLESS_SOFTWARE"] === "1"
    ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
    : ["--use-angle=gl-egl", `--render-node-override=${process.env["HEADLESS_RENDER_NODE"] ?? "/dev/dri/renderD130"}`, "--enable-gpu", "--ignore-gpu-blocklist"];
