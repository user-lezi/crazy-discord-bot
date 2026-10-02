import type { Client, User } from "discord.js";

import { CacheManager } from "../../../../managers/CacheManager";
import { generateShipOpinion, ShipResult } from "./ai";
import { createShipImage } from "./canvas";

interface CachedShipResult {
  score: number;
  image: Buffer;
}

const SHIP_CACHE_TTL = 24 * 60 * 60 * 1000;
const variableShipCache = new CacheManager<CachedShipResult>();

function createProfile(user: User): string {
  return `Display name: ${user.globalName ?? user.username}. Username: ${user.username}.`;
}

export async function createShipResult(
  client: Client,
  first: User,
  second: User,
): Promise<{
  score: number;
  image: Buffer;
  name: string;
  emojis: string[];
  opinion: string;
}> {
  const users: ShipResult["users"] = [
    {
      profile: createProfile(first),
      user: {
        name: first.username,
        displayName: first.globalName ?? first.username,
      },
    },
    {
      profile: createProfile(second),
      user: {
        name: second.username,
        displayName: second.globalName ?? second.username,
      },
    },
  ];
  const avatarUrls: [string, string] = [
    first.displayAvatarURL({ extension: "png", size: 256 }),
    second.displayAvatarURL({ extension: "png", size: 256 }),
  ];
  const cacheKey = JSON.stringify({
    users,
    avatarUrls,
  });

  let cached = variableShipCache.get(cacheKey);
  if (!cached) {
    const similarity = await client.ollama.embeddings.similarity(
      users[0].profile,
      users[1].profile,
    );
    if (!Number.isFinite(similarity)) {
      throw new Error("Embeddings returned an invalid compatibility score");
    }

    const score = Math.round(
      Math.max(0, Math.min(100, (similarity + 1) * 50)),
    );
    const shipData: ShipResult = { users, score };
    const image = await createShipImage(client, shipData, avatarUrls);
    cached = { score, image };
    variableShipCache.set(cacheKey, cached, SHIP_CACHE_TTL);
  }

  const opinion = await generateShipOpinion({
    users,
    score: cached.score,
  });

  return {
    score: cached.score,
    image: cached.image,
    name: opinion.name,
    emojis: opinion.emojis,
    opinion: opinion.opinion,
  };
}
