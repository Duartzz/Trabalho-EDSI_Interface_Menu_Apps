import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { retrieveContext, formatRagContext, searchKnowledgeBase } from "./src/rag.js";
import { MCP_TOOL_DECLARATIONS, executeMcpTool } from "./src/mcpTools.js";
import { buildSystemPrompt, toGeminiContents } from "./src/prompt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const MODEL = "gemini-2.5-flash";
const STATIC_ROOT = path.join(__dirname, "..");

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(STATIC_ROOT));

function sendSse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function getLastUserMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return "";
}

function extractFunctionCalls(response) {
  const calls = response.functionCalls;
  if (calls?.length) return calls;

  const parts = response.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((part) => part.functionCall)
    .map((part) => ({
      name: part.functionCall.name,
      args: part.functionCall.args || {},
      id: part.functionCall.id,
    }));
}

function extractModelContent(response) {
  return response.candidates?.[0]?.content || { role: "model", parts: [] };
}

async function streamFinalResponse(res, systemInstruction, contents) {
  const stream = await ai.models.generateContentStream({
    model: MODEL,
    contents,
    config: { systemInstruction },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) sendSse(res, { type: "token", text });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    model: MODEL,
    geminiConfigured: Boolean(apiKey),
  });
});

app.post("/api/chat", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    if (!ai) {
      sendSse(res, {
        type: "error",
        message:
          "A API Key do Gemini não está configurada. Adiciona GEMINI_API_KEY ao ficheiro .env e reinicia o servidor.",
      });
      sendSse(res, { type: "done" });
      return res.end();
    }

    const { messages = [], tone = "casual" } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      sendSse(res, { type: "error", message: "Nenhuma mensagem enviada." });
      sendSse(res, { type: "done" });
      return res.end();
    }

    const lastUserMessage = getLastUserMessage(messages);
    const ragChunks = retrieveContext(lastUserMessage);
    const ragContext = formatRagContext(ragChunks);
    const systemInstruction = buildSystemPrompt({ tone, ragContext });

    let contents = toGeminiContents(messages);
    const maxToolRounds = 4;

    for (let round = 0; round < maxToolRounds; round += 1) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: MCP_TOOL_DECLARATIONS }],
        },
      });

      const functionCalls = extractFunctionCalls(response);

      if (!functionCalls.length) {
        const directText = response.text;
        if (directText) {
          sendSse(res, { type: "token", text: directText });
        } else {
          await streamFinalResponse(res, systemInstruction, contents);
        }
        break;
      }

      contents.push(extractModelContent(response));

      for (const call of functionCalls) {
        const toolResult = executeMcpTool(call.name, call.args || {}, {
          searchKnowledgeBase,
        });

        if (toolResult.clientAction) {
          sendSse(res, {
            type: "action",
            ...toolResult.clientAction,
          });
        }

        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: call.name,
                id: call.id,
                response: toolResult.data,
              },
            },
          ],
        });
      }

      if (round === maxToolRounds - 1) {
        await streamFinalResponse(res, systemInstruction, contents);
      }
    }

    sendSse(res, { type: "done" });
    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    const friendly =
      error?.message?.includes("API key")
        ? "Chave API inválida ou em falta. Verifica o ficheiro .env."
        : error?.message?.includes("fetch") || error?.message?.includes("network")
          ? "Não foi possível ligar ao serviço de IA. Verifica a tua ligação à internet."
          : "Ocorreu um erro ao processar a mensagem. Tenta novamente em instantes.";

    sendSse(res, { type: "error", message: friendly });
    sendSse(res, { type: "done" });
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`MeuPhone AI Buddy: http://localhost:${PORT}`);
  console.log(`Hub: http://localhost:${PORT}/index.html`);
  if (!apiKey) {
    console.warn("AVISO: GEMINI_API_KEY não definida. Cria o ficheiro .env a partir de .env.example");
  }
});
