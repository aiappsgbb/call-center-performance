import { CallMetadata, CallEvaluation, EvaluationResult } from '@/types/call';
import { EVALUATION_CRITERIA, getMaxScore } from '@/lib/evaluation-criteria';

declare const spark: {
  llmPrompt: (strings: TemplateStringsArray, ...values: any[]) => string;
  llm: (prompt: string, modelName?: string, jsonMode?: boolean) => Promise<string>;
};

export interface AzureOpenAIConfig {
  endpoint?: string;
  apiKey?: string;
  deploymentName?: string;
  apiVersion?: string;
}

export class AzureOpenAIService {
  private config: AzureOpenAIConfig;

  constructor(config?: AzureOpenAIConfig) {
    this.config = config || {};
  }

  updateConfig(config: Partial<AzureOpenAIConfig>) {
    this.config = { ...this.config, ...config };
  }

  private buildEvaluationPrompt(transcript: string, metadata: CallMetadata): string {
    const criteriaText = EVALUATION_CRITERIA.map((criterion) => {
      return `
${criterion.id}. ${criterion.name} [${criterion.type}]
Definition: ${criterion.definition}
Evaluation: ${criterion.evaluationCriteria}
Scoring: ${criterion.scoringStandard.passed} points if passed, ${criterion.scoringStandard.failed} if failed${criterion.scoringStandard.partial ? `, ${criterion.scoringStandard.partial} if partially met` : ''}
Examples: ${criterion.examples.join(' | ')}
`;
    }).join('\n');

    return spark.llmPrompt`You are an expert call center quality assurance evaluator. Analyze the following call transcript and evaluate it against the 10 quality criteria below.

CALL METADATA:
- Agent Name: ${metadata.agentName}
- Product: ${metadata.product}
- Borrower Name: ${metadata.borrowerName}
- Days Past Due: ${metadata.daysPastDue}
- Due Amount: ${metadata.dueAmount}
- Follow-up Status: ${metadata.followUpStatus}

TRANSCRIPT:
${transcript}

EVALUATION CRITERIA:
${criteriaText}

For each criterion, provide:
1. A score (0, 5, or 10 based on the scoring standard)
2. Whether it passed (true/false)
3. Specific evidence from the transcript (exact quote if available, or "Not found" if missing)
4. Brief reasoning explaining why this score was given

Also provide an overall feedback summary (2-3 sentences) highlighting key strengths and areas for improvement.

Return your evaluation as a valid JSON object with this structure:
{
  "results": [
    {
      "criterionId": 1,
      "score": 10,
      "passed": true,
      "evidence": "exact quote from transcript or description",
      "reasoning": "brief explanation"
    }
  ],
  "overallFeedback": "2-3 sentence summary"
}`;
  }

  async evaluateCall(
    transcript: string,
    metadata: CallMetadata,
    callId: string
  ): Promise<CallEvaluation> {
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is empty or invalid');
    }

    const prompt = this.buildEvaluationPrompt(transcript, metadata);

    try {
      const response = await spark.llm(prompt, 'gpt-4o', true);
      const parsed = JSON.parse(response);

      if (!parsed.results || !Array.isArray(parsed.results)) {
        throw new Error('Invalid response format from AI');
      }

      const results: EvaluationResult[] = parsed.results.map((r: any) => ({
        criterionId: r.criterionId,
        score: r.score,
        passed: r.passed,
        evidence: r.evidence || '',
        reasoning: r.reasoning || '',
      }));

      const totalScore = results.reduce((sum, r) => sum + r.score, 0);
      const maxScore = getMaxScore();
      const percentage = Math.round((totalScore / maxScore) * 100);

      const evaluation: CallEvaluation = {
        id: `eval_${Date.now()}`,
        callId,
        evaluatedAt: new Date().toISOString(),
        totalScore,
        maxScore,
        percentage,
        results,
        overallFeedback: parsed.overallFeedback || 'Evaluation completed.',
      };

      return evaluation;
    } catch (error) {
      console.error('Error evaluating call:', error);
      throw new Error(
        `Failed to evaluate call: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async batchEvaluate(
    calls: Array<{ transcript: string; metadata: CallMetadata; callId: string }>
  ): Promise<CallEvaluation[]> {
    const results: CallEvaluation[] = [];

    for (const call of calls) {
      try {
        const evaluation = await this.evaluateCall(
          call.transcript,
          call.metadata,
          call.callId
        );
        results.push(evaluation);
      } catch (error) {
        console.error(`Failed to evaluate call ${call.callId}:`, error);
      }
    }

    return results;
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.endpoint) {
      errors.push('Azure OpenAI endpoint is required');
    }

    if (!this.config.apiKey) {
      errors.push('Azure OpenAI API key is required');
    }

    if (!this.config.deploymentName) {
      errors.push('Deployment name is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const azureOpenAIService = new AzureOpenAIService();
