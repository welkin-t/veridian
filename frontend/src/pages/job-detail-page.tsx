import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api/unified-api-client';
import { 
  Leaf, 
  LogOut, 
  Settings,
  Bell,
  Activity,
  BarChart3,
  Plus,
  List,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Container,
  Server,
  FileText,
  AlertCircle,
  PlayCircle,
  Trash2,
  Edit
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import type { Job, JobExecution, ExecutionStatus } from '@/types/job';

interface JobDetailPageProps {}

export const JobDetailPage: React.FC<JobDetailPageProps> = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadJobDetails(id);
    }
  }, [id]);

  const loadJobDetails = async (jobId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [jobData, executionsData] = await Promise.all([
        apiClient.getJob(jobId),
        apiClient.getJobExecutions(jobId)
      ]);
      
      setJob(jobData);
      setExecutions(executionsData);
    } catch (error) {
      console.error('Failed to load job details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load job details';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleDelete = async () => {
    if (!job || !confirm(`Are you sure you want to delete job ${job.id}?`)) return;
    
    try {
      await apiClient.deleteJob(job.id);
      navigate('/jobs');
    } catch (error) {
      console.error('Failed to delete job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete job. Please try again.';
      alert(errorMessage);
    }
  };

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'evaluating':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed_success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'completed_error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'orphaned':
        return <XCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ExecutionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'evaluating':
        return <Badge className="bg-blue-500/20 text-blue-500">Evaluating</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/20 text-blue-500">Running</Badge>;
      case 'completed_success':
        return <Badge className="bg-green-500/20 text-green-500">Completed</Badge>;
      case 'completed_error':
        return <Badge className="bg-red-500/20 text-red-500">Failed</Badge>;
      case 'orphaned':
        return <Badge className="bg-orange-500/20 text-orange-500">Orphaned</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isLoading) {
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
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
            <p className="text-muted-foreground">Loading job details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !job) {
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
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Alert className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">Job Not Found</p>
              <p className="text-sm mt-1">{error || 'The requested job could not be found.'}</p>
            </div>
          </Alert>
          
          <div className="text-center mt-6">
            <Button onClick={() => navigate('/jobs')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const latestExecution = executions[0];

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
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/jobs/new')}
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/jobs')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Jobs
            </Button>
            <div>
              <h2 className="text-3xl font-bold text-foreground font-mono">{job.id}</h2>
              <p className="text-muted-foreground mt-1">
                Created {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => alert('Edit functionality coming soon!')}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Job Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Container className="w-5 h-5" />
                Job Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Container Image</p>
                <p className="text-sm font-mono bg-muted/50 px-2 py-1 rounded break-all">
                  {job.imageUri}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Delay Tolerance</p>
                <p className="text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {job.delayToleranceHours} hours
                </p>
              </div>

              {Object.keys(job.envVars).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Environment Variables</p>
                  <div className="space-y-1">
                    {Object.entries(job.envVars).map(([key, value]) => (
                      <div key={key} className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                        <span className="text-primary">{key}</span>=<span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestExecution ? (
                <>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(latestExecution.status)}
                    {getStatusBadge(latestExecution.status)}
                  </div>
                  
                  {latestExecution.cloudRegion && (
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Region: {latestExecution.cloudRegion}</span>
                    </div>
                  )}
                  
                  {latestExecution.vmType && (
                    <div className="flex items-center gap-2">
                      <Container className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">VM Type: {latestExecution.vmType}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {latestExecution.costActualUsd && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          ${latestExecution.costActualUsd.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Actual Cost</p>
                      </div>
                    )}
                    
                    {latestExecution.carbonEmittedKg && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {latestExecution.carbonEmittedKg}kg
                        </p>
                        <p className="text-xs text-muted-foreground">CO₂ Emitted</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No executions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Execution History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Execution History
            </CardTitle>
            <CardDescription>
              Complete history of job executions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {executions.length === 0 ? (
              <div className="text-center py-8">
                <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No executions yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This job is waiting to be scheduled by Veridian's optimizer
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {executions.map((execution) => (
                  <div key={execution.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(execution.status)}
                        <span className="font-mono text-sm">{execution.id}</span>
                        {getStatusBadge(execution.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(execution.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {execution.cloudRegion && (
                        <div>
                          <p className="font-medium">Region</p>
                          <p className="text-muted-foreground">{execution.cloudRegion}</p>
                        </div>
                      )}
                      
                      {execution.costActualUsd && (
                        <div>
                          <p className="font-medium">Cost</p>
                          <p className="text-green-600">${execution.costActualUsd.toFixed(2)}</p>
                        </div>
                      )}
                      
                      {execution.carbonEmittedKg && (
                        <div>
                          <p className="font-medium">Carbon</p>
                          <p className="text-primary">{execution.carbonEmittedKg}kg CO₂</p>
                        </div>
                      )}
                      
                      {execution.exitCode !== null && (
                        <div>
                          <p className="font-medium">Exit Code</p>
                          <p className={execution.exitCode === 0 ? "text-green-600" : "text-red-600"}>
                            {execution.exitCode}
                          </p>
                        </div>
                      )}
                    </div>

                    {(execution.startedAt || execution.completedAt) && (
                      <>
                        <Separator className="my-3" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {execution.startedAt && (
                            <div>
                              <p className="font-medium">Started</p>
                              <p className="text-muted-foreground">
                                {new Date(execution.startedAt).toLocaleString()}
                              </p>
                            </div>
                          )}
                          
                          {execution.completedAt && (
                            <div>
                              <p className="font-medium">Completed</p>
                              <p className="text-muted-foreground">
                                {new Date(execution.completedAt).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
