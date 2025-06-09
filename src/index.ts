import { Env, ChatRequestBody } from "./types";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    console.log(`📥 Incoming request: ${request.method} ${url.pathname}`);

    if (url.pathname === "/" || !url.pathname.startsWith("/api/")) {
      console.log("➡️ Serving static asset");
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChatRequest(request, env);
    }

    console.log("❌ Route not found");
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handleChatRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    console.log("🔹 Received /api/chat request");

    const body = await request.json();
    console.log("🧾 Parsed request body:", JSON.stringify(body));

    const lastMessage = body.messages?.at(-1)?.content;

    if (!lastMessage || typeof lastMessage !== "string") {
      console.warn("⚠️ Missing or invalid last message");
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    console.log("🤖 Sending query to AutoRAG:", lastMessage);

    const result = await env.AI.autorag("jaise").aiSearch({
      query: lastMessage,
    });

    console.log("✅ AutoRAG responded:", result);

    // Only return the actual response string so frontend renders it
    return new Response(`data: ${JSON.stringify({ response: result.response })}\n\n`, {
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
