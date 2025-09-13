import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit, Trash2, Building, MapPin } from "lucide-react";

interface Client {
  id: string;
  name: string;
  type: 'shipper' | 'consignee' | 'both';
  address: string;
  contact: string;
  email: string;
  phone: string;
  totalJobs: number;
  lastJobDate: string;
  notes?: string;
}

interface ClientManagerProps {
  onClose: () => void;
  onSelectClient?: (client: Client, type: 'shipper' | 'consignee') => void;
}

export default function ClientManager({ onClose, onSelectClient }: ClientManagerProps) {
  // Mock data - todo: replace with real data from API
  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      name: 'ABC Shipping Co.',
      type: 'shipper',
      address: '123 Port Street, New York, NY 10001',
      contact: 'John Smith',
      email: 'john@abcshipping.com',
      phone: '+1 (555) 123-4567',
      totalJobs: 24,
      lastJobDate: '2024-01-15',
      notes: 'Preferred shipper for air freight'
    },
    {
      id: '2',
      name: 'XYZ Logistics',
      type: 'consignee',
      address: '456 Commerce Ave, Los Angeles, CA 90021',
      contact: 'Jane Doe',
      email: 'jane@xyzlogistics.com',
      phone: '+1 (555) 987-6543',
      totalJobs: 18,
      lastJobDate: '2024-01-12',
      notes: 'Reliable delivery partner'
    },
    {
      id: '3',
      name: 'Global Trade Inc.',
      type: 'both',
      address: '789 International Blvd, Miami, FL 33101',
      contact: 'Mike Johnson',
      email: 'mike@globaltrade.com',
      phone: '+1 (555) 555-0123',
      totalJobs: 31,
      lastJobDate: '2024-01-14',
      notes: 'Handles both shipping and receiving'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    type: 'both',
    address: '',
    contact: '',
    email: '',
    phone: '',
    notes: ''
  });

  const getTypeBadge = (type: string) => {
    const styles = {
      shipper: 'bg-blue-100 text-blue-800 border-blue-300',
      consignee: 'bg-green-100 text-green-800 border-green-300',
      both: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const filteredClients = clients
    .filter(client => {
      const matchesSearch = 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || client.type === typeFilter || client.type === 'both';
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.lastJobDate).getTime() - new Date(a.lastJobDate).getTime());

  const handleSaveClient = () => {
    if (!newClient.name || !newClient.contact) return;

    if (editingClient) {
      // Update existing client
      setClients(prev => prev.map(client => 
        client.id === editingClient.id 
          ? { ...client, ...newClient } as Client
          : client
      ));
      console.log('Updated client:', editingClient.id);
    } else {
      // Add new client
      const client: Client = {
        id: Date.now().toString(),
        name: newClient.name!,
        type: newClient.type as 'shipper' | 'consignee' | 'both',
        address: newClient.address || '',
        contact: newClient.contact!,
        email: newClient.email || '',
        phone: newClient.phone || '',
        totalJobs: 0,
        lastJobDate: '',
        notes: newClient.notes || ''
      };
      setClients(prev => [...prev, client]);
      console.log('Added new client:', client.name);
    }

    // Reset form
    setNewClient({
      name: '',
      type: 'both',
      address: '',
      contact: '',
      email: '',
      phone: '',
      notes: ''
    });
    setIsAddingClient(false);
    setEditingClient(null);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setNewClient({ ...client });
    setIsAddingClient(true);
  };

  const handleDeleteClient = (clientId: string) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
    console.log('Deleted client:', clientId);
  };

  const totalClients = clients.length;
  const shippers = clients.filter(c => c.type === 'shipper' || c.type === 'both').length;
  const consignees = clients.filter(c => c.type === 'consignee' || c.type === 'both').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Client Manager</h1>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
              <DialogTrigger asChild>
                <Button 
                  data-testid="button-add-client"
                  className="gap-2"
                  onClick={() => {
                    setEditingClient(null);
                    setNewClient({
                      name: '',
                      type: 'both',
                      address: '',
                      contact: '',
                      email: '',
                      phone: '',
                      notes: ''
                    });
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingClient ? 'Edit Client' : 'Add New Client'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="md:col-span-2">
                    <label className="block mb-2 font-semibold text-sm">Company Name *</label>
                    <Input
                      data-testid="input-client-name"
                      value={newClient.name || ''}
                      onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 font-semibold text-sm">Client Type</label>
                    <Select 
                      value={newClient.type || 'both'} 
                      onValueChange={(value) => setNewClient(prev => ({ ...prev, type: value as 'shipper' | 'consignee' | 'both' }))}
                    >
                      <SelectTrigger data-testid="select-client-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shipper">Shipper Only</SelectItem>
                        <SelectItem value="consignee">Consignee Only</SelectItem>
                        <SelectItem value="both">Both (Shipper & Consignee)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 font-semibold text-sm">Contact Person *</label>
                    <Input
                      data-testid="input-client-contact"
                      value={newClient.contact || ''}
                      onChange={(e) => setNewClient(prev => ({ ...prev, contact: e.target.value }))}
                      placeholder="Contact person name"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 font-semibold text-sm">Email</label>
                    <Input
                      data-testid="input-client-email"
                      type="email"
                      value={newClient.email || ''}
                      onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@company.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 font-semibold text-sm">Phone</label>
                    <Input
                      data-testid="input-client-phone"
                      value={newClient.phone || ''}
                      onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block mb-2 font-semibold text-sm">Address</label>
                    <Textarea
                      data-testid="textarea-client-address"
                      value={newClient.address || ''}
                      onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Full company address"
                      rows={2}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block mb-2 font-semibold text-sm">Notes</label>
                    <Textarea
                      data-testid="textarea-client-notes"
                      value={newClient.notes || ''}
                      onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this client"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button 
                    data-testid="button-cancel-client"
                    variant="outline" 
                    onClick={() => {
                      setIsAddingClient(false);
                      setEditingClient(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    data-testid="button-save-client"
                    onClick={handleSaveClient}
                    disabled={!newClient.name || !newClient.contact}
                  >
                    {editingClient ? 'Update Client' : 'Add Client'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              data-testid="button-close-client-manager"
              onClick={onClose}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                  <p className="text-3xl font-bold" data-testid="text-total-clients">
                    {totalClients}
                  </p>
                </div>
                <Building className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Shippers</p>
                  <p className="text-3xl font-bold text-blue-600" data-testid="text-total-shippers">
                    {shippers}
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Consignees</p>
                  <p className="text-3xl font-bold text-green-600" data-testid="text-total-consignees">
                    {consignees}
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  data-testid="input-search-clients"
                  type="text"
                  placeholder="Search clients by name, contact, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-type-filter" className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="shipper">Shippers</SelectItem>
                  <SelectItem value="consignee">Consignees</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                No clients match the current filters.
              </CardContent>
            </Card>
          ) : (
            filteredClients.map((client) => (
              <Card key={client.id} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-lg text-primary" data-testid={`text-client-name-${client.id}`}>
                          {client.name}
                        </h3>
                        <Badge 
                          className={getTypeBadge(client.type)}
                          data-testid={`badge-type-${client.id}`}
                        >
                          {client.type === 'both' ? 'Shipper & Consignee' : client.type.charAt(0).toUpperCase() + client.type.slice(1)}
                        </Badge>
                        {client.totalJobs > 0 && (
                          <Badge variant="outline">
                            {client.totalJobs} jobs
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Contact:</span> {client.contact}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {client.email || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {client.phone || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Last Job:</span> {client.lastJobDate ? new Date(client.lastJobDate).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      
                      {client.address && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Address:</span> {client.address}
                        </div>
                      )}
                      
                      {client.notes && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Notes:</span> {client.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {onSelectClient && (
                        <div className="flex gap-1">
                          {(client.type === 'shipper' || client.type === 'both') && (
                            <Button
                              data-testid={`button-select-shipper-${client.id}`}
                              onClick={() => onSelectClient(client, 'shipper')}
                              variant="outline"
                              size="sm"
                            >
                              Use as Shipper
                            </Button>
                          )}
                          {(client.type === 'consignee' || client.type === 'both') && (
                            <Button
                              data-testid={`button-select-consignee-${client.id}`}
                              onClick={() => onSelectClient(client, 'consignee')}
                              variant="outline"
                              size="sm"
                            >
                              Use as Consignee
                            </Button>
                          )}
                        </div>
                      )}
                      
                      <Button
                        data-testid={`button-edit-${client.id}`}
                        onClick={() => handleEditClient(client)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      
                      <Button
                        data-testid={`button-delete-${client.id}`}
                        onClick={() => handleDeleteClient(client.id)}
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}