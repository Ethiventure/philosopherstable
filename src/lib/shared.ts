import { GeminiError, REPAIR_SUFFIX, parseTurnOutput, retryAfterMs, type TurnOutput } from '@/lib/gemini';

// Generous ceiling for the same reason as the other free paths: reasoning
// models spend output on thinking first, and a tight cap truncates the JSON.
// Stays under Groq's 8K TPM alongside our ~4.5K-token prompts.
const SHARED_MAX_TOKENS = { normal: 2000, long: 4000 } as const;

/**
 * Shared provider: the cabinet's own Groq-backed turn, via the same-origin
 * Netlify Function (`/.netlify/functions/cabinet`) that holds the key
 * server-side. The browser never sees any key here.
 *
 * Response contract with the function:
 *   200 { text, model }              → parse into a turn
 *   4xx/5xx { error: { message, code } } → mapped to GeminiError codes so the
 *     existing halt/resume/quota UI behaves identically across providers.
 * Function 'quota' → quota panel; 'auth'/'unconfigured' → auth-flavoured halt
 * telling the visitor to add their own key; everything else → server, resumable.
 */

interface SharedTurnArgs {
  systemPrompt: string;
  userMessage: string;
  longForm: boolean;
}

function stripFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

export async function generateTurnShared({ systemPrompt, userMessage, longForm }: SharedTurnArgs): Promise<TurnOutput> {
  const post = async (msg: string): Promise<string> => {
    let lastError: GeminiError | null = null;
    // Our ~4.5K-token prompts butt against Groq's per-minute caps, so a turn
    // may need to wait out a 429 ("try again in Ns") rather than halt.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response: Response;
      try {
        response = await fetch('/.netlify/functions/cabinet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          userMessage: msg,
          maxTokens: longForm ? SHARED_MAX_TOKENS.long : SHARED_MAX_TOKENS.normal,
        }),
        });
      } catch {
        throw new GeminiError(
          'Could not reach the shared provider. Check the connection and Resume the cabinet — or add your own Gemini/OpenRouter key in Settings → Key.',
          true,
          'network',
        );
      }

      if (response.status === 404) {
        // Same-origin function missing: plain `npm run dev` instead of `netlify dev`,
        // or a deploy without functions. Not a key/quota problem.
        throw new GeminiError(
          'Shared provider is unreachable here (functions are only served on Netlify or via `netlify dev`). Add your own Gemini/OpenRouter key in Settings → Key, or run `netlify dev` locally.',
          false,
          'server',
        );
      }

      let data: { text?: string; model?: string; error?: { message?: string; code?: string } };
      try {
        data = (await response.json()) as typeof data;
      } catch {
        throw new GeminiError('Shared provider returned a broken response. Resume the cabinet to retry the turn.', true, 'server');
      }

      if (!response.ok || !data.text) {
        const code = data.error?.code;
        const message = data.error?.message ?? 'Shared provider failed. Resume the cabinet to retry the turn.';
        if (code === 'auth' || code === 'unconfigured') throw new GeminiError(message, false, 'auth');
        // Quota (ours or Groq's TPM): wait out the window, then retry the turn.
        if (attempt < 2) {
          lastError = new GeminiError(message, true, code === 'quota' ? 'quota' : 'server');
          await new Promise((resolve) => setTimeout(resolve, code === 'quota' ? retryAfterMs(message, 15000) : 2000));
          continue;
        }
        if (code === 'quota') throw new GeminiError(message, true, 'quota');
        throw new GeminiError(message, true, 'server');
      }
      return data.text;
    }
    throw lastError ?? new GeminiError('Shared provider failed. Resume the cabinet to retry the turn.', true, 'server');
  };

  const text = await post(userMessage);
  try {
    return parseTurnOutput(stripFences(text), 'Shared provider');
  } catch (error) {
    if (!(error instanceof GeminiError) || error.code !== 'parse') throw error;
    return parseTurnOutput(stripFences(await post(userMessage + REPAIR_SUFFIX)), 'Shared provider');
  }
}
