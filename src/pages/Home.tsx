import { useNavigate } from 'react-router-dom';
import { Sparkles, Play, Layers, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';

export default function Home() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="flex h-screen flex-col overflow-y-auto">
        {/* Hero Section */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                <Sparkles className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Create stunning
              <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                UGC videos
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
              Generate professional user-generated content with AI. 
              Create talking head videos, first frames, and scripts in minutes.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/projects')}
                className="group gap-2 rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/projects')}
                className="gap-2 rounded-xl px-8 text-base font-semibold"
              >
                <Play className="h-4 w-4" />
                View Projects
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="border-t bg-secondary/30 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-2xl font-bold text-foreground sm:text-3xl">
              Everything you need to create
            </h2>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="group rounded-2xl border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 transition-colors duration-300 group-hover:bg-blue-200 dark:bg-blue-900/30 dark:group-hover:bg-blue-900/50">
                  <Play className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Talking Head Videos</h3>
                <p className="text-sm text-muted-foreground">
                  Generate realistic talking head videos with AI avatars that speak your script naturally.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group rounded-2xl border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 transition-colors duration-300 group-hover:bg-purple-200 dark:bg-purple-900/30 dark:group-hover:bg-purple-900/50">
                  <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">First Frames</h3>
                <p className="text-sm text-muted-foreground">
                  Create eye-catching thumbnail images and first frames that grab attention.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group rounded-2xl border bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 transition-colors duration-300 group-hover:bg-amber-200 dark:bg-amber-900/30 dark:group-hover:bg-amber-900/50">
                  <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">AI Scripts</h3>
                <p className="text-sm text-muted-foreground">
                  Generate compelling scripts with AI that convert viewers into customers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
