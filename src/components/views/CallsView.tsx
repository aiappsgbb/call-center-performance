import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { CallRecord } from '@/types/call';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, MagnifyingGlass } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { CallsTable } from '@/components/CallsTable';
import { UploadDialog } from '@/components/UploadDialog';
import { CallDetailDialog } from '@/components/CallDetailDialog';

export function CallsView() {
  const [calls, setCalls] = useKV<CallRecord[]>('calls', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  const filteredCalls = (calls || []).filter((call) => {
    const query = searchQuery.toLowerCase();
    return (
      call.metadata.agentName.toLowerCase().includes(query) ||
      call.metadata.borrowerName.toLowerCase().includes(query) ||
      call.metadata.product.toLowerCase().includes(query) ||
      call.metadata.fileTag.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Search calls by agent, borrower, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2" size={18} />
          Upload Calls
        </Button>
      </div>

      {(!calls || calls.length === 0) && (
        <Card className="p-12 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Upload size={32} className="text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No calls yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your first batch of call recordings with metadata to get started
              </p>
            </div>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="mr-2" size={18} />
              Upload Your First Calls
            </Button>
          </div>
        </Card>
      )}

      {calls && calls.length > 0 && (
        <CallsTable
          calls={filteredCalls}
          onSelectCall={setSelectedCall}
          onUpdateCalls={setCalls}
        />
      )}

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={(newCalls) => {
          setCalls((prevCalls) => [...(prevCalls || []), ...newCalls]);
          setUploadOpen(false);
        }}
      />

      {selectedCall && (
        <CallDetailDialog
          call={selectedCall}
          open={!!selectedCall}
          onOpenChange={(open) => !open && setSelectedCall(null)}
          onUpdate={(updatedCall) => {
            setCalls((prevCalls) =>
              (prevCalls || []).map((c) => (c.id === updatedCall.id ? updatedCall : c))
            );
            setSelectedCall(updatedCall);
          }}
        />
      )}
    </div>
  );
}
