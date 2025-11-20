import { CallRecord, AgentPerformance, CriteriaAnalytics } from '@/types/call';
import { EVALUATION_CRITERIA } from './evaluation-criteria';

export function calculateAgentPerformance(calls: CallRecord[]): AgentPerformance[] {
  const agentMap = new Map<string, CallRecord[]>();

  calls.forEach((call) => {
    if (call.evaluation) {
      const agent = call.metadata.agentName;
      if (!agentMap.has(agent)) {
        agentMap.set(agent, []);
      }
      agentMap.get(agent)!.push(call);
    }
  });

  const performances: AgentPerformance[] = [];

  agentMap.forEach((agentCalls, agentName) => {
    const totalCalls = agentCalls.length;
    const totalScore = agentCalls.reduce(
      (sum, call) => sum + (call.evaluation?.totalScore || 0),
      0
    );
    const totalPercentage = agentCalls.reduce(
      (sum, call) => sum + (call.evaluation?.percentage || 0),
      0
    );

    const criteriaScores: Record<number, number> = {};
    EVALUATION_CRITERIA.forEach((criterion) => {
      const scores = agentCalls
        .map((call) => {
          const result = call.evaluation?.results.find(
            (r) => r.criterionId === criterion.id
          );
          return result?.score || 0;
        });
      criteriaScores[criterion.id] =
        scores.reduce((sum, s) => sum + s, 0) / scores.length;
    });

    const sortedCriteria = Object.entries(criteriaScores).sort(
      ([, a], [, b]) => b - a
    );
    const topStrengths = sortedCriteria.slice(0, 3).map(([id]) => parseInt(id));
    const topWeaknesses = sortedCriteria.slice(-3).map(([id]) => parseInt(id));

    const recentCalls = agentCalls.slice(-5);
    const olderCalls = agentCalls.slice(0, -5);
    const recentAvg =
      recentCalls.reduce((sum, c) => sum + (c.evaluation?.percentage || 0), 0) /
      Math.max(recentCalls.length, 1);
    const olderAvg =
      olderCalls.length > 0
        ? olderCalls.reduce((sum, c) => sum + (c.evaluation?.percentage || 0), 0) /
          olderCalls.length
        : recentAvg;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentAvg > olderAvg + 5) trend = 'up';
    else if (recentAvg < olderAvg - 5) trend = 'down';

    performances.push({
      agentName,
      totalCalls,
      averageScore: totalScore / totalCalls,
      averagePercentage: totalPercentage / totalCalls,
      criteriaScores,
      trend,
      topStrengths,
      topWeaknesses,
    });
  });

  return performances.sort((a, b) => b.averagePercentage - a.averagePercentage);
}

export function calculateCriteriaAnalytics(calls: CallRecord[]): CriteriaAnalytics[] {
  const evaluatedCalls = calls.filter((c) => c.evaluation);

  const analytics: CriteriaAnalytics[] = EVALUATION_CRITERIA.map((criterion) => {
    const results = evaluatedCalls
      .map((call) =>
        call.evaluation?.results.find((r) => r.criterionId === criterion.id)
      )
      .filter((r) => r !== undefined);

    const totalEvaluations = results.length;
    const passedCount = results.filter((r) => r?.passed).length;
    const passRate = totalEvaluations > 0 ? (passedCount / totalEvaluations) * 100 : 0;
    const averageScore =
      totalEvaluations > 0
        ? results.reduce((sum, r) => sum + (r?.score || 0), 0) / totalEvaluations
        : 0;

    const failedResults = results.filter((r) => !r?.passed);
    const commonIssues = failedResults
      .map((r) => r?.reasoning)
      .filter((r) => r)
      .slice(0, 3) as string[];

    return {
      criterionId: criterion.id,
      totalEvaluations,
      passRate,
      averageScore,
      commonIssues,
    };
  });

  return analytics;
}

export function getPerformanceTrend(calls: CallRecord[], agentName?: string): Array<{
  date: string;
  score: number;
  count: number;
}> {
  const filteredCalls = agentName
    ? calls.filter((c) => c.metadata.agentName === agentName && c.evaluation)
    : calls.filter((c) => c.evaluation);

  const dateMap = new Map<string, { total: number; count: number }>();

  filteredCalls.forEach((call) => {
    const date = new Date(call.createdAt).toISOString().split('T')[0];
    if (!dateMap.has(date)) {
      dateMap.set(date, { total: 0, count: 0 });
    }
    const entry = dateMap.get(date)!;
    entry.total += call.evaluation?.percentage || 0;
    entry.count += 1;
  });

  return Array.from(dateMap.entries())
    .map(([date, { total, count }]) => ({
      date,
      score: Math.round(total / count),
      count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
