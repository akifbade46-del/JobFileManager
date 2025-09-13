import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface JobFileData {
  jobFileNo: string;
  invoiceNo: string;
  billingDate: string;
  salesman: string;
  shipperName: string;
  consigneeName: string;
  mawb: string;
  hawb: string;
  teamsOfShipping: string;
  origin: string;
  noOfPieces: string;
  grossWeight: string;
  destination: string;
  volumeWeight: string;
  description: string;
  carrier: string;
  truckNo: string;
  vesselName: string;
  flightVoyageNo: string;
  containerNo: string;
  remarks: string;
  clearanceTypes: string[];
  productTypes: string[];
  charges: Array<{
    description: string;
    selling: string;
    cost: string;
  }>;
  status: 'pending' | 'checked' | 'approved' | 'rejected';
  rejectionReason?: string;
  preparedBy: string;
  checkedBy?: string;
  approvedBy?: string;
}

interface JobFileFormProps {
  user: { name: string; role: 'admin' | 'checker' | 'user' };
  initialData?: Partial<JobFileData>;
  onSave: (data: JobFileData) => void;
  onCheck?: () => void;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
}

export default function JobFileForm({ user, initialData, onSave, onCheck, onApprove, onReject }: JobFileFormProps) {
  const [formData, setFormData] = useState<JobFileData>({
    jobFileNo: initialData?.jobFileNo || '',
    invoiceNo: initialData?.invoiceNo || '',
    billingDate: initialData?.billingDate || '',
    salesman: initialData?.salesman || '',
    shipperName: initialData?.shipperName || '',
    consigneeName: initialData?.consigneeName || '',
    mawb: initialData?.mawb || '',
    hawb: initialData?.hawb || '',
    teamsOfShipping: initialData?.teamsOfShipping || '',
    origin: initialData?.origin || '',
    noOfPieces: initialData?.noOfPieces || '',
    grossWeight: initialData?.grossWeight || '',
    destination: initialData?.destination || '',
    volumeWeight: initialData?.volumeWeight || '',
    description: initialData?.description || '',
    carrier: initialData?.carrier || '',
    truckNo: initialData?.truckNo || '',
    vesselName: initialData?.vesselName || '',
    flightVoyageNo: initialData?.flightVoyageNo || '',
    containerNo: initialData?.containerNo || '',
    remarks: initialData?.remarks || '',
    clearanceTypes: initialData?.clearanceTypes || [],
    productTypes: initialData?.productTypes || [],
    charges: initialData?.charges || [{ description: '', selling: '', cost: '' }],
    status: initialData?.status || 'pending',
    rejectionReason: initialData?.rejectionReason || '',
    preparedBy: user.name,
    checkedBy: initialData?.checkedBy || '',
    approvedBy: initialData?.approvedBy || ''
  });

  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);

  const updateField = (field: keyof JobFileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleClearanceType = (type: string) => {
    const current = formData.clearanceTypes;
    const updated = current.includes(type) 
      ? current.filter(t => t !== type)
      : [...current, type];
    updateField('clearanceTypes', updated);
  };

  const toggleProductType = (type: string) => {
    const current = formData.productTypes;
    const updated = current.includes(type) 
      ? current.filter(t => t !== type)
      : [...current, type];
    updateField('productTypes', updated);
  };

  const addCharge = () => {
    updateField('charges', [...formData.charges, { description: '', selling: '', cost: '' }]);
  };

  const removeCharge = (index: number) => {
    if (formData.charges.length > 1) {
      const updated = formData.charges.filter((_, i) => i !== index);
      updateField('charges', updated);
    }
  };

  const updateCharge = (index: number, field: 'description' | 'selling' | 'cost', value: string) => {
    const updated = [...formData.charges];
    updated[index] = { ...updated[index], [field]: value };
    updateField('charges', updated);
  };

  const calculateTotals = () => {
    const totalSelling = formData.charges.reduce((sum, charge) => sum + (parseFloat(charge.selling) || 0), 0);
    const totalCost = formData.charges.reduce((sum, charge) => sum + (parseFloat(charge.cost) || 0), 0);
    const totalProfit = totalSelling - totalCost;
    return { totalSelling, totalCost, totalProfit };
  };

  const handleSave = () => {
    console.log('Saving job file:', formData);
    onSave(formData);
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      console.log('Rejecting job file:', rejectionReason);
      onReject?.(rejectionReason);
      setShowRejectionDialog(false);
      setRejectionReason('');
    }
  };

  const { totalSelling, totalCost, totalProfit } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {formData.status === 'rejected' && formData.rejectionReason && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            <strong>This job file was rejected.</strong> Reason: {formData.rejectionReason}
          </AlertDescription>
        </Alert>
      )}
      
      {user.role === 'checker' && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <strong>Note:</strong> Files must be checked before they can be approved or rejected by an admin.
          </AlertDescription>
        </Alert>
      )}

      {/* Job File Number and Service Types */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className="block mb-2 font-semibold">Job File No.:</label>
              <Input
                data-testid="input-job-file-no"
                value={formData.jobFileNo}
                onChange={(e) => updateField('jobFileNo', e.target.value)}
                placeholder="Enter a unique ID here..."
                disabled={!!initialData?.jobFileNo}
              />
            </div>
            <div className="flex space-x-8">
              <div>
                <span className="font-semibold block mb-2">Clearance</span>
                <div className="space-y-2">
                  {['Export', 'Import', 'Clearance', 'Local Move'].map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        data-testid={`checkbox-clearance-${type.toLowerCase().replace(' ', '-')}`}
                        checked={formData.clearanceTypes.includes(type)}
                        onCheckedChange={() => toggleClearanceType(type)}
                      />
                      <label className="text-sm">{type}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-semibold block mb-2">Product Type</span>
                <div className="space-y-2">
                  {['Air Freight', 'Sea Freight', 'Land Freight', 'Others'].map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        data-testid={`checkbox-product-${type.toLowerCase().replace(' ', '-')}`}
                        checked={formData.productTypes.includes(type)}
                        onCheckedChange={() => toggleProductType(type)}
                      />
                      <label className="text-sm">{type}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 font-semibold text-sm">Invoice No.:</label>
              <Input
                data-testid="input-invoice-no"
                value={formData.invoiceNo}
                onChange={(e) => updateField('invoiceNo', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Billing Date:</label>
              <Input
                data-testid="input-billing-date"
                type="date"
                value={formData.billingDate}
                onChange={(e) => updateField('billingDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Salesman:</label>
              <Input
                data-testid="input-salesman"
                value={formData.salesman}
                onChange={(e) => updateField('salesman', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold text-sm">Shipper's Name:</label>
              <Input
                data-testid="input-shipper-name"
                value={formData.shipperName}
                onChange={(e) => updateField('shipperName', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Consignee's Name:</label>
              <Input
                data-testid="input-consignee-name"
                value={formData.consigneeName}
                onChange={(e) => updateField('consigneeName', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Details */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block mb-1 font-semibold text-sm">MAWB / OBL / TCN No.:</label>
              <Input
                data-testid="input-mawb"
                value={formData.mawb}
                onChange={(e) => updateField('mawb', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">HAWB / HBL:</label>
              <Input
                data-testid="input-hawb"
                value={formData.hawb}
                onChange={(e) => updateField('hawb', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Teams of Shipping:</label>
              <Input
                data-testid="input-teams-shipping"
                value={formData.teamsOfShipping}
                onChange={(e) => updateField('teamsOfShipping', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Origin:</label>
              <Input
                data-testid="input-origin"
                value={formData.origin}
                onChange={(e) => updateField('origin', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">No. of Pieces:</label>
              <Input
                data-testid="input-no-pieces"
                value={formData.noOfPieces}
                onChange={(e) => updateField('noOfPieces', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Gross Weight:</label>
              <Input
                data-testid="input-gross-weight"
                value={formData.grossWeight}
                onChange={(e) => updateField('grossWeight', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Destination:</label>
              <Input
                data-testid="input-destination"
                value={formData.destination}
                onChange={(e) => updateField('destination', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Volume Weight:</label>
              <Input
                data-testid="input-volume-weight"
                value={formData.volumeWeight}
                onChange={(e) => updateField('volumeWeight', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block mb-1 font-semibold text-sm">Description:</label>
              <Input
                data-testid="input-description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Carrier / Shipping Line:</label>
              <Input
                data-testid="input-carrier"
                value={formData.carrier}
                onChange={(e) => updateField('carrier', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Truck No. / Driver's Name:</label>
              <Input
                data-testid="input-truck-no"
                value={formData.truckNo}
                onChange={(e) => updateField('truckNo', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Vessel's Name:</label>
              <Input
                data-testid="input-vessel-name"
                value={formData.vesselName}
                onChange={(e) => updateField('vesselName', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Flight / Voyage No.:</label>
              <Input
                data-testid="input-flight-voyage"
                value={formData.flightVoyageNo}
                onChange={(e) => updateField('flightVoyageNo', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Container No.:</label>
              <Input
                data-testid="input-container-no"
                value={formData.containerNo}
                onChange={(e) => updateField('containerNo', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charges */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Charges</CardTitle>
          <Button 
            data-testid="button-add-charge"
            onClick={addCharge} 
            variant="outline"
          >
            + Add Charge
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 font-semibold text-sm">
              <div className="col-span-5">Description</div>
              <div className="col-span-3">Selling Price</div>
              <div className="col-span-3">Cost</div>
              <div className="col-span-1">Action</div>
            </div>
            {formData.charges.map((charge, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Input
                    data-testid={`input-charge-description-${index}`}
                    value={charge.description}
                    onChange={(e) => updateCharge(index, 'description', e.target.value)}
                    placeholder="Charge description"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    data-testid={`input-charge-selling-${index}`}
                    type="number"
                    value={charge.selling}
                    onChange={(e) => updateCharge(index, 'selling', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    data-testid={`input-charge-cost-${index}`}
                    type="number"
                    value={charge.cost}
                    onChange={(e) => updateCharge(index, 'cost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-1">
                  {formData.charges.length > 1 && (
                    <Button
                      data-testid={`button-remove-charge-${index}`}
                      onClick={() => removeCharge(index)}
                      variant="destructive"
                      size="sm"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="grid grid-cols-3 gap-4 text-sm font-semibold">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="text-blue-600">Total Selling</div>
                  <div className="text-lg" data-testid="text-total-selling">
                    ${totalSelling.toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="text-red-600">Total Cost</div>
                  <div className="text-lg" data-testid="text-total-cost">
                    ${totalCost.toFixed(2)}
                  </div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="text-green-600">Total Profit</div>
                  <div className="text-lg" data-testid="text-total-profit">
                    ${totalProfit.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remarks */}
      <Card>
        <CardHeader>
          <CardTitle>Remarks</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            data-testid="textarea-remarks"
            value={formData.remarks}
            onChange={(e) => updateField('remarks', e.target.value)}
            rows={4}
            placeholder="Enter any additional remarks here..."
          />
        </CardContent>
      </Card>

      {/* Approval Section */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <label className="block mb-2 font-semibold">PREPARED BY</label>
              <div className="p-2 bg-muted rounded" data-testid="text-prepared-by">
                {formData.preparedBy}
              </div>
            </div>
            
            <div className="text-center relative">
              <label className="block mb-2 font-semibold">CHECKED BY</label>
              <div className="p-2 bg-muted rounded" data-testid="text-checked-by">
                {formData.checkedBy || 'Pending'}
              </div>
              {formData.status === 'checked' && (
                <Badge className="absolute -top-2 -right-2 bg-blue-500">
                  Checked
                </Badge>
              )}
              {user.role === 'checker' && formData.status === 'pending' && (
                <Button
                  data-testid="button-check-file"
                  onClick={onCheck}
                  className="mt-2 w-full bg-blue-500 hover:bg-blue-600"
                >
                  Check Job File
                </Button>
              )}
            </div>
            
            <div className="text-center relative">
              <label className="block mb-2 font-semibold">APPROVED BY</label>
              <div className="p-2 bg-muted rounded" data-testid="text-approved-by">
                {formData.approvedBy || 'Pending'}
              </div>
              {formData.status === 'approved' && (
                <Badge className="absolute -top-2 -right-2 bg-green-500">
                  Approved
                </Badge>
              )}
              {formData.status === 'rejected' && (
                <Badge className="absolute -top-2 -right-2 bg-red-500">
                  Rejected
                </Badge>
              )}
              {user.role === 'admin' && ['checked', 'pending'].includes(formData.status) && (
                <div className="mt-2 flex gap-2">
                  <Button
                    data-testid="button-approve-file"
                    onClick={onApprove}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    Approve
                  </Button>
                  <Button
                    data-testid="button-reject-file"
                    onClick={() => setShowRejectionDialog(true)}
                    variant="destructive"
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button 
          data-testid="button-save-job-file"
          onClick={handleSave}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          Save Job File
        </Button>
      </div>

      {/* Rejection Dialog */}
      {showRejectionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Job File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold">Rejection Reason:</label>
                <Textarea
                  data-testid="textarea-rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  data-testid="button-cancel-rejection"
                  onClick={() => {
                    setShowRejectionDialog(false);
                    setRejectionReason('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  data-testid="button-confirm-rejection"
                  onClick={handleReject}
                  variant="destructive"
                  disabled={!rejectionReason.trim()}
                >
                  Reject File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}