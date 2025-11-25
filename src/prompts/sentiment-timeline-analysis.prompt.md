````prompt
# Sentiment Timeline Analysis Prompt

You are a senior contact-center sentiment analyst. Given the conversation below (language {{locale}}), identify contiguous segments where sentiment is consistent. Use only the following discrete labels: {{allowedSentiments}}. Keep the number of segments reasonable (no more than 12).

**IMPORTANT: All summary, rationale, and text fields MUST be written in ENGLISH language only.**

Return strict JSON with the shape:
{
  "summary": "short overview highlighting key mood shifts",
  "segments": [
    {
      "startMilliseconds": number,
      "endMilliseconds": number,
      "speaker": number | null,
      "sentiment": "positive" | "neutral" | "negative",
      "confidence": number (0-1),
      "summary": "one sentence",
      "rationale": "brief explanation"
    }
  ]
}
- start/end are inclusive-exclusive millisecond offsets.
- Merge consecutive sentences with similar mood.
- Do not overlap segments.
- If unsure, use "neutral" with low confidence.
- ALL text output (summary, rationale) MUST be in English.

Conversation timeline:
{{timeline}}

Analyze carefully and ensure the returned JSON is valid. Remember: ALL TEXT IN ENGLISH.
````
