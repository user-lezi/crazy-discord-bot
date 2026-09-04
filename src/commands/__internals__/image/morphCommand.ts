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
import { rgbToHsl } from "../../../util/color";

const WORK_SIZE = 512; // Computation resolution
const OUTPUT_SIZE = 512; // Final GIF resolution
const FORWARD_FRAMES = 36;
const FRAME_DELAY_MS = 90;
const BG_COLOR = "#2b2d31";
const BG_RGB = { r: 0x2b, g: 0x2d, b: 0x31 };

// How much a pixel's motion window overlaps with its neighbors' in sort-rank
// order. 0 = every pixel moves in perfect unison (old behavior).
// Close to 1 = a very tight cascading wipe. 0.55 gives a smooth staggered flow.
const STAGGER_FRACTION = 0.55;

export type SortBy =
  "luminance" | "hue" | "saturation" | "brightness" | "red" | "green" | "blue";

// Cache for downloaded images (URL -> Image object)
const imageCache = new Map<string, Image>();
const generatedCache = new Map<string, Buffer>();

type ProgressCallback = (percent: number, etaMs: number | null) => void;

export async function morphImageCommand(
  interaction: ChatInputCommandInteraction,
) {
  const user1 = interaction.options.getUser("from") ?? interaction.user;
  let user2 = interaction.options.getUser("to");

  const shouldLoop = interaction.options.getBoolean("loop") ?? true;
  const sortBy = (interaction.options.getString("sort_by") ??
    "luminance") as SortBy;

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

  const cacheKey = `${user1.id}:${user2.id}:${shouldLoop}:${sortBy}`;
  const cached = generatedCache.get(cacheKey);

  if (cached) {
    await interaction.editReply({
      content: `${user1.username} → ${user2.username}`,
      files: [new AttachmentBuilder(cached, { name: "morph.gif" })],
    });
    return;
  }

  await interaction.editReply({
    content: `🔄 Morphing **${user1.username}** → **${user2.username}**… starting up.`,
  });

  let lastEditAt = Date.now();
  const onProgress: ProgressCallback = (percent, etaMs) => {
    const now = Date.now();
    // Throttle: at most one edit every 1.5s, and skip once we're basically done
    if (now - lastEditAt < 1500 || percent >= 97) return;
    lastEditAt = now;

    const etaText =
      etaMs === null
        ? "estimating…"
        : `~${Math.max(1, Math.round(etaMs / 1000))}s left`;

    void interaction
      .editReply({
        content: `🔄 Morphing **${user1.username}** → **${user2.username}**… ${percent}% (${etaText})`,
      })
      .catch(() => {
        // Ignore transient edit failures (rate limit, message deleted, etc.)
      });
  };

  const gif = await buildPixelSortMorphGif(
    user1,
    user2,
    shouldLoop,
    sortBy,
    onProgress,
  );
  generatedCache.set(cacheKey, gif);

  await interaction.editReply({
    content: `${user1.username} → ${user2.username}`,
    files: [new AttachmentBuilder(gif, { name: "morph.gif" })],
  });
}

