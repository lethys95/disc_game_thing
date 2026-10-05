import { runBatch } from "#scripts/art/batch";

/**
 * Tarot card art (the user, 2026-10-05): the Major Arcana, "mysterious enigmatic themes you usually see with tarot
 * cards, but within our universe", 2D; maybe browns rather than more grey: "try things out. Be creative." Claude's
 * prompts, styles and reviews (`docs/design/tarot-art.md`); every round is kept.
 *
 * `pnpm exec tsx scripts/art/tarot.ts <id pattern…> <seed…>`: ids are `<style>-<arcana>`, and a pattern may use `*`
 * (`engraving-*`, `*-death`).
 */

/** Text in generated images comes out garbled: the card's name and number belong to the UI, not the picture. */
const NO_TEXT = "No text, no letters, no numbers, no writing anywhere on the card.";

const CARD = "A single tarot card, the whole card visible with a narrow margin, upright, its picture framed by an ornate border.";

const STYLES: Readonly<Record<string, string>> = {
  // The game's look so far (the unit portraits' recipe), for comparison: the user asked whether browns would do better.
  grey:
    "Dark painterly fantasy illustration with a gothic reliquary mood: sacred things worn thin by use, tarnished metal, bone, old lacquer, cracked stone. A desaturated palette of umber, ash, bone and oxidized iron. Chiaroscuro lighting with deep shadows. Solemn and enigmatic.",
  engraving:
    "In the manner of an old hand-tinted woodcut engraving: fine black linework and crosshatching, coloured with faded washes of umber, sepia, ochre and rust brown on aged, stained parchment; the border a thorny gothic filigree. Enigmatic and symbolic.",
  oil:
    "Painted in dark oils like an old master: rich browns, burnt sienna, umber and old gold, deep shadows and warm candlelit highlights, cracked varnish; the border carved dark wood and tarnished gilt in gothic tracery. Mysterious and enigmatic.",
  gilded:
    "Like a page of a medieval illuminated manuscript and a church reliquary icon: a ground of dark brown and black, tarnished gold leaf with tooled patterns and halos, deep oxblood red and muted ochre, flat stylized figures; the border gilded gothic tracery. Sacred, strange and enigmatic.",
};

/**
 * The Major Arcana: the classic images, made strange and gothic, about no one in particular. The user (2026-10-05): not
 * the game's units, "you risk making our universe look smaller… Tarot cards are about mystery. If we just see more of
 * our units, it becomes less so." (Round one, the colour probe, still carried unit motifs: a carnival jester, moths,
 * Nexus lightning, roots; the git history has those prompts.)
 */
