# Music sources: AI generators vs human-made (research, 2026-09-27; nothing downloaded or signed up for)

The question was: would Suno's license mess us up, and what are the alternatives for faction music (4 factions,
each with map themes and a rotating battle list, so roughly 12–20 tracks)? A Claude agent researched this on the
web on the date above. The companion doc `audio-sources.md` covers SFX and human-made packs in more depth, and
`audio-pipeline.md` covers the ACE-Step setup. **Terms change often (Suno changed its terms on 2026-09-03). Recheck
on the day you generate or buy, and save a copy of the terms with the files.** This is not legal advice.

## The user's direction (2026-09-30)
The user tried Suno's free tier: "well beyond anything we could possibly make ourselves through our local tools". The Grove battle track (prompt in `factions/sylvan.md`) is "just perfect". Plan: churn out as much as is reasonable per faction, as long as each faction's mood is captured. Style rule: low, brooding music; a strategy game isn't high-octane. **Free-tier tracks can't ship** (below): keep the prompts, and regenerate the keepers on a paid month.

## Update (user, 2026-10-04): Suno's limit, and MiniMax-Music3
- **Suno caps downloads at 20 a month** (Pro), which is limiting; the user cancelled, with the rest of the month left. The seven Grove battle tracks are in the game (`assets/audio/SOURCES.md`).
- **MiniMax-Music3** (https://huggingface.co/MiniMaxAI/MiniMax-Music3), the user's candidate to replace it, **runs locally**: full songs up to 5 minutes (with vocals or arrangements), 32 kHz stereo WAV, under 24 GB of VRAM (our cards are 24 GB; layer streaming fits 8 GB), via SGLang-Omni, Diffusers or ComfyUI. **License (MiniMax-Music3 Community License, read 2026-10-04):** commercial use allowed, but "You shall prominently display 'MiniMax-Music3' on the user interface of commercial product or service that uses the Software", and authorization is needed above $20M yearly revenue. No territorial restriction stated; output ownership not addressed. So it's usable with a visible credit (where it must show, a credits screen or the main menu, is worth confirming). ACE-Step 1.5 (MIT, installed, made the current placeholders) stays the no-strings fallback. Next: a side-by-side with the Grove prompt once the user wants it.

## Short answer on Suno

**The contract doesn't block a paid game, but Suno is the weakest of the realistic options.**

- **Free tier: unusable.** Output is "personal and non-commercial" only, and Suno keeps ownership. A track made on
  the free tier stays non-commercial even if you subscribe later.
- **Pro/Premier: commercial use is allowed, but only for tracks you download within the monthly allowance.** Since
  2026-09-03 that is 20 a month on Pro and 60 on Premier; the free tier gets 7 for the life of the account. Rights
  in a downloaded track are "perpetual and … not affected by … the expiry, cancellation, downgrade or suspension of
  your subscription". The terms don't restrict games or require attribution. One month of Pro would cover the
  soundtrack.
- **What can actually hurt us:**
  1. **There is probably no copyright to own.** In the US, purely AI output isn't copyrightable (Copyright Office,
     January 2025; the Supreme Court declined *Thaler* on 2026-03-02). Suno's terms also say the output "may not be
     unique across users". Anyone could reuse the soundtrack, and a stranger could generate a near-identical track
     and register it with Content ID, which would flag players' streams.
  2. **Suno is still being sued, with no indemnity for us.** Warner settled in November 2025. On about
     2026-09-18, UMG and Sony filed a second suit alleging the new licensed v6 models are still "fruit of the
     poisoned tree". The suits target Suno, not users, but Suno gives users no indemnity.
  3. **Suno keeps a sublicensable licence to our outputs** and may show them to other users. It may also watermark
     or fingerprint downloads by tier.
  4. **Steam requires a disclosure.** It's allowed, but it goes on the store page, and part of the audience reacts
     badly to AI music in a paid game.

Udio is worse: downloads have been disabled since the UMG settlement (October 2025), so nothing can go into the
game at all.

## Recommendation (ranked for this project)

