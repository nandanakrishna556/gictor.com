import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useProjects } from '@/hooks/useProjects';
import { formatDistanceToNow } from 'date-fns';

export default function Projects() {
  const navigate = useNavigate();
  const { projects, isLoading, createProject, deleteProject } = useProjects();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleCreateProject = async () => {
    const project = await createProject('Untitled Project');
    if (project) {
      navigate(`/projects/${project.id}`);
    }
  };

  const handleDeleteProject = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete);
      setProjectToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex h-screen flex-col">
        <AppHeader breadcrumbs={[{ label: 'Projects' }]} />

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl bg-secondary"
                />
              ))}
            </div>
          ) : projects?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                No projects yet
              </h2>
              <p className="mb-6 text-center text-muted-foreground">
                Create your first project to start generating content
              </p>
              <Button
                onClick={handleCreateProject}
                className="gap-2 rounded-xl bg-primary px-6 font-medium text-primary-foreground transition-apple hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects?.map((project) => (
                <div
                  key={project.id}
                  className="group relative cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-apple transition-apple hover-lift"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <FolderOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-1 font-semibold text-card-foreground">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Updated{' '}
                    {formatDistanceToNow(new Date(project.updated_at), {
                      addSuffix: true,
                    })}
                  </p>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="absolute right-3 top-3 rounded-lg p-1.5 opacity-0 transition-apple hover:bg-secondary group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Pencil className="h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(project.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this project and all its contents.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
