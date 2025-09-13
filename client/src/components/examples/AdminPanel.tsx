import AdminPanel from '../AdminPanel';

export default function AdminPanelExample() {
  return (
    <AdminPanel
      onClose={() => console.log('Close admin panel')}
    />
  );
}