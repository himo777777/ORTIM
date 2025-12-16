import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, LogOut, User, Settings, Moon, Sun, Monitor, Search } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { GlobalSearch, SearchTrigger } from '@/components/search/GlobalSearch';
import { StreakDisplay } from '@/components/gamification/StreakDisplay';
import { XPDisplay } from '@/components/gamification/XPDisplay';
import { BookmarkPanel } from '@/components/study/BookmarkPanel';
import { NotesPanel } from '@/components/study/NotesPanel';
import { FocusModeTrigger } from '@/components/study/FocusMode';

export function Header() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar, theme, setTheme } = useUIStore();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="h-5 w-5" />;
    if (theme === 'light') return <Sun className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-full items-center justify-between px-4">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:flex">
              <Menu className="h-5 w-5" />
            </Button>

            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                B
              </div>
              <span className="font-semibold text-lg hidden sm:inline">B-ORTIM</span>
            </Link>
          </div>

          {/* Center section - Search trigger */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchTrigger onClick={() => setSearchOpen(true)} />
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1">
            {/* Gamification displays - only show for authenticated users */}
            {user && (
              <>
                <div className="hidden lg:flex items-center gap-2 mr-2">
                  <XPDisplay compact />
                  <StreakDisplay />
                </div>

                {/* Study tools */}
                <FocusModeTrigger />
                <BookmarkPanel />
                <NotesPanel />
                <NotificationCenter />
              </>
            )}

            {/* Mobile search */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="md:hidden"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={cycleTheme}>
              {getThemeIcon()}
            </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {user.role.toLowerCase()}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Min profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Inställningar</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logga ut</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
