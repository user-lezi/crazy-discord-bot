import { createCanvas, loadImage } from "@napi-rs/canvas";
import { AttachmentBuilder, User } from "discord.js";

export type MemeType = "simple-caps" | "pov" | "demotivator";

export interface MemeInput {
  type: MemeType;
  topCaption: string;
  bottomCaption: string;
  user: User;
}

const WIDTH = 900;
const HEIGHT = 700;

type CanvasContext = ReturnType<ReturnType<typeof createCanvas>["getContext"]>;

function drawCover(
  context: CanvasContext,
  image: Awaited<ReturnType<typeof loadImage>>,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
}

function wrapText(
  context: CanvasContext,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCaption(
  context: CanvasContext,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  color = "#ffffff",
): void {
  if (!text.trim()) return;
  context.font = `900 ${fontSize}px "Alexandria", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const lines = wrapText(context, text.toUpperCase(), maxWidth).slice(0, 3);
  const lineHeight = fontSize * 1.12;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  context.lineJoin = "round";
  context.lineWidth = Math.max(3, fontSize * 0.12);
  context.strokeStyle = "#000000";
  context.fillStyle = color;
  lines.forEach((line, index) => {
    context.strokeText(line, x, startY + index * lineHeight, maxWidth);
    context.fillText(line, x, startY + index * lineHeight, maxWidth);
  });
}

async function loadAvatar(user: User) {
  const response = await fetch(
    user.displayAvatarURL({ extension: "png", size: 512 }),
    { signal: AbortSignal.timeout(10_000) },
  );
  if (!response.ok) {
    throw new Error(`Could not load meme avatar (HTTP ${response.status}).`);
  }
  return loadImage(Buffer.from(await response.arrayBuffer()));
}

export async function createMeme(input: MemeInput): Promise<AttachmentBuilder> {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const context = canvas.getContext("2d");
  const avatar = await loadAvatar(input.user);

  if (input.type === "demotivator") {
    context.fillStyle = "#050505";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    const imageWidth = 700;
    const imageHeight = 430;
    const imageX = (WIDTH - imageWidth) / 2;
    const imageY = 48;
    context.fillStyle = "#ffffff";
    context.fillRect(imageX - 4, imageY - 4, imageWidth + 8, imageHeight + 8);
    drawCover(context, avatar, imageX, imageY, imageWidth, imageHeight);
    drawCaption(context, input.topCaption, WIDTH / 2, 545, 790, 39);
    drawCaption(
      context,
      input.bottomCaption,
      WIDTH / 2,
      625,
      790,
      24,
      "#dddddd",
    );
  } else {
    drawCover(context, avatar, 0, 0, WIDTH, HEIGHT);
    context.fillStyle = "rgba(0, 0, 0, 0.25)";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    if (input.type === "pov") {
      drawCaption(context, `POV: ${input.topCaption}`, WIDTH / 2, 100, 830, 43);
      drawCaption(context, input.bottomCaption, WIDTH / 2, 600, 830, 43);
    } else {
      drawCaption(context, input.topCaption, WIDTH / 2, 95, 830, 45);
      drawCaption(context, input.bottomCaption, WIDTH / 2, 605, 830, 45);
    }
  }

  return new AttachmentBuilder(await canvas.encode("png"), {
    name: "court-meme.png",
  });
}