1. **Human-made royalty-free packs now, starting with Ovani Sound's Dark Fantasy / Fantasy music packs.** Each pack
   is $50 one-time and perpetual. It has 10 tracks × 5 variants (three intensity levels plus 30 s and 60 s cuts),
   loopable, 48 kHz/24-bit. Credit is optional. Ovani vets tracks for Content ID and supports disputes. Three or
   four packs (about $150–200) cover 4 factions × map + battle. Add itch.io RPG packs (Owl Theory, Lufus and
   others, each with its own license) to fill gaps. These packs need no Steam AI disclosure and carry no copyright
   uncertainty.
   *Key risk:* the music isn't exclusive, so other games use the same tracks, and faction identity is limited to
   whatever the packs happen to contain. Each pack forbids AI training, so never feed these tracks to
   ACE-Step or Stable Audio as a reference.
2. **Keep local generation, but on a licensed-data model: Stable Audio 3 Medium alongside ACE-Step 1.5.** This
   costs nothing and gives full control. It fits the project's local-open-models approach.
   - SA3 Medium (open weights, released 2026-05-20) was trained on AudioSparx-licensed plus Freesound CC
     recordings, with copyrighted music filtered out. It is under the Stability Community License: free
     commercial use and outputs owned by the user, up to $1M annual revenue.
   - ACE-Step 1.5 is MIT with no revenue cap.
   - Before giving up on quality, try a stricter brief: "instrumental, no vocals, slow, minor key, dark orchestral",
     a low BPM, and negative tags. The "upbeat, weird" results may come from the model's pop bias. SA3 SFX
     disappointed, but that doesn't prove its music is bad.

   *Key risk:* the quality ceiling (already seen). A Steam disclosure is needed, and the output probably has no
   copyright.
3. **Commission a composer for the four faction main themes, closer to the Steam release.** GameSoundCon's 2025
   survey puts the average indie freelance rate at about $618 per finished minute (range up to about $2,100).
   Four themes of about 2 minutes each would cost roughly $3–5k at average rates. Newer composers charge much
   less, and some work for revenue share. Negotiate a buyout or an exclusive license that includes soundtrack
   sales, and ask for stems so the tracks can be looped and layered. Packs or generated tracks can fill the
   rotating battle list.
   *Key risk:* cost and lead time. The contract must spell out ownership, soundtrack rights and whether the
   composer may use AI.

