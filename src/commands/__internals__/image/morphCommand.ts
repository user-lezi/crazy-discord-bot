import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  User,
} from "discord.js";
import {
  Canvas,
  GifEncoder,
  Image,
  createCanvas,
  loadImage,
} from "@napi-rs/canvas";

import { getCachedGuildMembers } from "../../../functions/getCachedGuildMembers";
import { pick } from "../../../util/random";

const SIZE = 512; // Increased size for better quality
const FORWARD_FRAMES = 32; // Increased frame count to slow down speed smoothly
const FRAME_DELAY_MS = 85; // Slightly higher delay per frame
const BG_COLOR = "#2b2d31";

// Cache for downloaded images (URL -> Image object)
const imageCache = new Map<string, Image>();
const generatedCache = new Map<[string, string, boolean], Buffer>();

export async function morphImageCommand(
  interaction: ChatInputCommandInteraction,
) {
  const user1 = interaction.options.getUser("from") ?? interaction.user;
  let user2 = interaction.options.getUser("to");

  // Read loop preference (true = ping-pong loop, false = play once & hold end)
  const shouldLoop = interaction.options.getBoolean("loop") ?? true;

  if (!user2) {
    if (!interaction.guild) {
      await interaction.reply({
        content:
          "You need to pass a `to` user when using this outside a server.",
        ephemeral: true,
      });
      return;
    }

    const fetched = await getCachedGuildMembers(interaction.guild);
    const candidates = [...fetched.values()].filter(
      (m) => !m.user.bot && m.id !== user1.id,
    );

    if (candidates.length === 0) {
      await interaction.reply({
        content: "Couldn't find another non-bot member to morph with.",
        ephemeral: true,
      });
      return;
    }

    user2 = pick(candidates).user;
  }

  if (user2.id === user1.id) {
    await interaction.reply({
      content: "Can't morph someone into themselves.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();
  let gif = generatedCache.get([user1.id, user2.id, shouldLoop]);
  gif ??= await buildPixelSortMorphGif(user1, user2, shouldLoop);
  generatedCache.set([user1.id, user2.id, shouldLoop], gif);
  const attachment = new AttachmentBuilder(gif, { name: "morph.gif" });

  await interaction.editReply({
    content: `${user1.username} → ${user2.username}`,
    files: [attachment],
  });
}

interface PositionedPixel {
  r: number;
  g: number;
  b: number;
  a: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface WeightedPixel {
  r: number;
  g: number;
  b: number;
  a: number;
  weight: number;
  index: number;
}

/** Fetches avatar image with in-memory cache fallback */
async function fetchCachedImage(url: string): Promise<Image> {
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }
  const loaded = await loadImage(url);
  imageCache.set(url, loaded);
  return loaded;
}

async function buildPixelSortMorphGif(
  user1: User,
  user2: User,
  shouldLoop: boolean,
): Promise<Buffer> {
  const url1 = user1.displayAvatarURL({ extension: "png", size: SIZE });
  const url2 = user2.displayAvatarURL({ extension: "png", size: SIZE });

  // Use cached avatar loaders
  const [image1, image2] = await Promise.all([
    fetchCachedImage(url1),
    fetchCachedImage(url2),
  ]);

  const rawPixels1 = getWeightedPixels(image1);
  const rawPixels2 = getWeightedPixels(image2);

  const sorted1 = rawPixels1.slice().sort((a, b) => a.weight - b.weight);
  const sorted2 = rawPixels2.slice().sort((a, b) => a.weight - b.weight);

  const mappedPixels: PositionedPixel[] = new Array(sorted1.length);
  for (let i = 0; i < sorted1.length; i++) {
    const p1 = sorted1[i];
    const p2 = sorted2[i];

    mappedPixels[i] = {
      r: p1.r,
      g: p1.g,
      b: p1.b,
      a: p1.a,
      x1: p1.index % SIZE,
      y1: Math.floor(p1.index / SIZE),
      x2: p2.index % SIZE,
      y2: Math.floor(p2.index / SIZE),
    };
  }

  // repeat: 0 loops infinitely, repeat: -1 stops after 1 cycle
  const repeatSetting = shouldLoop ? 0 : -1;
  const encoder = new GifEncoder(SIZE, SIZE, {
    repeat: repeatSetting,
    quality: 10,
  });
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");

  const steps = getAnimationSteps(FORWARD_FRAMES, shouldLoop);

  for (let stepIdx = 0; stepIdx < steps.length; stepIdx++) {
    const t = steps[stepIdx];

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Ease-in-out curve for gentle acceleration/deceleration
    const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    for (let i = 0; i < mappedPixels.length; i++) {
      const p = mappedPixels[i];

      const x = p.x1 + (p.x2 - p.x1) * easeT;
      const y = p.y1 + (p.y2 - p.y1) * easeT;

      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${p.a / 255})`;
      ctx.fillRect(x, y, 1.2, 1.2);
    }

    const frameBytes = new Uint8Array(
      ctx.getImageData(0, 0, SIZE, SIZE).data.buffer,
    );

    // Hold final frame longer if non-looping so the result stays visible
    const isLastFrame = !shouldLoop && stepIdx === steps.length - 1;
    const delay = isLastFrame ? 2000 : FRAME_DELAY_MS;

    encoder.addFrame(frameBytes, SIZE, SIZE, { delay });
  }

  return encoder.finish();
}

function getWeightedPixels(image: Image | Canvas): WeightedPixel[] {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, SIZE, SIZE);

  const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
  const pixels: WeightedPixel[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    const weight = 0.299 * r + 0.587 * g + 0.114 * b;

    pixels.push({ r, g, b, a, weight, index: i / 4 });
  }

  return pixels;
}

/** Generates sequence steps depending on loopback mode */
function getAnimationSteps(
  forwardFrames: number,
  shouldLoop: boolean,
): number[] {
  if (shouldLoop) {
    // Forward + Backward loop ping-pong
    return [
      ...Array.from(
        { length: forwardFrames },
        (_, i) => i / (forwardFrames - 1),
      ),
      ...Array.from(
        { length: forwardFrames - 2 },
        (_, i) => 1 - (i + 1) / (forwardFrames - 1),
      ),
    ];
  }

  // One-way journey (0 to 1) and stop
  return Array.from(
    { length: forwardFrames },
    (_, i) => i / (forwardFrames - 1),
  );
}
