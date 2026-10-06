import * as z from "zod";

import { OllamaService } from "../../../functions/ollama";
import { Snowflake } from "discord.js";
import { getPrompt } from "../utils";
import { randomInt } from "node:crypto";

const MODEL = "s1gnature/qwen3.5-uncensored-low-end:4b-q8_0";

export interface JudgeProfile {
  username: string;
  displayName: string;
  isBot: boolean;
  accountAgeDays: number;
}

export interface JudgePlayer {
  id: Snowflake;
  name: string;
  profile: JudgeProfile;
}

export interface JudgeMatch {
  players: [JudgePlayer, JudgePlayer];
  question: string;
  chaosMode: boolean;
  answers: [string, string];
  eliminated: JudgePlayer;
  winner: JudgePlayer;
  verdict: string;
  votes: [number, number];
  decisionBy: "votes" | "judge" | "timeout" | "random";
}

export interface JudgeRound {
  round: number;
  matches: JudgeMatch[];
  byes: JudgePlayer[];
}

export interface IAIJudgeGame {
  id: string;
  serverId: Snowflake;
  creatorId: Snowflake;
  status: "lobby" | "playing" | "finished" | "cancelled";
  players: JudgePlayer[];
  pingedOwnerPlayers: Snowflake[];
  pingedAnswerPlayers: Snowflake[];
  rounds: JudgeRound[];
  location: [channel: Snowflake, message: Snowflake];
}

export interface GeneratedJudgeQuestion {
  question: string;
  chaosMode: boolean;
}

const QuestionResponse = z.object({
  question: z.string().trim().min(20).max(100),
});

const JudgmentResponse = z.object({
  outcome: z.enum(["player1", "player2"]),
  verdict: z.string().trim().min(1).max(450),
});

export function createJudgePlayer(
  id: Snowflake,
  username: string,
  displayName: string,
  isBot: boolean,
  createdTimestamp: number,
): JudgePlayer {
  return {
    id,
    name: username,
    profile: {
      username,
      displayName,
      isBot,
      accountAgeDays: Math.max(
        0,
        Math.floor((Date.now() - createdTimestamp) / 86_400_000),
      ),
    },
  };
}

export async function generateJudgeQuestion(
  round: number,
  players: [JudgePlayer, JudgePlayer],
  previousMatch?: JudgeMatch,
): Promise<GeneratedJudgeQuestion> {
  const chaosMode = randomInt(100) < 40;
  const prompt = getPrompt(
    chaosMode ? "ai_judge_question_chaos.txt" : "ai_judge_question.txt",
    [
      String(round),
      JSON.stringify(players.map((player) => player.profile)),
      JSON.stringify(
        previousMatch
          ? {
              question: previousMatch.question,
              answers: previousMatch.players.map((player, index) => ({
                name: player.name,
                answer: previousMatch.answers[index],
              })),
            }
          : null,
      ),
    ],
  );
  const response = await OllamaService.chatStructured({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    think: false,
    schema: QuestionResponse,
    options: { temperature: 0.9 },
  });
  return { ...QuestionResponse.parse(response), chaosMode };
}

export async function judgeAnswers(
  round: number,
  players: [JudgePlayer, JudgePlayer],
  question: string,
  answers: [string, string],
  tiedVotes?: [number, number],
): Promise<z.infer<typeof JudgmentResponse>> {
  const prompt = getPrompt("ai_judge_verdict.txt", [
    JSON.stringify({
      round,
      question,
      audienceVote: tiedVotes
        ? { player1: tiedVotes[0], player2: tiedVotes[1] }
        : null,
      contestants: players.map((player, index) => ({
        contestant: index === 0 ? "player1" : "player2",
        profile: player.profile,
        answer: answers[index],
      })),
    }),
  ]);
  const response = await OllamaService.chatStructured({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    think: false,
    schema: JudgmentResponse,
    options: { temperature: 0.65 },
  });
  return JudgmentResponse.parse(response);
}
