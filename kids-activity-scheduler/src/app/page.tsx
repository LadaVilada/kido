'use client';

import { useAuthState } from '@/hooks/useAuthState';
import { AuthPage } from '@/components/auth/AuthPage';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuthState();
  const { logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Kids Activity Scheduler</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Welcome to Your Activity Scheduler</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage your children's activities and schedules with ease. 
            Get started by adding your children and their activities.
          </p>
          
          <div className="mt-8 p-8 border rounded-lg bg-muted/50">
            <h3 className="text-xl font-semibold mb-4">Coming Soon</h3>
            <p className="text-muted-foreground">
              Child management, activity scheduling, and calendar views will be available in the next updates.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
