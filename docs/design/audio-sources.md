# Audio sources (research, 2026-09-26; nothing downloaded)

Stable Audio 3 SFX weren't good enough (see `audio-pipeline.md`), so this surveys human-made royalty-free sound
effects and music. A Claude agent did the research on the web on the date above. Quotes come from the license pages linked below.
Recheck each license on the day you download, and keep a copy of the license text with the files.

## Decision (user, 2026-10-04): sound effects from ElevenLabs
https://elevenlabs.io/sound-effects makes effects from text prompts, several takes per prompt, up to 30 s, with seamless loops on paid plans (ambience beds). **Free tier: personal use only, MP3.** Paid plans allow commercial use with no attribution, WAV at 48 kHz, and an API from Starter ($6/month): Starter 30k credits a month, Creator ($22) 121k, Pro ($99) 600k, about $0.03–0.07 per generation; on Creator and Pro the rights survive cancelling. Like Suno, only effects made on a paid plan can ship. The current placeholders (Sonniss GDC bundles, royalty-free) stay until replaced; `scripts/audio/sfx.sh` already trims, levels and encodes whatever comes in.

## Recommendation: start with these four

1. **Sonniss #GameAudioGDC archive (free).** This is the backbone: 2015–2026, over 200 GB of professional library
   material (Boom Library, Krotos, A Sound Effect and dozens more). No attribution needed. Commercial use is
   allowed, and the license explicitly lets finished games "be shared, published and sold in the normal way".
   It covers melee impacts, whooshes, creatures, foley, footsteps, horses, cloth and ambience beds. The catch is
   that the files are raw library source (long multi-take WAVs at 96/24), so each sound needs cutting. Use each
   year's track-list spreadsheet to find the magic, medieval and creature material.
2. **Kenney audio packs (CC0, free)**: Interface Sounds, UI Audio, RPG Audio, Impact Sounds. These are game-ready
   UI clicks, coins, confirm/cancel, pages, doors and small impacts, and there is nothing to track legally. Add
   the two CC0 OpenGameArt RPG packs (below) for more of the same.
3. **One paid, game-ready fantasy pack line: Ovani Sound.** Medieval Fantasy SFX Vol. 1–3 and RTS Fantasy
   (about $20 each), plus Fantasy / Orchestral Ambient music packs (about $50 each). The license is one-time and
   perpetual, credit is optional, and the packs are advertised as human-made with no AI. The RTS pack fits almost
   exactly: armored/ranged unit sounds, marching, gold clinks, building cues and UI. This fills the gaps where
   GDC material is thin or needs heavy editing, such as spell casts, holy/dark/curse and level-up stingers. The
   alternative is **Imphenzia Universal Sound FX** ($49, about 10k game-mastered files, any engine), which is
   broader but less fantasy-specific.
4. **Freesound, filtered to CC0 only, as a gap-filler.** Use it for the odd missing sound. Don't mix in CC-BY
   unless a sound is irreplaceable (see caveats).

**Music:** use the Ovani fantasy/orchestral-ambient packs, or CC0 tracks from OpenGameArt. Avoid Kevin MacLeod,
Pixabay music and Epidemic Sound (reasons in the caveats). ACE-Step (see `audio-pipeline.md`) is still an option.

Everything in the four picks above allows no-attribution commercial use inside a sold game. All of them forbid
the same thing: redistributing the raw files as a sound library. Sonniss and Ovani also forbid AI training.

## Sources

