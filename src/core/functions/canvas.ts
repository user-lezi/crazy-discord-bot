import { createCanvas, type Image } from "@napi-rs/canvas";

export type RGBColor = readonly [red: number, green: number, blue: number];

export function extractImageAccent(image: Image): RGBColor {
  const sample = createCanvas(32, 32);
  const context = sample.getContext("2d");
  context.drawImage(image, 0, 0, 32, 32);
  const { data } = context.getImageData(0, 0, 32, 32);

  let red = 0;
  let green = 0;
  let blue = 0;
  let totalWeight = 0;

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
    const weight =
      Math.max(1, saturation) *
      Math.max(0.15, 1 - Math.abs(lightness - 128) / 160);

    red += r * weight;
    green += g * weight;
    blue += b * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return [160, 120, 200];
  }

  return [
    Math.round(red / totalWeight),
    Math.round(green / totalWeight),
    Math.round(blue / totalWeight),
  ];
}
