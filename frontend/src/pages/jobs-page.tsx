import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Search,
  Filter,
  RefreshCw,
  Clock,
  Eye,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import type { Job, JobExecution, ExecutionStatus } from '@/types/job';

interface JobsPageProps {}

export const JobsPage: React.FC<JobsPageProps> = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState<(Job & { latestExecution?: JobExecution })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load jobs on component mount
  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch jobs from API - backend returns { jobs: Job[] }
      const fetchedJobs = await apiClient.getJobs();
      
      // Since executions endpoint doesn't exist yet, just use jobs without execution data
      const jobsWithoutExecutions = fetchedJobs.map((job) => ({
        ...job,
        latestExecution: undefined // No execution data available yet
      }));
      
      setJobs(jobsWithoutExecutions);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setError(error instanceof Error ? error.message : 'Failed to load jobs');
      // Set empty array instead of mock data to avoid confusion
      setJobs([]);
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

  const handleRefresh = () => {
    loadJobs();
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.imageUri.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.id.toLowerCase().includes(searchTerm.toLowerCase());
    // Since we don't have execution data yet, we'll show all jobs regardless of status filter
    return matchesSearch;
  });

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
                variant="default" 
                size="sm"
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Jobs</h2>
            <p className="text-muted-foreground mt-1">
              Manage your workload scheduling and optimization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate('/jobs/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Job
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">Failed to load jobs</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </Alert>
        )}

        {/* Filters & Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search jobs by ID or image..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ExecutionStatus | 'all')}
                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                  disabled
                  title="Status filtering will be available when execution tracking is implemented"
                >
                  <option value="all">All Status (Coming Soon)</option>
                  <option value="pending">Pending</option>
                  <option value="evaluating">Evaluating</option>
                  <option value="running">Running</option>
                  <option value="completed_success">Completed</option>
                  <option value="completed_error">Failed</option>
                  <option value="orphaned">Orphaned</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading jobs...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <List className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Get started by creating your first job'
                    }
                  </p>
                  <Button onClick={() => navigate('/jobs/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Job
                  </Button>
                </CardContent>
              </Card>
            ) : (
            filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg font-mono">{job.id}</h3>
                        <Badge variant="outline">Created</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Container Image</p>
                          <p className="text-sm font-mono bg-muted/50 px-2 py-1 rounded truncate">
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
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            Created {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            Updated {new Date(job.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {Object.keys(job.envVars).length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Environment Variables</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(job.envVars).slice(0, 3).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs font-mono">
                                {key}={String(value)}
                              </Badge>
                            ))}
                            {Object.keys(job.envVars).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{Object.keys(job.envVars).length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alert('Delete functionality coming soon!')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span>Execution tracking will be available soon</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};