import { createCanvas, loadImage } from "@napi-rs/canvas";
import type { Client } from "discord.js";

import type { ShipResult } from "./ai";

const WIDTH = 1000;
const HEIGHT = 500;
const AVATAR_SIZE = 164;

type CanvasContext = ReturnType<ReturnType<typeof createCanvas>["getContext"]>;

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

function drawAvatar(
  context: CanvasContext,
  image: Awaited<ReturnType<typeof loadImage>>,
  x: number,
  y: number,
): void {
  context.save();
  context.shadowColor = "rgba(255, 105, 180, 0.48)";
  context.shadowBlur = 28;
  context.beginPath();
  context.arc(x + AVATAR_SIZE / 2, y + AVATAR_SIZE / 2, AVATAR_SIZE / 2 + 5, 0, Math.PI * 2);
  context.fillStyle = "#ff8fbd";
  context.fill();
  context.restore();

  context.save();
  context.beginPath();
  context.arc(x + AVATAR_SIZE / 2, y + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, x, y, AVATAR_SIZE, AVATAR_SIZE);
  context.restore();
}

function drawHeart(context: CanvasContext, x: number, y: number): void {
  context.save();
  context.translate(x, y);
  context.scale(1.6, 1.6);
  context.beginPath();
  context.moveTo(0, 24);
  context.bezierCurveTo(-12, 13, -35, -3, -35, -19);
  context.bezierCurveTo(-35, -38, -11, -42, 0, -24);
  context.bezierCurveTo(11, -42, 35, -38, 35, -19);
  context.bezierCurveTo(35, -3, 12, 13, 0, 24);
  context.closePath();
  context.shadowColor = "rgba(255, 93, 157, 0.8)";
  context.shadowBlur = 22;
  context.fillStyle = "#ff6b9d";
  context.fill();
  context.restore();
}

async function cachedAvatar(client: Client, url: string) {
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
  const canvas = createCanvas(WIDTH, HEIGHT);
  const context = canvas.getContext("2d");

  const background = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, "#171528");
  background.addColorStop(0.52, "#30203f");
  background.addColorStop(1, "#642e58");
  context.fillStyle = background;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = "rgba(255, 255, 255, 0.035)";
  for (let x = 25; x < WIDTH; x += 40) {
    for (let y = 25; y < HEIGHT; y += 40) {
      context.beginPath();
      context.arc(x, y, 1.5, 0, Math.PI * 2);
      context.fill();
    }
  }

  roundedRect(context, 32, 32, WIDTH - 64, HEIGHT - 64, 28);
  context.fillStyle = "rgba(18, 15, 32, 0.72)";
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.12)";
  context.lineWidth = 1;
  context.stroke();

  drawAvatar(context, firstAvatar, 176, 118);
  drawAvatar(context, secondAvatar, WIDTH - 176 - AVATAR_SIZE, 118);
  drawHeart(context, WIDTH / 2, 196);

  context.fillStyle = "#ffffff";
  context.font = "600 25px sans-serif";
  context.fillText(result.users[0].user.displayName, 258, 315, 300);
  context.fillText(result.users[1].user.displayName, WIDTH - 258, 315, 300);

  context.fillStyle = "rgba(255, 255, 255, 0.12)";
  roundedRect(context, 246, 353, WIDTH - 492, 12, 6);
  context.fill();

  const progress = (WIDTH - 492) * (result.score / 100);
  if (progress > 0) {
    const bar = context.createLinearGradient(246, 0, 246 + progress, 0);
    bar.addColorStop(0, "#ff6b9d");
    bar.addColorStop(1, "#ffc0dd");
    context.fillStyle = bar;
    roundedRect(context, 246, 353, progress, 12, 6);
    context.fill();
  }

  context.fillStyle = "#ffffff";
  context.font = "bold 54px sans-serif";
  context.fillText(`${result.score}%`, WIDTH / 2, 421);

  return canvas.toBuffer("image/png");
}
