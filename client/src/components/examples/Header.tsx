import Header from '../Header';

export default function HeaderExample() {
  const mockUser = {
    name: 'John Admin',
    role: 'admin' as const
  };

  return (
    <Header
      user={mockUser}
      onLogout={() => console.log('Logout clicked')}
      onOpenAnalytics={() => console.log('Analytics clicked')}
      onOpenAdminPanel={() => console.log('Admin panel clicked')}
      onOpenActivityLog={() => console.log('Activity log clicked')}
    />
  );
}