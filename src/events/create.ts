import { ClientEvents } from "discord.js";
import { IEventData } from "../managers/EventManager";

export function createEventData<E extends keyof ClientEvents = keyof ClientEvents>(
  data: IEventData<E>,
): IEventData<E> {
  return data;
}
