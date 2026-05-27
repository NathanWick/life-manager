import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createLifeQuestMcpServer } from "@/mcp/lifequest-server";
import type { LifeQuestMcpContext } from "@/mcp/lifequest-context";
import type { AgentAction } from "@/lib/agent-tools";
import { parseToolCall } from "@/lib/agent-tools";

export type OpenAITool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export async function createLifeQuestMcpClient(ctx: LifeQuestMcpContext) {
  const server = createLifeQuestMcpServer(ctx);
  const client = new Client(
    { name: "lifequest-app", version: "1.0.0" },
    { capabilities: {} }
  );

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();

  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ]);

  return client;
}

export async function listMcpToolsAsOpenAI(
  client: Client
): Promise<OpenAITool[]> {
  const { tools } = await client.listTools();
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description ?? "",
      parameters: (t.inputSchema as Record<string, unknown>) ?? {
        type: "object",
        properties: {},
      },
    },
  }));
}

export async function executeMcpToolCall(
  client: Client,
  name: string,
  args: Record<string, unknown>,
  goalMap: Map<string, string>
): Promise<{ toolMessage: string; action?: AgentAction }> {
  const result = await client.callTool({
    name,
    arguments: args,
  });

  const content = Array.isArray(result.content) ? result.content : [];
  const textBlock = content.find(
    (c): c is { type: "text"; text: string } =>
      typeof c === "object" &&
      c !== null &&
      "type" in c &&
      c.type === "text" &&
      "text" in c
  );
  const text = textBlock?.text ?? "";

  try {
    const parsed = JSON.parse(text) as {
      success?: boolean;
      message?: string;
      action?: AgentAction;
    };
    if (parsed.action) {
      return { toolMessage: parsed.message ?? "OK", action: parsed.action };
    }
  } catch {
    // not JSON action payload
  }

  const legacy = parseToolCall(name, JSON.stringify(args), goalMap);
  if (legacy) {
    return { toolMessage: text || "OK", action: legacy };
  }

  if (name === "create_north_star") {
    const legacyGoal = parseToolCall(
      "create_goal",
      JSON.stringify(args),
      goalMap
    );
    if (legacyGoal) {
      return { toolMessage: text || "OK", action: legacyGoal };
    }
  }

  return { toolMessage: text || "Done." };
}
