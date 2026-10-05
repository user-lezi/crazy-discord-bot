import type { Client, User } from "discord.js";

import { CacheManager } from "../../../../managers/CacheManager";
import {
  generateShipOpinion,
  ShipResult,
  ShipScoreFactorResult,
} from "./ai";
import { createShipImage } from "./canvas";

interface CachedShipResult {
  score: number;
  factors: ShipScoreFactorResult[];
}

const SHIP_CACHE_TTL = 24 * 60 * 60 * 1000;
const variableShipCache = new CacheManager<CachedShipResult>();

interface ShipScoreFactor {
  name: string;
  weight: number;
  score(client: Client, first: User, second: User): number | Promise<number>;
}

const EMBEDDING_BASELINE = 0.5;
const EMBEDDING_RANGE = 0.5;

function normalizeName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function nameSimilarity(first: string, second: string): number {
  const a = normalizeName(first);
  const b = normalizeName(second);
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + Number(a[i - 1] !== b[j - 1]),
      );
      diagonal = above;
    }
  }

  return 1 - previous[b.length] / Math.max(a.length, b.length);
}

function nameFactor(
  name: string,
  weight: number,
  getValue: (user: User) => string,
): ShipScoreFactor {
  return {
    name,
    weight,
    score(_client, first, second) {
      const similarity = nameSimilarity(getValue(first), getValue(second));
      return 0.5 + similarity * 0.5;
    },
  };
}

function embeddingFactor(
  name: string,
  weight: number,
  getProfile: (user: User) => string,
): ShipScoreFactor {
  return {
    name,
    weight,
    async score(client, first, second) {
      const similarity = await client.ollama.embeddings.similarity(
        getProfile(first),
        getProfile(second),
      );
      if (!Number.isFinite(similarity)) {
        throw new Error(`Embeddings returned an invalid ${name} similarity`);
      }

      return Math.max(
        0,
        Math.min(1, 0.5 + (similarity - EMBEDDING_BASELINE) / EMBEDDING_RANGE),
      );
    },
  };
}

const SHIP_SCORE_FACTORS: readonly ShipScoreFactor[] = [
  nameFactor("username resemblance", 0.25, (user) => user.username),
  nameFactor(
    "display-name resemblance",
    0.25,
    (user) => user.globalName ?? user.username,
  ),
  embeddingFactor(
    "account-profile embedding",
    0.25,
    (user) =>
      [
        `Username: ${user.username}`,
        `Display name: ${user.globalName ?? user.username}`,
        `Account type: ${user.bot ? "bot" : "person"}`,
        `Account age: ${Math.floor(
          (Date.now() - user.createdTimestamp) / 86_400_000,
        )} days`,
      ].join(". "),
  ),
  {
    name: "account-age resemblance",
    weight: 0.2,
    score(_client, first, second) {
      const ageDifferenceDays = Math.abs(
        first.createdTimestamp - second.createdTimestamp,
      ) / 86_400_000;
      return Math.exp(-ageDifferenceDays / (365 * 5));
    },
  },
  {
    name: "bot status",
    weight: 0.05,
    score(_client, first, second) {
      return Number(first.bot === second.bot);
    },
  },
];

async function calculateShipScore(
  client: Client,
  first: User,
  second: User,
): Promise<{ score: number; factors: ShipScoreFactorResult[] }> {
  if (
    SHIP_SCORE_FACTORS.some(
      (factor) => !Number.isFinite(factor.weight) || factor.weight <= 0,
    )
  ) {
    throw new Error("Ship score factor weights must be positive finite numbers");
  }

  const totalWeight = SHIP_SCORE_FACTORS.reduce(
    (total, factor) => total + factor.weight,
    0,
  );
  if (totalWeight <= 0) {
    throw new Error("Ship score factors must have a positive total weight");
  }

  const scores = await Promise.all(
    SHIP_SCORE_FACTORS.map(async (factor) => ({
      factor,
      score: await factor.score(client, first, second),
    })),
  );

  for (const { factor, score } of scores) {
    if (!Number.isFinite(score)) {
      throw new Error(
        `Ship score factor "${factor.name}" returned an invalid score`,
      );
    }
  }

  const factors = scores.map(({ factor, score }) => ({
    name: factor.name,
    weight: factor.weight,
    score: Math.round(Math.max(0, Math.min(1, score)) * 100),
  }));
  const score = Math.round(
    factors.reduce(
      (total, factor) => total + factor.score * factor.weight,
      0,
    ) / totalWeight,
  );

  return { score, factors };
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
  const firstDisplayName = first.globalName ?? first.username;
  const secondDisplayName = second.globalName ?? second.username;
  const now = Date.now();
  const users: ShipResult["users"] = [
    {
      profile: {
        username: first.username,
        displayName: firstDisplayName,
        isBot: first.bot,
        accountCreatedAt: new Date(first.createdTimestamp).toISOString(),
        accountAgeDays: Math.floor((now - first.createdTimestamp) / 86_400_000),
      },
      user: {
        name: first.username,
        displayName: firstDisplayName,
      },
    },
    {
      profile: {
        username: second.username,
        displayName: secondDisplayName,
        isBot: second.bot,
        accountCreatedAt: new Date(second.createdTimestamp).toISOString(),
        accountAgeDays: Math.floor((now - second.createdTimestamp) / 86_400_000),
      },
      user: {
        name: second.username,
        displayName: secondDisplayName,
      },
    },
  ];
  const avatarUrls: [string, string] = [
    first.displayAvatarURL({ extension: "png", size: 256 }),
    second.displayAvatarURL({ extension: "png", size: 256 }),
  ];
  const cacheKey = JSON.stringify({
    users,
    userIds: [first.id, second.id],
    avatarUrls,
  });

  let cached = variableShipCache.get(cacheKey);
  if (!cached) {
    const { score, factors } = await calculateShipScore(client, first, second);
    cached = { score, factors };
    variableShipCache.set(cacheKey, cached, SHIP_CACHE_TTL);
  }

  const image = await createShipImage(
    client,
    { users, score: cached.score, factors: cached.factors },
    avatarUrls,
  );
  const opinion = await generateShipOpinion({
    users,
    score: cached.score,
    factors: cached.factors,
  });

  return {
    score: cached.score,
    image,
    name: opinion.name,
    emojis: opinion.emojis,
    opinion: opinion.opinion,
  };
}
