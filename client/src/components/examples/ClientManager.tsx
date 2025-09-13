import ClientManager from '../ClientManager';

export default function ClientManagerExample() {
  return (
    <ClientManager
      onClose={() => console.log('Close client manager')}
      onSelectClient={(client, type) => console.log('Select client:', client.name, 'as', type)}
    />
  );
}