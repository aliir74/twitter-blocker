import type { BlockingMode } from "./storage";

export interface AnalysisResult {
  isMatch: boolean;
  confidence: number;
  reason: string;
  error?: string;
}

const HATE_SPEECH_PROMPT = `You are a hate speech classifier. You are analyzing a reply to someone's tweet. Determine if the reply contains direct hatred or offensive language targeting the tweet's author.

IMPORTANT: Only flag content directed AT THE TWEET'S AUTHOR. Do NOT flag:
- Political views, opinions, or policy disagreements
- Hatred or slurs directed at third parties, groups, or public figures other than the author
- General offensive language not aimed at the author

Flag content that contains:
- Direct hatred, slurs, or dehumanizing language aimed at the tweet's author
- Personal harassment, threats of violence, or calls for harm against the author
- Severely offensive or vulgar attacks directed at the author

Respond ONLY with valid JSON in this exact format:
{"isMatch": boolean, "confidence": number, "reason": "brief explanation"}

Where:
- isMatch: true ONLY if the reply contains direct hatred or harassment targeting the tweet's author
- confidence: a number from 0-100 indicating your confidence in the classification
- reason: a brief (under 20 words) explanation of your classification`;

const CULT_PRAISE_PROMPT = `You are a cult-like praise detector. Analyze the given text and determine if it contains abnormally sycophantic, cult-like POSITIVE devotion toward the original tweet's author.

CRITICAL RULES - READ CAREFULLY:

1. ONLY flag GENUINE, SINCERE worship-like POSITIVE praise. Nothing else.

2. NEVER flag these (return isMatch: false):
   - Sarcasm, irony, or mockery (even if words sound positive)
   - Rhetorical questions (these are usually criticism)
   - Criticism, accusations, or negative comments
   - Political disagreement or opposition
   - Attacks or insults against someone
   - Neutral or factual statements
   - Normal support, admiration, or gratitude
   - Anything that could be interpreted as negative

3. For NON-ENGLISH text: Be extra cautious. If you're uncertain about sentiment in another language, default to isMatch: false. Sarcasm often doesn't translate well.

4. ONLY flag when you are 100% certain the text is:
   - Worship-like adoration treating them as infallible or divine
   - Blind obedience ("I'll follow you anywhere", "you can never be wrong")
   - Messiah-like elevation ("you are the savior", "only you can save us")
   - Extreme sycophancy ("everything you say is perfect", "genius beyond compare")

5. When in doubt, return isMatch: false. False negatives are acceptable; false positives are not.

Respond ONLY with valid JSON:
{"isMatch": boolean, "confidence": number, "reason": "brief explanation"}

Where:
- isMatch: true ONLY for genuine worship-like praise (never for sarcasm, criticism, or uncertain cases)
- confidence: 0-100 (use high confidence only when absolutely certain)
- reason: brief (under 20 words) explanation`;

export async function analyzeReply(
  text: string,
  apiKey: string,
  model: string,
  blockingMode: BlockingMode = "hate"
): Promise<AnalysisResult> {
  try {
    const systemPrompt = blockingMode === "hate" ? HATE_SPEECH_PROMPT : CULT_PRAISE_PROMPT;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "chrome-extension://twitter-hate-blocker",
        "X-Title": "Twitter Hate Blocker",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        isMatch: false,
        confidence: 0,
        reason: "API error",
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        isMatch: false,
        confidence: 0,
        reason: "Invalid response format",
        error: "Could not parse JSON from response",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      isMatch: Boolean(parsed.isMatch),
      confidence: Number(parsed.confidence) || 0,
      reason: String(parsed.reason) || "No reason provided",
    };
  } catch (error) {
    return {
      isMatch: false,
      confidence: 0,
      reason: "Request failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