| Source | Cost | License summary | Attribution | In a shipped game (extractable files) | AI training | Seats | Fantasy-RPG fit / quality |
|---|---|---|---|---|---|---|---|
| **Sonniss GDC bundles** ([license](https://sonniss.com/gdc-bundle-license/), [archive](https://sonniss.com/gameaudiogdc/), [2026](https://gdc.sonniss.com/)) | Free | Worldwide, non-exclusive, royalty-free, lifetime, unlimited projects | Not required | Yes: "finished projects […] may be shared, published and sold". Not allowed: supplying them "as sound effects" or selling them as they come | **Prohibited** | Per licensee; anyone can download their own copy | Pro quality, huge; fantasy content varies by year; raw files that need editing |
| **Kenney** ([support/license](https://kenney.nl/support), [audio](https://kenney.nl/assets/category:Audio)) | Free | CC0 | No | Yes | No restriction | n/a | Small (50–130 per pack), clean, game-ready; strong for UI, light on combat/magic |
| **OpenGameArt** ([FAQ](https://opengameart.org/content/faq)) | Free | Per asset: CC0, CC-BY, CC-BY-SA, OGA-BY, GPL | Unless CC0 | CC-BY(-SA) forbids DRM ("technical measures"); OGA-BY allows it | Varies | n/a | Uneven. Good ones: [80 CC0 RPG SFX](https://opengameart.org/content/80-cc0-rpg-sfx), [RPG Sound Pack](https://opengameart.org/content/rpg-sound-pack) (CC0), [Little Robot Fantasy SFX](https://opengameart.org/content/fantasy-sound-effects-library) (CC-BY 3.0), [CC0 fantasy music](https://opengameart.org/content/cc0-fantasy-music-sounds) |
| **Freesound** ([FAQ](https://freesound.org/help/faq/)) | Free | Per sound: CC0, CC-BY 4.0, CC-BY-NC 4.0, legacy Sampling+ | CC-BY: title, author, link, license per sound | Yes for CC0/CC-BY | Allowed by the license; uploaders can set extra AI preferences | n/a | Enormous, from pro to junk; filter by license |
| **Zapsplat** ([EULA PDF, 2025-09-29](https://zapsplat-assets.s3.amazonaws.com/ZapSplat-EULA-Standard-License.pdf)) | Free (MP3 only, download caps) or Premium subscription (WAV, unlimited) | Perpetual, "Games, apps, and software" listed as permitted | Free: required ("ZapSplat" in credits). Premium: not required | Yes, embedded in a production. See the "ROMS" caveat | **Prohibited** | "a single user" | 150k+ sounds, decent; wide fantasy coverage. Premium downloads stay licensed, with no attribution, after you cancel |
| **Pixabay SFX/music** ([license summary](https://pixabay.com/service/license-summary/), [terms 2024-11-18](https://pixabay.com/service/terms/)) | Free | Pixabay Content License (not CC0) | Not required | Yes, unless distributed "on a Standalone basis" (content left in substantially the same form) | Pixabay may train on it; no limit on us | n/a | Uploaded by anyone, unvetted; uneven; music has Content ID claim problems |
| **Mixkit** ([license](https://mixkit.co/license/), [terms](https://mixkit.co/terms/)) | Free | Mixkit (Envato) free license | Not required | Yes inside a project; no redistribution unaltered | Not stated | n/a | Small, video-oriented; a handful of usable game/UI sounds |
| **Ovani Sound** ([ToS](https://ovanisound.com/policies/terms-of-service), [RTS Fantasy](https://ovanisound.com/products/rts-fantasy-sound-fx-pack), [Medieval Fantasy](https://ovanisound.com/products/medieval-fantasy-sound-fx-pack)) | About $20 per SFX pack, $50 per music pack, bundle discounts | Perpetual, one-time, games explicitly allowed | Appreciated, not required | Yes; not "on its own or separated from Attached Media" | **Prohibited** | Not addressed | Game-ready, fantasy/RTS-specific, music loops too. Best fit per dollar |
| **Imphenzia Universal Sound FX** ([product](https://imphenzia.com/universal-sound-fx), [license](https://imphenzia.com/license-terms)) | $49 (also on [itch](https://imphenzia.itch.io/universal-sound-fx) and the Unity store) | Commercial games allowed, any engine | Not required | Yes, in games. No selling or distributing the files | **Prohibited**, including use in content-generating software | Not addressed | 10,101 game-mastered 44.1/16 WAVs with magic, creatures, UI and ambience; generic but broad |
| **Sonniss store (paid libraries)** ([license](https://sonniss.com/license/), e.g. [Fantasy RPG bundle $399.99](https://sonniss.com/sound-effects/fantasy-rpg-sound-effects-bundle/)) | $20 to $400+ per library | Royalty-free, games explicitly allowed, no attribution | No | Yes, "synchronized within Licensee's project" | **Prohibited** | **Single user** ("sole editor"); multi-user license for teams | Pro, 96/24; expensive; overkill for now |
| **itch.io packs** (e.g. [Leohpaz](https://itch.io/profile/leohpaz), Shapeforms) | $2–$5 per pack | No platform-wide license; each page defines its own | Varies | Usually yes | Varies | Varies | Many cheap, stylistically consistent fantasy packs (Minifantasy creatures/spells); read each page |
| **Humble bundles** | $10–$30 when running | The license of each included vendor | Varies | Varies | Varies | Varies | Occasional audio bundles (Ovani, Sonniss partners, ELV music); none confirmed running now |
| **Unity Asset Store** ([EULA](https://unity.com/legal/as-terms)) | Per asset | Standard EULA: "embedded components of electronic games"; **not tied to Unity** except "restricted" / Unity Companion License assets | Not required | Yes | **Prohibited** | Per licensee (Editor extensions are per seat) | Big audio catalog; check each listing for "restricted" |
| **Fab (Epic)** ([licenses](https://dev.epicgames.com/documentation/en-us/fab/licenses-and-pricing-in-fab), [EULA](https://www.fab.com/eula)) | Per asset; Personal tier if revenue under $100k/yr | Fab Standard License: any engine or tool. Legacy "UE Marketplace License" items still exist | No (CC-BY items: yes) | Yes | NoAI-tagged items forbid it | Per licensee | Many ex-UE-Marketplace SFX packs; check each item's license |
| **Soundly Pro** ([license PDF](https://getsoundly.com/assets/Soundly-EULA.pdf)) | $14.99/mo ($12.49/mo yearly) | Subscription sync license | No | Yes, but **only game versions made during the subscription** | Upload to AI tools prohibited | One legal entity | Pro catalog. **Bad fit** for a game still in development (see caveats) |
| **Epidemic Sound** ([game dev](https://www.epidemicsound.com/game-development/)) | Commercial games need the API Scale/Enterprise plans (price not public) | Subscription | No | Only on those plans | Not checked | n/a | Built for video creators. **Skip** |
| **BBC Sound Effects** (RemArc) | Free | RemArc: **personal, educational or research use only**. Commercial use is licensed separately through Pro Sound Effects | n/a | **No** | n/a | n/a | Confirmed from secondary sources ([Avosound](https://www.avosound.com/en-us/licensing/remarc-license), [CineD](https://www.cined.com/bbc-gives-away-16000-sound-effects-for-free/)); bbc.co.uk was unreachable. **Don't use** |
| **Kevin MacLeod** ([licenses](https://incompetech.com/music/royalty-free/licenses/)) | Free with CC-BY 4.0, or a paid no-attribution Standard License | CC-BY 4.0 | "Title Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0" | Yes | n/a | n/a | Heavily overused, and few tracks suit dark fantasy. **Skip** |

## Caveats and ambiguities

- **The browser build exposes every file.** On the web, each `.ogg` is a fetchable URL, and an Electron build's
  asar can be unpacked. Every license here forbids redistributing the sounds *as sounds* and allows them inside a
  game. None requires encryption, and this setup is normal industry practice. To stay clearly on the "embedded in
  a production" side:
  - ship edited, re-encoded (Opus), loudness-normalized derivatives, never the source WAVs;
  - don't offer a sound-test download or a "soundpack" mod export.
- **Zapsplat's wording** bans redistribution "in any form ( […] physical media such as hard drives, DVDs, ROMS etc)",
  and in the same document allows "Games, apps, and software". The obvious reading is that files embedded in a game
  are fine and loose libraries are not, but the wording is loose. Its free tier also needs credit and is MP3 only.
- **AI clauses matter to this project.** Sonniss (GDC and store), Zapsplat, Ovani, Imphenzia, Unity and Soundly
  forbid using their sounds for AI training. Imphenzia also bans use in "software or services that generate
  content". So never use licensed sounds as Stable Audio 3 audio-to-audio input, style reference or fine-tuning
  data. Only CC0 material is safe for that.
- **Mixing in CC-BY** (Freesound, OpenGameArt, Zapsplat free, MacLeod) is legal but costs you something forever:
  per-file credits (title, author, link, license) in a credits screen or file. That's manageable only with a
  provenance manifest, and `audio-pipeline.md` already plans a license field per asset. Avoid **CC-BY-SA /
  CC-BY 3.0** on OpenGameArt: their no-DRM clause clashes with store DRM, though Steam's DRM is optional. Avoid
  **CC-BY-NC and Sampling+** entirely.
- **Soundly:** "only the version(s) of the video game Production produced during the term of this License will be
  licensed", and after cancelling "you must exclude the Licensed Works if you create any new major version". A game
  that keeps being developed would have to keep subscribing forever.
- **Epidemic:** anything published while subscribed stays cleared, but its standard creator plans don't cover
  commercial games.
- **Pixabay:** "Pixabay License" is not CC0 (a common confusion). Anyone can upload, so provenance is unverified
  (some "free" uploads are ripped). Music tracks can be registered with Content ID after you download them, which
  would hit players who stream the game. Prefer other sources.
- **Unity/Fab:** assets are usable outside those engines *unless* marked restricted / Unity Companion License
  (Unity) or carrying the legacy UE-only marketplace license (Fab). Check every listing.
- **GDC bundles:** each year's bundle is a sampler of commercial libraries. Nobody has checked here how much
  *fantasy* material there is. Skim the per-year track-list spreadsheets before downloading 200 GB (the disk is
  91% full). The 2015/2016 bundles came with their own license PDFs; the current license page is assumed to match
  them but wasn't compared.
- **Keep a license manifest from day one:** source, pack, original filename, license URL and date downloaded, per
  shipped file. That is the only defense if a claim ever arrives, and it makes credits automatic.

## Stable Audio 3 on notice (the user, 2026-10-05)
After the tarot card sounds: "This sfx model here isn't very good by the way […] this particular skill and model might be
something we'll remove from the equation entirely." Until the user decides, its takes stay provisional
(`assets/audio/SOURCES.md`); ElevenLabs is the decided route for SFX (above).
