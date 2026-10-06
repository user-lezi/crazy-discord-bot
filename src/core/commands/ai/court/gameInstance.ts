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
  Message,
  MessageFlags,
  ModalBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import {
  IAIJudgeGame,
  JudgeMatch,
  JudgePlayer,
  JudgeRound,
  createJudgePlayer,
  generateJudgeQuestion,
  judgeAnswers,
} from "./ai";
import { randomInt, randomUUID } from "node:crypto";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 12;
const LOBBY_IDLE_MS = 2 * 60 * 1000;
const ANSWER_WINDOW_MS = 2 * 60 * 1000;
const VOTE_WINDOW_MS = 30 * 1000;
const ANSWER_MAX_LENGTH = 1000;
const ROUND_GAP_MS = 4 * 1000;
const CACHE_PREFIX = "ai-judge:server:";

function cacheKey(serverId: string): string {
  return `${CACHE_PREFIX}${serverId}`;
}

function getActiveGame(
  client: Client,
  serverId: string,
): IAIJudgeGame | undefined {
  const game = client.cacheManager.get(cacheKey(serverId)) as
    IAIJudgeGame | undefined;
  return game && (game.status === "lobby" || game.status === "playing")
    ? game
    : undefined;
}

function shuffle<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = randomInt(index + 1);
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function lobbyEmbed(game: IAIJudgeGame): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setTitle("⚖️ The Court")
    .setDescription(
      [
        "Join the court. Paired players answer the same AI-generated question in private.",
        `You have **${ANSWER_WINDOW_MS / 60_000} minutes** to answer. The other players vote for who advances; the AI judge breaks ties.`,
        "",
        `**Contestants (${game.players.length}/${MAX_PLAYERS}):**`,
        game.players
          .map((player, index) => `${index + 1}. <@${player.id}>`)
          .join("\n"),
        "",
        `The creator is <@${game.creatorId}>. Players may ping the creator once.`,
        game.players.length < MIN_PLAYERS
          ? `At least ${MIN_PLAYERS} players are needed to start.`
          : "The creator can start, or the lobby closes after 2 minutes of inactivity.",
      ].join("\n"),
    )
    .setFooter({
      text: "If the judge can't decide, chance decides—and the judge regrets it.",
    });
}

function lobbyComponents(
  game: IAIJudgeGame,
): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`aij:${game.id}:join`)
        .setLabel("Join Court")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(game.players.length >= MAX_PLAYERS),
      new ButtonBuilder()
        .setCustomId(`aij:${game.id}:start`)
        .setLabel("Start Court")
        .setStyle(ButtonStyle.Success)
        .setDisabled(game.players.length < MIN_PLAYERS),
      new ButtonBuilder()
        .setCustomId(`aij:${game.id}:ping-owner`)
        .setLabel("Ping Owner")
        .setStyle(ButtonStyle.Secondary),
    ),
  ];
}

function answerModal(
  game: IAIJudgeGame,
  round: number,
  match: number,
  player: JudgePlayer,
  question: string,
): ModalBuilder {
  const answer = new TextInputBuilder()
    .setCustomId("answer")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Write a concise answer to the question...")
    .setMaxLength(ANSWER_MAX_LENGTH)
    .setRequired(true);
  return new ModalBuilder()
    .setCustomId(`aij:${game.id}:${round}:${match}:${player.id}`)
    .setTitle("Answer the Judge")
    .addLabelComponents((label) =>
      label
        .setLabel("Here is your question")
        .setDescription(question)
        .setTextInputComponent(answer),
    );
}

function answerButton(
  game: IAIJudgeGame,
  round: number,
  match: number,
  disabled = false,
): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`aij:${game.id}:answer:${round}:${match}`)
        .setLabel("Submit Your Answer")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`aij:${game.id}:ping-answer:${round}:${match}`)
        .setLabel("Ping to Answer")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
    ),
  ];
}

function matchEmbed(
  round: number,
  matchNumber: number,
  players: [JudgePlayer, JudgePlayer],
  question: string,
  chaosMode: boolean,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setTitle(`${chaosMode ? "🌪️ Chaos Court" : "⚖️ The Court"} · ${question}`)
    .setDescription(
      [
        `**Round ${round} · Match ${matchNumber}**`,
        `<@${players[0].id}> **vs** <@${players[1].id}>`,
        "",
        `Both contestants have **${ANSWER_WINDOW_MS / 60_000} minutes** to submit privately.`,
        "Answers will be revealed after the timer or once both are in.",
      ].join("\n"),
    );
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength
    ? value
    : `${value.slice(0, maxLength - 1)}…`;
}

