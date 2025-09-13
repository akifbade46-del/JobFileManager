import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Upload, Download, UserPlus, Shield, Trash2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'checker' | 'user';
  status: 'active' | 'pending' | 'blocked';
  joinDate: string;
}

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  // Mock data - todo: replace with real data from API
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Admin',
      email: 'admin@qgocargo.com',
      role: 'admin',
      status: 'active',
      joinDate: '2023-01-15'
    },
    {
      id: '2',
      name: 'Jane Checker',
      email: 'checker@qgocargo.com',
      role: 'checker',
      status: 'active',
      joinDate: '2023-02-20'
    },
    {
      id: '3',
      name: 'Mike User',
      email: 'user@qgocargo.com',
      role: 'user',
      status: 'active',
      joinDate: '2023-03-10'
    },
    {
      id: '4',
      name: 'Sarah Pending',
      email: 'pending@qgocargo.com',
      role: 'user',
      status: 'pending',
      joinDate: '2024-01-15'
    }
  ]);

  const [uploadStatus, setUploadStatus] = useState<{
    type?: 'success' | 'error';
    message?: string;
  }>({});

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-red-100 text-red-800 border-red-300',
      checker: 'bg-blue-100 text-blue-800 border-blue-300',
      user: 'bg-green-100 text-green-800 border-green-300'
    };
    return styles[role as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      blocked: 'bg-red-100 text-red-800 border-red-300'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const handleUserStatusChange = (userId: string, newStatus: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: newStatus as 'active' | 'pending' | 'blocked' }
        : user
    ));
    console.log('User status changed:', { userId, newStatus });
  };

  const handleUserRoleChange = (userId: string, newRole: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, role: newRole as 'admin' | 'checker' | 'user' }
        : user
    ));
    console.log('User role changed:', { userId, newRole });
  };

  const handleDataUpload = async (type: 'users' | 'jobfiles' | 'clients', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(`Uploading ${type} data:`, file.name);
    setUploadStatus({ type: 'success', message: `${type} data upload started...` });

    // Mock upload process - todo: replace with real file upload
    setTimeout(() => {
      setUploadStatus({ 
        type: 'success', 
        message: `Successfully uploaded ${type} data from ${file.name}. ${Math.floor(Math.random() * 100) + 50} records processed.` 
      });
      // Reset file input
      event.target.value = '';
    }, 2000);
  };

  const handleDataExport = (type: 'users' | 'jobfiles' | 'clients') => {
    console.log(`Exporting ${type} data`);
    setUploadStatus({ 
      type: 'success', 
      message: `${type} data export started. Download will begin shortly...` 
    });
    
    // Mock export process - todo: replace with real data export
    setTimeout(() => {
      setUploadStatus({ 
        type: 'success', 
        message: `Successfully exported ${type} data. Check your downloads folder.` 
      });
    }, 1500);
  };

  const pendingUsersCount = users.filter(u => u.status === 'pending').length;
  const activeUsersCount = users.filter(u => u.status === 'active').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            {pendingUsersCount > 0 && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                {pendingUsersCount} Pending
              </Badge>
            )}
          </div>
          
          <Button 
            data-testid="button-close-admin-panel"
            onClick={onClose}
            variant="outline"
          >
            Back to Main
          </Button>
        </div>

        {/* Status Alert */}
        {uploadStatus.message && (
          <Alert className={uploadStatus.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <AlertDescription className={uploadStatus.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {uploadStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold" data-testid="text-total-users">
                    {users.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-3xl font-bold text-green-600" data-testid="text-active-users">
                    {activeUsersCount}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                  <p className="text-3xl font-bold text-yellow-600" data-testid="text-pending-users">
                    {pendingUsersCount}
                  </p>
                </div>
                <UserPlus className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" data-testid="tab-user-management">
              User Management
            </TabsTrigger>
            <TabsTrigger value="data" data-testid="tab-data-management">
              Data Management
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 border rounded-lg">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold" data-testid={`text-user-name-${user.id}`}>
                            {user.name}
                          </h3>
                          <Badge 
                            className={getRoleBadge(user.role)}
                            data-testid={`badge-role-${user.id}`}
                          >
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                          <Badge 
                            className={getStatusBadge(user.status)}
                            data-testid={`badge-status-${user.id}`}
                          >
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Email:</span> {user.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Joined:</span> {new Date(user.joinDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select 
                          value={user.role} 
                          onValueChange={(value) => handleUserRoleChange(user.id, value)}
                        >
                          <SelectTrigger data-testid={`select-role-${user.id}`} className="w-32">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="checker">Checker</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select 
                          value={user.status} 
                          onValueChange={(value) => handleUserStatusChange(user.id, value)}
                        >
                          <SelectTrigger data-testid={`select-status-${user.id}`} className="w-32">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          data-testid={`button-delete-user-${user.id}`}
                          onClick={() => {
                            console.log('Delete user:', user.email);
                            setUsers(prev => prev.filter(u => u.id !== user.id));
                          }}
                          variant="destructive"
                          size="sm"
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Data Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Data Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload CSV/JSON files to restore data from your Hostinger backup.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="font-medium text-sm min-w-24">User Data:</label>
                      <Input
                        data-testid="input-upload-users"
                        type="file"
                        accept=".csv,.json"
                        onChange={(e) => handleDataUpload('users', e)}
                        className="flex-1"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <label className="font-medium text-sm min-w-24">Job Files:</label>
                      <Input
                        data-testid="input-upload-jobfiles"
                        type="file"
                        accept=".csv,.json"
                        onChange={(e) => handleDataUpload('jobfiles', e)}
                        className="flex-1"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <label className="font-medium text-sm min-w-24">Client Data:</label>
                      <Input
                        data-testid="input-upload-clients"
                        type="file"
                        accept=".csv,.json"
                        onChange={(e) => handleDataUpload('clients', e)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertDescription className="text-blue-800 text-sm">
                      <strong>Supported formats:</strong> CSV and JSON files. 
                      Data will be automatically validated and imported.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
              
              {/* Data Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Data Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Export data for backup to your Hostinger hosting.
                  </p>
                  
                  <div className="space-y-3">
                    <Button
                      data-testid="button-export-users"
                      onClick={() => handleDataExport('users')}
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export User Data
                    </Button>
                    
                    <Button
                      data-testid="button-export-jobfiles"
                      onClick={() => handleDataExport('jobfiles')}
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Job Files Data
                    </Button>
                    
                    <Button
                      data-testid="button-export-clients"
                      onClick={() => handleDataExport('clients')}
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export Client Data
                    </Button>
                  </div>
                  
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800 text-sm">
                      <strong>Export format:</strong> Data will be exported as JSON files 
                      compatible with your Hostinger backup system.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}