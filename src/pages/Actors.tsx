import { useState } from 'react';
import { Plus, UserCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useActors } from '@/hooks/useActors';
import { ActorCard, ActorCardSkeleton } from '@/components/actors/ActorCard';
import CreateActorModal from '@/components/modals/CreateActorModal';
import ConfirmDeleteDialog from '@/components/modals/ConfirmDeleteDialog';

export default function Actors() {
  const { actors, isLoading, createActor, deleteActor, isCreating } = useActors();
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Actors</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage your AI actors
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Actor
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ActorCardSkeleton key={i} />
            ))}
          </div>
        ) : !actors || actors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <UserCircle className="h-10 w-10 text-primary" strokeWidth={1.5} />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">No actors yet</h2>
              <p className="text-muted-foreground max-w-md">
                Create AI actors with unique voices and appearances to use across your projects.
              </p>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Actor
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
        onSubmit={createActor}
        isCreating={isCreating}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Actor"
        description="Are you sure you want to delete this actor? This action cannot be undone."
        itemName={actorToDelete?.name}
      />
    </MainLayout>
  );
}
