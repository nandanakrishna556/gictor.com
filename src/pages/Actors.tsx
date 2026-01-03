import { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ActorCard, ActorCardSkeleton } from '@/components/actors/ActorCard';
import CreateActorModal from '@/components/modals/CreateActorModal';
import ConfirmDeleteDialog from '@/components/modals/ConfirmDeleteDialog';
import { useActors } from '@/hooks/useActors';

export default function Actors() {
  const { actors, isLoading, deleteActor } = useActors();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actorToDelete, setActorToDelete] = useState<{ id: string; name: string } | null>(null);

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
              <Button 
                onClick={() => setCreateModalOpen(true)}
                className="gap-2 rounded-lg px-5"
              >
                <Plus className="w-4 h-4" />
                Create Actor
              </Button>
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
              </p>
              <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
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
