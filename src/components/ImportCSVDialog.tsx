import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileArrowUp, Warning, CheckCircle, Info } from '@phosphor-icons/react';
import { CallRecord } from '@/types/call';
import { SchemaDefinition, getSchemaAudioPath } from '@/types/schema';
import { parseCSV, readFileAsText, readExcelFile } from '@/lib/csv-parser';
import { detectSchemaForRows } from '@/lib/csv-parser';
import { getAllSchemas, saveSchema, generateSchemaId } from '@/services/schema-manager';
import { SchemaMapper } from '@/services/schema-mapper';
import { toast } from 'sonner';

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (calls: CallRecord[]) => void;
  activeSchema: SchemaDefinition | null;
}

export function ImportCSVDialog({ open, onOpenChange, onImport, activeSchema }: ImportCSVDialogProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [audioFolderPath, setAudioFolderPath] = useState('/audio');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sheetName, setSheetName] = useState('audio related info');
  const [isAudioPathLocked, setIsAudioPathLocked] = useState(false);
  
  // Schema detection state
  const [availableSchemas, setAvailableSchemas] = useState<SchemaDefinition[]>([]);
  const [detectedSchema, setDetectedSchema] = useState<SchemaDefinition | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<SchemaDefinition | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[] | null>(null);
  
  // Custom schema naming
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [customSchemaName, setCustomSchemaName] = useState('');

  // Load available schemas on mount and when dialog opens
  useEffect(() => {
    if (open) {
      const schemas = getAllSchemas();
      setAvailableSchemas(schemas);
      setSelectedSchema(activeSchema);
    }
  }, [activeSchema, open]);

  // Update audio path when schema changes
  useEffect(() => {
    if (selectedSchema && !isAudioPathLocked) {
      const schemaPath = getSchemaAudioPath(selectedSchema);
      setAudioFolderPath(schemaPath);
    }
  }, [selectedSchema, isAudioPathLocked]);

  /**
   * Creates a new schema variant from a base schema with a custom name
   */
  const createSchemaVariant = (baseSchema: SchemaDefinition, newName: string): SchemaDefinition => {
    const newId = generateSchemaId(newName);
    const sanitizedId = newId.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    
    return {
      ...baseSchema,
      id: newId,
      name: newName,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: undefined,
      audioFolderPath: `/audio/${sanitizedId}`,
      relationships: [], // Start with no relationships for new schema
    };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv');
    
    if (!isExcel && !isCsv) {
      toast.error('Please select a CSV or Excel file');
      return;
    }
    
    setCsvFile(file);
    
    // Auto-detect schema
    await detectSchema(file);
  };

  const detectSchema = async (file: File) => {
    setIsDetecting(true);
    try {
      let rows: any[];
      
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      if (isExcel) {
        rows = await readExcelFile(file, sheetName);
      } else {
        const csvText = await readFileAsText(file);
        rows = parseCSV(csvText);
      }

      console.log('=== SCHEMA DETECTION ===');
      console.log('File:', file.name);
      console.log('Rows:', rows.length);
      console.log('First row columns:', rows[0] ? Object.keys(rows[0]) : 'none');
      console.log('Available schemas:', availableSchemas.length);
      console.log('Schemas:', availableSchemas.map(s => ({ 
        name: s.name, 
        fields: s.fields.map(f => ({ name: f.name, displayName: f.displayName })) 
      })));

      if (rows.length === 0) {
        toast.error('No data found in file');
        return;
      }

      setParsedRows(rows);

      // Try to detect best matching schema
      const schema = detectSchemaForRows(rows, availableSchemas, 30); // Very low threshold for detection

      console.log('Detected schema:', schema?.name || 'none');
      
      // Show match scores for all schemas
      console.log('Match scores for all schemas:');
      const schemaScores = availableSchemas.map(s => {
        const score = SchemaMapper.calculateMatchScore(rows[0], s);
        console.log(`  ${s.name}: ${score}%`);
        return { schema: s, score };
      });

      // Find best match even if below threshold
      const bestMatch = schemaScores.reduce((best, current) => 
        current.score > best.score ? current : best
      , { schema: null as SchemaDefinition | null, score: 0 });

      if (bestMatch.schema && bestMatch.score > 30) {
        const score = bestMatch.score / 100;
        
        console.log('Using best match:', bestMatch.schema.name, 'with score:', bestMatch.score);
        
        setDetectedSchema(bestMatch.schema);
        setSelectedSchema(bestMatch.schema);
        setMatchScore(score);

        if (bestMatch.score >= 70) {
          toast.success(
            `Schema detected: ${bestMatch.schema.name} (${Math.round(bestMatch.score)}% match)`,
            { duration: 4000 }
          );
        } else {
          toast.warning(
            `Schema detected: ${bestMatch.schema.name} (${Math.round(bestMatch.score)}% match - low confidence). Please verify the mapping.`,
            { duration: 6000 }
          );
        }
      } else {
        console.log('No schema matched');
        toast.warning('No matching schema found. Please select manually or create a new schema.');
        setDetectedSchema(null);
        setMatchScore(null);
      }
    } catch (error) {
      console.error('Schema detection error:', error);
      toast.error('Failed to detect schema');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleImport = async () => {
    if (!csvFile) {
      toast.error('Please select a file');
      return;
    }

    if (!selectedSchema) {
      toast.error('Please select a schema');
      return;
    }

    if (!audioFolderPath.trim()) {
      toast.error('Please specify the audio folder path');
      return;
    }

    const isLocalFilePath = /^[a-zA-Z]:|^\\\\/.test(audioFolderPath.trim());
    if (isLocalFilePath) {
      toast.error('Please provide an HTTP-accessible path (e.g., /audio or http://localhost:8080) because browsers cannot load C:/ files directly.');
      return;
    }

    setIsProcessing(true);

    try {
      // Handle schema creation if save-as-new is enabled
      let targetSchema = selectedSchema;

      if (saveAsNew && customSchemaName.trim()) {
        // Validate uniqueness
        const existing = availableSchemas.find(s => s.name === customSchemaName.trim());
        if (existing) {
          toast.error('Schema name already exists. Please choose a different name.');
          setIsProcessing(false);
          return;
        }

        // Validate name format
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(customSchemaName.trim())) {
          toast.error('Schema name contains invalid characters. Use only letters, numbers, spaces, hyphens, and underscores.');
          setIsProcessing(false);
          return;
        }

        // Create new schema variant
        targetSchema = createSchemaVariant(selectedSchema, customSchemaName.trim());
        const result = saveSchema(targetSchema);

        if (!result.success) {
          toast.error(result.error || 'Failed to create new schema');
          setIsProcessing(false);
          return;
        }

        toast.success(`Created new schema: "${customSchemaName.trim()}"`, { duration: 3000 });
      }

      // Use parsed rows if available, otherwise re-parse
      let rows = parsedRows;
      if (!rows) {
        const isExcel = csvFile.name.endsWith('.xlsx') || csvFile.name.endsWith('.xls');
        
        if (isExcel) {
          rows = await readExcelFile(csvFile, sheetName);
        } else {
          const csvText = await readFileAsText(csvFile);
          rows = parseCSV(csvText);
        }
      }

      if (!rows || rows.length === 0) {
        toast.error('No data found in file');
        return;
      }

      console.log('=== IMPORT WITH SCHEMA ===');
      console.log('Target schema:', targetSchema.name);
      console.log('Total rows:', rows.length);

      // Find audio file field in schema
      const audioUrlField = targetSchema.fields.find(f => 
        f.name.toLowerCase().includes('audiourl') || 
        f.name.toLowerCase().includes('audio_url') ||
        f.name.toLowerCase().includes('filetag') ||
        f.name.toLowerCase().includes('file_tag') ||
        f.name.toLowerCase().includes('file')
      );

      // Convert rows to CallRecords using target schema
      const callRecords: CallRecord[] = rows.map((row, index) => {
        const metadata = SchemaMapper.mapRow(row, targetSchema);
        
        // Extract audio filename from metadata and construct full URL
        let audioUrl: string | undefined;
        if (audioUrlField && metadata[audioUrlField.name]) {
          const audioFileName = metadata[audioUrlField.name];
          // Ensure audioFolderPath ends with /
          const basePath = audioFolderPath.endsWith('/') ? audioFolderPath : `${audioFolderPath}/`;
          audioUrl = `${basePath}${audioFileName}`;
        }
        
        return {
          id: `import-${Date.now()}-${index}`,
          status: 'pending audio' as const, // Status will change to 'uploaded' when audio files are attached
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          schemaId: targetSchema.id,
          schemaVersion: targetSchema.version,
          metadata,
          audioUrl,
        };
      });

      console.log('Converted call records:', callRecords.length);
      console.log('First call record:', callRecords[0]);
      console.log('Audio URL field:', audioUrlField?.name);
      console.log('Sample audioUrl:', callRecords[0]?.audioUrl);

      // Fetch audio files from URLs if audio field was found
      if (audioUrlField && audioFolderPath.trim()) {
        toast.info('Fetching audio files...');
        const { fetchAudioFilesForCalls } = await import('@/lib/csv-parser');
        const callsWithAudio = await fetchAudioFilesForCalls(callRecords);
        const successCount = callsWithAudio.filter(c => c.audioFile).length;
        
        onImport(callsWithAudio);
        toast.success(`Successfully imported ${callRecords.length} call records! (${successCount} with audio files)`);
      } else {
        onImport(callRecords);
        toast.success(`Successfully imported ${callRecords.length} call records!`);
      }
      
      onOpenChange(false);
      
      // Reset state
      setCsvFile(null);
      setParsedRows(null);
      setDetectedSchema(null);
      setMatchScore(null);
      setSaveAsNew(false);
      setCustomSchemaName('');
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Calls from Excel/CSV</DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx) or CSV file with call metadata from the "audio related info" sheet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Excel or CSV File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="cursor-pointer"
                disabled={isDetecting}
              />
              {csvFile && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {csvFile.name}
                </span>
              )}
            </div>
            {isDetecting && (
              <div className="flex items-center gap-2">
                <Progress value={undefined} className="h-1" />
                <span className="text-xs text-muted-foreground">Detecting schema...</span>
              </div>
            )}
          </div>

          {/* Schema Detection Results */}
          {detectedSchema && matchScore !== null && (
            <Alert className={matchScore >= 0.8 ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'}>
              <CheckCircle size={18} className={matchScore >= 0.8 ? 'text-green-600' : 'text-yellow-600'} />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{detectedSchema.name}</span> detected
                  </div>
                  <Badge variant={matchScore >= 0.8 ? 'default' : 'secondary'}>
                    {Math.round(matchScore * 100)}% match
                  </Badge>
                </div>
                <p className="text-xs mt-1 text-muted-foreground">
                  {matchScore >= 0.8 
                    ? 'Schema columns match well with your file structure.'
                    : 'Schema partially matches. You may want to select a different schema or create a new one.'}
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Manual Schema Selection */}
          {csvFile && availableSchemas.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="schema-select">Schema</Label>
              <Select
                value={selectedSchema?.id || ''}
                onValueChange={(schemaId) => {
                  const schema = availableSchemas.find(s => s.id === schemaId);
                  setSelectedSchema(schema || null);
                }}
              >
                <SelectTrigger id="schema-select">
                  <SelectValue placeholder="Select schema..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSchemas.map((schema) => (
                    <SelectItem key={schema.id} value={schema.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{schema.name}</span>
                        {schema.id === detectedSchema?.id && (
                          <Badge variant="outline" className="ml-2 text-xs">Auto-detected</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {detectedSchema 
                  ? 'Auto-detected schema shown above. You can manually override if needed.'
                  : 'Select the schema that matches your file structure.'}
              </p>
            </div>
          )}

          {/* Custom Schema Naming */}
          {selectedSchema && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="save-as-new"
                  checked={saveAsNew}
                  onCheckedChange={(checked) => {
                    setSaveAsNew(checked as boolean);
                    if (!checked) {
                      setCustomSchemaName('');
                    }
                  }}
                />
                <Label 
                  htmlFor="save-as-new"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Save as new schema variant
                </Label>
              </div>
              
              {saveAsNew && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="custom-schema-name">Custom Schema Name</Label>
                  <Input
                    id="custom-schema-name"
                    placeholder={`e.g., ${selectedSchema.name} - Custom`}
                    value={customSchemaName}
                    onChange={(e) => setCustomSchemaName(e.target.value)}
                    className="font-medium"
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a new schema based on <strong>{selectedSchema.name}</strong> with your custom name.
                    This allows you to organize schemas by project, client, or use case.
                  </p>
                </div>
              )}
            </div>
          )}

          {csvFile && (csvFile.name.endsWith('.xlsx') || csvFile.name.endsWith('.xls')) && (
            <div className="space-y-2">
              <Label htmlFor="sheet-name">Sheet Name</Label>
              <Input
                id="sheet-name"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="audio related info"
              />
              <p className="text-xs text-muted-foreground">
                Name of the Excel sheet containing the call metadata (default: "audio related info")
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="audio-folder">Audio Folder Path</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAudioPathLocked(!isAudioPathLocked)}
                className="h-6 px-2 text-xs"
              >
                {isAudioPathLocked ? '🔒 Locked' : '🔓 Auto'}
              </Button>
            </div>
            <Input
              id="audio-folder"
              value={audioFolderPath}
              onChange={(e) => {
                setAudioFolderPath(e.target.value);
                setIsAudioPathLocked(true);
              }}
              placeholder="/audio/schema-name"
              disabled={!isAudioPathLocked}
            />
            <p className="text-xs text-muted-foreground">
              {isAudioPathLocked 
                ? 'Custom path locked. Click 🔒 to use automatic schema-based path.'
                : `Auto-generated from schema: ${selectedSchema?.name || 'Select a schema'}. Click 🔓 to customize.`}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!csvFile || isProcessing}>
            <FileArrowUp className="mr-2" size={18} />
            {isProcessing ? 'Importing...' : 'Import Metadata'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
