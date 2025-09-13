import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/LoginForm";
import Header from "@/components/Header";
import JobFileForm from "@/components/JobFileForm";
import JobFileManager from "@/components/JobFileManager";
import Analytics from "@/components/Analytics";
import AdminPanel from "@/components/AdminPanel";
import ClientManager from "@/components/ClientManager";
import { FileText, Users, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'checker' | 'user';
  status: 'active' | 'pending' | 'blocked';
}

type View = 'jobform' | 'filemanager' | 'analytics' | 'adminpanel' | 'clientmanager';

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('jobform');
  const [currentJobFile, setCurrentJobFile] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication status on app load
  const { data: authData, error: authError, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/auth/me');
        if (response.ok) {
          return response.json();
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Set user from authentication check
  useEffect(() => {
    if (!isLoading) {
      setIsCheckingAuth(false);
      if (authData?.user) {
        setUser(authData.user);
      }
    }
  }, [authData, isLoading]);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
      return response.ok;
    },
    onSuccess: () => {
      console.log('User logged out');
      setUser(null);
      setCurrentView('jobform');
      setCurrentJobFile(null);
      queryClient.clear(); // Clear all cached queries
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      setUser(null);
      setCurrentView('jobform');
      setCurrentJobFile(null);
      queryClient.clear();
    }
  });

  const handleLogin = (userData: User) => {
    console.log('User logged in:', userData);
    setUser(userData);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleLoadJobFile = (file: any) => {
    console.log('Loading job file:', file.jobFileNo);
    setCurrentJobFile(file);
    setCurrentView('jobform');
  };

  const handleSaveJobFile = (data: any) => {
    console.log('Saving job file:', data.jobFileNo);
    // todo: implement API call to save job file
  };

  const handleCheckJobFile = () => {
    console.log('Checking job file');
    // todo: implement job file checking logic
  };

  const handleApproveJobFile = () => {
    console.log('Approving job file');
    // todo: implement job file approval logic
  };

  const handleRejectJobFile = (reason: string) => {
    console.log('Rejecting job file:', reason);
    // todo: implement job file rejection logic
  };

  const handlePreviewJobFile = (file: any) => {
    console.log('Previewing job file:', file.jobFileNo);
    // todo: implement job file preview modal
  };

  const handleDeleteJobFile = (file: any) => {
    console.log('Deleting job file:', file.jobFileNo);
    // todo: implement job file deletion
  };

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
          <div className="text-sm text-muted-foreground mt-2">Checking authentication</div>
        </div>
      </div>
    );
  }

  // Show login form if no user is logged in
  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Main application views
  const renderCurrentView = () => {
    switch (currentView) {
      case 'filemanager':
        return (
          <JobFileManager
            user={user}
            onLoadFile={handleLoadJobFile}
            onPreviewFile={handlePreviewJobFile}
            onDeleteFile={user.role === 'admin' ? handleDeleteJobFile : undefined}
          />
        );
      
      case 'analytics':
        return (
          <Analytics
            onClose={() => setCurrentView('jobform')}
          />
        );
      
      case 'adminpanel':
        return user.role === 'admin' ? (
          <AdminPanel
            onClose={() => setCurrentView('jobform')}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
          </div>
        );
      
      case 'clientmanager':
        return (
          <ClientManager
            onClose={() => setCurrentView('jobform')}
            onSelectClient={(client, type) => {
              console.log('Selected client:', client.name, 'as', type);
              // todo: populate job file form with selected client
              setCurrentView('jobform');
            }}
          />
        );
      
      default: // 'jobform'
        return (
          <div className="max-w-6xl mx-auto p-4 space-y-6">
            <Header
              user={user}
              onLogout={handleLogout}
              onOpenAnalytics={() => setCurrentView('analytics')}
              onOpenAdminPanel={user.role === 'admin' ? () => setCurrentView('adminpanel') : undefined}
              onOpenActivityLog={() => console.log('Open activity log - todo: implement')}
            />
            
            {/* Quick Actions */}
            <div className="flex justify-center gap-4 mb-8">
              <Button
                data-testid="button-open-clients"
                onClick={() => setCurrentView('clientmanager')}
                className="bg-cyan-600 hover:bg-cyan-700 gap-2"
                size="lg"
              >
                <Users className="h-5 w-5" />
                Manage Clients
              </Button>
              
              <Button
                data-testid="button-open-file-manager"
                onClick={() => setCurrentView('filemanager')}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
                size="lg"
              >
                <FileText className="h-5 w-5" />
                Browse Files
              </Button>
              
              <Button
                data-testid="button-open-analytics-quick"
                onClick={() => setCurrentView('analytics')}
                className="bg-teal-600 hover:bg-teal-700 gap-2"
                size="lg"
              >
                <BarChart3 className="h-5 w-5" />
                View Analytics
              </Button>
            </div>
            
            <JobFileForm
              user={user}
              initialData={currentJobFile}
              onSave={handleSaveJobFile}
              onCheck={user.role === 'checker' ? handleCheckJobFile : undefined}
              onApprove={user.role === 'admin' ? handleApproveJobFile : undefined}
              onReject={user.role === 'admin' ? handleRejectJobFile : undefined}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentView()}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
