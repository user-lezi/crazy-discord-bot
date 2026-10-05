import * as z from "zod";

import { OllamaService } from "../../functions/ollama";
import { getPrompt } from "./utils";

const MODEL = "s1gnature/qwen3.5-uncensored-low-end:4b-q8_0";

export interface RizzUpInputUser {
  name: string;
  id: string;
}

export interface RizzUpInput {
  requester: RizzUpInputUser;
  target: RizzUpInputUser;
  targetMessage: string;
  messages: {
    character: "requester" | "target" | "side-character";
    author: RizzUpInputUser;
    content: string;
    timestamp: string;
    replyTo?: {
      character: "requester" | "target" | "side-character";
      author: RizzUpInputUser;

      content: string;
    };
  }[];
}

const RizzUpResponse = z.object({
  line: z
    .string()
    .trim()
    .min(1)
    .max(240)
    .refine((line) => !/[\r\n]/.test(line), "The message must be one line."),
});

export async function generateRizzUp(input: RizzUpInput): Promise<string> {
  const prompt = getPrompt("rizz_up.txt", [JSON.stringify(input)]);
  const response = await OllamaService.chatStructured({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    think: false,
    schema: RizzUpResponse,
    options: { temperature: 0.7 },
  });

  return RizzUpResponse.parse(response).line;
}
