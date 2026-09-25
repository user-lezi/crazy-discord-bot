import { Collection } from "discord.js";

export interface ICacheItem<T> {
  expires: number;
  value: T;
  key: string;
}

export class CacheManager<T> {
  public _ = new Collection<string, ICacheItem<T>>();

  public set(key: string, value: T, ttl = Infinity): this {
    this._.set(key, {
      key,
      value,
      expires: ttl === Infinity ? Infinity : Date.now() + ttl,
    });

    return this;
  }

  public get(key: string, fallback?: T): T {
    const item = this._.get(key);

    if (!item) return fallback as T;

    if (item.expires <= Date.now()) {
      this._.delete(key);
      return fallback as T;
    }

    return item.value;
  }

  public has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  public delete(key: string): boolean {
    return this._.delete(key);
  }

  public clear(): void {
    this._.clear();
  }
}
