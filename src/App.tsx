import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthForm } from './components/AuthForm';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { Loader2 } from 'lucide-react';

type AppState = 'landing' | 'auth' | 'dashboard';
type UserRole = 'student' | 'teacher' | null;

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { createClient } = await import('./utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // Fetch user profile to get role
        const { projectId } = await import('./utils/supabase/info');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/profile`,
          {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setAccessToken(session.access_token);
          setUserId(session.user.id);
          setUserRole(data.profile.role);
          setAppState('dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
    setLoading(false);
  };

  const handleGetStarted = (role: 'student' | 'teacher') => {
    setSelectedRole(role);
    setAppState('auth');
  };

  const handleAuth = async (token: string, id: string) => {
    setAccessToken(token);
    setUserId(id);
    
    // Fetch user profile to confirm role
    try {
      const { projectId } = await import('./utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/profile`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.profile.role);
        setAppState('dashboard');
      }
    } catch (error) {
      console.error('Error fetching profile after auth:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { createClient } = await import('./utils/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    
    setAccessToken(null);
    setUserId(null);
    setUserRole(null);
    setSelectedRole(null);
    setAppState('landing');
  };

  const handleBack = () => {
    setSelectedRole(null);
    setAppState('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading ResNet...</p>
        </div>
      </div>
    );
  }

  if (appState === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (appState === 'auth' && selectedRole) {
    return (
      <AuthForm
        role={selectedRole}
        onBack={handleBack}
        onAuth={handleAuth}
      />
    );
  }

  if (appState === 'dashboard' && accessToken && userId && userRole) {
    if (userRole === 'teacher') {
      return (
        <TeacherDashboard
          accessToken={accessToken}
          userId={userId}
          onLogout={handleLogout}
        />
      );
    } else {
      return (
        <StudentDashboard
          accessToken={accessToken}
          userId={userId}
          onLogout={handleLogout}
        />
      );
    }
  }

  return null;
}
