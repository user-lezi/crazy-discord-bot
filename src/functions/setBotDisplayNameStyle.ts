import { Client, Guild, Routes, Snowflake } from "discord.js";

export enum DisplayNameFonts {
  Bangers = 1,
  BioRhyme = 2,
  CherryBomb = 3,
  Chicle = 4,
  Compagnon = 5,
  MuseoModerno = 6,
  NeoCastel = 7,
  PixelifySans = 8,
  Ribes = 9,
  Sinistre = 10,
  Default = 11,
  ZillaSlab = 12,
}

export enum DisplayNameEffects {
  Solid = 1,
  Gradient = 2,
  Neon = 3,
  Toon = 4,
  Pop = 5,
  Glow = 6,
}

export async function applyNameStyle(
  client: Client,
  guild: Guild | Snowflake,
  font: DisplayNameFonts,
  effect: DisplayNameEffects,
  colors: number[],
) {
  try {
    const res = await client.rest.patch(
      Routes.guildMember(typeof guild == "string" ? guild : guild.id, "@me"),
      {
        body: {
          display_name_font_id: font,
          display_name_effect_id: effect,
          display_name_colors: colors,
        },
      },
    );
    return Boolean(res);
  } catch (err: any) {
    const reason = err?.rawError?.message ?? err?.message ?? "Unknown error";
    console.error("Name style failed:", reason);
    return false;
  }
}
export async function resetNameStyle(client: Client, guild: Guild | Snowflake) {
  try {
    const res = await client.rest

      .patch(
        Routes.guildMember(typeof guild == "string" ? guild : guild.id, "@me"),
        {
          body: {
            display_name_font_id: null,
            display_name_effect_id: null,
            display_name_colors: null,
          },
        },
      )
      .catch((e) => console.error(e));
    return Boolean(res);
  } catch (err: any) {
    const reason = err?.rawError?.message ?? err?.message ?? "Unknown error";
    console.error("Name style failed:", reason);
    return false;
  }
}
