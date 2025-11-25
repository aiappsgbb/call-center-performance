import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CallRecord } from '@/types/call';
import { SchemaDefinition, getSchemaAudioPath } from '@/types/schema';
import { toast } from 'sonner';
import { Upload } from '@phosphor-icons/react';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (updatedCalls: CallRecord[]) => void;
  activeSchema?: SchemaDefinition | null;
  existingCalls: CallRecord[];
}

export function UploadDialog({ open, onOpenChange, onUpload, activeSchema, existingCalls }: UploadDialogProps) {
  const [audioFiles, setAudioFiles] = useState<FileList | null>(null);

  const handleUpload = async () => {
    if (!audioFiles || audioFiles.length === 0) {
      toast.error('Please select at least one audio file');
      return;
    }

    if (!activeSchema) {
      toast.error('No active schema selected. Please select a schema first.');
      return;
    }

    if (!existingCalls || existingCalls.length === 0) {
      toast.error('No existing records found. Please import metadata first.');
      return;
    }

    try {
      const schemaAudioPath = getSchemaAudioPath(activeSchema);
      const updatedCalls: CallRecord[] = [];
      let matchedCount = 0;
      let unmatchedFiles: string[] = [];

      // Try to match each audio file to an existing record by filename
      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i];
        const fileName = file.name;
        
        // Find matching call record by checking metadata for audio filename
        const matchingCall = existingCalls.find(call => {
          const audioField = Object.entries(call.metadata || {}).find(([key, value]) => 
            typeof value === 'string' && 
            (value === fileName || value.endsWith(`/${fileName}`) || value.includes(fileName))
          );
          return !!audioField;
        });

        if (matchingCall) {
          // Create a blob URL for the audio file
          const audioBlob = new Blob([file], { type: file.type });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Update the matching call with audio file
          const updatedCall: CallRecord = {
            ...matchingCall,
            audioFile: file,
            audioUrl: audioUrl,
            status: 'uploaded',
            updatedAt: new Date().toISOString(),
          };
          
          updatedCalls.push(updatedCall);
          matchedCount++;
        } else {
          unmatchedFiles.push(fileName);
        }
      }

      if (updatedCalls.length === 0) {
        toast.error('No audio files matched existing records. Check filenames in metadata.');
        return;
      }

      // Store audio files in IndexedDB with schema organization
      const { storeAudioFiles } = await import('@/lib/audio-storage');
      await storeAudioFiles(updatedCalls.map(call => ({
        id: call.id,
        audioFile: call.audioFile!,
        schemaId: activeSchema.id
      })));

      onUpload(updatedCalls);
      
      if (unmatchedFiles.length > 0) {
        toast.warning(`Matched ${matchedCount} file(s). ${unmatchedFiles.length} unmatched: ${unmatchedFiles.slice(0, 3).join(', ')}${unmatchedFiles.length > 3 ? '...' : ''}`);
      } else {
        toast.success(`Successfully attached ${matchedCount} audio file(s) to existing records`);
      }
      
      setAudioFiles(null);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to upload audio files');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Audio Files</DialogTitle>
          <DialogDescription>
            {activeSchema ? (
              <>
                Select audio files to attach to existing records in <strong>{activeSchema.name}</strong>.
                <br />
                <span className="text-xs text-muted-foreground">
                  Files will be matched by filename to metadata records. {existingCalls?.length || 0} record(s) available.
                </span>
              </>
            ) : (
              'Please select a schema before uploading audio files.'
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="audio-files">Audio Files</Label>
            <Input
              id="audio-files"
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg"
              multiple
              onChange={(e) => setAudioFiles(e.target.files)}
              className="cursor-pointer"
            />
            {audioFiles && audioFiles.length > 0 && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">Selected files ({audioFiles.length}):</p>
                <ul className="text-xs space-y-1 max-h-[150px] overflow-y-auto">
                  {Array.from(audioFiles).map((file, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Upload size={14} className="text-muted-foreground" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Supported formats: MP3, WAV, M4A, FLAC, OGG
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!audioFiles || audioFiles.length === 0 || !activeSchema}>
              <Upload className="mr-2" size={18} />
              Upload {audioFiles && audioFiles.length > 0 ? `${audioFiles.length} File(s)` : 'Files'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
