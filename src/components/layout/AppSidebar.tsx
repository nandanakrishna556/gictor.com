import { useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronDown, Plus, Sparkles, Layers, MoreHorizontal, Trash2, Pencil, Check, X, Coins, Sun, Moon, LayoutDashboard, Settings, UserCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { useProjects } from '@/hooks/useProjects';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  const { projects, createProject, deleteProject, updateProject } = useProjects();
  const { profile } = useProfile();
  const { theme, setTheme } = useTheme();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const project = await createProject(newProjectName.trim());
    if (project) {
      navigate(`/projects/${project.id}`);
    }
    setNewProjectDialogOpen(false);
    setNewProjectName('');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-sidebar gradient-sidebar border-r border-sidebar-border overflow-hidden">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={1.5} />
        </div>
        <span className="font-semibold text-sidebar-foreground text-sm">UGC Generator</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {/* Dashboard */}
        <Link
          to="/dashboard"
          className={cn(
            'flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-sm font-medium transition-fast',
            isActive('/dashboard')
              ? 'bg-primary/15 text-primary'
              : 'text-sidebar-muted hover:bg-sidebar-border/50 hover:text-sidebar-foreground'
          )}
        >
          <LayoutDashboard className="h-[18px] w-[18px]" strokeWidth={1.5} />
          <span>Dashboard</span>
        </Link>

        {/* Actors */}
        <Link
          to="/actors"
          className={cn(
            'flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-sm font-medium transition-fast',
            isActive('/actors')
              ? 'bg-primary/15 text-primary'
              : 'text-sidebar-muted hover:bg-sidebar-border/50 hover:text-sidebar-foreground'
          )}
        >
          <UserCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />
          <span>Actors</span>
        </Link>

        {/* Projects Collapsible */}
        <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                'flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-sm font-medium transition-fast cursor-pointer',
                isActive('/projects')
                  ? 'bg-primary/15 text-primary'
                  : 'text-sidebar-muted hover:bg-sidebar-border/50 hover:text-sidebar-foreground'
              )}
            >
              <div className="flex items-center gap-2">
                <Layers className="h-[18px] w-[18px]" strokeWidth={1.5} />
                <span>Projects</span>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  !projectsOpen && '-rotate-90'
                )}
                strokeWidth={1.5}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-0.5 space-y-0.5 pl-3">
            {projects?.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className={cn(
                  'group flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-fast cursor-pointer',
                  projectId === project.id
                    ? 'bg-primary/15 font-medium text-primary'
                    : 'text-sidebar-muted hover:bg-sidebar-border/50 hover:text-sidebar-foreground'
                )}
              >
                {renamingProjectId === project.id ? (
                  <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="h-7 text-sm bg-sidebar-border border-sidebar-border text-sidebar-foreground"
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
                      className="rounded-xs p-0.5 hover:bg-sidebar-border"
                    >
                      <Check className="h-4 w-4 text-success" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => setRenamingProjectId(null)}
                      className="rounded-xs p-0.5 hover:bg-sidebar-border"
                    >
                      <X className="h-4 w-4 text-sidebar-muted" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Layers className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span className="flex-1 truncate text-left">{project.name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="rounded-xs p-0.5 opacity-0 transition-opacity hover:bg-sidebar-border group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4 text-sidebar-muted" strokeWidth={1.5} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          className="gap-2 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameValue(project.name);
                            setRenamingProjectId(project.id);
                          }}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-destructive text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(project.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            ))}

            {/* New Project Button */}
            <button
              onClick={() => setNewProjectDialogOpen(true)}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-sidebar-muted transition-fast hover:bg-sidebar-border/50 hover:text-sidebar-foreground"
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
              <span>New project</span>
            </button>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Bottom Section */}
      <div className="shrink-0 border-t border-sidebar-border px-3 py-3 space-y-0.5">
        {/* Settings */}
        <Link
          to="/settings"
          className={cn(
            'flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-sm font-medium transition-fast',
            isActive('/settings')
              ? 'bg-primary/15 text-primary'
              : 'text-sidebar-muted hover:bg-sidebar-border/50 hover:text-sidebar-foreground'
          )}
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
          <span>Settings</span>
        </Link>
        
        {/* Credits */}
        <Link
          to="/billing"
          className="flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm text-sidebar-muted transition-fast hover:bg-sidebar-border/50 hover:text-sidebar-foreground"
        >
          <Coins className="h-[18px] w-[18px] text-primary" strokeWidth={1.5} />
          <span className="flex-1">{profile?.credits ?? 0} Credits</span>
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Link>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between rounded-sm px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Moon className="h-[18px] w-[18px] text-sidebar-muted" strokeWidth={1.5} />
            ) : (
              <Sun className="h-[18px] w-[18px] text-sidebar-muted" strokeWidth={1.5} />
            )}
            <span className="text-sm text-sidebar-muted">Dark Mode</span>
          </div>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={(checked) => {
              document.documentElement.classList.add('theme-transition');
              setTheme(checked ? 'dark' : 'light');
              setTimeout(() => {
                document.documentElement.classList.remove('theme-transition');
              }, 300);
            }}
          />
        </div>
      </div>

      {/* New Project Dialog */}
      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Give your project a name to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Input
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newProjectName.trim()) {
                  handleCreateProject();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNewProjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
