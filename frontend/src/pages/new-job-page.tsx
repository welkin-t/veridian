import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { 
  Leaf, 
  LogOut, 
  Settings,
  Bell,
  Activity,
  BarChart3,
  Plus,
  List,
  Save,
  ArrowLeft,
  Container,
  Clock,
  Settings2,
  Info,
  AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import type { CreateJobRequest } from '@/types/job';

interface NewJobPageProps {}

export const NewJobPage: React.FC<NewJobPageProps> = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateJobRequest>({
    image_uri: '',
    env_vars: {},
    delay_tolerance_hours: 24
  });
  const [envVarInput, setEnvVarInput] = useState({ key: '', value: '' });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  const handleSettings = () => {
    alert('Settings page coming soon!');
  };

  const addEnvVar = () => {
    if (envVarInput.key && envVarInput.value) {
      setFormData(prev => ({
        ...prev,
        env_vars: {
          ...prev.env_vars,
          [envVarInput.key]: envVarInput.value
        }
      }));
      setEnvVarInput({ key: '', value: '' });
    }
  };

  const removeEnvVar = (key: string) => {
    setFormData(prev => ({
      ...prev,
      env_vars: Object.fromEntries(
        Object.entries(prev.env_vars || {}).filter(([k]) => k !== key)
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_uri) return;

    setIsLoading(true);
    try {
      // Make API call to create job
      const response = await apiClient.createJob(formData);
      console.log('Job created successfully:', response);
      
      // Success - redirect to jobs page
      navigate('/jobs');
    } catch (error) {
      console.error('Failed to create job:', error);
      alert(`Failed to create job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = formData.image_uri.trim() !== '' && 
                   formData.delay_tolerance_hours >= 0 && 
                   formData.delay_tolerance_hours <= 168;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Leaf className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Veridian</h1>
            </div>
            
            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/jobs')}
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                Jobs
              </Button>
              <Button 
                variant="default" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Job
              </Button>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="hidden sm:flex">
                <Activity className="w-3 h-3 mr-1" />
                System Healthy
              </Badge>
              
              <Button variant="ghost" size="sm" onClick={() => alert('Notifications coming soon!')}>
                <Bell className="w-4 h-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleSettings}>
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/jobs')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Create New Job</h2>
            <p className="text-muted-foreground mt-1">
              Schedule a new workload for carbon-aware optimization
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Container Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Container className="w-5 h-5" />
                Container Configuration
              </CardTitle>
              <CardDescription>
                Specify the Docker container and its configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="image_uri">Container Image URI *</Label>
                <Input
                  id="image_uri"
                  placeholder="docker.io/myapp/processor:v1.0.0"
                  value={formData.image_uri}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_uri: e.target.value }))}
                  className="font-mono"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Full URI to your Docker container image
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Environment Variables
              </CardTitle>
              <CardDescription>
                Set environment variables for your container
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new env var */}
              <div className="flex gap-2">
                <Input
                  placeholder="Variable name"
                  value={envVarInput.key}
                  onChange={(e) => setEnvVarInput(prev => ({ ...prev, key: e.target.value }))}
                  className="flex-1 font-mono"
                />
                <Input
                  placeholder="Value"
                  value={envVarInput.value}
                  onChange={(e) => setEnvVarInput(prev => ({ ...prev, value: e.target.value }))}
                  className="flex-1 font-mono"
                />
                <Button 
                  type="button" 
                  onClick={addEnvVar}
                  disabled={!envVarInput.key || !envVarInput.value}
                >
                  Add
                </Button>
              </div>

              {/* Existing env vars */}
              {Object.keys(formData.env_vars || {}).length > 0 && (
                <div className="space-y-2">
                  <Label>Current Variables</Label>
                  <div className="space-y-2">
                    {Object.entries(formData.env_vars || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <code className="text-sm flex-1">
                          {key}={String(value)}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEnvVar(key)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduling Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Scheduling Configuration
              </CardTitle>
              <CardDescription>
                Configure when and how your job can be executed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="delay_tolerance_hours">Delay Tolerance (hours) *</Label>
                <Input
                  id="delay_tolerance_hours"
                  type="number"
                  min="0"
                  max="168"
                  value={formData.delay_tolerance_hours}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    delay_tolerance_hours: parseInt(e.target.value) || 0 
                  }))}
                  className="max-w-xs"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  How long the job can be delayed for optimization (0-168 hours, max 1 week)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <div>
              <p className="font-medium">How it works</p>
              <p className="text-sm mt-1">
                Veridian will analyze carbon intensity and cost data to find the optimal time and Azure region 
                to execute your job within your specified delay tolerance, maximizing both cost savings and 
                environmental benefits.
              </p>
            </div>
          </Alert>

          {/* Validation Alert */}
          {!canSubmit && formData.image_uri && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <div>
                <p className="font-medium">Validation Issues</p>
                <ul className="text-sm mt-1 list-disc list-inside">
                  {!formData.image_uri.trim() && <li>Container image URI is required</li>}
                  {(formData.delay_tolerance_hours < 0 || formData.delay_tolerance_hours > 168) && 
                    <li>Delay tolerance must be between 0 and 168 hours</li>
                  }
                </ul>
              </div>
            </Alert>
          )}

          {/* Submit Actions */}
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/jobs')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!canSubmit || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Job
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};
