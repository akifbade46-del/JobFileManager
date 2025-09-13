import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface LoginFormProps {
  onLogin: (user: { email: string; name: string; role: 'admin' | 'checker' | 'user' }) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showApprovalMessage, setShowApprovalMessage] = useState(false);
  const [showBlockedMessage, setShowBlockedMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(isSignup ? 'Signup submitted' : 'Login submitted', { email, password, name });
    
    // Mock login logic - todo: replace with real authentication
    if (email.includes('admin')) {
      onLogin({ email, name: name || 'Admin User', role: 'admin' });
    } else if (email.includes('checker')) {
      onLogin({ email, name: name || 'Checker User', role: 'checker' });
    } else {
      onLogin({ email, name: name || 'Regular User', role: 'user' });
    }
  };

  const toggleAuthMode = () => {
    setIsSignup(!isSignup);
    setShowApprovalMessage(false);
    setShowBlockedMessage(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md space-y-8">
        <CardHeader className="text-center">
          <div className="text-5xl font-extrabold mb-4">
            <span className="text-[#0E639C]">Q'go</span>
            <span className="text-[#4FB8AF]">Cargo</span>
          </div>
          <CardTitle className="text-3xl font-extrabold">
            {isSignup ? 'Create your account' : 'Sign in to your account'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {showApprovalMessage && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                Your account is awaiting admin approval.
              </AlertDescription>
            </Alert>
          )}
          
          {showBlockedMessage && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                Your account has been blocked by an administrator.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <Input
                data-testid="input-name"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-t-md"
              />
            )}
            
            <Input
              data-testid="input-email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input
              data-testid="input-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-b-md"
            />
            
            <Button 
              data-testid="button-auth"
              type="submit" 
              className="w-full"
              size="lg"
            >
              {isSignup ? 'Sign up' : 'Sign in'}
            </Button>
          </form>
          
          <div className="text-center space-y-2">
            <button
              data-testid="button-toggle-auth"
              type="button"
              onClick={toggleAuthMode}
              className="font-medium text-primary hover:text-primary/90"
            >
              {isSignup ? 'Already have an account? Sign in' : 'Create a new account'}
            </button>
            
            {!isSignup && (
              <div>
                <button
                  data-testid="button-forgot-password"
                  type="button"
                  onClick={() => console.log('Forgot password clicked')}
                  className="font-medium text-primary hover:text-primary/90 text-sm"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </div>
          
          {/* Demo badges for testing different roles */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Demo: Use these emails to test different roles:</p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">admin@test.com (Admin)</Badge>
              <Badge variant="outline" className="text-xs">checker@test.com (Checker)</Badge>
              <Badge variant="outline" className="text-xs">user@test.com (User)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}