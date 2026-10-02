import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  ComponentType,
  EmbedBuilder,
  Interaction,
  InteractionCollector,
  Message,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import {
  CreationBattlePlayer,
  CreationBattleResult,
  IClashOfCreationGameCache,
  battleCreations,
  checkCreationFairness,
  createBotCreation,
  generateWinnerDialogue,
  getCreationPhraseDetails,
} from "./ai";

import creationData from "../../../../../assets/data/coc-random-creations.json";
import { randomUUID } from "node:crypto";
import { shuffle } from "../../../../util/random";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;
const LOBBY_IDLE_MS = 2 * 60 * 1000;
const IMAGINATION_TIME_MS = 1 * 60 * 1000;
const PLAYOFF_ROUND_GAP_MS = 15 * 1000;
const GAME_CACHE_PREFIX = "clash-of-creations:server:";
const gameCreationLocks = new Map<string, Promise<void>>();

export function randomCreation(): string {
  const creations = creationData.creations;
  if (creations.length === 0) {
    throw new Error("The Clash of Creations random creation list is empty.");
  }
  return creations[Math.floor(Math.random() * creations.length)];
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function gameCacheKey(serverId: string): string {
  return `${GAME_CACHE_PREFIX}${serverId}`;
}

function getServerGame(
  client: Client,
  serverId: string,
): IClashOfCreationGameCache | undefined {
  return client.cacheManager.get(gameCacheKey(serverId)) as
    IClashOfCreationGameCache | undefined;
}

function existingGameReply(game: IClashOfCreationGameCache): {
  content: string;
  components: ActionRowBuilder<ButtonBuilder>[];
  flags: MessageFlags.Ephemeral;
} {
  const jumpUrl = `https://discord.com/channels/${game.serverId}/${game.location[0]}/${game.location[1]}`;
  const button = new ButtonBuilder()
    .setLabel("Go to Existing Game")
    .setStyle(ButtonStyle.Link)
    .setURL(jumpUrl);

  return {
    content:
      "There is already a Clash of Creations game running in this server.",
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(button)],
    flags: MessageFlags.Ephemeral,
  };
}

function lobbyComponents(
  game: IClashOfCreationGameCache,
): ActionRowBuilder<ButtonBuilder>[] {
  const joinButton = new ButtonBuilder()
    .setCustomId(`coc:${game.id}:join`)
    .setLabel("Join Battle")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(game.players.length >= MAX_PLAYERS);
  const startButton = new ButtonBuilder()
    .setCustomId(`coc:${game.id}:start`)
    .setLabel("Start Battle")
    .setStyle(ButtonStyle.Success)
    .setDisabled(game.players.length < MIN_PLAYERS);
  const pingCreatorButton = new ButtonBuilder()
    .setCustomId(`coc:${game.id}:ping`)
    .setLabel("Ask Creator to Start")
    .setStyle(ButtonStyle.Secondary);

  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      joinButton,
      startButton,
      pingCreatorButton,
    ),
  ];
}

function lobbyEmbed(game: IClashOfCreationGameCache): EmbedBuilder {
  const playerList = game.players
    .map((player, index) => `${index + 1}. <@${player.id}>`)
    .join("\n");

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("⚔️ Clash of Creations")
    .setDescription(
      [
        "Join the arena and prepare to pit your creation against the others!",
        "",
        `**Players (${game.players.length}/${MAX_PLAYERS}):**`,
        playerList || "No players have joined yet.",
        "",
        game.players.length < MIN_PLAYERS
          ? "At least 2 players are needed to start."
          : "The creator can start now, or the battle starts after 2 minutes without activity.",
        "Each player can ask the creator to start once.",
      ].join("\n"),
    )
    .setFooter({ text: "The game creator has already joined." });
}

