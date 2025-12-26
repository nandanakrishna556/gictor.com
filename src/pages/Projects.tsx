import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal, Trash2, Pencil, Layers, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

export default function Projects() {
  const navigate = useNavigate();
  const { projects, isLoading, createProject, deleteProject, updateProject } = useProjects();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[2/3] animate-pulse rounded-2xl bg-secondary"
                />
              ))}
            </div>
          ) : projects?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <Layers className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                No projects yet
              </h2>
              <p className="mb-6 text-center text-muted-foreground">
                Create your first project to start generating content
              </p>
              <Button
                onClick={handleCreateProject}
                className="gap-2 rounded-xl bg-primary px-6 font-medium text-primary-foreground transition-all duration-200 hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* Create New Project Card */}
              <button
                onClick={handleCreateProject}
                className="group relative flex aspect-[2/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:scale-[1.02]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-all duration-200 group-hover:bg-primary/20">
                  <Plus className="h-7 w-7 text-primary" />
                </div>
                <span className="mt-4 text-base font-medium text-muted-foreground transition-all duration-200 group-hover:text-primary">
                  New project
                </span>
              </button>

              {projects?.map((project) => (
                <div
                  key={project.id}
                  className="group relative flex aspect-[2/3] cursor-pointer flex-col items-center justify-center rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary hover:scale-[1.02]"
                  onClick={() => {
                    if (renamingProjectId !== project.id) {
                      navigate(`/projects/${project.id}`);
                    }
                  }}
                >
                  {/* Project Icon - Stacked layers */}
                  <div className="relative mb-4">
                    <svg 
                      width="72" 
                      height="72" 
                      viewBox="0 0 72 72" 
                      fill="none" 
                      className="text-primary"
                    >
                      {/* Bottom layer */}
                      <rect 
                        x="8" 
                        y="24" 
                        width="56" 
                        height="40" 
                        rx="8" 
                        fill="currentColor"
                        opacity="0.2"
                      />
                      {/* Middle layer */}
                      <rect 
                        x="12" 
                        y="16" 
                        width="48" 
                        height="40" 
                        rx="6" 
                        fill="currentColor"
                        opacity="0.4"
                      />
                      {/* Top layer */}
                      <rect 
                        x="16" 
                        y="8" 
                        width="40" 
                        height="40" 
                        rx="6" 
                        fill="currentColor"
                        opacity="0.8"
                      />
                      {/* Play/content indicator */}
                      <path 
                        d="M32 22L44 28L32 34V22Z" 
                        fill="white"
                        opacity="0.9"
                      />
                    </svg>
                  </div>

                  {renamingProjectId === project.id ? (
                    <div className="flex items-center gap-1 px-4" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-8 text-sm text-center"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && renameValue.trim()) {
                            updateProject({ id: project.id, name: renameValue.trim() });
                            setRenamingProjectId(null);
                          } else if (e.key === 'Escape') {
                            setRenamingProjectId(null);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (renameValue.trim()) {
                            updateProject({ id: project.id, name: renameValue.trim() });
                          }
                          setRenamingProjectId(null);
                        }}
                        className="rounded p-1 hover:bg-secondary"
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </button>
                      <button
                        onClick={() => setRenamingProjectId(null)}
                        className="rounded p-1 hover:bg-secondary"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-base font-semibold text-card-foreground text-center px-4">
                      {project.name}
                    </h3>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="absolute right-3 top-3 rounded-lg p-1.5 opacity-0 transition-all duration-200 hover:bg-secondary group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameValue(project.name);
                          setRenamingProjectId(project.id);
                        }}
                      >
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
