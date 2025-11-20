import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CallRecord } from '@/types/call';
import { azureOpenAIService } from '@/services/azure-openai';
import { getCriterionById } from '@/lib/evaluation-criteria';
import { toast } from 'sonner';
import { CheckCircle, XCircle, MinusCircle, Sparkle } from '@phosphor-icons/react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CallDetailDialogProps {
  call: CallRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (call: CallRecord) => void;
}

export function CallDetailDialog({
  call,
  open,
  onOpenChange,
  onUpdate,
}: CallDetailDialogProps) {
  const [evaluating, setEvaluating] = useState(false);

  const handleEvaluate = async () => {
    if (!call.transcript) {
      toast.error('No transcript available for evaluation');
      return;
    }

    setEvaluating(true);
    try {
      const evaluation = await azureOpenAIService.evaluateCall(
        call.transcript,
        call.metadata,
        call.id
      );

      const updatedCall: CallRecord = {
        ...call,
        evaluation,
        status: 'evaluated',
        updatedAt: new Date().toISOString(),
      };

      onUpdate(updatedCall);
      toast.success('Call evaluated successfully!');
    } catch (error) {
      toast.error(
        `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">Call Details</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {call.metadata.agentName} → {call.metadata.borrowerName}
              </p>
            </div>
            {call.evaluation && (
              <div className="text-right">
                <div className="text-3xl font-bold">{call.evaluation.percentage}%</div>
                <div className="text-sm text-muted-foreground">
                  {call.evaluation.totalScore} / {call.evaluation.maxScore} points
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="metadata" className="mt-4">
          <TabsList>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="evaluation">
              Evaluation {call.evaluation && '✓'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metadata" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Agent</h4>
                <p className="font-medium">{call.metadata.agentName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Product</h4>
                <p className="font-medium">{call.metadata.product}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Borrower</h4>
                <p className="font-medium">{call.metadata.borrowerName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Nationality</h4>
                <p className="font-medium">{call.metadata.nationality}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Days Past Due
                </h4>
                <p className="font-medium">{call.metadata.daysPastDue}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Due Amount</h4>
                <p className="font-medium">{call.metadata.dueAmount.toFixed(2)}</p>
              </div>
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Follow-up Status
                </h4>
                <p className="font-medium">{call.metadata.followUpStatus}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transcript">
            <ScrollArea className="h-[500px] border border-border rounded-lg p-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {call.transcript || 'No transcript available'}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="evaluation" className="space-y-4">
            {!call.evaluation ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                    <Sparkle size={32} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Ready to Evaluate</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use AI to evaluate this call against 10 quality criteria
                    </p>
                  </div>
                  <Button onClick={handleEvaluate} disabled={evaluating}>
                    {evaluating ? 'Evaluating...' : 'Evaluate Call'}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Overall Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">
                      {call.evaluation.overallFeedback}
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  {call.evaluation.results.map((result) => {
                    const criterion = getCriterionById(result.criterionId);
                    if (!criterion) return null;

                    return (
                      <Card key={result.criterionId}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              {result.passed ? (
                                <CheckCircle
                                  size={24}
                                  weight="fill"
                                  className="text-success"
                                />
                              ) : result.score > 0 ? (
                                <MinusCircle
                                  size={24}
                                  weight="fill"
                                  className="text-warning"
                                />
                              ) : (
                                <XCircle
                                  size={24}
                                  weight="fill"
                                  className="text-destructive"
                                />
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold">{criterion.name}</h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {criterion.type}
                                  </p>
                                </div>
                                <Badge
                                  variant={result.passed ? 'default' : 'destructive'}
                                >
                                  {result.score} pts
                                </Badge>
                              </div>
                              <Progress
                                value={(result.score / criterion.scoringStandard.passed) * 100}
                                className="h-2"
                              />
                              <div className="text-sm">
                                <p className="font-medium text-muted-foreground">Evidence:</p>
                                <p className="mt-1 italic">"{result.evidence}"</p>
                              </div>
                              <div className="text-sm">
                                <p className="font-medium text-muted-foreground">Reasoning:</p>
                                <p className="mt-1">{result.reasoning}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleEvaluate} variant="outline" disabled={evaluating}>
                    {evaluating ? 'Re-evaluating...' : 'Re-evaluate'}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
