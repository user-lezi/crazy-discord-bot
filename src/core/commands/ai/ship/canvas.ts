import { createCanvas, loadImage } from "@napi-rs/canvas";
import type { Client } from "discord.js";

import { extractImageAccent, type RGBColor } from "../../../functions/canvas";
import type { ShipResult } from "./ai";

const WIDTH = 1200;
const HEIGHT = 360;
const AVATAR_SIZE = 250;
const CENTER_Y = HEIGHT / 2;
const LEFT_CENTER_X = 220;
const RIGHT_CENTER_X = WIDTH - LEFT_CENTER_X;
const HEART_SCALE = 2.9;
const HEART_PATH_CENTER_Y = -9;

type CanvasContext = ReturnType<ReturnType<typeof createCanvas>["getContext"]>;
type CanvasImage = Awaited<ReturnType<typeof loadImage>>;
type AccentColor = RGBColor;

function roundedRect(
  context: CanvasContext,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function rgba(color: AccentColor, alpha: number): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function drawAccentGradient(
  context: CanvasContext,
  first: AccentColor,
  second: AccentColor,
): void {
  const gradient = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, rgba(first, 0.45));
  gradient.addColorStop(0.5, "#08090f");
  gradient.addColorStop(1, rgba(second, 0.45));
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const firstGlow = context.createRadialGradient(190, 150, 0, 190, 150, 520);
  firstGlow.addColorStop(0, rgba(first, 0.42));
  firstGlow.addColorStop(1, rgba(first, 0));
  context.fillStyle = firstGlow;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const secondGlow = context.createRadialGradient(
    WIDTH - 190,
    210,
    0,
    WIDTH - 190,
    210,
    520,
  );
  secondGlow.addColorStop(0, rgba(second, 0.38));
  secondGlow.addColorStop(1, rgba(second, 0));
  context.fillStyle = secondGlow;
  context.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawGrid(
  context: CanvasContext,
  first: AccentColor,
  second: AccentColor,
): void {
  drawAccentGradient(context, first, second);
  context.save();
  context.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x += 36) {
    context.strokeStyle = rgba(x < WIDTH / 2 ? first : second, 0.18);
    context.beginPath();
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, HEIGHT);
    context.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += 36) {
    context.strokeStyle = rgba(y < CENTER_Y ? first : second, 0.15);
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(WIDTH, y + 0.5);
    context.stroke();
  }
  context.restore();
}

function drawPixelGradient(
  context: CanvasContext,
  first: AccentColor,
  second: AccentColor,
  random: () => number,
): void {
  const columns = 60;
  const rows = 18;
  const pixelCanvas = createCanvas(columns, rows);
  const pixelContext = pixelCanvas.getContext("2d");

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const mix = Math.max(
        0,
        Math.min(1, (x / (columns - 1)) * 0.72 + (y / (rows - 1)) * 0.28),
      );
      const variation = (random() - 0.5) * 42;
      const color: AccentColor = [
        Math.round(
          Math.max(
            0,
            Math.min(255, first[0] * (1 - mix) + second[0] * mix + variation),
          ),
        ),
        Math.round(
          Math.max(
            0,
            Math.min(255, first[1] * (1 - mix) + second[1] * mix + variation),
          ),
        ),
        Math.round(
          Math.max(
            0,
            Math.min(255, first[2] * (1 - mix) + second[2] * mix + variation),
          ),
        ),
      ];
      pixelContext.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      pixelContext.fillRect(x, y, 1, 1);
    }
  }

  context.fillStyle = "#05060b";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.save();
  context.globalAlpha = 0.62;
  context.imageSmoothingEnabled = false;
  context.drawImage(pixelCanvas, 0, 0, WIDTH, HEIGHT);
  context.restore();
}

function drawGalaxy(
  context: CanvasContext,
  first: AccentColor,
  second: AccentColor,
  random: () => number,
): void {
  context.fillStyle = "#03040a";
  context.fillRect(0, 0, WIDTH, HEIGHT);

  for (let index = 0; index < 5; index++) {
    const color = index % 2 === 0 ? first : second;
    const x = random() * WIDTH;
    const y = random() * HEIGHT;
    const radius = 180 + random() * 260;
    const glow = context.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, rgba(color, 0.3));
    glow.addColorStop(1, rgba(color, 0));
    context.fillStyle = glow;
    context.fillRect(0, 0, WIDTH, HEIGHT);
  }

  for (let index = 0; index < 210; index++) {
    const color = index % 2 === 0 ? first : second;
    const radius = 0.5 + random() * 1.8;
    context.beginPath();
    context.arc(random() * WIDTH, random() * HEIGHT, radius, 0, Math.PI * 2);
    context.fillStyle = rgba(color, 0.3 + random() * 0.7);
    context.fill();
  }
}

