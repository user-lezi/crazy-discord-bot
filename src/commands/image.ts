import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { CommandType, createCommandData } from "../handlers/commands";
import { Image, createCanvas, loadImage } from "@napi-rs/canvas";

import { ReadyMadeReplies } from "../util/interactionReply";
import { getCachedGuildMembers } from "../functions/getCachedGuildMembers";
import { shuffle } from "../util/random";

export default createCommandData({
  type: CommandType.ChatInput,
  data: new SlashCommandBuilder()
    .setName("image")
    .setDescription("Crazy images")
    .addSubcommand((sub) =>
      sub
        .setName("guild_icon")
        .setDescription("Guild icon wow")
        .addBooleanOption((opt) =>
          opt
            .setName("allow_bots")
            .setDescription(
              "Allow bots to be included in the image (default: no)",
            )
            .setRequired(false),
        )
        .addStringOption((opt) =>
          opt
            .setName("size")
            .setDescription(
              "Output resolution — bigger is slower to render (default: medium)",
            )
            .setRequired(false)
            .addChoices(
              { name: "Tiny (faster)", value: "tiny" },
              { name: "Small (fast)", value: "small" },
              { name: "Medium (default)", value: "medium" },
              { name: "Large (slow)", value: "large" },
            ),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("unique_only")
            .setDescription(
              "Never reuse a member's avatar twice — shrinks the grid instead of duplicating (default: no)",
            )
            .setRequired(false),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("max_duplicates")
            .setDescription(
              "Max times a single member's avatar can repeat when filling the grid (default: no limit)",
            )
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(20),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("multiplier")
            .setDescription(
              "Repeat every member's avatar, e.g. 2 = everyone appears twice (default: 1)",
            )
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10),
        )
        .addAttachmentOption((opt) =>
          opt
            .setName("image")
            .setDescription("Recreate this image instead of the guild icon")
            .setRequired(false),
        ),
    ),
  async execute(interaction) {
    try {
      switch (interaction.options.getSubcommand()) {
        case "guild_icon":
          return guildIconImageCommand(interaction);
        default:
          throw new Error("Unknown subcommand.");
      }
    } catch (error) {
      return ReadyMadeReplies.unknownError(
        interaction,
        error,
        interaction.replied,
      );
    }
  },
});

// Cap the grid so fetch/render time and memory stay reasonable — 25x25 is
// already 625 avatar downloads + a 625^2 nearest-color search.
const MAX_GRID_MEMBERS = 625;
const TILE_SIZES = { tiny: 12, small: 32, medium: 48, large: 64 } as const;
const AVATAR_FETCH_CONCURRENCY = 20;

type AvatarEntry = {
  member: GuildMember;
  image: Image;
  color: [number, number, number];
};