function voteEmbed(
  round: number,
  matchNumber: number,
  players: [JudgePlayer, JudgePlayer],
  question: string,
  chaosMode: boolean,
  answers: [string, string],
  eligibleVoters: number,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setTitle(
      `${chaosMode ? "🌪️ Chaos Court" : "🗳️ The Court"} · Round ${round}, Match ${matchNumber}`,
    )
    .setDescription(
      [
        `**Question:** ${question}`,
        "",
        `**<@${players[0].id}>:** ${answers[0]}`,
        "",
        `**<@${players[1].id}>:** ${answers[1]}`,
        "",
        eligibleVoters
          ? `Everyone in the lobby except these two contestants may vote, including eliminated players. Voting closes in ${VOTE_WINDOW_MS / 1000} seconds.`
          : "There are no eligible voters, so the AI judge will decide this match.",
      ].join("\n"),
    );
}

async function collectVotes(
  game: IAIJudgeGame,
  round: number,
  matchNumber: number,
  players: [JudgePlayer, JudgePlayer],
  question: string,
  chaosMode: boolean,
  answers: [string, string],
  lobbyMessage: Message,
): Promise<[number, number]> {
  const voters = game.players.filter(
    (player) => !players.some((contestant) => contestant.id === player.id),
  );
  if (!lobbyMessage.channel.isSendable()) {
    throw new Error("The AI Court voting channel cannot send messages.");
  }
  const menu = new StringSelectMenuBuilder()
    .setCustomId(`aij:${game.id}:vote:${round}:${matchNumber}`)
    .setPlaceholder("Choose the answer that deserves to advance")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      players.map((player, index) => ({
        label: truncate(player.name, 100),
        description: truncate(answers[index], 100),
        value: String(index),
      })),
    );
  const voteMessage = await lobbyMessage.channel.send({
    embeds: [
      voteEmbed(
        round,
        matchNumber,
        players,
        question,
        chaosMode,
        answers,
        voters.length,
      ),
    ],
    components: voters.length
      ? [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)]
      : [],
    allowedMentions: { parse: [] },
  });
  if (!voters.length) {
    return [0, 0];
  }

  const votes = new Map<string, number>();
  const collector = voteMessage.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: VOTE_WINDOW_MS,
    filter: (select) =>
      select.customId === `aij:${game.id}:vote:${round}:${matchNumber}`,
  });
  collector.on("collect", (select: StringSelectMenuInteraction) => {
    void (async () => {
      if (!voters.some((voter) => voter.id === select.user.id)) {
        await select.reply({
          content: "Only other players in this court can vote.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      if (votes.has(select.user.id)) {
        await select.reply({
          content: "Your vote is already locked in for this match.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const selected = Number(select.values[0]);
      if (selected !== 0 && selected !== 1) {
        await select.reply({
          content: "That vote option is invalid. Please use the court's menu.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      votes.set(select.user.id, selected);
      await select.reply({
        content:
          "Your vote has been counted. The court will reveal the tally when voting closes.",
        flags: MessageFlags.Ephemeral,
      });
      if (votes.size === voters.length) collector.stop("all-voted");
    })().catch((error) => {
      console.error("Failed to accept a Court vote.", error);
      if (!select.replied && !select.deferred) {
        void select
          .reply({
            content: votes.has(select.user.id)
              ? "Your vote may have been recorded, but I couldn't confirm it."
              : "I couldn't record your vote. Please try again.",
            flags: MessageFlags.Ephemeral,
          })
          .catch((replyError) => {
            console.error("Failed to report a Court vote error.", replyError);
          });
      }
    });
  });

  await new Promise<void>((resolve) => collector.once("end", () => resolve()));
  await voteMessage.edit({ components: [] });
  return [
    [...votes.values()].filter((vote) => vote === 0).length,
    [...votes.values()].filter((vote) => vote === 1).length,
  ];
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function collectAnswers(
  client: Client,
  game: IAIJudgeGame,
  round: number,
  matchNumber: number,
  players: [JudgePlayer, JudgePlayer],
  question: string,
  chaosMode: boolean,
  message: Message,
): Promise<[string | null, string | null]> {
  const answers = new Map<string, string>();
  const modalIds = new Map(
    players.map((player) => [
      `aij:${game.id}:${round}:${matchNumber}:${player.id}`,
      player.id,
    ]),
  );
  const modalOpen = new Set<string>();
  let phaseActive = true;
  let resolveAnswers!: (result: [string | null, string | null]) => void;
  const completed = new Promise<[string | null, string | null]>((resolve) => {
    resolveAnswers = resolve;
  });
  const finish = () => {
    if (!phaseActive) return;
    phaseActive = false;
    collector.stop("complete");
    resolveAnswers([
      answers.get(players[0].id) ?? null,
      answers.get(players[1].id) ?? null,
    ]);
  };
  const onModalSubmit = (interaction: Interaction) => {
    if (!interaction.isModalSubmit()) return;
    const playerId = modalIds.get(interaction.customId);
    if (!playerId) return;

    void (async () => {
      if (!phaseActive) {
        await interaction.reply({
          content: "The 2-minute answer window has ended.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      if (interaction.user.id !== playerId) {
        await interaction.reply({
          content: "Only the contestant who opened this form can submit it.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      if (answers.has(playerId)) {
        await interaction.reply({
          content: "Your answer is already locked in.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const answer = interaction.fields.getTextInputValue("answer").trim();
      if (!answer) {
        modalOpen.delete(playerId);
        await interaction.reply({
          content: "Your answer cannot be empty.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      answers.set(playerId, answer);
      modalOpen.delete(playerId);
      await interaction.reply({
        content:
          "Your answer is locked in. The judge will review it when the round closes.",
        flags: MessageFlags.Ephemeral,
      });
      await message.edit({
        embeds: [
          matchEmbed(
            round,
            matchNumber,
            players,
            question,
            chaosMode,
          ).setFooter({ text: `${answers.size}/2 answers submitted` }),
        ],
        components: answerButton(
          game,
          round,
          matchNumber,
          answers.size === players.length,
        ),
      });
      if (answers.size === players.length) finish();
    })().catch((error) => {
      console.error("Failed to accept an AI Judge answer.", error);
    });
  };

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: ANSWER_WINDOW_MS,
    filter: (button) =>
      button.customId === `aij:${game.id}:answer:${round}:${matchNumber}` ||
      button.customId === `aij:${game.id}:ping-answer:${round}:${matchNumber}`,
  });
  collector.once("end", () => {
    if (phaseActive) {
      phaseActive = false;
      resolveAnswers([
        answers.get(players[0].id) ?? null,
        answers.get(players[1].id) ?? null,
      ]);
    }
  });
  client.on("interactionCreate", onModalSubmit);
  collector.on("collect", async (button: ButtonInteraction) => {
    const player = players.find((entry) => entry.id === button.user.id);
    if (!player) {
      await button.reply({
        content: "Only the two contestants in this match can answer.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (
      button.customId === `aij:${game.id}:ping-answer:${round}:${matchNumber}`
    ) {
      if (game.pingedAnswerPlayers.includes(player.id)) {
        await button.reply({
          content: "You can only ping for an answer once per AI Judge game.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const opponent = players.find((entry) => entry.id !== player.id);
      if (!opponent) {
        throw new Error("The active AI Judge match has no opposing player.");
      }
      game.pingedAnswerPlayers.push(player.id);
      client.cacheManager.set(cacheKey(game.serverId), game);
      try {
        await button.deferUpdate();
        if (!message.channel.isSendable()) {
          throw new Error("The AI Judge match channel cannot send messages.");
        }
        await message.channel.send({
          content: `<@${opponent.id}> — <@${player.id}> is ready and has asked you to submit your AI Judge answer.`,
          allowedMentions: { users: [opponent.id] },
        });
      } catch (error) {
        game.pingedAnswerPlayers = game.pingedAnswerPlayers.filter(
          (playerId) => playerId !== player.id,
        );
        client.cacheManager.set(cacheKey(game.serverId), game);
        console.error("Failed to ping an AI Judge opponent to answer.", error);
        await button.followUp({
          content: "I couldn't send that reminder. Please try again.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      try {
        await button.followUp({
          content: `${opponent.name} has been pinged. You can only do this once per game.`,
          flags: MessageFlags.Ephemeral,
        });
      } catch (error) {
        console.error("Failed to confirm the AI Judge answer reminder.", error);
      }
      return;
    }
    if (answers.has(player.id) || modalOpen.has(player.id)) {
      await button.reply({
        content: "Your answer is already submitted or open in a modal.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    modalOpen.add(player.id);
    try {
      await button.showModal(
        answerModal(game, round, matchNumber, player, question),
      );
    } catch (error) {
      modalOpen.delete(player.id);
      console.error("Failed to open an AI Judge answer modal.", error);
      if (!button.replied && !button.deferred) {
        await button.reply({
          content: "I couldn't open your answer form. Please try again.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });

  try {
    return await completed;
  } finally {
    phaseActive = false;
    collector.stop("finished");
    client.off("interactionCreate", onModalSubmit);
    await message.edit({
      components: answerButton(game, round, matchNumber, true),
    });
  }
}

async function runTournament(
  client: Client,
  game: IAIJudgeGame,
  lobbyMessage: Message,
): Promise<void> {
  let contenders = shuffle(game.players);
  let roundNumber = 1;

  while (contenders.length > 1) {
    const round: JudgeRound = { round: roundNumber, matches: [], byes: [] };
    game.rounds.push(round);
    client.cacheManager.set(cacheKey(game.serverId), game);
    const entrants = shuffle(contenders);
    const nextRound: JudgePlayer[] = [];
    if (entrants.length % 2 === 1) {
      const bye = entrants.pop();
      if (bye) {
        round.byes.push(bye);
        nextRound.push(bye);
        await lobbyMessage.reply({
          content: `🏃 <@${bye.id}> gets a bye and advances directly to the next round.`,
          allowedMentions: { parse: [] },
        });
      }
    }

    for (let index = 0; index < entrants.length; index += 2) {
      const players: [JudgePlayer, JudgePlayer] = [
        entrants[index],
        entrants[index + 1],
      ];
      const matchNumber = index / 2 + 1;
      const previousMatches = game.rounds.flatMap((entry) => entry.matches);
      const previousMatch = previousMatches[previousMatches.length - 1];
      const generatedQuestion = await generateJudgeQuestion(
        roundNumber,
        players,
        previousMatch,
      );
      const { question, chaosMode } = generatedQuestion;
      const matchMessage = await lobbyMessage.reply({
        content: `⚖️ <@${players[0].id}> and <@${players[1].id}> — you're up! Submit your answers within ${ANSWER_WINDOW_MS / 60_000} minutes.`,
        embeds: [
          matchEmbed(roundNumber, matchNumber, players, question, chaosMode),
        ],
        components: answerButton(game, roundNumber, matchNumber),
        allowedMentions: { users: players.map((player) => player.id) },
      });

      const answers = await collectAnswers(
        client,
        game,
        roundNumber,
        matchNumber,
        players,
        question,
        chaosMode,
        matchMessage,
      );

      let eliminated: JudgePlayer;
      let winner: JudgePlayer;
      let verdict: string;
      let votes: [number, number] = [0, 0];
      let decisionBy: JudgeMatch["decisionBy"];

      if (!answers[0] || !answers[1]) {
        if (!answers[0] && !answers[1]) {
          eliminated = players[randomInt(2)];
          winner = players[players[0].id === eliminated.id ? 1 : 0];
          decisionBy = "random";
          verdict =
            "Neither contestant submitted in time, so the clock made the call. Even I couldn't save this round. 😭";
        } else {
          const missingIndex = answers[0] ? 1 : 0;
          eliminated = players[missingIndex];
          winner = players[1 - missingIndex];
          decisionBy = "timeout";
          verdict = `<@${eliminated.id}> didn't submit before time ran out, so <@${winner.id}> advances by default.`;
        }
      } else {
        votes = await collectVotes(
          game,
          roundNumber,
          matchNumber,
          players,
          question,
          chaosMode,
          [answers[0], answers[1]],
          lobbyMessage,
        );
        if (votes[0] !== votes[1]) {
          const winnerIndex = votes[0] > votes[1] ? 0 : 1;
          winner = players[winnerIndex];
          eliminated = players[1 - winnerIndex];
          decisionBy = "votes";
          verdict = `The court votes **${votes[0]}–${votes[1]}**. <@${winner.id}> wins the room's verdict and advances.`;
        } else {
          const judgment = await judgeAnswers(
            roundNumber,
            players,
            question,
            [answers[0], answers[1]],
            votes,
          );
          const winnerIndex = judgment.outcome === "player1" ? 0 : 1;
          winner = players[winnerIndex];
          eliminated = players[1 - winnerIndex];
          decisionBy = "judge";
          verdict = `The court vote tied **${votes[0]}–${votes[1]}**, so I had to break it.\n\n${judgment.verdict}`;
        }
      }

      const result: JudgeMatch = {
        players,
        question,
        chaosMode,
        answers: [
          answers[0] ?? "[No answer submitted]",
          answers[1] ?? "[No answer submitted]",
        ],
        eliminated,
        winner,
        verdict,
        votes,
        decisionBy,
      };
      round.matches.push(result);
      nextRound.push(winner);
      client.cacheManager.set(cacheKey(game.serverId), game);
      await lobbyMessage.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(decisionBy === "random" ? 0xe67e22 : 0x8b5cf6)
            .setTitle(
              decisionBy === "random"
                ? "😭 The Court Couldn't Decide"
                : `${chaosMode ? "🌪️ Chaos Court" : decisionBy === "votes" ? "🗳️ The Court's Verdict" : "⚖️ The Judge's Verdict"} · Round ${roundNumber}, Match ${matchNumber}`,
            )
            .setDescription(
              [
                `**Question:** ${question}`,
                "",
                `**<@${players[0].id}>:** ${result.answers[0]}`,
                `**<@${players[1].id}>:** ${result.answers[1]}`,
                "",
                verdict,
                "",
                `🏅 **<@${winner.id}> advances.**`,
                `💔 **<@${eliminated.id}> is eliminated.**`,
              ].join("\n"),
            ),
        ],
        allowedMentions: { parse: [] },
      });
    }

    contenders = nextRound;
    roundNumber++;
    if (contenders.length > 1) {
      await wait(ROUND_GAP_MS);
    }
  }

  const champion = contenders[0];
  game.status = "finished";
  client.cacheManager.set(cacheKey(game.serverId), game);
  await lobbyMessage.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xf1c40f)
        .setTitle("🏆 The Last One Standing")
        .setDescription(
          `<@${champion.id}> outlasted the court and is crowned the AI Judge champion!`,
        ),
    ],
    allowedMentions: { users: [champion.id] },
  });
}

export async function createCourtGame(
  client: Client,
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const serverId = interaction.guildId;
  if (!serverId) {
    throw new Error("AI Judge can only be started in a server.");
  }
  const active = getActiveGame(client, serverId);
  if (active) {
    await interaction.reply({
      content: "An AI Judge game is already running in this server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const game: IAIJudgeGame = {
    id: randomUUID(),
    serverId,
    creatorId: interaction.user.id,
    status: "lobby",
    pingedOwnerPlayers: [],
    pingedAnswerPlayers: [],
    players: [
      createJudgePlayer(
        interaction.user.id,
        interaction.user.username,
        interaction.user.globalName ?? interaction.user.username,
        interaction.user.bot,
        interaction.user.createdTimestamp,
      ),
    ],
    rounds: [],
    location: [interaction.channelId, interaction.id],
  };
  client.cacheManager.set(cacheKey(serverId), game);

  try {
    const response = await interaction.reply({
      embeds: [lobbyEmbed(game)],
      components: lobbyComponents(game),
      withResponse: true,
    });
    const lobbyMessage = response.resource?.message;
    if (!lobbyMessage) {
      throw new Error("Discord did not return the AI Judge lobby message.");
    }
    game.location[1] = lobbyMessage.id;

    const collector = lobbyMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      idle: LOBBY_IDLE_MS,
      filter: (button) =>
        button.customId === `aij:${game.id}:join` ||
        button.customId === `aij:${game.id}:start` ||
        button.customId === `aij:${game.id}:ping-owner`,
    });
    collector.on("collect", async (button) => {
      if (game.status !== "lobby") {
        await button.reply({
          content: "This AI Judge game has already started or ended.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      if (button.customId === `aij:${game.id}:join`) {
        if (button.user.bot) {
          await button.reply({
            content: "Only people can compete in the AI Judge court.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        if (game.players.some((player) => player.id === button.user.id)) {
          await button.reply({
            content: "You are already in the court.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        if (game.players.length >= MAX_PLAYERS) {
          await button.reply({
            content: "The court is full (12 contestants maximum).",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        game.players.push(
          createJudgePlayer(
            button.user.id,
            button.user.username,
            button.user.globalName ?? button.user.username,
            button.user.bot,
            button.user.createdTimestamp,
          ),
        );
        client.cacheManager.set(cacheKey(serverId), game);
        collector.resetTimer({ idle: LOBBY_IDLE_MS });
        await button.update({
          embeds: [lobbyEmbed(game)],
          components: lobbyComponents(game),
        });
        return;
      }

      if (button.customId === `aij:${game.id}:ping-owner`) {
        if (!game.players.some((player) => player.id === button.user.id)) {
          await button.reply({
            content: "Join the court before pinging its owner.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        if (button.user.id === game.creatorId) {
          await button.reply({
            content: "You're the owner of this court!",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        if (game.pingedOwnerPlayers.includes(button.user.id)) {
          await button.reply({
            content: "You can only ping the owner once per AI Judge game.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        game.pingedOwnerPlayers.push(button.user.id);
        client.cacheManager.set(cacheKey(serverId), game);
        try {
          await button.deferUpdate();
          if (!lobbyMessage.channel.isSendable()) {
            throw new Error("The AI Judge lobby channel cannot send messages.");
          }
          await lobbyMessage.channel.send({
            content: `<@${game.creatorId}> — <@${button.user.id}> is ready to start the AI Judge trial.`,
            allowedMentions: { users: [game.creatorId] },
          });
        } catch (error) {
          game.pingedOwnerPlayers = game.pingedOwnerPlayers.filter(
            (playerId) => playerId !== button.user.id,
          );
          client.cacheManager.set(cacheKey(serverId), game);
          console.error("Failed to ping the AI Judge game owner.", error);
          await button.followUp({
            content: "I couldn't send the owner a reminder. Please try again.",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        try {
          await button.followUp({
            content:
              "The owner has been pinged. You can only do this once per game.",
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          console.error(
            "Failed to confirm the AI Judge owner reminder.",
            error,
          );
        }
        return;
      }

      if (button.user.id !== game.creatorId) {
        await button.reply({
          content: "Only the game creator can start the trial.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      if (game.players.length < MIN_PLAYERS) {
        await button.reply({
          content: "At least two contestants are needed.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await button.deferUpdate();
      game.status = "playing";
      client.cacheManager.set(cacheKey(serverId), game);
      collector.stop("started");
      try {
        await lobbyMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setColor(0x8b5cf6)
              .setTitle("⚖️ The court is now in session")
              .setDescription(
                `The AI Judge is preparing the first question for ${game.players.length} contestants.`,
              ),
          ],
          components: [],
        });
      } catch (error) {
        console.error(
          "Failed to update the AI Judge lobby at game start.",
          error,
        );
      }
      try {
        if (!lobbyMessage.channel.isSendable()) {
          throw new Error("The AI Judge game channel cannot send messages.");
        }
        const playerMentions = game.players.map((player) => player.id);
        await lobbyMessage.channel.send({
          content: `⚖️ The AI Judge is starting! Contestants: ${playerMentions.map((id) => `<@${id}>`).join(" ")}`,
          allowedMentions: { users: playerMentions },
        });
      } catch (error) {
        console.error("Failed to announce the AI Judge game start.", error);
      }
      void runTournament(client, game, lobbyMessage).catch(async (error) => {
        console.error("Failed to run the AI Judge tournament.", error);
        game.status = "cancelled";
        client.cacheManager.set(cacheKey(serverId), game);
        await lobbyMessage.reply(
          "The AI Judge hit a problem and had to end the tournament.",
        );
      });
    });
    collector.once("end", async (_collected, reason) => {
      if (reason !== "idle" || game.status !== "lobby") return;
      game.status = "cancelled";
      client.cacheManager.set(cacheKey(serverId), game);
      await lobbyMessage
        .edit({
          embeds: [
            new EmbedBuilder()
              .setColor(0x747f8d)
              .setTitle("AI Judge — Lobby Closed")
              .setDescription(
                "The lobby closed after 2 minutes of inactivity.",
              ),
          ],
          components: [],
        })
        .catch((error) => {
          console.error("Failed to close the inactive AI Judge lobby.", error);
        });
    });
  } catch (error) {
    client.cacheManager.delete(cacheKey(serverId));
    throw error;
  }
}
