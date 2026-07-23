import { ClientEvents } from "discord.js-selfbot-v13";

export interface ClientEventData<E extends keyof ClientEvents> {
  name: E;
  customName?: string;
  once?: boolean;
  execute: (...args: ClientEvents[E]) => Promise<unknown> | unknown;
}
export function createEventData<
  E extends keyof ClientEvents = keyof ClientEvents,
>(data: ClientEventData<E>): ClientEventData<E> {
  return data;
}
