import { useState } from 'react';
import { Plus, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ActorCard, ActorCardSkeleton } from '@/components/actors/ActorCard';
import CreateActorModal from '@/components/modals/CreateActorModal';
import ConfirmDeleteDialog from '@/components/modals/ConfirmDeleteDialog';
import { useActors } from '@/hooks/useActors';
import { useProfile } from '@/hooks/useProfile';
import { getActorLimit } from '@/constants/planLimits';
import { toast } from 'sonner';

export default function Actors() {
  const { actors, isLoading, deleteActor } = useActors();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actorToDelete, setActorToDelete] = useState<{ id: string; name: string } | null>(null);

  const actorLimit = getActorLimit(profile?.plan);
  const actorCount = actors?.length ?? 0;
  const canCreateActor = actorLimit > 0 && actorCount < actorLimit;

  const handleCreateClick = () => {
    if (actorLimit === 0) {
      toast.error('No active plan', {
        description: 'Subscribe to a plan to create actors.',
        action: { label: 'View Plans', onClick: () => navigate('/billing') },
      });
      return;
    }
    if (!canCreateActor) {
      toast.error('Actor limit reached', {
        description: `Your ${profile?.plan} plan allows ${actorLimit} active actors. Delete an actor or upgrade your plan.`,
        action: { label: 'Upgrade', onClick: () => navigate('/billing') },
      });
      return;
    }
    setCreateModalOpen(true);
  };

  const handleDeleteClick = (actorId: string) => {
    const actor = actors?.find((a) => a.id === actorId);
    if (actor) {
      setActorToDelete({ id: actor.id, name: actor.name });
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (actorToDelete) {
      await deleteActor(actorToDelete.id);
      setDeleteDialogOpen(false);
      setActorToDelete(null);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border/40">
          <div className="px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Actors</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Create and manage your AI actors
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Actor count badge */}
                <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {actorCount}{actorLimit > 0 ? ` / ${actorLimit}` : ''} active actors
                  </span>
                </div>
                <Button 
                  onClick={handleCreateClick}
                  className="gap-2 rounded-lg px-5"
                >
                  <Plus className="w-4 h-4" />
                  Create Actor
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 lg:px-8 py-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
              {Array.from({ length: 14 }).map((_, i) => (
                <ActorCardSkeleton key={i} />
              ))}
            </div>
          ) : !actors || actors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <UserPlus className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h2 className="text-lg font-medium text-foreground mb-1">No actors yet</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Create your first AI actor to get started
                {actorLimit > 0 && ` — your plan allows up to ${actorLimit} active actors`}
              </p>
              <Button onClick={handleCreateClick} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Actor
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
              {actors.map((actor) => (
                <ActorCard key={actor.id} actor={actor} onDelete={handleDeleteClick} />
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        <CreateActorModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
        />

        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          title="Delete Actor"
          description="Are you sure you want to delete this actor? This action cannot be undone."
          itemName={actorToDelete?.name}
        />
      </div>
    </MainLayout>
  );
}