// Recreate the guild icon by replacing its pixels with member avatars —
// a photomosaic: downscale the icon to one "pixel" per grid cell, then
// greedily match each cell to whichever avatar's average color is closest.
async function guildIconImageCommand(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true,
    });
    return;
  }

  const guild = interaction.guild;
  const customImage = interaction.options.getAttachment("image");
  const sourceUrl =
    customImage?.url ?? guild.iconURL({ size: 512, extension: "png" });
  if (!sourceUrl) {
    await interaction.reply({
      content:
        "This server doesn't have an icon set — try the image option to use a custom picture instead.",
      ephemeral: true,
    });
    return;
  }
  if (customImage && !customImage.contentType?.startsWith("image/")) {
    await interaction.reply({
      content: "That attachment doesn't look like an image.",
      ephemeral: true,
    });
    return;
  }

  // Default is "user members"; pass allow_bots:true to include bots too.
  const allowBots = interaction.options.getBoolean("allow_bots") ?? false;
  const tileSize =
    TILE_SIZES[
      (interaction.options.getString("size") as keyof typeof TILE_SIZES) ??
        "medium"
    ];
  const uniqueOnly = interaction.options.getBoolean("unique_only") ?? false;
  const maxDuplicates =
    interaction.options.getInteger("max_duplicates") ?? undefined; // undefined = no limit
  const multiplier = interaction.options.getInteger("multiplier") ?? 1;

  if (uniqueOnly && multiplier > 1) {
    await interaction.reply({
      content:
        "unique_only and multiplier can't be used together — unique_only forbids repeats entirely.",
      ephemeral: true,
    });
    return;
  }
  if (maxDuplicates !== undefined && maxDuplicates < multiplier) {
    await interaction.reply({
      content: `max_duplicates (${maxDuplicates}) can't be lower than multiplier (${multiplier}).`,
      ephemeral: true,
    });
    return;
  }

  // Fetching all members + rendering can take a while, so defer immediately.
  await interaction.deferReply();

  const fetched = await getCachedGuildMembers(guild);
  let members = [...fetched.values()].filter((m) =>
    allowBots ? true : !m.user.bot,
  );

  if (members.length === 0) {
    await interaction.editReply(
      allowBots
        ? "This server has no members to build a mosaic from."
        : "This server has no non-bot members to build a mosaic from — try allow_bots:true.",
    );
    return;
  }

  // Cap + randomly sample so huge guilds don't blow up fetch/render time.
  if (members.length > MAX_GRID_MEMBERS) {
    members = shuffle([...members]).slice(0, MAX_GRID_MEMBERS);
  }

  // Fill the grid to a perfect square. Default: randomly duplicate real
  // members (there's no such thing as a "blank" member, so repeats are
  // the only way to fill every tile), capped by max_duplicates if given.
  // unique_only instead shrinks down to the nearest smaller perfect
  // square so no avatar repeats at all — it takes priority over
  // max_duplicates since "unique" is a stricter version of the same idea.
  let pool: GuildMember[];
  let gridSize: number;

  if (uniqueOnly) {
    gridSize = Math.floor(Math.sqrt(members.length));
    pool = shuffle([...members]).slice(0, gridSize * gridSize);
  } else {
    // Seed the pool with `multiplier` copies of every member first (this
    // is what makes multiplier:2 mean "everyone appears twice", not just
    // "up to twice" like the random max_duplicates padding below).
    const counts = new Map(members.map((m) => [m.id, multiplier]));
    pool = [];
    for (let i = 0; i < multiplier; i++) pool.push(...members);

    // Re-cap here too — multiplier can blow past MAX_GRID_MEMBERS even
    // when the raw member count didn't (e.g. 300 members x multiplier 3).
    if (pool.length > MAX_GRID_MEMBERS) {
      pool = shuffle(pool).slice(0, MAX_GRID_MEMBERS);
    }

    gridSize = Math.ceil(Math.sqrt(pool.length));
    const targetTiles = gridSize * gridSize;

    while (pool.length < targetTiles) {
      const candidates = maxDuplicates
        ? members.filter((m) => (counts.get(m.id) ?? 0) < maxDuplicates)
        : members;

      if (candidates.length === 0) {
        // Every member already hit max_duplicates — can't fill this grid
        // size without breaking the limit, so stop here and shrink to fit.
        break;
      }

      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      counts.set(pick.id, (counts.get(pick.id) ?? 0) + 1);
      pool.push(pick);
    }

    // If max_duplicates forced an early stop, recompute the grid around
    // what we actually managed to fill instead of leaving empty tiles.
    if (pool.length < targetTiles) {
      gridSize = Math.floor(Math.sqrt(pool.length));
      pool = pool.slice(0, gridSize * gridSize);
    }
  }
  const totalTiles = gridSize * gridSize;

  if (totalTiles === 0) {
    await interaction.editReply(
      "Not enough members to make even a 1x1 mosaic with these options — try lowering unique_only/max_duplicates restrictions.",
    );
    return;
  }

  // Downscale the source image to one pixel per grid cell — canvas's own
  // image smoothing does the block-averaging for us for free.
  const iconImage = await loadImage(sourceUrl);
  const targetCanvas = createCanvas(gridSize, gridSize);
  const targetCtx = targetCanvas.getContext("2d");
  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = "high";
  targetCtx.drawImage(iconImage, 0, 0, gridSize, gridSize);
  const targetData = targetCtx.getImageData(0, 0, gridSize, gridSize).data;

  const targetColors: [number, number, number][] = [];
  for (let i = 0; i < totalTiles; i++) {
    const o = i * 4;
    targetColors.push([targetData[o], targetData[o + 1], targetData[o + 2]]);
  }

  // Fetch every avatar + its average color, a batch at a time so we don't
  // fire hundreds of concurrent requests at Discord's CDN at once.
  const avatarEntries = await mapWithConcurrency(
    pool,
    AVATAR_FETCH_CONCURRENCY,
    async (member): Promise<AvatarEntry> => {
      const url = member.displayAvatarURL({ size: 64, extension: "png" });
      const image = await loadImage(url);
      return { member, image, color: getAverageColor(image) };
    },
  );

  // Greedy nearest-color matching: for each grid cell (raster order),
  // pick whichever remaining avatar's average color is closest, then
  // remove it from the pool so it isn't reused. O(totalTiles^2), but
  // totalTiles is capped at 576, so worst case is ~330k comparisons —
  // trivial compared to the network fetches above.
  const remaining = [...avatarEntries];
  const assignment: AvatarEntry[] = [];
  for (const target of targetColors) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = colorDistanceSq(target, remaining[i].color);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }
    assignment.push(remaining[bestIndex]);
    remaining.splice(bestIndex, 1);
  }

  // Render the final mosaic.
  const canvas = createCanvas(gridSize * tileSize, gridSize * tileSize);
  const ctx = canvas.getContext("2d");
  assignment.forEach((entry, i) => {
    const x = (i % gridSize) * tileSize;
    const y = Math.floor(i / gridSize) * tileSize;
    ctx.drawImage(entry.image, x, y, tileSize, tileSize);
  });

  const attachment = new AttachmentBuilder(await canvas.encode("png"), {
    name: "image.png",
  });
  await interaction.editReply({ files: [attachment] });
}

/** Approximates an image's average color by downscaling it to a single pixel. */
function getAverageColor(image: Image): [number, number, number] {
  const c = createCanvas(1, 1);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(image, 0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function colorDistanceSq(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  const rMean = (a[0] + b[0]) / 2;

  return (
    ((512 + rMean) * dr * dr) / 256 +
    4 * dg * dg +
    ((767 - rMean) * db * db) / 256
  );
}

/** Runs `fn` over `items` with at most `concurrency` in flight at once. */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return results;
}
