import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Sparkles, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useProjects } from '@/hooks/useProjects';

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function AppSidebar({ collapsed, onCollapse }: AppSidebarProps) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects, createProject } = useProjects();
  const [projectsOpen, setProjectsOpen] = useState(true);

  const handleCreateProject = async () => {
    const project = await createProject('Untitled Project');
    if (project) {
      navigate(`/projects/${project.id}`);
    }
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
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-apple hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
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
                  <span>Projects</span>
                </>
              )}
              {collapsed && <FolderOpen className="h-5 w-5" />}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-1 space-y-1">
            {projects?.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-apple',
                  projectId === project.id
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span className="truncate">{project.name}</span>
              </button>
            ))}

            <button
              onClick={handleCreateProject}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-apple hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
            'w-full justify-center text-muted-foreground transition-apple hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
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
