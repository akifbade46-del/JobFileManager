import JobFileForm from '../JobFileForm';

export default function JobFileFormExample() {
  const mockUser = {
    name: 'John Admin',
    role: 'admin' as const
  };

  const mockData = {
    jobFileNo: 'JF-2024-001',
    shipperName: 'ABC Shipping Co.',
    consigneeName: 'XYZ Logistics',
    status: 'checked' as const,
    charges: [
      { description: 'Air Freight Charges', selling: '1000', cost: '800' },
      { description: 'Documentation Fee', selling: '150', cost: '100' }
    ]
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <JobFileForm
        user={mockUser}
        initialData={mockData}
        onSave={(data) => console.log('Save job file:', data)}
        onCheck={() => console.log('Check job file')}
        onApprove={() => console.log('Approve job file')}
        onReject={(reason) => console.log('Reject job file:', reason)}
      />
    </div>
  );
}