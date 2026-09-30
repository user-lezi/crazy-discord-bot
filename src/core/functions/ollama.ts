import * as z from "zod";

import ollama, {
  AbortableAsyncIterator,
  ChatRequest,
  ChatResponse,
  EmbedRequest,
  EmbedResponse,
  GenerateRequest,
  GenerateResponse,
  ListResponse,
  Ollama,
  ShowResponse,
} from "ollama";

const cloudOllama = new Ollama({
  host: "https://ollama.com",
  headers: { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` },
});

export class OllamaService {
  /**
   * Retrieves the appropriate client instance based on local/cloud preference.
   */
  static getClient(local: boolean = true): Ollama {
    return local ? ollama : cloudOllama;
  }

  /**
   * Non-streaming chat completion.
   */
  static async chat(
    request: Omit<ChatRequest, "stream">,
    local: boolean = true,
  ): Promise<ChatResponse> {
    return await this.getClient(local).chat({
      ...request,
      stream: false,
    });
  } /**
   * Structured Chat Completion using Zod Schema.
   * Automatically converts the Zod schema to JSON schema, passes it to Ollama,
   * and parses/validates the returned response object into strong TypeScript types.
   */
  static async chatStructured<T extends z.ZodTypeAny>(
    request: Omit<ChatRequest, "stream" | "format"> & {
      schema: T;
    },
    local: boolean = true,
  ): Promise<z.infer<T>> {
    const { schema, ...chatParams } = request;

    const response = await this.getClient(local).chat({
      ...chatParams,
      stream: false,
      format: z.toJSONSchema(schema),
    });

    const parsedJson = JSON.parse(response.message.content);
    return schema.parse(parsedJson);
  }

  /**
   * Streaming chat completion.
   */
  static async chatStream(
    request: Omit<ChatRequest, "stream">,
    local: boolean = true,
  ): Promise<AbortableAsyncIterator<ChatResponse>> {
    return await this.getClient(local).chat({
      ...request,
      stream: true,
    });
  }

  /**
   * Non-streaming raw completion (for base models / unstructured prompts).
   */
  static async generate(
    request: Omit<GenerateRequest, "stream">,
    local: boolean = true,
  ): Promise<GenerateResponse> {
    return await this.getClient(local).generate({
      ...request,
      stream: false,
    });
  }

  /**
   * Streaming raw text generation.
   */
  static async generateStream(
    request: Omit<GenerateRequest, "stream">,
    local: boolean = true,
  ): Promise<AbortableAsyncIterator<GenerateResponse>> {
    return await this.getClient(local).generate({
      ...request,
      stream: true,
    });
  }

  /**
   * Generates vector embeddings for a prompt or array of prompts.
   */
  static async embed(
    request: EmbedRequest,
    local: boolean = true,
  ): Promise<EmbedResponse> {
    return await this.getClient(local).embed(request);
  }

  /**
   * Lists all models installed on the instance.
   */
  static async listModels(local: boolean = true): Promise<ListResponse> {
    return await this.getClient(local).list();
  }

  /**
   * Gets metadata and details for a specific model.
   */
  static async getModelInfo(
    modelName: string,
    local: boolean = true,
  ): Promise<ShowResponse> {
    return await this.getClient(local).show({ model: modelName });
  }
}
