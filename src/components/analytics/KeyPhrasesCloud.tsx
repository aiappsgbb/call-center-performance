import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KeyPhraseAnalytics } from '@/lib/analytics';
import { SentimentLabel } from '@/types/call';

interface KeyPhrasesCloudProps {
  phrases: KeyPhraseAnalytics[];
  maxPhrases?: number;
  title?: string;
  description?: string;
}

const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  positive: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50',
  neutral: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50',
};

// Calculate font size based on frequency
function calculateFontSize(frequency: number, maxFrequency: number, minFrequency: number): string {
  // Normalize frequency to 0-1 range
  const range = maxFrequency - minFrequency;
  const normalized = range > 0 ? (frequency - minFrequency) / range : 0.5;
  
  // Map to font sizes (0.75rem to 1.5rem)
  const minSize = 0.75;
  const maxSize = 1.5;
  const size = minSize + normalized * (maxSize - minSize);
  
  return `${size}rem`;
}

// Calculate opacity based on frequency
function calculateOpacity(frequency: number, maxFrequency: number, minFrequency: number): number {
  const range = maxFrequency - minFrequency;
  const normalized = range > 0 ? (frequency - minFrequency) / range : 0.5;
  return 0.6 + normalized * 0.4; // 0.6 to 1.0
}

export function KeyPhrasesCloud({
  phrases,
  maxPhrases = 30,
  title = 'Key Phrases',
  description = 'Most frequently mentioned phrases across all calls',
}: KeyPhrasesCloudProps) {
  const displayPhrases = useMemo(() => {
    const limited = phrases.slice(0, maxPhrases);
    // Shuffle for visual variety but keep relative importance via size
    return [...limited].sort(() => Math.random() - 0.5);
  }, [phrases, maxPhrases]);

  const { maxFrequency, minFrequency } = useMemo(() => {
    if (displayPhrases.length === 0) return { maxFrequency: 0, minFrequency: 0 };
    const frequencies = displayPhrases.map((p) => p.frequency);
    return {
      maxFrequency: Math.max(...frequencies),
      minFrequency: Math.min(...frequencies),
    };
  }, [displayPhrases]);

  if (phrases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No key phrases extracted yet. Re-evaluate calls to generate key phrases.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description} • {phrases.length} unique phrases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 justify-center items-center min-h-[200px] py-4">
          {displayPhrases.map((phrase, index) => {
            const fontSize = calculateFontSize(phrase.frequency, maxFrequency, minFrequency);
            const opacity = calculateOpacity(phrase.frequency, maxFrequency, minFrequency);
            const colorClass = SENTIMENT_COLORS[phrase.avgSentiment];

            return (
              <Badge
                key={`${phrase.phrase}-${index}`}
                variant="secondary"
                className={`cursor-default transition-all duration-200 ${colorClass}`}
                style={{
                  fontSize,
                  opacity,
                  padding: '0.25em 0.5em',
                }}
                title={`Mentioned in ${phrase.count} calls (${phrase.frequency.toFixed(1)}%)\nSentiment: ${phrase.avgSentiment}${phrase.relatedTopics.length > 0 ? `\nRelated topics: ${phrase.relatedTopics.join(', ')}` : ''}`}
              >
                {phrase.phrase}
              </Badge>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span>Positive</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Neutral</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>Negative</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-[0.75rem]">Small</span>
            <span>→</span>
            <span className="text-[1.25rem]">Large</span>
            <span className="ml-1">= Frequency</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default KeyPhrasesCloud;
