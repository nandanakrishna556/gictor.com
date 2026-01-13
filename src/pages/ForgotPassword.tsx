import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ArrowLeft, Mail } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().trim().email('Please enter a valid email');

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = emailSchema.safeParse(email);
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
      const { error } = await resetPassword(email);
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setShowSuccessMessage(true);
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

  if (showSuccessMessage) {
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
              We've sent a password reset link to <span className="text-foreground font-medium">{email}</span>
            </p>
            <p className="text-muted-foreground mb-8">
              Click the link in the email to reset your password.
            </p>
            <Button variant="outline" asChild className="w-full h-12 rounded-xl text-base">
              <Link to="/login">Back to Login</Link>
            </Button>
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
            <h1 className="text-2xl font-bold text-foreground">Forgot password?</h1>
            <p className="mt-2 text-base text-muted-foreground text-center">
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button
              type="submit"
              className="h-12 w-full rounded-xl font-medium text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-base text-muted-foreground">
            Remember your password?{' '}
            <Link to="/login" className="font-medium text-primary hover:opacity-80 transition-opacity">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