**Not recommended:** Suno (above); Udio (no downloads); ElevenLabs Music on self-serve plans (they exclude "Studio
Games", and disc on web plus Steam would count as one, see the table); Beatoven, Soundraw and Mubert (the vendor
owns the output; Mubert's licence is tied to the subscription).

## Comparison

| Option | Cost | Who owns output | Commercial / game use | Caveats | Source |
|---|---|---|---|---|---|
| **Suno Free** | $0 | Suno | No: "personal and non-commercial" only | 7 downloads per account lifetime; can't be relicensed later by upgrading | [ToS (rev. 2026-08-10, eff. 2026-09-03)](https://suno.com/terms-of-service), [help](https://help.suno.com/en/articles/2416769) |
| **Suno Pro / Premier** | about $8–10 / $24–30 a month | ToS: Suno "assigns … all of its right, title and interest" to you. Press reports say the "owner" wording was softened after the Warner deal (**conflicting; recheck**). In practice there is likely no copyright either way | Yes, only for tracks downloaded within the allowance (20/60 a month; Studio exempt); perpetual after cancelling; no attribution | No indemnity; outputs "may not be unique"; Suno may sublicense outputs to other users and watermark downloads; the UMG/Sony suits are active; prior models retired for the v6 licensed models | [ToS](https://suno.com/terms-of-service), [MBW caps](https://www.musicbusinessworldwide.com/suno-limits-subscribers-downloads-per-month/), [Engadget 2026-09-18](https://www.engadget.com/2262978/sony-music-and-umg-say-sunos-new-models-still-violates-their-copyright/), [Music in Africa](https://musicinafrica.net/magazine/suno-adjusts-ai-music-ownership-terms-after-warner-music-partnership/) |
| **Udio** | Subscription | n/a | **Not possible**: audio, video and stem downloads disabled | UMG settlement 2025-10-29; Warner deal Nov 2025; a licensed "walled garden" platform was promised for 2026 with no download date | [Udio help](https://help.udio.com/en/articles/12683565-changes-associated-with-the-universal-music-group-umg-partnership), [Billboard](https://www.billboard.com/pro/udio-deal-backlash-ai-users-download-ai-songs-48-hours/) |
| **ElevenLabs Music** | Self-serve plans; Enterprise by quote | Terms don't state ownership | Self-serve: commercial "except for film, TV, and Studio Games". Studio Games are commercialised games "available … through more than one platform", so web plus Steam counts. Enterprise: all uses | Trained under Merlin/Kobalt licenses; outputs stay under the plan they were created on | [product page](https://elevenlabs.io/music), [music terms](https://elevenlabs.io/eleven-music-model-specific-terms) |
| **Stable Audio 3 Small/Medium (local, open weights)** | $0 (GPU time) | You (Community License) | Yes, free up to $1M annual revenue, then an Enterprise license (which also brings indemnity) | Licensed training data (AudioSparx + Freesound CC); includes Gemma-licensed text encoder; quality unproven here for music | [Stability announcement](https://stability.ai/news-updates/meet-stable-audio-3-the-model-family-built-for-artistic-experimentation-with-open-weight-models), [HF card](https://huggingface.co/stabilityai/stable-audio-3-medium), [license](https://stability.ai/license) |
| **Stable Audio hosted / SA3 Large** | Subscription / API | Paid tiers: commercial rights (from secondary sources, **unverified on Stability's site**) | Reportedly yes on paid tiers, including games | Large is API-only | [Dynamoi](https://dynamoi.com/learn/ai-music-distribution/can-i-distribute-stable-audio-commercially) |
| **ACE-Step 1.5 (current)** | $0 | You (MIT; no claim on outputs) | Yes | Pop/"upbeat" bias seen so far; the training-data claim is the project's own (see `audio-pipeline.md`) | [GitHub](https://github.com/ace-step/ACE-Step-1.5) |
| **Google Lyria 3 / 3.5 (Gemini API, Vertex, Gemini app, Flow Music)** | Paid API / Gemini plan | Customer (under Google's generative-AI terms, per secondary sources) | Commercial use on paid surfaces, per secondary sources; **not confirmed on a Google terms page** | SynthID watermark on every output; up to about 3 min; whether Vertex IP indemnity covers Lyria is **unverified** | [Google blog 2026-03-25](https://blog.google/innovation-and-ai/technology/ai/lyria-3-pro/), [RightsDocket](https://www.rightsdocket.com/insights/google-lyria-3-commercial-use-copyright) |
| **AIVA** | Free / €11 / €33 a month (annual billing) | Free and Standard: AIVA. **Pro: "Owned by YOU"** (full copyright assignment) | Standard monetizes only on YouTube, Twitch, TikTok and Instagram, so **Pro is needed for a game** | Composition engine with MIDI export (a human can re-orchestrate); EULA says to delete non-owned compositions when the license ends | [pricing](https://www.aiva.ai/pricing), [EULA](https://www.aiva.ai/legal/1) |
| **Beatoven.ai** | Subscription | **Beatoven** | Perpetual licence only "as … synchronized with Your Content"; no selling copies or streaming distribution | Credit "Music by Beatoven.ai" required "wherever practicable" | [ToS](https://www.beatoven.ai/tos) |
| **Soundraw** | Subscription (Creator plan) | Soundraw (per its blog; **not checked in the ToS**) | Games listed as allowed | Can't distribute unmodified tracks; no Content ID; some categories need an active subscription to stay published | [license](https://soundraw.io/license), [blog](https://soundraw.io/blog/post/do-i-own-the-copyright-of-music-generated-with-soundraw) |
| **Mubert Render** | $39 (Pro) / $199 (Business) a month | Mubert | "Apps & Services" on Pro/Business | Licensed "as long as your Subscription Period lasts"; **silent on already-shipped works**. Poor fit | [license](https://mubert.com/render/license), [subscription agreement](https://mubert.com/render/docs/subscription-agreement) |
| **Ovani Sound music packs** | $50 per pack, one-time (bundles cheaper) | Ovani (you get a license) | Yes, perpetual, games explicitly allowed; credit optional | Non-exclusive; no AI training; no redistributing raw files | [Dark Fantasy Vol. 1](https://ovanisound.com/products/dark-fantasy-music-pack-vol-1) |
| **itch.io / Humble packs** | $5–$40 a pack; Humble bundles when running | Composer (license) | Usually yes; each page sets its own terms | Read each license; quality and consistency vary | [e.g. Owl Theory](https://owl-theory-music.itch.io/rpg-music-pack-the-complete-collection), [GameFromScratch on Humble](https://gamefromscratch.com/big-royalty-free-game-dev-music-and-sfx-bundle/) |
| **Unity Asset Store / Fab** | Per asset | Publisher (license) | Yes when embedded; usable in any engine unless marked restricted (Unity) or carrying the legacy UE-only license (Fab); Fab Professional tier above $100k revenue | No extractable standalone soundtrack sale | [Unity EULA FAQ](https://assetstore.unity.com/browse/eula-faq), [Fab EULA](https://www.fab.com/eula?lang=en) |
| **CC0 (OpenGameArt)** | $0 | Public domain | Yes | Uneven quality; provenance only as good as the uploader | [OGA CC0 fantasy](https://opengameart.org/content/cc0-fantasy-music-sounds) |
| **CC-BY (e.g. Kevin MacLeod)** | $0, or about $20–30 per song without attribution | Author | Yes, with credit | Overused; little dark fantasy (see `audio-sources.md`) | [incompetech FAQ](https://incompetech.com/music/royalty-free/faq.html) |
| **Commissioned composer** | About $618 per finished minute on average for indie work (range up to about $2,100) | Whatever the contract says (buyout or license) | Yes, as contracted | Cost and lead time; get soundtrack rights and stems in writing | [GameSoundCon 2025 survey](https://www.gamesoundcon.com/post/gamesoundcon-game-audio-industry-survey-2025) |

## Caveats

- **Copyright in AI output.** The US Copyright Office's January 2025 report says prompts alone aren't enough for
  authorship. Human selection, arrangement or modification can be protected, but only that human part. The
  Supreme Court declined *Thaler v. Perlmutter* on 2026-03-02 ([Morgan Lewis](https://www.morganlewis.com/pubs/2026/03/us-supreme-court-declines-to-consider-whether-ai-alone-can-create-copyrighted-works)).
  For a game this doesn't stop us selling it. It means we can't stop others from reusing the music, and a
  vendor's "you own it" assigns little. Other countries differ; the UK, for example, has a computer-generated
  works provision. That wasn't researched here.
- **Steam.** Valve's content survey (clarified 2026-01-16) requires disclosing AI-made content that players see or
  hear. That includes pre-generated music, which then follows the same rules as other content. It shows on the
  store page. Development-only tools are exempt ([PC Gamer](https://www.pcgamer.com/software/ai/steam-updates-ai-disclosure-form-to-specify-that-its-focused-on-ai-generated-content-that-is-consumed-by-players-not-efficiency-tools-used-behind-the-scenes/)).
  This covers ACE-Step and Stable Audio output as much as Suno's.
- **Suno's lawsuits.** The facts about the second UMG/Sony suit (60,202 recordings; v6 allegedly trained partly on
  outputs of the earlier models) come from press reports. It's unclear from the sources whether the original
  2024 case has been stayed or is still active. The BMG and Believe deals with Suno appear in one secondary
  source only.
- **Suno's ownership wording** differs between the ToS (an assignment of Suno's rights), the help centre ("you are
  considered the owner") and press reports (after the Warner deal, users are "not considered the owner"). The ToS
  controls; read it on the day. Because pure AI output likely has no copyright, the practical difference is small.
- **Soundtrack sales** (a Steam soundtrack DLC) are forbidden or unclear for Beatoven, Soundraw, Mubert and
  Unity/Fab assets, and not addressed for Ovani. Suno and AIVA Pro don't forbid them. For a commissioned
  composer, it depends on the contract.
- **Keep provenance.** For every shipped track, record the tool or pack, the plan or license, the date, the
  prompt or seed and a copy of the terms. For Suno this also means proof that the track was a counted download.
