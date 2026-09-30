import { join } from "node:path";
import { readFileSync } from "node:fs";

export function getPrompt(file: string, replacers: string[]): string {
  const prompt = readFileSync(join("assets/prompts", file), "utf8");

  const placeholderRegex = /{{}}/g;
  const matches = prompt.match(placeholderRegex) ?? [];

  if (matches.length > replacers.length) {
    throw new Error(
      `Missing prompt replacements: expected at least ${matches.length}, received ${replacers.length}.`,
    );
  }

  let replacementIndex = 0;

  return prompt.replace(placeholderRegex, () => {
    const replacement = replacers[replacementIndex];

    if (replacement === undefined) {
      throw new Error(
        `Prompt replacement missing at index ${replacementIndex}.`,
      );
    }

    replacementIndex++;
    return replacement;
  });
}
