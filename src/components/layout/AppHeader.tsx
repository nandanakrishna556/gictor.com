import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Grid3X3, Kanban, Plus, Coins, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from 'next-themes';
import { useTags } from '@/hooks/useTags';
import FilterPopover, { FilterState } from '@/components/files/FilterPopover';
import CreateTagDialog from '@/components/modals/CreateTagDialog';

interface BreadcrumbItem {
  label: string;
  href?: string | undefined;
}

interface AppHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  viewMode?: 'grid' | 'kanban';
  onViewModeChange?: (mode: 'grid' | 'kanban') => void;
  onCreateFolder?: () => void;
  onCreateNew?: () => void;
  showCreateButtons?: boolean;
  filters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
}

export default function AppHeader({
  breadcrumbs,
  viewMode = 'grid',
  onViewModeChange,
  onCreateFolder,
  onCreateNew,
  showCreateButtons = false,
  filters = { statuses: [], fileTypes: [], tags: [] },
  onFiltersChange,
}: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { tags, createTag } = useTags();
  const [createTagOpen, setCreateTagOpen] = useState(false);

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
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              {item.href ? (
                <Link
                  to={item.href}
                  className="text-muted-foreground transition-apple hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{item.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Filter */}
          {onFiltersChange && (
            <FilterPopover
              filters={filters}
              onFiltersChange={onFiltersChange}
              tags={tags}
              onCreateTag={() => setCreateTagOpen(true)}
            />
          )}

          {/* View Toggle */}
          {onViewModeChange && (
            <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`rounded-md px-3 py-1.5 text-sm transition-apple ${
                  viewMode === 'grid'
                    ? 'bg-background font-medium text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('kanban')}
                className={`rounded-md px-3 py-1.5 text-sm transition-apple ${
                  viewMode === 'kanban'
                    ? 'bg-background font-medium text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Kanban className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Create Buttons */}
          {showCreateButtons && (
            <>
              {onCreateFolder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateFolder}
                  className="gap-2 rounded-lg border-border"
                >
                  <Plus className="h-4 w-4" />
                  Create folder
                </Button>
              )}
              {onCreateNew && (
                <Button
                  size="sm"
                  onClick={onCreateNew}
                  className="gap-2 rounded-lg bg-primary font-medium text-primary-foreground transition-apple hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Create new
                </Button>
              )}
            </>
          )}

          {/* Credits */}
          <Link
            to="/billing"
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-apple hover:bg-secondary"
          >
            <Coins className="h-4 w-4 text-warning" />
            {profile?.credits ?? 0} Credits
            <Plus className="h-3 w-3 text-muted-foreground" />
          </Link>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none ring-offset-2 transition-apple focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                    {getInitials(profile?.full_name, user?.email)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
        </div>
      </header>

      <CreateTagDialog
        open={createTagOpen}
        onOpenChange={setCreateTagOpen}
        onSubmit={createTag}
      />
    </>
  );
}
