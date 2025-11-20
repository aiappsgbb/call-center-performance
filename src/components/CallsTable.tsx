import { CallRecord } from '@/types/call';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayCircle } from '@phosphor-icons/react';

interface CallsTableProps {
  calls: CallRecord[];
  onSelectCall: (call: CallRecord) => void;
  onUpdateCalls: (updater: (prev: CallRecord[] | undefined) => CallRecord[]) => void;
}

export function CallsTable({ calls, onSelectCall }: CallsTableProps) {
  const getStatusBadge = (status: CallRecord['status']) => {
    const variants: Record<CallRecord['status'], {
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
      label: string;
    }> = {
      uploaded: { variant: 'secondary', label: 'Uploaded' },
      transcribed: { variant: 'outline', label: 'Transcribed' },
      evaluated: { variant: 'default', label: 'Evaluated' },
      failed: { variant: 'destructive', label: 'Failed' },
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Borrower</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Days Past Due</TableHead>
            <TableHead>Due Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <TableRow
              key={call.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectCall(call)}
            >
              <TableCell className="font-medium">{call.metadata.agentName}</TableCell>
              <TableCell>{call.metadata.borrowerName}</TableCell>
              <TableCell>{call.metadata.product}</TableCell>
              <TableCell>{call.metadata.daysPastDue}</TableCell>
              <TableCell>{call.metadata.dueAmount.toFixed(2)}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(call.createdAt)}
              </TableCell>
              <TableCell>{getStatusBadge(call.status)}</TableCell>
              <TableCell className="text-center">
                {call.evaluation ? (
                  <span className="font-semibold">{call.evaluation.percentage}%</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCall(call);
                  }}
                >
                  <PlayCircle size={18} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
