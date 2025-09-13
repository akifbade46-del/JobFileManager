import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface User {
  name: string;
  role: 'admin' | 'checker' | 'user';
}

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onOpenAnalytics: () => void;
  onOpenAdminPanel?: () => void;
  onOpenActivityLog?: () => void;
}

export default function Header({ user, onLogout, onOpenAnalytics, onOpenAdminPanel, onOpenActivityLog }: HeaderProps) {
  return (
    <div className="space-y-6">
      {/* Main Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <div className="text-3xl font-bold mr-4">
            <span className="text-[#0E639C]">Q'go</span>
            <span className="text-[#4FB8AF]">Cargo</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground border-l-4 border-border pl-4">
            JOB FILE
          </h1>
        </div>
        
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label htmlFor="date" className="font-semibold text-sm">
              Date:
            </label>
            <Input 
              data-testid="input-date"
              type="date" 
              id="date" 
              className="w-full sm:w-40" 
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="po-number" className="font-semibold text-sm">
              P.O. #:
            </label>
            <Input 
              data-testid="input-po-number"
              type="text" 
              id="po-number" 
              className="w-full sm:w-40" 
              placeholder="Enter P.O. Number"
            />
          </div>
        </div>
      </header>
      
      {/* User Info and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2 bg-muted/50 p-3 rounded-md">
        <div className="text-sm text-center sm:text-left">
          Logged in as: 
          <span className="font-bold text-primary ml-1" data-testid="text-user-name">
            {user.name}
          </span>
          <Badge variant="outline" className="ml-2 capitalize" data-testid="badge-user-role">
            {user.role}
          </Badge>
        </div>
        
        <div className="flex-grow text-center">
          <Button 
            data-testid="button-analytics"
            onClick={onOpenAnalytics}
            className="bg-[#0d9488] hover:bg-[#0f766e]" 
            size="lg"
          >
            Analytics
          </Button>
        </div>
        
        <div className="flex gap-2">
          {user.role === 'admin' && (
            <>
              <Button 
                data-testid="button-activity-log"
                onClick={onOpenActivityLog}
                variant="outline"
                size="sm"
              >
                Activity Log
              </Button>
              <Button 
                data-testid="button-admin-panel"
                onClick={onOpenAdminPanel}
                className="bg-yellow-500 hover:bg-yellow-600"
                size="sm"
              >
                Admin Panel
              </Button>
            </>
          )}
          <Button 
            data-testid="button-logout"
            onClick={onLogout}
            variant="destructive"
            size="sm"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}