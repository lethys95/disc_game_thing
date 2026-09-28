/**
 * How the headless browser (screenshots, playtests) reaches a GPU: the CPU's integrated Radeon, so testing never loads
 * the NVIDIA cards (the desktop's card failed after many test contexts, 2026-09-28). WebGPU (the game's renderer since
 * M57) runs on Vulkan limited to Mesa's RADV driver (`HEADLESS_ENV`); OpenGL on `/dev/dri/renderD130`.
 * `HEADLESS_RENDER_NODE` picks another node; `HEADLESS_SOFTWARE=1` renders on the CPU (WebGL 2 fallback).
 */
export const HEADLESS_GPU_ARGS: readonly string[] =
  process.env["HEADLESS_SOFTWARE"] === "1"
    ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
    : [
        "--use-angle=gl-egl",
        `--render-node-override=${process.env["HEADLESS_RENDER_NODE"] ?? "/dev/dri/renderD130"}`,
        "--enable-gpu",
        "--ignore-gpu-blocklist",
        "--enable-unsafe-webgpu",
        "--enable-features=Vulkan",
      ];

/** The browser's environment: Vulkan sees only the integrated Radeon's driver. */
export const HEADLESS_ENV: Readonly<Record<string, string>> = {
  ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)),
  VK_ICD_FILENAMES: "/usr/share/vulkan/icd.d/radeon_icd.json",
};
