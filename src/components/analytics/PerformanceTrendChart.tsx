import { CallRecord } from '@/types/call';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getPerformanceTrend } from '@/lib/analytics';

interface PerformanceTrendChartProps {
  calls: CallRecord[];
  agentName?: string;
}

export function PerformanceTrendChart({ calls, agentName }: PerformanceTrendChartProps) {
  const trendData = getPerformanceTrend(calls, agentName);

  if (trendData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={trendData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          stroke="hsl(var(--muted-foreground))"
          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'score') return [`${value}%`, 'Average Score'];
            if (name === 'count') return [value, 'Calls'];
            return [value, name];
          }}
          labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric' 
          })}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
