import { CriteriaAnalytics } from '@/types/call';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCriterionById } from '@/lib/evaluation-criteria';

interface CriteriaAnalyticsChartProps {
  analytics: CriteriaAnalytics[];
}

export function CriteriaAnalyticsChart({ analytics }: CriteriaAnalyticsChartProps) {
  const data = analytics.map((item) => {
    const criterion = getCriterionById(item.criterionId);
    return {
      name: `#${item.criterionId}`,
      passRate: item.passRate,
      criterionName: criterion?.name || `Criterion ${item.criterionId}`,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
        <YAxis stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Pass Rate']}
          labelFormatter={(label) => {
            const item = data.find((d) => d.name === label);
            return item?.criterionName || label;
          }}
        />
        <Bar dataKey="passRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
