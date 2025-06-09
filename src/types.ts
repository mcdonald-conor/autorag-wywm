/**
 * Type definitions for the LLM chat application.
 */

export interface Env {
  /**
   * Binding for the Cloudflare AI API with AutoRAG capabilities
   */
  AI: {
    autorag: (namespace: string) => {
      aiSearch: (params: { query: string }) => Promise<string>;
    };
  };

  /**
   * Binding for static assets.
   */
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

/**
 * Represents a chat message.
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Represents the request body for chat endpoints
 */
export interface ChatRequestBody {
  query: string;
}
