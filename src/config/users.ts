import { Snowflake } from "discord.js";

export enum UserFlags {
  None = 0,
  Developer = 1 << 0,
  Placeholder = 1 << 1,
}

export interface SpecialUser {
  id: Snowflake;
  name: string;
  flags: number;
}

function createUser<Name extends string>(
  name: Name,
  id: Snowflake,
  flags: number,
): SpecialUser & { name: Name } {
  return { id, name, flags };
}

const USER_REGISTRY = {
  Lezi: createUser(
    "Lezi",
    "910837428862984213",
    UserFlags.Developer | UserFlags.Placeholder,
  ),
  Ayu: createUser("Ayansh", "1421877908456083578", UserFlags.Placeholder),
  Adi: createUser("Aditya", "903681538842054686", UserFlags.Placeholder),
  iiezl: createUser("iiezl", "904003750400757781", UserFlags.Placeholder),
} as const satisfies Record<string, SpecialUser>;

const ALL_USERS = Object.values(USER_REGISTRY);

function hasFlag(flags: number, flag: UserFlags) {
  return (flags & flag) === flag;
}

function hasAnyFlag(flags: number, flags2: UserFlags) {
  return (flags & flags2) !== 0;
}

function getById(id: Snowflake) {
  return ALL_USERS.find((u) => u.id === id);
}

function hasFlagById(id: Snowflake, flag: UserFlags) {
  const user = getById(id);
  return user ? hasFlag(user.flags, flag) : false;
}

function getByFlag(flag: UserFlags) {
  return ALL_USERS.filter((u) => hasFlag(u.flags, flag));
}

function isDev(id: Snowflake) {
  return hasFlagById(id, UserFlags.Developer);
}

function isPlaceholder(id: Snowflake) {
  return hasFlagById(id, UserFlags.Placeholder);
}

function listByType(flag: UserFlags) {
  return getByFlag(flag).map((u) => u.name);
}

export const Users = {
  registry: USER_REGISTRY,
  hasFlag,
  hasAnyFlag,
  getById,
  hasFlagById,
  getByFlag,
  isDev,
  isPlaceholder,
  listByType,
};

export default Users;
