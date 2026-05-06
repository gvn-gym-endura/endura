import { Express } from "express";

// OpenRouter AI Configuration (OpenAI-compatible API)
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = process.env.VPS_AI_DEFAULT_MODEL || "qwen/qwen2.5-vl-3b-instruct:free";
const DEFAULT_FREE_MODEL = process.env.VPS_AI_FREE_MODEL || "nvidia/nemotron-3-nano-30b-a3b:free";
const API_KEY = process.env.VPS_AI_API_KEY || process.env.OPENROUTER_API_KEY || "";

function getOpenRouterHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
    "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
    "X-Title": process.env.APP_NAME || "GVN Gym App",
    ...(process.env.OPENROUTER_ORG_ID && { "X-Org-Id": process.env.OPENROUTER_ORG_ID }),
  };
}

// Helper: make non-streaming request to OpenRouter
async function fetchOpenRouter(endpoint: string, body: any) {
  const url = `${OPENROUTER_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers: getOpenRouterHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Helper: make streaming request to OpenRouter (returns raw Response)
async function fetchOpenRouterStream(endpoint: string, body: any) {
  const url = `${OPENROUTER_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers: getOpenRouterHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
  }

  return response;
}

// Helper: SSE forwarding – reads OpenRouter SSE chunks, forwards to client in our format
async function pipeOpenRouterStream(sourceStream: ReadableStream<Uint8Array>, res: any) {
  const reader = sourceStream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // keep incomplete chunk

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const jsonStr = trimmed.slice(6);
        if (jsonStr === "[DONE]") {
          res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
          continue;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;

          if (delta?.content) {
            res.write(`data: ${JSON.stringify({ type: "content", content: delta.content })}\n\n`);
          }

          // OpenRouter sends finish_reason when stream is done
          if (parsed.choices?.[0]?.finish_reason) {
            res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
          }
        } catch {
          // skip unparseable chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function registerAIRoutes(app: Express) {
  // POST /api/ai-chat – streaming chat via OpenRouter
  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { messages, model = DEFAULT_FREE_MODEL } = req.body;

      console.log("=== AI CHAT REQUEST ===");
      console.log("Model:", model);
      console.log("OpenRouter URL:", OPENROUTER_BASE_URL);
      console.log("Messages count:", messages?.length);

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const openRouterResponse = await fetchOpenRouterStream("/chat/completions", {
        model,
        messages,
        stream: true,
      });

      const body = openRouterResponse.body;
      if (!body) throw new Error("No response body");

      await pipeOpenRouterStream(body, res);
      res.end();
    } catch (error: any) {
      console.error("AI Chat error:", error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Failed to process AI request" });
      } else {
        res.write(`data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`);
        res.end();
      }
    }
  });

  // POST /api/ai-chat-sync – non-streaming chat for client hooks
  app.post("/api/ai-chat-sync", async (req, res) => {
    try {
      const { messages, model = DEFAULT_FREE_MODEL } = req.body;

      console.log("=== AI CHAT SYNC REQUEST ===");
      console.log("Model:", model);
      console.log("Messages count:", messages?.length);

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const result = await fetchOpenRouter("/chat/completions", {
        model,
        messages,
        stream: false,
      });

      const content = result.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content in AI response");

      res.json({ content, model: result.model, usage: result.usage });
    } catch (error: any) {
      console.error("AI Chat Sync error:", error.message);
      res.status(500).json({ error: error.message || "Failed to process AI request" });
    }
  });

  // POST /api/ai-json-validate – validate/fix JSON via OpenRouter
  app.post("/api/ai-json-validate", async (req, res) => {
    try {
      const { jsonString, schema } = req.body;

      console.log("=== AI JSON VALIDATE REQUEST ===");
      console.log("JSON String length:", jsonString?.length);
      console.log("Schema:", schema);

      if (!jsonString || typeof jsonString !== "string") {
        return res.status(400).json({ error: "jsonString is required and must be a string" });
      }

      // First, try direct parse
      try {
        const directParsed = JSON.parse(jsonString);
        console.log("Input is already valid JSON, returning directly");
        return res.json({ valid: true, json: JSON.stringify(directParsed) });
      } catch {
        console.log("Input is not valid JSON, sending to AI for fixing...");
      }

      let systemPrompt = `You are a JSON validator and fixer. Your task is to:
1. Parse the provided JSON string
2. If it's invalid JSON, fix it to make it valid
3. If the JSON has missing or malformed fields, fix them
4. Return ONLY the valid JSON string, nothing else

IMPORTANT: 
- If the input is a JSON array, return a valid JSON array
- If the input is a JSON object, return a valid JSON object
- Do NOT change the structure (array vs object)
- Return ONLY the JSON, no explanations, no markdown formatting.`;

      if (schema) {
        systemPrompt += `\n\nExpected schema: ${JSON.stringify(schema)}`;
      }

      const result = await fetchOpenRouter("/chat/completions", {
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Validate and fix this JSON:\n${jsonString}` }
        ],
        stream: false,
        temperature: 0.1,
      });

      const responseText = result.choices?.[0]?.message?.content;

      console.log("=== AI JSON VALIDATE RESPONSE ===");
      console.log("Response length:", responseText?.length);

      if (!responseText) {
        return res.status(500).json({ error: "No response from AI" });
      }

      let validatedJson = responseText.trim();

      // Remove markdown code blocks if present
      if (validatedJson.startsWith("```json")) {
        validatedJson = validatedJson.slice(7);
      } else if (validatedJson.startsWith("```")) {
        validatedJson = validatedJson.slice(3);
      }
      if (validatedJson.endsWith("```")) {
        validatedJson = validatedJson.slice(0, -3);
      }
      validatedJson = validatedJson.trim();

      try {
        const parsed = JSON.parse(validatedJson);
        return res.json({ valid: true, json: JSON.stringify(parsed) });
      } catch {
        console.log("First parse attempt failed, trying to extract JSON...");

        const jsonArrayMatch = validatedJson.match(/\[[\s\S]*\]/);
        const jsonObjectMatch = validatedJson.match(/\{[\s\S]*\}/);

        if (jsonArrayMatch) {
          try {
            const parsed = JSON.parse(jsonArrayMatch[0]);
            return res.json({ valid: true, json: JSON.stringify(parsed) });
          } catch {
            if (jsonObjectMatch) {
              try {
                const parsed = JSON.parse(jsonObjectMatch[0]);
                return res.json({ valid: true, json: JSON.stringify(parsed) });
              } catch {
                return res.json({ valid: false, error: "Could not parse as valid JSON", raw: validatedJson });
              }
            }
            return res.json({ valid: false, error: "Could not parse as valid JSON", raw: validatedJson });
          }
        } else if (jsonObjectMatch) {
          try {
            const parsed = JSON.parse(jsonObjectMatch[0]);
            return res.json({ valid: true, json: JSON.stringify(parsed) });
          } catch {
            return res.json({ valid: false, error: "Could not parse as valid JSON", raw: validatedJson });
          }
        }

        return res.json({ valid: false, error: "Could not parse as valid JSON", raw: validatedJson });
      }
    } catch (error: any) {
      console.error("AI JSON Validate error:", error.message);
      res.status(500).json({ error: error.message || "Failed to validate JSON" });
    }
  });
}