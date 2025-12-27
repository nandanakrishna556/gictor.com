import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Sparkles, Layers, MoreHorizontal, Trash2, Pencil, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useProjects } from '@/hooks/useProjects';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-200 ease-out',
        collapsed ? 'w-16' : 'w-72'
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
      <div className="flex-1 overflow-y-auto p-3">
        <Collapsible open={projectsOpen && !collapsed} onOpenChange={setProjectsOpen}>
          <div
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer',
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
                        'h-4 w-4 transition-transform',
                        !projectsOpen && '-rotate-90'
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <button 
                  onClick={handleProjectsClick}
                  className="flex-1 text-left"
                >
                  Projects
                </button>
              </>
            )}
            {collapsed && (
              <button onClick={handleProjectsClick}>
                <Layers className="h-5 w-5" />
              </button>
            )}
          </div>

          <CollapsibleContent className="mt-1 space-y-1">
            {projects?.map((project) => (
              <div
                key={project.id}
                className={cn(
                  'group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200',
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
                    <button
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="flex flex-1 items-center gap-2 truncate"
                    >
                      <Layers className="h-4 w-4 shrink-0" />
                      <span className="truncate">{project.name}</span>
                    </button>
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

            <button
              onClick={handleCreateProject}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Plus className="h-4 w-4" />
              <span>New project</span>
            </button>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Collapse Button */}
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapse(!collapsed)}
          className={cn(
            'w-full justify-center text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed && 'px-2'
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
    </aside>
  );
}
