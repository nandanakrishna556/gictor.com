import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Video, 
  Mic, 
  Image, 
  FileText, 
  ArrowRight, 
  Check,
  Zap,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CREDIT_PACKAGES, CREDIT_COSTS } from '@/constants/creditPackages';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface WelcomeOnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const GENERATION_TYPES = [
  {
    icon: Video,
    name: 'Lip Sync Videos',
    cost: `${CREDIT_COSTS.lip_sync_per_second} credits/sec`,
    description: 'Create talking head videos with synced lip movements',
  },
  {
    icon: Image,
    name: 'AI Images',
    cost: `${CREDIT_COSTS.frame_per_generation} credits each`,
    description: 'Generate stunning first frames and thumbnails',
  },
  {
    icon: Mic,
    name: 'Text to Speech',
    cost: `${CREDIT_COSTS.speech_per_1000_chars} credits/1K chars`,
    description: 'Convert scripts to natural-sounding voiceovers',
  },
  {
    icon: FileText,
    name: 'AI Scripts',
    cost: `${CREDIT_COSTS.script_per_generation} credits each`,
    description: 'Generate engaging video scripts with AI',
  },
];

// Starter package is the 10 credits package
const STARTER_PACKAGE = CREDIT_PACKAGES[0];

export default function WelcomeOnboardingModal({ open, onClose }: WelcomeOnboardingModalProps) {
  const [step, setStep] = useState<'welcome' | 'credits' | 'offer'>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { updateProfile } = useProfile();

  const handleContinue = () => {
    if (step === 'welcome') {
      setStep('credits');
    } else if (step === 'credits') {
      setStep('offer');
    }
  };

  const handleSkip = async () => {
    try {
      await updateProfile({ onboarding_completed: true } as any);
      onClose();
    } catch (error) {
      console.error('Failed to update onboarding status:', error);
      onClose();
    }
  };

  const handleGetStarterPack = async () => {
    setIsLoading(true);
    try {
      // Mark onboarding as completed first
      await updateProfile({ onboarding_completed: true } as any);
      
      // Navigate to billing with the starter package pre-selected
      onClose();
      navigate('/billing?package=10');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAllPackages = async () => {
    try {
      await updateProfile({ onboarding_completed: true } as any);
      onClose();
      navigate('/billing');
    } catch (error) {
      console.error('Failed to update onboarding status:', error);
      onClose();
      navigate('/billing');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg md:max-w-2xl p-0 gap-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {step === 'welcome' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Welcome to PromptGeist! 🎬
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
                Create stunning AI-generated videos, images, and voiceovers in minutes.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: Video, text: 'Talking Head Videos' },
                { icon: Image, text: 'AI Image Generation' },
                { icon: Mic, text: 'Natural Voiceovers' },
                { icon: FileText, text: 'AI Script Writing' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            <Button 
              className="w-full h-12 text-base"
              onClick={handleContinue}
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 'credits' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-2">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                How Credits Work
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Credits are the currency for generating content. Different tasks use different amounts.
              </p>
            </div>

            <div className="space-y-3">
              {GENERATION_TYPES.map((type, i) => (
                <div 
                  key={i} 
                  className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <type.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">{type.name}</span>
                      <Badge variant="secondary" className="text-xs font-medium shrink-0">
                        {type.cost}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleSkip}
              >
                Skip for now
              </Button>
              <Button 
                className="flex-1"
                onClick={handleContinue}
              >
                See Pricing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'offer' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-2">
                <CreditCard className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Start Creating Today
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Get your first credits and start generating amazing content.
              </p>
            </div>

            <Card className="border-2 border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                STARTER PACK
              </div>
              <CardContent className="p-6 pt-8">
                <div className="text-center space-y-4">
                  <div>
                    <div className="text-4xl font-bold text-foreground">
                      {STARTER_PACKAGE.credits} Credits
                    </div>
                    <div className="text-muted-foreground mt-1">
                      Perfect to explore all features
                    </div>
                  </div>
                  
                  <div className="text-3xl font-bold text-primary">
                    ${STARTER_PACKAGE.price}
                  </div>

                  <div className="space-y-2 text-sm text-left max-w-xs mx-auto">
                    {[
                      '~2-3 lip sync videos',
                      '~40 AI-generated images',
                      '~40 AI scripts',
                      'Full platform access',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full h-12 text-base"
                    onClick={handleGetStarterPack}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Get Starter Pack'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleSkip}
              >
                I'll buy later
              </Button>
              <Button 
                variant="ghost" 
                className="flex-1"
                onClick={handleViewAllPackages}
              >
                View all packages
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}