interface MappedPixel {
  r: number;
  g: number;
  b: number;
  a: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Fraction (0-1) of the sort-rank order this pixel occupies; drives stagger */
  rank: number;
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

async function buildPixelSortMorphGif(
  user1: User,
  user2: User,
  shouldLoop: boolean,
  sortBy: SortBy,
  onProgress?: ProgressCallback,
): Promise<Buffer> {
  const url1 = user1.displayAvatarURL({ extension: "png", size: WORK_SIZE });
  const url2 = user2.displayAvatarURL({ extension: "png", size: WORK_SIZE });

  const [image1, image2] = await Promise.all([
    fetchCachedImage(url1),
    fetchCachedImage(url2),
  ]);

  const rawPixels1 = getWeightedPixels(image1, sortBy);
  const rawPixels2 = getWeightedPixels(image2, sortBy);

  const sorted1 = rawPixels1.slice().sort((a, b) => a.weight - b.weight);
  const sorted2 = rawPixels2.slice().sort((a, b) => a.weight - b.weight);

  const total = sorted1.length;
  const mappedPixels: MappedPixel[] = new Array(total);
  for (let i = 0; i < total; i++) {
    const p1 = sorted1[i];
    const p2 = sorted2[i];

    mappedPixels[i] = {
      r: p1.r,
      g: p1.g,
      b: p1.b,
      a: p1.a,
      x1: p1.index % WORK_SIZE,
      y1: Math.floor(p1.index / WORK_SIZE),
      x2: p2.index % WORK_SIZE,
      y2: Math.floor(p2.index / WORK_SIZE),
      rank: i / (total - 1),
    };
  }

  const repeatSetting = shouldLoop ? 0 : -1;
  const encoder = new GifEncoder(OUTPUT_SIZE, OUTPUT_SIZE, {
    repeat: repeatSetting,
    quality: 10,
  });

  const workCanvas = createCanvas(WORK_SIZE, WORK_SIZE);
  const workCtx = workCanvas.getContext("2d");
  const outputCanvas = createCanvas(OUTPUT_SIZE, OUTPUT_SIZE);
  const outputCtx = outputCanvas.getContext("2d");
  outputCtx.imageSmoothingEnabled = true;

  const steps = getAnimationSteps(FORWARD_FRAMES, shouldLoop);

  // Reusable accumulation buffers (avoid reallocating every frame)
  const accR = new Float32Array(WORK_SIZE * WORK_SIZE);
  const accG = new Float32Array(WORK_SIZE * WORK_SIZE);
  const accB = new Float32Array(WORK_SIZE * WORK_SIZE);
  const accW = new Float32Array(WORK_SIZE * WORK_SIZE);
  const frameData = new Uint8ClampedArray(WORK_SIZE * WORK_SIZE * 4);

  const startedAt = Date.now();

  for (let stepIdx = 0; stepIdx < steps.length; stepIdx++) {
    const t = steps[stepIdx];

    renderFrameBuffer(mappedPixels, t, accR, accG, accB, accW, frameData);

    workCtx.putImageData(
      new (require("@napi-rs/canvas").ImageData)(
        frameData,
        WORK_SIZE,
        WORK_SIZE,
      ),
      0,
      0,
    );

    outputCtx.fillStyle = BG_COLOR;
    outputCtx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    outputCtx.drawImage(workCanvas, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const outFrame = new Uint8Array(
      outputCtx.getImageData(0, 0, OUTPUT_SIZE, OUTPUT_SIZE).data.buffer,
    );

    const isLastFrame = !shouldLoop && stepIdx === steps.length - 1;
    const delay = isLastFrame ? 2000 : FRAME_DELAY_MS;

    encoder.addFrame(outFrame, OUTPUT_SIZE, OUTPUT_SIZE, { delay });

    if (onProgress) {
      const framesDone = stepIdx + 1;
      const elapsed = Date.now() - startedAt;
      const percent = Math.round((framesDone / steps.length) * 100);
      const eta =
        framesDone >= 3
          ? (elapsed / framesDone) * (steps.length - framesDone)
          : null;
      onProgress(percent, eta);
      // Yield to the event loop so the progress edit above can actually be sent
      await sleep(0);
    }
  }

  return encoder.finish();
}

/**
 * Splats every mapped pixel into the accumulation buffers at its
 * currently-interpolated (staggered, eased) position using bilinear
 * weighting, then resolves the buffers into RGBA frame data blended
 * against the background. This avoids per-pixel canvas draw calls
 * entirely, which is the main performance win over fillRect-per-pixel.
 */
function renderFrameBuffer(
  pixels: MappedPixel[],
  globalT: number,
  accR: Float32Array,
  accG: Float32Array,
  accB: Float32Array,
  accW: Float32Array,
  out: Uint8ClampedArray,
): void {
  accR.fill(0);
  accG.fill(0);
  accB.fill(0);
  accW.fill(0);

  for (let i = 0; i < pixels.length; i++) {
    const p = pixels[i];

    // Staggered window: pixel starts moving at p.rank * STAGGER_FRACTION
    // and finishes within the remaining window, creating a cascade instead
    // of every pixel snapping along the same straight-line schedule.
    const localStart = p.rank * STAGGER_FRACTION;
    const localT = clamp((globalT - localStart) / (1 - STAGGER_FRACTION), 0, 1);
    const eased = easeInOutCubic(localT);

    const x = p.x1 + (p.x2 - p.x1) * eased;
    const y = p.y1 + (p.y2 - p.y1) * eased;

    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const alpha = p.a / 255;

    for (let dy = 0; dy <= 1; dy++) {
      const yy = y0 + dy;
      if (yy < 0 || yy >= WORK_SIZE) continue;
      const wy = dy ? fy : 1 - fy;

      for (let dx = 0; dx <= 1; dx++) {
        const xx = x0 + dx;
        if (xx < 0 || xx >= WORK_SIZE) continue;
        const wx = dx ? fx : 1 - fx;

        const w = wx * wy * alpha;
        if (w <= 0) continue;

        const idx = yy * WORK_SIZE + xx;
        accR[idx] += p.r * w;
        accG[idx] += p.g * w;
        accB[idx] += p.b * w;
        accW[idx] += w;
      }
    }
  }

  for (let idx = 0; idx < accW.length; idx++) {
    const w = accW[idx];
    const o = idx * 4;

    if (w <= 0.001) {
      out[o] = BG_RGB.r;
      out[o + 1] = BG_RGB.g;
      out[o + 2] = BG_RGB.b;
      out[o + 3] = 255;
      continue;
    }

    const coverage = clamp(w, 0, 1);
    const r = accR[idx] / w;
    const g = accG[idx] / w;
    const b = accB[idx] / w;

    out[o] = r * coverage + BG_RGB.r * (1 - coverage);
    out[o + 1] = g * coverage + BG_RGB.g * (1 - coverage);
    out[o + 2] = b * coverage + BG_RGB.b * (1 - coverage);
    out[o + 3] = 255;
  }
}

function computeWeight(
  r: number,
  g: number,
  b: number,
  sortBy: SortBy,
): number {
  switch (sortBy) {
    case "hue":
      return rgbToHsl(r, g, b).h;
    case "saturation":
      return rgbToHsl(r, g, b).s;
    case "brightness":
      return (r + g + b) / 3;
    case "red":
      return r;
    case "green":
      return g;
    case "blue":
      return b;
    case "luminance":
    default:
      return 0.299 * r + 0.587 * g + 0.114 * b;
  }
}

function getWeightedPixels(
  image: Image | Canvas,
  sortBy: SortBy,
): WeightedPixel[] {
  const canvas = createCanvas(WORK_SIZE, WORK_SIZE);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, WORK_SIZE, WORK_SIZE);

  const data = ctx.getImageData(0, 0, WORK_SIZE, WORK_SIZE).data;
  const pixels: WeightedPixel[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    const weight = computeWeight(r, g, b, sortBy);

    pixels.push({ r, g, b, a, weight, index: i / 4 });
  }

  return pixels;
}

function getAnimationSteps(
  forwardFrames: number,
  shouldLoop: boolean,
): number[] {
  if (shouldLoop) {
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

  return Array.from(
    { length: forwardFrames },
    (_, i) => i / (forwardFrames - 1),
  );
}