function imaginationEmbed(game: IClashOfCreationGameCache): EmbedBuilder {
  const players = game.players
    .map((player) => {
      const statusEmoji = {
        waiting: "💭",
        imagining: "🤔",
        processing: "⚙️",
        ready: "✅",
        random: "🎲",
      }[player.imaginationStatus];
      return `${player.name}: ${statusEmoji}`;
    })
    .join("\n");

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("⚔️ Clash of Creations — Imagine Your Creation")
    .setDescription(
      [
        "Press **Imagine** and enter your creation in the private form.",
        "Your creation stays secret until everyone is ready. Your reaction is sent privately.",
        `Players who do not submit within ${IMAGINATION_TIME_MS / 60_000} minutes get a random creation.`,
        "",
        players,
      ].join("\n"),
    )
    .setFooter({
      text: "💭 Waiting • 🤔 Imagining • ⚙️ Processing • ✅ Ready • 🎲 Random creation",
    });
}

function imaginationComponents(
  game: IClashOfCreationGameCache,
): ActionRowBuilder<ButtonBuilder>[] {
  const hasUnfinishedPlayers = game.players.some((player) =>
    ["waiting", "imagining", "processing"].includes(player.imaginationStatus),
  );

  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`coc:${game.id}:imagine`)
        .setLabel("Imagine")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!hasUnfinishedPlayers),
      new ButtonBuilder()
        .setCustomId(`coc:${game.id}:ping-imagine`)
        .setLabel("Ping Players to Imagine")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasUnfinishedPlayers),
    ),
  ];
}

function creationRevealEmbed(game: IClashOfCreationGameCache): EmbedBuilder {
  const players = game.players
    .map((player) => {
      const emojis = player.ai?.emojis.join("") ?? "❔";
      return `**${player.name}:** ${emojis} — **${player.creation ?? "Unknown creation"}**`;
    })
    .join("\n");

  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle("✨ Creations Revealed")
    .setDescription(
      `Every creation is in. The Clash of Creations playoffs begin!\n\n${players}`,
    );
}

function creationModal(game: IClashOfCreationGameCache, userId: string) {
  const input = new TextInputBuilder()
    .setCustomId("creation")
    .setLabel("What is your creation?")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Keep it under 30 characters...")
    .setMaxLength(29)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId(`coc:${game.id}:creation:${userId}`)
    .setTitle("Imagine Your Creation")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(input),
    );
}

function expiredEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x747f8d)
    .setTitle("Clash of Creations — Lobby Closed")
    .setDescription(
      "The lobby closed because fewer than 2 players joined before it became inactive.",
    );
}

