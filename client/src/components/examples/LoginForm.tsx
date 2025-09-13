import LoginForm from '../LoginForm';

export default function LoginFormExample() {
  const handleLogin = (user: any) => {
    console.log('User logged in:', user);
  };

  return <LoginForm onLogin={handleLogin} />;
}