import { config as dotenv } from "dotenv";

dotenv({ quiet: true });

export const secrets = {
  token: process.env.BotToken ?? "",
  clientId: process.env.BotID ?? "",
  userToken: process.env.UserToken ?? null,

  validate() {
    const missing = [];

    if (!this.token) missing.push("BotToken");

    if (!this.clientId) missing.push("BotID");

    if (missing.length) {
      throw new Error(`Missing environment variables: ${missing.join(", ")}`);
    }
  },
};
