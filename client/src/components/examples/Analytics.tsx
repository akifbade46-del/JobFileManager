import Analytics from '../Analytics';

export default function AnalyticsExample() {
  return (
    <Analytics
      onClose={() => console.log('Close analytics')}
    />
  );
}