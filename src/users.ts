import { Client, Snowflake } from "discord.js";

const Users = [
  createUser(["developer", "special"], "910837428862984213"),
  createUser(["special"], "903681538842054686"),
  createUser(["special"], "1421877908456083578"),
];

export type UserType = "developer" | "placeholder" | "special";

function createUser(type: UserType[], id: Snowflake) {
  return {
    type,
    id,
    toString() {
      return `<@${this.id}>`;
    },
    async resolve(client: Client, fetch: boolean = false) {
      return fetch
        ? client.users.fetch(this.id)
        : (client.users.cache.get(this.id) ?? null);
    },
  };
}

export { Users };
