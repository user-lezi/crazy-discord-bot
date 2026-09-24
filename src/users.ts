import { Client, Snowflake } from "discord.js";

const Users = [createUser("developer", "910837428862984213")];

export type UserType = "developer" | "placeholder";

function createUser(type: UserType, id: Snowflake) {
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