const ARCANA: Readonly<Record<string, string>> = {
  fool: "The Fool: a young wanderer in ragged, once-fine clothes strides toward a cliff's edge at dusk, eyes on the sky, a bundle on a stick over one shoulder and a white rose in hand, a small lean dog leaping at his heels; far mountains, a pale sun low on the horizon.",
  magician: "The Magician: a robed figure at a stone altar raises a rod to the sky, the other hand pointing to the earth; on the altar a blade, a chalice, a coin and a wand; an infinity loop above the head; roses and lilies twined around the altar.",
  "high-priestess": "The High Priestess: a veiled woman sits between two pillars, one black and one bone-white, before a curtain embroidered with pomegranates, a crescent moon at her feet, a half-hidden scroll in her lap.",
  empress: "The Empress: a crowned woman enthroned in a dark, overgrown garden, a crown of twelve stars, a heavy gown patterned with pomegranates, sheaves of wheat at her feet, a stream falling behind her.",
  emperor: "The Emperor: a stern armored king on a throne of grey stone carved with rams' heads, a sceptre and an orb, a long white beard, barren red-brown mountains behind him.",
  hierophant: "The Hierophant: a robed high priest in a triple crown raises a hand in blessing from a stone throne between two pillars; two tonsured acolytes kneel before him; two crossed keys at his feet.",
  lovers: "The Lovers: two figures, a man and a woman, reach toward each other beneath a tree, one bare and one in fruit; above them a veiled winged figure spreads its arms in a burst of pale light; a serpent coils around the fruiting tree.",
  chariot: "The Chariot: a crowned warrior in dark armor stands in a stone chariot under a canopy of stars, drawn by two sphinxes, one black and one white, pulling in different directions; a walled city behind.",
  strength: "Strength: a calm woman in a white robe gently closes the jaws of a great lion with her bare hands, a wreath of flowers in her hair, an infinity loop above her head.",
  hermit: "The Hermit: a hooded old man in a grey cloak stands alone on a snowy peak at night, holding up a lantern with a six-pointed star inside, a long staff in his other hand.",
  "wheel-of-fortune": "Wheel of Fortune: a great wheel covered in arcane symbols turns in the clouds; a sphinx with a sword sits on top, a serpent descends on one side and a jackal-headed figure rises on the other; four winged creatures read books in the corners.",
  justice: "Justice: a crowned figure in a red robe sits between two pillars, a raised sword in one hand and balanced scales in the other, a purple veil behind.",
  "hanged-man": "The Hanged Man: a man hangs upside down by one foot from a living T-shaped tree, his hands behind his back, his face serene, a faint halo around his head.",
  death: "Death: a skeleton in black armor rides a pale horse carrying a black banner marked with a white rose; a fallen king lies before it, a bishop kneels, a child offers flowers; a sun rises between two towers far behind.",
  temperance: "Temperance: a winged angel in a white robe, one foot on the land and one in a still pool, pours water from one cup into another in an impossible arc; irises grow at the water's edge; a path leads to a distant crown of light.",
  devil: "The Devil: a horned, goat-headed winged figure squats on a black pedestal, one hand raised, an inverted torch in the other, an inverted pentagram above its head; a man and a woman stand chained loosely to the pedestal, small horns and tails on them.",
  tower: "The Tower: a tall dark stone tower on a crag is split by a bolt of lightning, its crown blown off, fire bursting from the windows, two figures falling headlong, sparks like falling stars.",
  star: "The Star: a woman kneels by a pool at night, pouring water from two jugs, one into the pool and one onto the land; above her one great eight-pointed star and seven small ones; a bird on a far tree.",
  moon: "The Moon: a full moon with a sleeping face sheds dew between two towers; a path winds from a pool, where a crayfish crawls out, toward the mountains; a dog and a wolf howl up at it.",
  sun: "The Sun: a stern-faced sun blazes over a crumbling garden wall lined with tall sunflowers, some withering; a child with a red banner rides a pale horse below.",
  judgement: "Judgement: a great angel in the clouds sounds a long trumpet hung with a banner of a cross; below, the dead rise from open stone coffins on a grey sea, their arms raised.",
  world: "The World: a dancer wrapped in a sash floats inside a great oval wreath of dark leaves, holding a wand in each hand; in the four corners a winged man, an eagle, a bull and a lion look on.",
};

const JOBS = Object.entries(STYLES).flatMap(([style, look]) =>
  Object.entries(ARCANA).map(([arcana, subject]) => ({ id: `${style}-${arcana}`, prompt: `${CARD} ${subject} ${look} ${NO_TEXT}`, width: 768, height: 1344 })),
);

const args = process.argv.slice(2);
const seeds = args.map(Number).filter((n) => !Number.isNaN(n));
const patterns = args.filter((a) => Number.isNaN(Number(a))).map((a) => new RegExp(`^${a.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`));
const chosen = JOBS.filter((j) => patterns.length === 0 || patterns.some((p) => p.test(j.id)));
if (chosen.length === 0) throw new Error(`no tarot jobs match ${args.join(" ")}`);
await runBatch("art/candidates/ui/tarot", chosen, seeds.length > 0 ? seeds : [1000, 1001]);