async function startGame(
  client: Client,
  game: IClashOfCreationGameCache,
  message: Message,
  collector: InteractionCollector<ButtonInteraction>,
  inactivityAutoStart = false,
): Promise<void> {
  if (game.status !== "lobby" || game.players.length < MIN_PLAYERS) return;

  if (
    inactivityAutoStart &&
    game.players.length < MAX_PLAYERS &&
    client.user &&
    Math.random() < 0.85
  ) {
    const botSeed = randomCreation();
    let botCreation = botSeed;
    if (Math.random() < 0.5) {
      try {
        botCreation = await createBotCreation(botSeed);
      } catch (error) {
        console.error(
          "Failed to generate a creative bot entry; using its random seed instead.",
          error,
        );
      }
    }

    const botPlayer: CreationBattlePlayer = {
      id: client.user.id,
      name: client.user.username,
      isBot: true,
      creation: botCreation,
      imaginationStatus: "processing",
      ai: null,
    };
    try {
      botPlayer.ai = await getCreationPhraseDetails(botCreation);
    } catch (error) {
      console.error(
        "Failed to generate details for the bot's creation; using neutral bot details.",
        error,
      );
      botPlayer.ai = {
        emojis: ["🤖"],
        opinion: "A mystery contender rolls into the arena!",
      };
    }
    botPlayer.imaginationStatus = "ready";
    game.players.push(botPlayer);
    client.cacheManager.set(gameCacheKey(game.serverId), game);
    await message.edit({ embeds: [lobbyEmbed(game)] });
    try {
      await message.reply({
        content:
          "🤖 I joined the game with a creation of my own. Let's see how it fares!",
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      console.error("Failed to announce the bot joining the game.", error);
    }
  }

  game.status = "imagining";
  client.cacheManager.set(gameCacheKey(game.serverId), game);
  collector.stop("started");
  await announceGameStart(game, message);
  await message.edit({
    embeds: [imaginationEmbed(game)],
    components: imaginationComponents(game),
  });
  try {
    await runImaginationPhase(client, game, message);
  } catch (error) {
    console.error("Clash of Creations gameplay failed.", error);
    game.status = "finished";
    client.cacheManager.set(gameCacheKey(game.serverId), game);
    await message.reply({
      content:
        "The game could not continue because of an unexpected error. Please start a new game.",
      allowedMentions: { parse: [] },
    });
  }
}

async function announceGameStart(
  game: IClashOfCreationGameCache,
  lobbyMessage: Message,
): Promise<void> {
  const humanPlayers = game.players.filter((player) => !player.isBot);
  if (humanPlayers.length === 0 || !lobbyMessage.channel.isSendable()) return;

  try {
    const pingMessage = await lobbyMessage.channel.send({
      content: `⚔️ Clash of Creations is starting! ${humanPlayers
        .map((player) => `<@${player.id}>`)
        .join(" ")}`,
      allowedMentions: {
        users: humanPlayers.map((player) => player.id),
      },
    });

    setTimeout(() => {
      void pingMessage.delete().catch((error) => {
        console.error("Failed to delete the temporary game-start ping.", error);
      });
    }, 5_000);
  } catch (error) {
    console.error("Failed to send the Clash of Creations start ping.", error);
  }
}

async function runImaginationPhase(
  client: Client,
  game: IClashOfCreationGameCache,
  message: Message,
): Promise<void> {
  const collector = message.createMessageComponentCollector({
    time: IMAGINATION_TIME_MS,
    componentType: ComponentType.Button,
    filter: (button) =>
      button.customId === `coc:${game.id}:imagine` ||
      button.customId === `coc:${game.id}:ping-imagine`,
  });

  const phaseEnded = new Promise<void>((resolve) => {
    collector.once("end", () => resolve());
  });
  const pendingSubmissions = new Set<Promise<void>>();

  const onModalSubmit = (interaction: Interaction) => {
    if (
      !interaction.isModalSubmit() ||
      interaction.customId !== `coc:${game.id}:creation:${interaction.user.id}`
    ) {
      return;
    }

    const submission = (async () => {
      const player = game.players.find(
        (candidate) => candidate.id === interaction.user.id,
      );
      if (
        game.status !== "imagining" ||
        !player ||
        player.imaginationStatus !== "imagining"
      ) {
        await interaction.reply({
          content:
            "The imagining phase has ended or your creation has already been locked in.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const creation = interaction.fields.getTextInputValue("creation").trim();
      if (!creation) {
        player.imaginationStatus = "waiting";
        client.cacheManager.set(gameCacheKey(game.serverId), game);
        await interaction.reply({
          content: "Please enter a creation before submitting.",
          flags: MessageFlags.Ephemeral,
        });
        await message.edit({
          embeds: [imaginationEmbed(game)],
          components: imaginationComponents(game),
        });
        return;
      }
      if (creation.length >= 30) {
        await interaction.reply({
          content: "Your creation must be fewer than 30 characters.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      player.creation = creation;
      player.imaginationStatus = "processing";
      collector.resetTimer({ time: IMAGINATION_TIME_MS });
      client.cacheManager.set(gameCacheKey(game.serverId), game);
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await message.edit({
        embeds: [imaginationEmbed(game)],
        components: imaginationComponents(game),
      });

      try {
        const fairness = await checkCreationFairness(creation);
        if (!fairness.fair) {
          player.creation = null;
          player.imaginationStatus = "imagining";
          client.cacheManager.set(gameCacheKey(game.serverId), game);
          await interaction.editReply({
            content: `That creation is too unbeatable for a fun matchup. ${fairness.reason} Please try a version that can be challenged.`,
          });
          await message.edit({
            embeds: [imaginationEmbed(game)],
            components: imaginationComponents(game),
          });
          return;
        }

        player.ai = await getCreationPhraseDetails(creation);
      } catch (error) {
        player.creation = null;
        player.imaginationStatus = "imagining";
        client.cacheManager.set(gameCacheKey(game.serverId), game);
        console.error("Failed to validate or analyze creation.", error);
        await interaction.editReply({
          content:
            "I couldn't analyze your creation. Please try submitting it again.",
        });
        await message.edit({
          embeds: [imaginationEmbed(game)],
          components: imaginationComponents(game),
        });
        return;
      }

      player.imaginationStatus = "ready";
      client.cacheManager.set(gameCacheKey(game.serverId), game);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("✨ Your Creation Is Ready")
            .setDescription(`${player.ai.emojis.join("")} — **${creation}**`)
            .addFields(
              {
                name: "My reaction",
                value: player.ai.opinion,
              },
              {
                name: "Status",
                value:
                  "Your creation will stay hidden until everyone is ready.",
              },
            ),
        ],
      });
      await message.edit({
        embeds: [imaginationEmbed(game)],
        components: imaginationComponents(game),
      });

      if (game.players.every((entry) => entry.imaginationStatus === "ready")) {
        collector.stop("all-ready");
      }
    })().catch((error) => {
      console.error("Failed to save a Clash of Creations entry.", error);
    });
    pendingSubmissions.add(submission);
    void submission.finally(() => pendingSubmissions.delete(submission));
  };

  client.on("interactionCreate", onModalSubmit);
  collector.on("collect", async (button) => {
    if (button.customId === `coc:${game.id}:ping-imagine`) {
      const requester = game.players.find(
        (player) => player.id === button.user.id,
      );
      if (!requester) {
        await button.reply({
          content: "Only players in this game can ping others.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      if (game.pingedImaginePlayers.includes(button.user.id)) {
        await button.reply({
          content: "You can only ping the remaining players once per game.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const waitingPlayers = game.players.filter(
        (player) =>
          player.id !== button.user.id &&
          ["waiting", "imagining"].includes(player.imaginationStatus),
      );
      if (waitingPlayers.length === 0) {
        await button.reply({
          content: "There are no other players left to remind.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await button.deferUpdate();
      game.pingedImaginePlayers.push(button.user.id);
      client.cacheManager.set(gameCacheKey(game.serverId), game);
      try {
        if (!message.channel.isSendable()) {
          throw new Error("The game channel cannot send messages.");
        }
        await message.channel.send({
          content: `${waitingPlayers.map((player) => `<@${player.id}>`).join(" ")} — your creations are needed in Clash of Creations!`,
          allowedMentions: {
            users: waitingPlayers.map((player) => player.id),
          },
        });
      } catch (error) {
        game.pingedImaginePlayers = game.pingedImaginePlayers.filter(
          (playerId) => playerId !== button.user.id,
        );
        client.cacheManager.set(gameCacheKey(game.serverId), game);
        console.error(
          "Failed to ping players who have not imagined yet.",
          error,
        );
        await button.followUp({
          content: "I couldn't send the reminders. Please try again.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await button.followUp({
        content:
          "The remaining players have been pinged. You can only do this once per game.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const player = game.players.find(
      (candidate) => candidate.id === button.user.id,
    );
    if (!player) {
      await button.reply({
        content: "Only players in this game can submit a creation.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (
      player.imaginationStatus === "processing" ||
      player.imaginationStatus === "ready" ||
      player.imaginationStatus === "random"
    ) {
      await button.reply({
        content: "You have already submitted your creation.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    player.imaginationStatus = "imagining";
    client.cacheManager.set(gameCacheKey(game.serverId), game);
    try {
      await button.showModal(creationModal(game, button.user.id));
      collector.resetTimer({ time: IMAGINATION_TIME_MS });
    } catch (error) {
      player.imaginationStatus = "waiting";
      client.cacheManager.set(gameCacheKey(game.serverId), game);
      console.error("Failed to open the creation form.", error);
      if (!button.replied && !button.deferred) {
        await button.reply({
          content: "I couldn't open the creation form. Please try again.",
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }

    try {
      await message.edit({
        embeds: [imaginationEmbed(game)],
        components: imaginationComponents(game),
      });
    } catch (error) {
      console.error(
        "Failed to update the Clash of Creations status display.",
        error,
      );
    }
  });

  await phaseEnded;
  await Promise.all(pendingSubmissions);
  client.off("interactionCreate", onModalSubmit);

  if (game.status !== "imagining") return;

  for (const player of game.players) {
    if (player.imaginationStatus === "ready") continue;
    player.creation = randomCreation();
    player.imaginationStatus = "processing";
    player.ai = await getCreationPhraseDetails(player.creation);
    player.imaginationStatus = "random";
  }

  game.status = "playoffs";
  client.cacheManager.set(gameCacheKey(game.serverId), game);
  await message.edit({
    embeds: [creationRevealEmbed(game)],
    components: [],
  });
  await runPlayoffs(client, game, message);
}

async function runPlayoffs(
  client: Client,
  game: IClashOfCreationGameCache,
  lobbyMessage: Message,
): Promise<void> {
  let round = 1;
  let contenders = shuffle([...game.players]);

  while (contenders.length > 1) {
    const nextRound: CreationBattlePlayer[] = [];
    const hasBye = contenders.length % 2 === 1;
    if (hasBye) nextRound.push(contenders[contenders.length - 1]);

    const pairCount = contenders.length - (hasBye ? 1 : 0);
    for (let index = 0; index < pairCount; index += 2) {
      const players: [CreationBattlePlayer, CreationBattlePlayer] = [
        contenders[index],
        contenders[index + 1],
      ];
      const isFinal = contenders.length === 2;
      const humanFighters = players.filter((player) => !player.isBot);
      await lobbyMessage.reply({
        content: humanFighters.length
          ? `⚔️ ${humanFighters.map((player) => `<@${player.id}>`).join(" vs ")} — your creations are up!`
          : "⚔️ The contenders are ready. Let the battle begin!",
        embeds: [matchupEmbed(players, round, index / 2 + 1)],
        allowedMentions: {
          users: humanFighters.map((player) => player.id),
          parse: [],
        },
      });
      let result = await battleCreations(players[0], players[1]);
      game.results.push(result);
      client.cacheManager.set(gameCacheKey(game.serverId), game);
      await lobbyMessage.reply({
        embeds: [battleEmbed(result, round, index / 2 + 1)],
        allowedMentions: { parse: [] },
      });

      if (isFinal && result.tie) {
        await lobbyMessage.reply({
          content: humanFighters.length
            ? `⚔️ ${humanFighters.map((player) => `<@${player.id}>`).join(" vs ")} — the final is tied! Rematch!`
            : "⚔️ The final is tied! Rematch!",
          embeds: [matchupEmbed(players, round, index / 2 + 1, true)],
          allowedMentions: {
            users: humanFighters.map((player) => player.id),
            parse: [],
          },
        });
        result = await battleCreations(players[0], players[1], true);
        game.results.push(result);
        client.cacheManager.set(gameCacheKey(game.serverId), game);
        await lobbyMessage.reply({
          embeds: [battleEmbed(result, round, index / 2 + 1, true)],
          allowedMentions: { parse: [] },
        });
      }

      if (result.tie) {
        nextRound.push(...players);
      } else if (result.winner) {
        nextRound.push(result.winner);
      }
    }

    contenders = shuffle(nextRound);
    round++;
    if (contenders.length > 1) {
      await lobbyMessage.reply({
        content: `The next playoff round begins in ${PLAYOFF_ROUND_GAP_MS / 1000} seconds!`,
        allowedMentions: { parse: [] },
      });
      await delay(PLAYOFF_ROUND_GAP_MS);
    }
  }

  const winner = contenders[0];
  game.status = "finished";
  client.cacheManager.set(gameCacheKey(game.serverId), game);
  let winnerDialogue: string;
  try {
    winnerDialogue = await generateWinnerDialogue(
      winner,
      game.players,
      game.results,
    );
  } catch (error) {
    console.error("Failed to generate the champion's victory dialogue.", error);
    winnerDialogue = `${winner.creation} celebrates: "I made it through every clash and I'm still standing!"`;
  }

  await lobbyMessage.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle("🏆🏆🏆 THE CHAMPION 🏆🏆🏆")
        .setDescription(
          [
            `# ${winner.name.toUpperCase()} WINS!`,
            "",
            `${winner.ai?.emojis.join(" ") ?? "🏆"} **${winner.creation}**`,
            "",
            `> ${winnerDialogue}`,
            "",
            "This creation stands last and takes the Clash of Creations crown!",
          ].join("\n"),
        )
        .setFooter({ text: "CLASH OF CREATIONS CHAMPION" }),
    ],
    allowedMentions: { parse: [] },
  });
}

function matchupEmbed(
  players: [CreationBattlePlayer, CreationBattlePlayer],
  round: number,
  match: number,
  rematch = false,
): EmbedBuilder {
  const lines = players.map((player) => {
    const emojis = player.ai?.emojis.join("") ?? "❔";
    return `**${player.name}:** ${emojis} — **${player.creation ?? "Unknown creation"}**`;
  });

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(
      `⚔️ ${round === 1 ? "Opening Round" : `Round ${round}`} • Match ${match}${
        rematch ? " • Final rematch" : ""
      }`,
    )
    .setDescription(lines.join("\n\n"));
}

function battleEmbed(
  result: CreationBattleResult,
  round: number,
  match: number,
  noTieRematch = false,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(result.tie ? 0xf1c40f : 0x57f287)
    .setTitle(
      result.tie
        ? `🤝 ROUND ${round} • MATCH ${match} — DRAW`
        : `🏆 ${result.winner?.name.toUpperCase() ?? "WINNER"} WINS!`,
    )
    .setDescription(
      [
        result.message,
        "",
        `**${round === 1 ? "Opening Round" : `Round ${round}`} • Match ${match}${noTieRematch ? " • No-draw rematch" : ""}**`,
      ].join("\n"),
    )
    .setFooter({
      text: result.tie
        ? "It's a draw — both creations advance!"
        : `🏆 ${result.winner?.name ?? "A contender"} advances!`,
    });

  const players = result.players
    .map((player) => {
      const emojis = player.ai?.emojis.join("") ?? "❔";
      return `**${player.name}:** ${emojis} — **${player.creation ?? "Unknown creation"}**`;
    })
    .join("\n");
  embed.addFields({ name: "Fighters", value: players });

  return embed;
}

export async function createGameInstance(
  client: Client,
  interaction: ChatInputCommandInteraction,
): Promise<IClashOfCreationGameCache> {
  const serverId = interaction.guildId;
  if (!serverId) {
    throw new Error("Clash of Creations can only be started in a server.");
  }

  const cachedGame = getServerGame(client, serverId);
  if (
    (cachedGame && cachedGame.status !== "finished") ||
    gameCreationLocks.has(serverId)
  ) {
    await gameCreationLocks.get(serverId);
    const existingGame = getServerGame(client, serverId);
    if (existingGame && existingGame.status !== "finished") {
      await interaction.reply(existingGameReply(existingGame));
      return existingGame;
    }
  }

  let releaseCreation!: () => void;
  const creationLock = new Promise<void>((resolve) => {
    releaseCreation = resolve;
  });
  gameCreationLocks.set(serverId, creationLock);

  const game: IClashOfCreationGameCache = {
    id: randomUUID(),
    serverId,
    creatorId: interaction.user.id,
    status: "lobby",
    pingedPlayers: [],
    pingedImaginePlayers: [],
    players: [
      {
        id: interaction.user.id,
        name: interaction.user.username,
        isBot: false,
        creation: null,
        imaginationStatus: "waiting",
        ai: null,
      },
    ],
    location: [interaction.channelId, interaction.id],
    results: [],
  };

  client.cacheManager.set(gameCacheKey(serverId), game);
  let message: Message;
  try {
    const response = await interaction.reply({
      embeds: [lobbyEmbed(game)],
      components: lobbyComponents(game),
      withResponse: true,
    });
    const replyMessage = response.resource?.message;
    if (!replyMessage) {
      throw new Error(
        "Discord did not return the Clash of Creations lobby message.",
      );
    }
    message = replyMessage;
    game.location[1] = message.id;
    client.cacheManager.set(gameCacheKey(serverId), game);
  } catch (error) {
    client.cacheManager.delete(gameCacheKey(serverId));
    throw error;
  } finally {
    gameCreationLocks.delete(serverId);
    releaseCreation();
  }

  const collector = message.createMessageComponentCollector({
    idle: LOBBY_IDLE_MS,
    componentType: ComponentType.Button,
    filter: (button) =>
      button.customId === `coc:${game.id}:join` ||
      button.customId === `coc:${game.id}:start` ||
      button.customId === `coc:${game.id}:ping`,
  });

  collector.on("collect", async (button) => {
    if (game.status !== "lobby") {
      await button.reply({
        content: "This battle has already started.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (button.customId === `coc:${game.id}:join`) {
      if (game.players.some((player) => player.id === button.user.id)) {
        await button.reply({
          content: "You have already joined this battle.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (game.players.length >= MAX_PLAYERS) {
        await button.reply({
          content: "This battle already has the maximum of 10 players.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const player: CreationBattlePlayer = {
        id: button.user.id,
        name: button.user.username,
        isBot: false,
        creation: null,
        imaginationStatus: "waiting",
        ai: null,
      };
      game.players.push(player);
      client.cacheManager.set(gameCacheKey(serverId), game);
      collector.resetTimer({ idle: LOBBY_IDLE_MS });
      await button.update({
        embeds: [lobbyEmbed(game)],
        components: lobbyComponents(game),
      });
      return;
    }

    if (button.customId === `coc:${game.id}:ping`) {
      if (!game.players.some((player) => player.id === button.user.id)) {
        await button.reply({
          content: "Join the lobby before asking its creator to start.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (button.user.id === game.creatorId) {
        await button.reply({
          content: "You are the creator. Use Start Battle when you're ready.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (game.pingedPlayers.includes(button.user.id)) {
        await button.reply({
          content: "You have already asked the creator to start this game.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      game.pingedPlayers.push(button.user.id);
      client.cacheManager.set(gameCacheKey(serverId), game);
      await button.deferUpdate();
      try {
        if (!message.channel.isSendable()) {
          throw new Error("The game channel cannot send messages.");
        }
        await message.channel.send({
          content: `<@${game.creatorId}> <@${button.user.id}> wants you to start Clash of Creations!`,
          allowedMentions: { users: [game.creatorId] },
        });
      } catch (error) {
        game.pingedPlayers = game.pingedPlayers.filter(
          (playerId) => playerId !== button.user.id,
        );
        client.cacheManager.set(gameCacheKey(serverId), game);
        console.error(
          "Failed to ping the Clash of Creations game creator.",
          error,
        );
        await button.followUp({
          content: "I couldn't send the creator's ping. Please try again.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await button.followUp({
        content: "The creator has been pinged. You can only ask once per game.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (button.user.id !== game.creatorId) {
      await button.reply({
        content:
          "Only the game creator can start the battle. Use the request button to ask them.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (game.players.length < MIN_PLAYERS) {
      await button.reply({
        content: "At least 2 players are needed to start the battle.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await button.deferUpdate();
    await startGame(client, game, message, collector);
  });

  collector.on("end", async (_collected, reason) => {
    if (reason === "started" || game.status !== "lobby") return;

    if (game.players.length >= MIN_PLAYERS) {
      await startGame(client, game, message, collector, reason === "idle");
      return;
    }

    client.cacheManager.delete(gameCacheKey(serverId));
    await message.edit({ embeds: [expiredEmbed()], components: [] });
  });

  return game;
}
