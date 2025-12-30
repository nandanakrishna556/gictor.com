import { Link } from 'react-router-dom';
import { ArrowLeft, UserCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';

export default function Actors() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <UserCircle className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Actors</h1>
          <p className="text-muted-foreground max-w-md">
            Manage your AI actors and avatars. This feature is coming soon.
          </p>
        </div>
        <Button variant="secondary" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" strokeWidth={1.5} />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </MainLayout>
  );
}
