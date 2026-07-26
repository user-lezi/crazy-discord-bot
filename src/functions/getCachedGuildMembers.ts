import { Guild } from "discord.js";

// Re-fetching the full member list is expensive; only do it if it's been
// a while since the last fetch for this guild. In between, discord.js's
// own guild.members.cache (kept warm by fetch + gateway events) is used.
const MEMBER_FETCH_TTL_MS = 10 * 60 * 1000;
const lastMemberFetchAt = new Map<string, number>();

export async function getCachedGuildMembers(guild: Guild) {
  const now = Date.now();
  const last = lastMemberFetchAt.get(guild.id);

  if (last === undefined || now - last > MEMBER_FETCH_TTL_MS) {
    await guild.members.fetch();
    lastMemberFetchAt.set(guild.id, now);
  }

  return guild.members.cache;
}
