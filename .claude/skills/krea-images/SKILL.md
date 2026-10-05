---
name: krea-images
description: Generate images with Krea-2 in the local ComfyUI (unit concepts, portraits, icons, props, ground, sky, UI: anything from scripts/art/*.ts or `pnpm art generate`). Always hand the run to a background subagent with the exact command, so the main session keeps working (coding, docs) while the GPU works. Use whenever about to run an image generation.
---

# Generating images with Krea-2

The user's rule (2026-10-04): image generation never blocks the main session. A background subagent runs it with
exactly the parameters given, and the main session goes on with other work until the subagent reports back.

Generate only on a clear ask from the user, or as the obvious next step of work they asked for. A request to *see*
something shows what already exists (memory: show-means-show).

## 1. Pin the parameters in a file first
The subagent runs a command; it never writes or edits prompts. So everything that decides the images lives in a
script before the hand-off:
- **Committed generators** (`scripts/art/concepts.ts`, `icons.ts`, `props.ts`, `ground.ts`, `sky.ts`, `ui.ts`, …):
  add or edit the job there (prompt, size, optional `negative` + `cfg`), commit if it's a keeper.
- **A one-off experiment** that must stay out of git: write a small script in the scratchpad that calls `runBatch`
  from `#scripts/art/batch`, but keep its output dir under `art/candidates/` (the contact sheet assumes a repo path),
  and delete the script afterwards.
- Output goes to `art/candidates/<group>/<folder>/` (see `art/README.md`); each run writes `manifest.json` (prompt,
  seed, model) and `contact-sheet.png`.

## 2. Hand it to a background subagent
Call the Agent tool with `run_in_background: true`, `subagent_type: "general-purpose"`, no `model` (it inherits the
main session's; the user, 2026-10-05: Haiku "has no use case anymore", and using it reads as not taking the work
seriously), and this prompt, filled in. The prompts and every creative choice are the main session's; the subagent
only runs the command:

```
Run this image generation for the disc project, exactly as given. Do not edit any file, prompt or parameter, and do
not retry with changes.

Working directory: /home/lethys/projects/all_disc/new_disc
Command: <e.g. pnpm exec tsx scripts/art/concepts.ts custodian-3d 1000 1001 1002 1003>
Expected output folder: <e.g. art/candidates/units/concepts/>

1. Check ComfyUI is up: `curl -s -m 5 http://127.0.0.1:8188/system_stats`. If it doesn't answer, stop and report
   that; don't start or restart it.
2. Start it detached and keep its process id: `nohup <command> > <log> 2>&1 & echo $! > <pidfile>` (about 23 s per
   image). Then wait with blocking calls of at most 9 minutes each, repeated until it has exited:
   `for i in $(seq 27); do kill -0 $(cat <pidfile>) 2>/dev/null || break; sleep 20; done`
   Never wait on `pgrep -f "<name>"`: it matches the waiting shell's own command line and never ends. Don't report
   until the process has exited and every expected file exists; send no interim or progress reports.
3. Report: the files written (paths), seconds per image, the contact sheet path, and any error output verbatim.
   Don't describe or judge the images; the main session looks at them.
```

Then carry on with other work. Don't poll; the notification arrives when the subagent is done. If the subagent
keeps waking you with interim reports anyway (a haiku run did, 2026-10-04): check that the generation runs detached
(`ps` its parent chain up to `systemd --user`), stop the agent (TaskStop), and wait for the process yourself by its
pid (`kill -0`), not by `pgrep -f`.

## 3. When it reports
Look at the contact sheet (or a sheet you compose with `magick … +append/-append` into the scratchpad) yourself
before saying anything about the images. For the user, put a sheet in `shots/` (served at
`http://<tailscale host>:5173/shots/…`; gitignored).

## Notes
- ComfyUI runs as the user service `comfyui.service`, pinned to the second RTX 3090 Ti (PCI 03:00.0) by
  `~/.config/systemd/user/comfyui.service.d/gpu.conf`; the first card drives the display. Its `/system_stats` lists
  one device. Free its memory before a TRELLIS run: `curl -X POST http://127.0.0.1:8188/free -d '{"unload_models":true,"free_memory":true}'`.
- Krea-2 Turbo runs at cfg 1, where negative prompts do nothing; a negative needs `cfg` above 1, and cfg 3 already
  burns the image (`scripts/art/comfy.ts`).
- Style words in prompts are the user's call (memory: no-silent-style): probe framings, don't bake one in.
