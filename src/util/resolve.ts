import {
  BaseInteraction,
  Client,
  GuildMember,
  Message,
  ThreadMember,
  User,
} from "discord.js";

export type UserResolvable =
  | string
  | User
  | Message<boolean>
  | GuildMember
  | ThreadMember<boolean>
  | BaseInteraction;

export function resolveUser(user: UserResolvable): User | null {
  if (user instanceof User) return user;
  if (user instanceof GuildMember) return user.user;
  if (user instanceof Message) return user.author;
  if (user instanceof ThreadMember) return user.user;
  if (user instanceof BaseInteraction) return user.user;
  return null;
}

export function resolveUserId(user: UserResolvable): string | null {
  if (typeof user == "string") return user;
  return resolveUser(user)?.id ?? null;
}

export function fetchUser(client: Client, user: UserResolvable) {
  let userId = resolveUserId(user);
  return userId ? client.users.fetch(userId) : null;
}
