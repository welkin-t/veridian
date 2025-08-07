
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { ProtectedRoute, PublicRoute } from '@/components/protected-route';
import { LoginPage, RegisterPage, DashboardPage, JobsPage, NewJobPage, JobDetailPage } from './pages';

function App() {
  return (
    <div className="dark">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Redirect root to dashboard if authenticated, login if not */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Public routes - redirect to dashboard if already authenticated */}
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } />
            
            {/* Protected routes - require authentication */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/jobs" element={
              <ProtectedRoute>
                <JobsPage />
              </ProtectedRoute>
            } />
            <Route path="/jobs/new" element={
              <ProtectedRoute>
                <NewJobPage />
              </ProtectedRoute>
            } />
            <Route path="/jobs/:id" element={
              <ProtectedRoute>
                <JobDetailPage />
              </ProtectedRoute>
            } />
            
            {/* Catch all - redirect to dashboard (will redirect to login if not authenticated) */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
