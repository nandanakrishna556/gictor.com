import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Grid3X3, Kanban, Plus, LogOut, Settings, Search, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import FilterPopover from '@/components/modals/FilterPopover';
import type { Tag } from '@/hooks/useTags';

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
  tags?: Tag[];
  selectedTags?: string[];
  selectedStatuses?: string[];
  selectedFileTypes?: string[];
  onTagsChange?: (tags: string[]) => void;
  onStatusesChange?: (statuses: string[]) => void;
  onFileTypesChange?: (types: string[]) => void;
  onCreateTag?: () => void;
  onDeleteTag?: (id: string) => void;
  onClearFilters?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectMode?: boolean;
  onSelectModeChange?: (mode: boolean) => void;
}

export default function AppHeader({
  breadcrumbs,
  viewMode = 'grid',
  onViewModeChange,
  onCreateFolder,
  onCreateNew,
  showCreateButtons = false,
  tags = [],
  selectedTags = [],
  selectedStatuses = [],
  selectedFileTypes = [],
  onTagsChange = () => {},
  onStatusesChange = () => {},
  onFileTypesChange = () => {},
  onCreateTag = () => {},
  onDeleteTag,
  onClearFilters = () => {},
  searchQuery = '',
  onSearchChange,
  selectMode = false,
  onSelectModeChange,
}: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

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
    <header className="flex h-14 sm:h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      {/* Breadcrumbs - scrollable container */}
      <nav className="flex min-w-0 flex-1 items-center overflow-x-auto pr-2 sm:pr-4 ml-10 md:ml-0">
        <div className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap">
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
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Search, Filter - Inline */}
        {showCreateButtons && (
          <>
            <div className="relative w-28 sm:w-48 hidden xs:block">
              <Search className="absolute left-2 sm:left-2.5 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="h-7 sm:h-8 pl-7 sm:pl-8 text-xs sm:text-sm"
              />
            </div>
            <FilterPopover
              tags={tags}
              selectedTags={selectedTags}
              selectedStatuses={selectedStatuses}
              selectedFileTypes={selectedFileTypes}
              onTagsChange={onTagsChange}
              onStatusesChange={onStatusesChange}
              onFileTypesChange={onFileTypesChange}
              onCreateTag={onCreateTag}
              onDeleteTag={onDeleteTag}
              onClearAll={onClearFilters}
            />
          </>
        )}

        {/* View Toggle */}
        {onViewModeChange && (
          <div className="flex rounded-lg border border-border bg-secondary/50 p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`rounded-md px-2 sm:px-3 py-1 sm:py-1.5 text-sm transition-apple ${
                viewMode === 'grid'
                  ? 'bg-background font-medium text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('kanban')}
              className={`rounded-md px-2 sm:px-3 py-1 sm:py-1.5 text-sm transition-apple ${
                viewMode === 'kanban'
                  ? 'bg-background font-medium text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Kanban className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        )}

        {/* Create Button */}
        {showCreateButtons && onCreateNew && (
          <Button
            size="sm"
            onClick={onCreateNew}
            className="gap-1.5 sm:gap-2 rounded-lg bg-primary font-medium text-primary-foreground transition-apple hover:opacity-90 text-xs sm:text-sm px-3 sm:px-4"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Create new</span>
            <span className="sm:hidden">New</span>
          </Button>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-offset-2 transition-apple focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-border">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-xs sm:text-sm font-medium text-primary">
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
              <Zap className="h-4 w-4" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2">
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
  );
}
