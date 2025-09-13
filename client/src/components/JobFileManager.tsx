import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Eye, Edit, Trash2 } from "lucide-react";

interface JobFile {
  id: string;
  jobFileNo: string;
  shipperName: string;
  consigneeName: string;
  status: 'pending' | 'checked' | 'approved' | 'rejected';
  lastUpdated: string;
  preparedBy: string;
  description?: string;
  totalProfit?: number;
}

interface JobFileManagerProps {
  user: { name: string; role: 'admin' | 'checker' | 'user' };
  onLoadFile: (file: JobFile) => void;
  onPreviewFile: (file: JobFile) => void;
  onDeleteFile?: (file: JobFile) => void;
}

export default function JobFileManager({ user, onLoadFile, onPreviewFile, onDeleteFile }: JobFileManagerProps) {
  // Mock data - todo: replace with real data from API
  const [jobFiles] = useState<JobFile[]>([
    {
      id: '1',
      jobFileNo: 'JF-2024-001',
      shipperName: 'ABC Shipping Co.',
      consigneeName: 'XYZ Logistics',
      status: 'approved',
      lastUpdated: '2024-01-15T10:30:00',
      preparedBy: 'John Smith',
      description: 'Air freight shipment',
      totalProfit: 1250.00
    },
    {
      id: '2',
      jobFileNo: 'JF-2024-002',
      shipperName: 'Global Trade Inc.',
      consigneeName: 'Fast Delivery Ltd.',
      status: 'checked',
      lastUpdated: '2024-01-14T15:45:00',
      preparedBy: 'Jane Doe',
      description: 'Sea freight shipment',
      totalProfit: 890.50
    },
    {
      id: '3',
      jobFileNo: 'JF-2024-003',
      shipperName: 'Express Cargo',
      consigneeName: 'Quick Solutions',
      status: 'pending',
      lastUpdated: '2024-01-13T09:20:00',
      preparedBy: 'Mike Johnson',
      description: 'Land freight shipment',
      totalProfit: 560.25
    },
    {
      id: '4',
      jobFileNo: 'JF-2024-004',
      shipperName: 'Ocean Freight Co.',
      consigneeName: 'Mountain Logistics',
      status: 'rejected',
      lastUpdated: '2024-01-12T14:10:00',
      preparedBy: 'Sarah Wilson',
      description: 'Special handling required',
      totalProfit: -120.00
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('lastUpdated');

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      checked: 'bg-blue-100 text-blue-800 border-blue-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const filteredFiles = jobFiles
    .filter(file => {
      const matchesSearch = 
        file.jobFileNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.shipperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.consigneeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'jobFileNo':
          return a.jobFileNo.localeCompare(b.jobFileNo);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'totalProfit':
          return (b.totalProfit || 0) - (a.totalProfit || 0);
        default: // lastUpdated
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
    });

  const statusCounts = {
    total: jobFiles.length,
    pending: jobFiles.filter(f => f.status === 'pending').length,
    checked: jobFiles.filter(f => f.status === 'checked').length,
    approved: jobFiles.filter(f => f.status === 'approved').length,
    rejected: jobFiles.filter(f => f.status === 'rejected').length
  };

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-2xl font-bold" data-testid="text-total-files">{statusCounts.total}</div>
          <div className="text-sm text-muted-foreground">Total Files</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
          <div className="text-sm text-yellow-700">Pending</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{statusCounts.checked}</div>
          <div className="text-sm text-blue-700">Checked</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
          <div className="text-sm text-green-700">Approved</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
          <div className="text-sm text-red-700">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Job Files Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  data-testid="input-search-files"
                  type="text"
                  placeholder="Search by job file no., shipper, or consignee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter" className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="checked">Checked</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="select-sort-by" className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastUpdated">Last Updated</SelectItem>
                  <SelectItem value="jobFileNo">File Number</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="totalProfit">Profit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Files List */}
      <div className="space-y-3">
        {filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              No job files match the current filters.
            </CardContent>
          </Card>
        ) : (
          filteredFiles.map((file) => (
            <Card key={file.id} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg text-primary" data-testid={`text-job-file-${file.id}`}>
                        {file.jobFileNo}
                      </h3>
                      <Badge 
                        className={getStatusBadge(file.status)}
                        data-testid={`badge-status-${file.id}`}
                      >
                        {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Shipper:</span> {file.shipperName}
                      </div>
                      <div>
                        <span className="font-medium">Consignee:</span> {file.consigneeName}
                      </div>
                      <div>
                        <span className="font-medium">Prepared by:</span> {file.preparedBy}
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span> {new Date(file.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {file.description && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Description:</span> {file.description}
                      </div>
                    )}
                    
                    {file.totalProfit !== undefined && (
                      <div className="text-sm">
                        <span className="font-medium">Total Profit:</span>
                        <span className={`ml-1 font-bold ${
                          file.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${file.totalProfit.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      data-testid={`button-preview-${file.id}`}
                      onClick={() => {
                        console.log('Preview file:', file.jobFileNo);
                        onPreviewFile(file);
                      }}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    
                    <Button
                      data-testid={`button-load-${file.id}`}
                      onClick={() => {
                        console.log('Load file:', file.jobFileNo);
                        onLoadFile(file);
                      }}
                      size="sm"
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Edit className="h-4 w-4" />
                      Load
                    </Button>
                    
                    {user.role === 'admin' && onDeleteFile && (
                      <Button
                        data-testid={`button-delete-${file.id}`}
                        onClick={() => {
                          console.log('Delete file:', file.jobFileNo);
                          onDeleteFile(file);
                        }}
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}