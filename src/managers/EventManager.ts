import { Client, ClientEvents, Collection } from "discord.js";

import { Events } from "../events";

export interface IEventData<E extends keyof ClientEvents> {
  name: E;
  customName?: string;
  once?: boolean;
  execute: (
    this: Client,
    ...args: ClientEvents[E]
  ) => Promise<unknown> | unknown;
}

export class EventManager {
  public events = new Collection<number, IEventData<any>>();
  constructor(public client: Client) {}

  load() {
    console.log("Loading events...");

    for (const event of Events) {
      if (event.once) {
        this.client.once(event.name, event.execute.bind(this.client) as any);
      } else {
        this.client.on(event.name, event.execute.bind(this.client) as any);
      }

      this.events.set(this.events.size, event);
    }

    console.log(
      `Loaded ${Events.length} event${Events.length === 1 ? "" : "s"}.`,
    );
  }

  get size() {
    return this.events.size;
  }
}
