import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
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
      <div className="min-h-full">
        {/* ========== HEADER SECTION ========== */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className="flex items-center justify-between h-16 sm:h-20">
              {/* Title */}
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                  Actors
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Create and manage your AI actors
                </p>
              </div>
              
              {/* Create Button */}
              <Button
                onClick={() => setCreateModalOpen(true)}
                size="lg"
                className="gap-2 rounded-xl px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              >
                <Plus className="h-4 w-4" />
                Create Actor
              </Button>
            </div>
          </div>
        </div>

        {/* ========== MAIN CONTENT ========== */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8">
          {isLoading ? (
            /* Loading State */
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ActorCardSkeleton key={i} />
              ))}
            </div>
          ) : !actors || actors.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 sm:py-32 px-4 animate-fade-in">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 text-primary" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
                No actors yet
              </h2>
              <p className="text-muted-foreground text-center max-w-md mb-8">
                Create your first AI actor to start generating personalized video content with realistic voices and appearances.
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                size="lg"
                className="gap-2 rounded-xl px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              >
                <Plus className="h-4 w-4" />
                Create Your First Actor
              </Button>
            </div>
          ) : (
            /* Actor Grid */
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {actors.map((actor, index) => (
                <div 
                  key={actor.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ActorCard actor={actor} onDelete={handleDeleteClick} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========== MODALS ========== */}
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
