import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, BarChart3, Zap, Leaf } from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any auth tokens/state here
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-foreground">
              <span className="text-primary font-mono">Veridian</span> Dashboard
            </h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome to your efficiency dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor your sustainable cloud job scheduling and optimization metrics
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cost Saved
              </CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">$2,847.32</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary">+12.5%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CO₂ Reduced
              </CardTitle>
              <Leaf className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">1,247 kg</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary">+8.3%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jobs Optimized
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">1,843</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary">+15.2%</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Jobs */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Jobs</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your latest job scheduling activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 'job-001', name: 'Data Processing Pipeline', status: 'Running', efficiency: '94%' },
                  { id: 'job-002', name: 'ML Model Training', status: 'Completed', efficiency: '87%' },
                  { id: 'job-003', name: 'Backup Operation', status: 'Queued', efficiency: '92%' },
                ].map((job) => (
                  <div key={job.id} className="flex justify-between items-center p-3 bg-secondary/20 rounded-md">
                    <div>
                      <p className="font-mono text-sm text-muted-foreground">{job.id}</p>
                      <p className="text-foreground font-medium">{job.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        job.status === 'Running' ? 'text-primary' : 
                        job.status === 'Completed' ? 'text-blue-400' : 
                        'text-muted-foreground'
                      }`}>
                        {job.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Efficiency: {job.efficiency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">System Status</CardTitle>
              <CardDescription className="text-muted-foreground">
                Current platform performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">CPU Usage</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-secondary rounded-full">
                      <div className="w-16 h-2 bg-primary rounded-full"></div>
                    </div>
                    <span className="text-sm font-mono text-foreground">67%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Memory Usage</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-secondary rounded-full">
                      <div className="w-12 h-2 bg-primary rounded-full"></div>
                    </div>
                    <span className="text-sm font-mono text-foreground">52%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Active Jobs</span>
                  <span className="text-sm font-mono text-foreground">23</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Queue Length</span>
                  <span className="text-sm font-mono text-foreground">7</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
