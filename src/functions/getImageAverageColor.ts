import { Image, createCanvas } from "@napi-rs/canvas";

/** Approximates an image's average color by downscaling it to a single pixel. */
export default function getImageAverageColor(image: Image): [number, number, number] {
  const c = createCanvas(1, 1);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, 0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}
