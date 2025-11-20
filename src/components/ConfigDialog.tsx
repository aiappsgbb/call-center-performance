import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GearSix } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface AzureConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
}

export function ConfigDialog() {
  const [config, setConfig] = useKV<AzureConfig>('azure-openai-config', {
    endpoint: '',
    apiKey: '',
    deploymentName: '',
    apiVersion: '2024-02-15-preview',
  });

  const [open, setOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<AzureConfig>(
    config || {
      endpoint: '',
      apiKey: '',
      deploymentName: '',
      apiVersion: '2024-02-15-preview',
    }
  );

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleSave = () => {
    setConfig((prev) => ({ ...localConfig }));
    toast.success('Configuration saved successfully');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GearSix className="mr-2" size={18} />
          Azure OpenAI Config
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Azure OpenAI Configuration</DialogTitle>
          <DialogDescription>
            Configure your Azure OpenAI API settings for call evaluation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="endpoint">Endpoint URL</Label>
            <Input
              id="endpoint"
              placeholder="https://your-resource.openai.azure.com/"
              value={localConfig.endpoint}
              onChange={(e) =>
                setLocalConfig((prev) => ({ ...prev, endpoint: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Your Azure OpenAI API key"
              value={localConfig.apiKey}
              onChange={(e) =>
                setLocalConfig((prev) => ({ ...prev, apiKey: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deploymentName">Deployment Name</Label>
            <Input
              id="deploymentName"
              placeholder="gpt-4"
              value={localConfig.deploymentName}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  deploymentName: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiVersion">API Version</Label>
            <Input
              id="apiVersion"
              placeholder="2024-02-15-preview"
              value={localConfig.apiVersion}
              onChange={(e) =>
                setLocalConfig((prev) => ({ ...prev, apiVersion: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
