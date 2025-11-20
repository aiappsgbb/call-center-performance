import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, ChartBar, Users, Upload } from '@phosphor-icons/react';
import { CallsView } from '@/components/views/CallsView';
import { AnalyticsView } from '@/components/views/AnalyticsView';
import { AgentsView } from '@/components/views/AgentsView';
import { ConfigDialog } from '@/components/ConfigDialog';

function App() {
  const [activeTab, setActiveTab] = useState('calls');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Call Center QA Platform
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered call quality evaluation and analytics
              </p>
            </div>
            <ConfigDialog />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="calls" className="flex items-center gap-2">
              <Phone size={18} />
              <span>Calls</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <ChartBar size={18} />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Users size={18} />
              <span>Agents</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="calls">
              <CallsView />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsView />
            </TabsContent>

            <TabsContent value="agents">
              <AgentsView />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

export default App;