function drawHeart(
  context: CanvasContext,
  centerX: number,
  centerY: number,
  opacity: number,
): void {
  context.save();
  context.translate(centerX, centerY - HEART_PATH_CENTER_Y * HEART_SCALE);
  context.scale(HEART_SCALE, HEART_SCALE);
  context.beginPath();
  context.moveTo(0, 24);
  context.bezierCurveTo(-12, 13, -35, -3, -35, -19);
  context.bezierCurveTo(-35, -38, -11, -42, 0, -24);
  context.bezierCurveTo(11, -42, 35, -38, 35, -19);
  context.bezierCurveTo(35, -3, 12, 13, 0, 24);
  context.closePath();
  context.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  context.fill();
  context.restore();
}

function drawAvatar(
  context: CanvasContext,
  image: CanvasImage,
  centerX: number,
  centerY: number,
  accent: AccentColor,
): void {
  const radius = AVATAR_SIZE / 2;
  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
  context.fillStyle = rgba(accent, 0.9);
  context.fill();
  context.lineWidth = 4;
  context.strokeStyle = "rgba(255, 255, 255, 0.92)";
  context.stroke();
  context.restore();

  context.save();
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.clip();
  context.drawImage(
    image,
    centerX - radius,
    centerY - radius,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  context.restore();
}

async function cachedAvatar(client: Client, url: string): Promise<CanvasImage> {
  const cached = client.imageCacheManager.get(url);
  if (cached) return cached;

  const image = await loadImage(url);
  client.imageCacheManager.set(url, image, 24 * 60 * 60 * 1000);
  return image;
}

export async function createShipImage(
  client: Client,
  result: ShipResult,
  avatarUrls: [string, string],
): Promise<Buffer> {
  const [firstAvatar, secondAvatar] = await Promise.all(
    avatarUrls.map((url) => cachedAvatar(client, url)),
  );
  const firstAccent = extractImageAccent(firstAvatar);
  const secondAccent = extractImageAccent(secondAvatar);
  const hourBucket = Math.floor(Date.now() / 3_600_000);
  const random = createRandom(hourBucket);
  const canvas = createCanvas(WIDTH, HEIGHT);
  const context = canvas.getContext("2d");

  switch (new Date().getHours() % 3) {
    case 0:
      drawGrid(context, firstAccent, secondAccent);
      break;
    case 1:
      drawPixelGradient(context, firstAccent, secondAccent, random);
      break;
    default:
      drawGalaxy(context, firstAccent, secondAccent, random);
  }

  roundedRect(context, 28, 28, WIDTH - 56, HEIGHT - 56, 34);
  context.fillStyle = "rgba(8, 9, 14, 0.5)";
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.22)";
  context.lineWidth = 2;
  context.stroke();

  drawAvatar(context, firstAvatar, LEFT_CENTER_X, CENTER_Y, firstAccent);
  drawAvatar(context, secondAvatar, RIGHT_CENTER_X, CENTER_Y, secondAccent);

  const heartGlow = context.createRadialGradient(
    WIDTH / 2,
    CENTER_Y,
    0,
    WIDTH / 2,
    CENTER_Y,
    200,
  );
  heartGlow.addColorStop(0, "rgba(255, 255, 255, 0.48)");
  heartGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = heartGlow;
  context.fillRect(WIDTH / 2 - 210, CENTER_Y - 210, 420, 420);

  const heartOpacity =
    0.1 + (Math.max(0, Math.min(100, result.score)) / 100) * 0.9;
  drawHeart(context, WIDTH / 2, CENTER_Y, heartOpacity);

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#ffffff";
  context.font = '600 58px "Alexandria"';
  context.shadowColor = "rgba(0, 0, 0, 0.55)";
  context.shadowBlur = 8;
  context.fillText(`${result.score}%`, WIDTH / 2, CENTER_Y);

  return canvas.toBuffer("image/png");
}
