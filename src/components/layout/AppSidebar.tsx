import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronDown, Plus, Sparkles, Layers, MoreHorizontal, Trash2, Pencil, Check, X, Coins, LogOut, Settings, PanelLeftClose, PanelLeft, Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function AppSidebar({ collapsed, onCollapse }: AppSidebarProps) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects, createProject, deleteProject, updateProject } = useProjects();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { theme, setTheme } = useTheme();

  const handleCreateProject = async () => {
    const project = await createProject('Untitled Project');
    if (project) {
      navigate(`/projects/${project.id}`);
    }
  };

  const handleProjectsClick = () => {
    navigate('/projects');
  };

  const handleToggleProjects = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectsOpen(!projectsOpen);
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
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-200 ease-out',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-border px-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-sm text-foreground">UGC Generator</span>
            )}
          </Link>
        </div>

        {/* Projects Section */}
        <div className="flex-1 overflow-y-auto p-2">
          <Collapsible open={projectsOpen && !collapsed} onOpenChange={setProjectsOpen}>
            <div
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
                collapsed && 'justify-center px-2'
              )}
            >
              {!collapsed && (
                <>
                  <CollapsibleTrigger asChild>
                    <button
                      onClick={handleToggleProjects}
                      className="p-0.5 rounded hover:bg-sidebar-accent"
                    >
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 transition-transform',
                          !projectsOpen && '-rotate-90'
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <button 
                    onClick={handleProjectsClick}
                    className="flex-1 text-left text-xs font-semibold uppercase tracking-wider"
                  >
                    Projects
                  </button>
                  <button
                    onClick={handleCreateProject}
                    className="rounded p-0.5 hover:bg-sidebar-accent"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              {collapsed && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={handleProjectsClick}>
                      <Layers className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Projects</TooltipContent>
                </Tooltip>
              )}
            </div>

            <CollapsibleContent className="mt-1 space-y-0.5">
              {projects?.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    'group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-all duration-200',
                    projectId === project.id
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  {renamingProjectId === project.id ? (
                    <div className="flex flex-1 items-center gap-1">
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-6 text-xs"
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
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      </button>
                      <button
                        onClick={() => setRenamingProjectId(null)}
                        className="rounded p-0.5 hover:bg-sidebar-accent"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="flex flex-1 items-center gap-2 truncate"
                      >
                        <Layers className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate text-sm">{project.name}</span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="rounded p-0.5 opacity-0 transition-opacity hover:bg-sidebar-accent group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            className="gap-2 text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameValue(project.name);
                              setRenamingProjectId(project.id);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-sm text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProject(project.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}

              <button
                onClick={handleCreateProject}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New project</span>
              </button>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Bottom Section - Credits, Theme Toggle, Profile, Collapse */}
        <div className="border-t border-border p-2 space-y-1">
          {/* Credits */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/billing"
                  className="flex h-9 w-full items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                >
                  <Coins className="h-4 w-4 text-warning" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{profile?.credits ?? 0} Credits</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              to="/billing"
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <Coins className="h-4 w-4 text-warning" />
              <span className="flex-1">{profile?.credits ?? 0} Credits</span>
              <Plus className="h-3 w-3" />
            </Link>
          )}

          {/* Theme Toggle */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex h-9 w-full items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                >
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Toggle theme</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-muted-foreground">
              <Sun className="h-4 w-4" />
              <span className="flex-1">Dark mode</span>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          )}

          {/* Profile */}
          {collapsed ? (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-9 w-full items-center justify-center rounded-xl transition-colors hover:bg-sidebar-accent">
                      <Avatar className="h-7 w-7 border border-border rounded-xl">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary rounded-xl">
                          {getInitials(profile?.full_name, user?.email)}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">Account</TooltipContent>
              </Tooltip>
              <DropdownMenuContent side="right" align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/billing')} className="gap-2">
                  <Coins className="h-4 w-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground">
                  <Avatar className="h-7 w-7 border border-border rounded-xl">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary rounded-xl">
                      {getInitials(profile?.full_name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/billing')} className="gap-2">
                  <Coins className="h-4 w-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Collapse Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onCollapse(!collapsed)}
                className={cn(
                  "flex h-9 w-full items-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                  collapsed ? "justify-center" : "gap-2.5 px-2.5"
                )}
              >
                {collapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <>
                    <PanelLeftClose className="h-4 w-4" />
                    <span className="text-sm">Collapse</span>
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
