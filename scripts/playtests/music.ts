import type { Playtest } from "#scripts/playtests/harness";

const music: Playtest = {
  name: "music",
  about: "a Grove-vs-Jilliath fight played by the AI: both themes start, and the music follows whoever is winning",
  async run(t) {
    await t.open(`/?fight=${process.env["MUSIC_FIGHT"] ?? "grove:decay"}&auto=1&fast`);
    // Browsers open audio on the first click.
    await t.page.mouse.click(5, 5);
    const leads: (0 | 1)[] = [];
    let tracks: (string | null)[] = [null, null];
    for (let i = 0; i < 400; i++) {
      const now = await t.page.evaluate(() => window.discDebug.music());
      if (now) {
        tracks = now.tracks;
        if (leads.at(-1) !== now.lead) leads.push(now.lead);
      }
      if ((await t.battleLog()).some((line) => /prevails|Victory|Defeat|None survive/.test(line))) break;
      await t.page.waitForTimeout(250);
    }
    t.log(`tracks: ${tracks.join(" | ")}`);
    t.log(`the music followed: ${leads.map((side) => `side ${side}`).join(" → ")}`);
    // Jilliath attacks in these fights; the enemy's theme is its faction's (bandits have none and share Jilliath's).
    const enemy = (process.env["MUSIC_FIGHT"] ?? "grove:decay").split(":")[0];
    const expected = enemy === "bandits" ? "jilliath" : enemy;
    if (!tracks[0]?.startsWith("jilliath/") || !tracks[1]?.startsWith(`${expected}/`)) t.fail(`each side should play its own faction's theme: ${tracks.join(" | ")}`);
    if (leads.length === 0) t.fail("no battle music state");
  },
};

export default music;
