import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const signupSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Please enter a valid email').max(255, 'Email must be less than 255 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be less than 72 characters'),
});

export default function Signup() {
  const { user, signUpWithEmail, signInWithGoogle, loading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({ fullName, email, password });
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error, needsEmailVerification } = await signUpWithEmail(email, password, fullName);
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Account exists',
            description: 'An account with this email already exists. Try logging in instead.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Signup failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else if (needsEmailVerification) {
        setShowVerificationMessage(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (showVerificationMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
        <Link 
          to="/home" 
          className="absolute top-6 left-6 flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
        <div className="w-full max-w-md animate-fade-in">
          <div className="rounded-2xl bg-card p-8 shadow-elevated text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Check your email</h1>
            <p className="text-lg text-muted-foreground mb-6">
              We've sent a verification link to <span className="text-foreground font-medium">{email}</span>
            </p>
            <p className="text-muted-foreground mb-8">
              Click the link in the email to verify your account and get started.
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="outline" asChild>
                <Link to="/login">Back to Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Link 
        to="/home" 
        className="absolute top-6 left-6 flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      
      <div className="w-full max-w-md animate-fade-in">
        <div className="rounded-2xl bg-card p-8 shadow-elevated">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <Link to="/home" className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="mt-2 text-base text-muted-foreground">
              Start creating studio-quality videos with AI
            </p>
          </div>

          {/* Google OAuth */}
          <Button
            variant="outline"
            className="h-12 w-full justify-center gap-3 rounded-xl border-border text-foreground transition-all hover:bg-secondary mb-6"
            onClick={handleGoogleAuth}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-base text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-base font-medium">
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="h-12 rounded-xl border-border bg-background text-base"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-xl border-border bg-background text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 rounded-xl border-border bg-background text-base"
                required
              />
              <p className="text-sm text-muted-foreground">Minimum 8 characters</p>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-xl font-medium text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-base text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:opacity-80 transition-opacity">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
