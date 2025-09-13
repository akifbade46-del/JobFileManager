import JobFileManager from '../JobFileManager';

export default function JobFileManagerExample() {
  const mockUser = {
    name: 'John Admin',
    role: 'admin' as const
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <JobFileManager
        user={mockUser}
        onLoadFile={(file) => console.log('Load file:', file)}
        onPreviewFile={(file) => console.log('Preview file:', file)}
        onDeleteFile={(file) => console.log('Delete file:', file)}
      />
    </div>
  );
}