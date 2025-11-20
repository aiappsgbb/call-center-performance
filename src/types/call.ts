export interface CallMetadata {
  time: string;
  billId: string;
  orderId: string;
  userId: string;
  fileTag: string;
  agentName: string;
  product: string;
  customerType: string;
  borrowerName: string;
  nationality: string;
  daysPastDue: number;
  dueAmount: number;
  followUpStatus: string;
}

export interface EvaluationCriterion {
  id: number;
  type: 'Must Do' | 'Must Not Do';
  name: string;
  definition: string;
  evaluationCriteria: string;
  scoringStandard: {
    passed: number;
    failed: number;
    partial?: number;
  };
  examples: string[];
}

export interface EvaluationResult {
  criterionId: number;
  score: number;
  passed: boolean;
  evidence: string;
  reasoning: string;
}

export interface CallEvaluation {
  id: string;
  callId: string;
  evaluatedAt: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  results: EvaluationResult[];
  overallFeedback: string;
}

export interface CallRecord {
  id: string;
  metadata: CallMetadata;
  audioFile?: File | string;
  transcript?: string;
  transcriptConfidence?: number;
  evaluation?: CallEvaluation;
  status: 'uploaded' | 'transcribed' | 'evaluated' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface AgentPerformance {
  agentName: string;
  totalCalls: number;
  averageScore: number;
  averagePercentage: number;
  criteriaScores: Record<number, number>;
  trend: 'up' | 'down' | 'stable';
  topStrengths: number[];
  topWeaknesses: number[];
}

export interface CriteriaAnalytics {
  criterionId: number;
  totalEvaluations: number;
  passRate: number;
  averageScore: number;
  commonIssues: string[];
}
