import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Sparkles, Layers, MoreHorizontal, Trash2, Pencil, Check, X, Zap, Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useProjects } from '@/hooks/useProjects';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
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
} from '@/components/ui/dialog';

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function AppSidebar({ collapsed, onCollapse }: AppSidebarProps) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects, createProject, deleteProject, updateProject } = useProjects();
  const { profile } = useProfile();
  const { user } = useAuth();
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

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-200 ease-out',
        collapsed ? 'w-16' : 'w-80'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-foreground">UGC Generator</span>
        )}
      </div>

      {/* Projects Section */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Projects Collapsible */}
        <Collapsible open={projectsOpen && !collapsed} onOpenChange={setProjectsOpen}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
                collapsed && 'justify-center px-2'
              )}
            >
              {!collapsed && (
                <>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      !projectsOpen && '-rotate-90'
                    )}
                  />
                  <Layers className="h-4 w-4" />
                  <span className="flex-1 text-left">Projects</span>
                </>
              )}
              {collapsed && <Layers className="h-5 w-5" />}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-1 space-y-1 pl-3">
            {projects?.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className={cn(
                  'group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200 cursor-pointer',
                  projectId === project.id
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                {renamingProjectId === project.id ? (
                  <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="h-7 text-sm"
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
                      className="rounded p-0.5 hover:bg-sidebar-accent"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </button>
                    <button
                      onClick={() => setRenamingProjectId(null)}
                      className="rounded p-0.5 hover:bg-sidebar-accent"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Layers className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate text-left">{project.name}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="rounded p-0.5 opacity-0 transition-opacity hover:bg-sidebar-accent group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(project.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            ))}

            {/* New Project Button */}
            {!collapsed && (
              <button
                onClick={() => setNewProjectDialogOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Plus className="h-4 w-4" />
                <span>New project</span>
              </button>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Bottom Section - Workspace, Credits, Dark Mode, Collapse */}
      <div className="border-t border-border p-4 space-y-2">
        {/* Workspace */}
        {!collapsed && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                {getInitials(profile?.full_name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {profile?.full_name || 'Workspace'}
              </p>
              <p className="truncate text-xs text-muted-foreground">Workspace</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center rounded-lg p-2">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                {getInitials(profile?.full_name, user?.email)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Credits */}
        {!collapsed && (
          <Link
            to="/billing"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent"
          >
            <Zap className="h-4 w-4 text-primary" />
            <span className="flex-1">{profile?.credits ?? 0} Credits</span>
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        )}
        {collapsed && (
          <Link
            to="/billing"
            className="flex items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent"
          >
            <Zap className="h-5 w-5 text-primary" />
          </Link>
        )}

        {/* Dark Mode Toggle */}
        {!collapsed && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent"
          >
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent"
          >
            {theme === 'dark' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapse(!collapsed)}
          className={cn(
            'w-full justify-start text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>

      {/* New Project Dialog */}
      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
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
            <Button variant="outline" onClick={() => setNewProjectDialogOpen(false)}>
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
