import { useState, useCallback } from 'react';

export interface UseVPSAIOptions {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}

/**
 * useVPSAI - Client-side hook for AI chat via OpenRouter
 *
 * All calls go through the Vercel server (/api/*) which securely
 * proxies to OpenRouter. No API keys are exposed to the client.
 */
export function useVPSAI(options: UseVPSAIOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<unknown>(null);

  const DEFAULT_MODEL = options.defaultModel || "qwen/qwen2.5-vl-3b-instruct:free";

  const chat = useCallback(async (message: string, model: string = DEFAULT_MODEL) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/ai-chat-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: message }],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `API Error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [DEFAULT_MODEL]);

  const chatStream = useCallback(async (
    message: string,
    onChunk: (content: string) => void,
    model: string = DEFAULT_MODEL
  ) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: message }],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `API Error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.content) {
              onChunk(data.content);
            }
          } catch {
            // skip invalid JSON lines
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [DEFAULT_MODEL]);

  const listModels = useCallback(async () => {
    return [
      { id: 'qwen/qwen2.5-vl-3b-instruct:free', name: 'Qwen 2.5 VL 3B (Free)' },
      { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron Nano 30B (Free)' },
      { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)' },
    ];
  }, []);

  const clear = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return { chat, chatStream, listModels, loading, error, response, clear };
}