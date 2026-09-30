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
  Message,
  Ollama,
  ShowResponse,
} from "ollama";

const DEFAULT_MODEL = process.env.OllamaDefaultModel || "gpt-oss:120b-cloud";

const cloudOllama = new Ollama({
  host: "https://ollama.com",
  headers: { Authorization: `Bearer ${process.env.OllamaAPIKey}` },
});

export class OllamaService {
  /** Default fallback model for quick methods */
  static defaultModel: string = DEFAULT_MODEL;
  /**
   * Retrieves the appropriate client instance based on local/cloud preference.
   */
  static getClient(local: boolean = true): Ollama {
    return local ? ollama : cloudOllama;
  }
  /**
   * Fast, lightweight shortcut methods with intelligent fallbacks.
   */
  static quick = {
    /**
     * Quick chat helper taking simple string prompt or message array.
     */
    chat: async (
      messages: string | Message[],
      model: string = OllamaService.defaultModel,
      local: boolean = true,
      options?: Omit<ChatRequest, "model" | "messages" | "stream">,
    ): Promise<ChatResponse> => {
      const formattedMessages: Message[] =
        typeof messages === "string"
          ? [{ role: "user", content: messages }]
          : messages;

      return await OllamaService.chat(
        {
          model,
          messages: formattedMessages,
          ...options,
        },
        local,
      );
    },

    /**
     * Quick structured chat helper returning validated JSON with fallback defaults.
     */
    chatStructured: async <T extends z.ZodType>(
      messages: string | Message[],
      schema: T,
      model: string = OllamaService.defaultModel,
      local: boolean = true,
    ): Promise<z.infer<T>> => {
      const formattedMessages: Message[] =
        typeof messages === "string"
          ? [{ role: "user", content: messages }]
          : messages;

      return await OllamaService.chatStructured(
        {
          model,
          messages: formattedMessages,
          schema,
        },
        local,
      );
    },
  };
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
  static async chatStructured<T extends z.ZodType>(
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
