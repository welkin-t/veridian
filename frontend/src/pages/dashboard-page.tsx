import React from 'react';
import { Leaf } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardPageProps {}

export const DashboardPage: React.FC<DashboardPageProps> = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 mb-8">
          <Leaf className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Veridian Dashboard</h1>
        </div>

        <Card className="border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Welcome to Veridian</CardTitle>
            <CardDescription>
              Your intelligent carbon-aware cloud workload scheduler
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="text-center text-muted-foreground">
              <p>Dashboard coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
