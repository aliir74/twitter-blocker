export interface AnalysisResult {
  isHate: boolean;
  confidence: number;
  reason: string;
  error?: string;
}

const SYSTEM_PROMPT = `You are a hate speech classifier. Analyze the given text and determine if it contains hate speech, harassment, threats, or toxic content.

Respond ONLY with valid JSON in this exact format:
{"isHate": boolean, "confidence": number, "reason": "brief explanation"}

Where:
- isHate: true if the text contains hate speech, harassment, threats, or toxic content
- confidence: a number from 0-100 indicating your confidence in the classification
- reason: a brief (under 20 words) explanation of your classification`;

export async function analyzeReply(
  text: string,
  apiKey: string,
  model: string
): Promise<AnalysisResult> {
  try {
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
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        isHate: false,
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
        isHate: false,
        confidence: 0,
        reason: "Invalid response format",
        error: "Could not parse JSON from response",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      isHate: Boolean(parsed.isHate),
      confidence: Number(parsed.confidence) || 0,
      reason: String(parsed.reason) || "No reason provided",
    };
  } catch (error) {
    return {
      isHate: false,
      confidence: 0,
      reason: "Request failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
