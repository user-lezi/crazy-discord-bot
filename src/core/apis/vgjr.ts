import { CacheManager } from "../../managers/CacheManager";
import { UserAgent } from ".";

export interface IVgjrAPIResponse {
  "/tools/translate": {
    response: string;
    data: {
      query: string;
      fromLang: [string, string];
      toLang: [string, string];
      translateType: [string, string];
      accuracy: string;
    };
  };
}

export type IVgjrAPIResponseCombined = IVgjrAPIResponse[keyof IVgjrAPIResponse];

export const VgjrAPI = {
  Base: "https://api.vgjr.top",
  Cache: new CacheManager<IVgjrAPIResponseCombined>(),
  async _requestJSON<T extends keyof IVgjrAPIResponse>(
    endpoint: T,
    params: Record<string, string | number | boolean | undefined> = {},
    opts: RequestInit = {},
    cache?: { load: boolean; save: boolean },
  ): Promise<IVgjrAPIResponse[T]> {
    const url = new URL(`${VgjrAPI.Base}${String(endpoint)}`);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    const cacheKey = url.toString();
    if (cache?.load) {
      const cached = VgjrAPI.Cache.get(cacheKey);
      if (cached !== undefined) {
        return cached as IVgjrAPIResponse[T];
      }
    }

    const response = await fetch(url, {
      ...opts,
      headers: {
        "user-agent": UserAgent,
        ...opts.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `VGJR API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as IVgjrAPIResponse[T];
    if (cache?.save) {
      VgjrAPI.Cache.set(cacheKey, data);
    }

    return data;
  },

  Translate(text: string, from?: string, to?: string) {
    return this._requestJSON(
      "/tools/translate",
      { q: text, from, to },
      {},
      {
        load: true,
        save: true,
      },
    );
  },
};


