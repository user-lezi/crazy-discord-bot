import * as z from "zod";

import { getPrompt } from "../utils";
import { OllamaService } from "../../../functions/ollama";

const MODEL = "s1gnature/qwen3.5-uncensored-low-end:4b-q8_0";

export interface ShipUser {
  name: string;
  displayName: string;
}

export interface ShipUserProfile {
  profile: {
    username: string;
    displayName: string;
    isBot: boolean;
    accountCreatedAt: string;
    accountAgeDays: number;
  };
  user: ShipUser;
}

export interface ShipScoreFactorResult {
  name: string;
  weight: number;
  score: number;
}

export interface ShipResult {
  users: [ShipUserProfile, ShipUserProfile];
  score: number;
  factors: ShipScoreFactorResult[];
}

const ShipOpinionResponse = z.object({
  name: z.string().min(1).max(32),
  emojis: z.array(z.string().min(1).max(16)).max(2),
  opinion: z.string().min(1).max(200),
});

export type ShipOpinion = z.infer<typeof ShipOpinionResponse>;

export async function generateShipOpinion(
  result: ShipResult,
): Promise<ShipOpinion> {
  const prompt = getPrompt("ship_opinion.txt", [JSON.stringify(result)]);
  const response = await OllamaService.chatStructured({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    think: false,
    schema: ShipOpinionResponse,
    options: { temperature: 0.8 },
  });

  return ShipOpinionResponse.parse(response);
}
