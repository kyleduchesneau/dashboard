import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CRM_TOOL, executeQuery, QueryInput } from "@/lib/crmTool";

const client = new Anthropic();

const MAX_HISTORY = 6;
const MAX_ROUNDS = 8;

const SYSTEM_PROMPT =
  "You are a CRM data analyst assistant. You have access to the query_crm tool which queries the CRM database. " +
  "Always call the tool to get real data before answering — never guess or estimate. " +
  "You may call it multiple times if needed to build a complete answer. " +
  "Respond concisely in plain language. Format currency with $ and commas. Round percentages to one decimal place.";

export async function POST(req: NextRequest) {
  try {
    const { messages: clientMessages } = await req.json();

    if (!Array.isArray(clientMessages) || clientMessages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const messages: Anthropic.MessageParam[] = clientMessages.slice(-MAX_HISTORY);

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [CRM_TOOL],
        messages,
      });

      // Append Claude's full response to the running message list
      messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason === "end_turn" || response.stop_reason === "max_tokens") {
        const textBlock = response.content.find((b) => b.type === "text");
        const text = textBlock?.type === "text" ? textBlock.text : "";
        return NextResponse.json({ reply: text || "I was unable to produce an answer." });
      }

      if (response.stop_reason === "tool_use") {
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const block of response.content) {
          if (block.type !== "tool_use") continue;
          let resultContent: string;
          try {
            const queryResult = executeQuery(block.input as QueryInput);
            resultContent = JSON.stringify(queryResult);
          } catch (err) {
            resultContent = JSON.stringify({ error: String(err) });
          }
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: resultContent,
          });
        }

        messages.push({ role: "user", content: toolResults });
        continue;
      }

      // Unexpected stop_reason — break safely
      break;
    }

    return NextResponse.json({
      reply: "I was unable to complete the analysis. Please try again.",
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Failed to get a response. Please try again." },
      { status: 500 }
    );
  }
}
