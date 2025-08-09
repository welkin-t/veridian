import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api/unified-api-client';
import { 
  Leaf, 
  LogOut, 
  User, 
  Mail, 
  Calendar,
  Activity,
  Zap,
  Cloud,
  Settings,
  Bell,
  BarChart3,
  Plus,
  List
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface DashboardPageProps {}

export const DashboardPage: React.FC<DashboardPageProps> = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState([
    {
      title: "Total Jobs",
      value: "0",
      change: "Create your first job",
      icon: Activity,
      color: "text-purple-600"
    },
    {
      title: "Recent Jobs",
      value: "0",
      change: "Last 7 days",
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      title: "System Status",
      value: "Online",
      change: "All systems operational",
      icon: Zap,
      color: "text-green-600"
    },
    {
      title: "Executions",
      value: "Coming Soon",
      change: "Feature in development",
      icon: Cloud,
      color: "text-gray-500"
    }
  ]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load dashboard data
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoadingStats(true);
      
      // Fetch user's jobs - now returns Job[] directly
      const userJobs = await apiClient.getJobs(10);
      console.log('API Response:', userJobs); // Debug log
      
      setRecentJobs(userJobs);
      
      // Calculate basic stats from jobs (no execution data available yet)
      const jobStats = {
        totalJobs: userJobs.length,
        activeJobs: userJobs.length, // All jobs are considered "active" for now
        recentJobs: userJobs.filter((job: any) => {
          const createdAt = new Date(job.createdAt);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return createdAt >= sevenDaysAgo;
        }).length
      };

      // Update stats with available data
      setStats([
        {
          title: "Total Jobs",
          value: jobStats.totalJobs.toString(),
          change: jobStats.totalJobs > 0 ? `${jobStats.totalJobs} jobs created` : "Create your first job",
          icon: Activity,
          color: "text-purple-600"
        },
        {
          title: "Recent Jobs",
          value: jobStats.recentJobs.toString(),
          change: "Last 7 days",
          icon: Calendar,
          color: "text-blue-600"
        },
        {
          title: "System Status",
          value: "Online",
          change: "All systems operational",
          icon: Zap,
          color: "text-green-600"
        },
        {
          title: "Executions",
          value: "Coming Soon",
          change: "Feature in development",
          icon: Cloud,
          color: "text-gray-500"
        }
      ]);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Keep default stats if API fails
      setRecentJobs([]); // Ensure it's always an array
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force navigation even if logout fails
      navigate('/login');
    }
  };

  const handleProfile = () => {
    alert('Profile settings coming soon!');
  };

  const handleSettings = () => {
    alert('Settings page coming soon!');
  };

  const getUserDisplayName = (user: any) => {
    if (!user) return 'User';
    // Try to extract name from email if no name field
    const emailName = user.email?.split('@')[0] || 'User';
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  };

  const getUserInitials = (user: any) => {
    if (!user) return 'U';
    const name = getUserDisplayName(user);
    return name.charAt(0).toUpperCase();
  };

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
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                            <div className="text-left">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Welcome back, {getUserDisplayName(user)}! 👋
                </h2>
                <p className="text-muted-foreground">
                  Here's your cloud optimization dashboard
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              {/* Company field removed - not in User model */}
              
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="mt-4">
              <Button variant="outline" onClick={handleProfile}>
                <User className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                {/* Loading state */}
                {isLoadingStats && (
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded animate-pulse"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest workload optimization activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!Array.isArray(recentJobs) || recentJobs.length === 0 ? (
                <div className="text-center py-8">
                  <Cloud className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first job to see activity here
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/jobs/new')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Job
                  </Button>
                </div>
              ) : (
                recentJobs.slice(0, 5).map((job: any) => {
                  const timeAgo = (dateStr: string) => {
                    const now = new Date();
                    const past = new Date(dateStr);
                    const diffMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
                    
                    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
                    const diffHours = Math.floor(diffMinutes / 60);
                    if (diffHours < 24) return `${diffHours} hours ago`;
                    const diffDays = Math.floor(diffHours / 24);
                    return `${diffDays} days ago`;
                  };

                  return (
                    <div key={job.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Job created: {job.imageUri || 'Custom image'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(job.createdAt)} • Delay tolerance: {job.delayToleranceHours}h
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {job.id.substring(0, 8)}...
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Success Message for Testing */}
        <Card className="mt-8 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  🎉 Login/Signup Test Successful!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  You have successfully logged in to the Veridian dashboard. All authentication flows are working correctly!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
