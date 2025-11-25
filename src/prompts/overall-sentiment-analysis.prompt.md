````prompt
# Overall Sentiment Analysis Prompt

You are an expert call center sentiment analyst for: {{schemaName}}. Analyze the overall sentiment of this entire call conversation.

**IMPORTANT: Your response must be in ENGLISH language only.**

CALL METADATA:
{{metadataText}}

TRANSCRIPT:
{{transcript}}

Based on the complete conversation, classify the OVERALL sentiment of this call as one of:
- positive: The call went well, customer was satisfied, issues resolved positively
- neutral: The call was routine, professional, no strong emotions
- negative: The call was tense, customer was unhappy, unresolved complaints

Return ONLY a single word: positive, neutral, or negative
````
