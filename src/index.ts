/**
 * AutoRAG Implementation using Cloudflare Workers
 *
 * A simple RAG application using Cloudflare Workers.
 * This implementation uses AutoRAG for question answering.
 *
 * @license MIT
 */
import { Env, ChatRequestBody } from "./types";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Serve static frontend
    if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    // Handle chat API
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChatRequest(request, env);
    }

    // Fallback 404
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handleChatRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    console.log("🔹 Received /api/chat request");

    const body = await request.json() as ChatRequestBody;
    console.log("🔹 Parsed request body:", JSON.stringify(body));

    const lastMessage = body.messages?.at(-1)?.content;

    if (!lastMessage || typeof lastMessage !== "string") {
      console.warn("⚠️ Missing or invalid last message");
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    console.log("🔹 Querying AutoRAG with:", lastMessage);

    const result = await env.AI.autorag("jaise").aiSearch({
      query: lastMessage,
    });

    console.log("✅ AutoRAG result:", result);

    // Send as SSE (required by streaming chat UI)
    return new Response(`data: ${JSON.stringify({ response: result })}\n\n`, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("❌ Error in /api/chat:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
