import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { OfflineIndicator } from './OfflineIndicator';

export function AppShell() {
  const { sidebarOpen } = useUIStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside
            className={cn(
              'fixed left-0 top-16 h-[calc(100vh-4rem)] border-r bg-card transition-all duration-300',
              sidebarOpen ? 'w-64' : 'w-16'
            )}
          >
            <Sidebar collapsed={!sidebarOpen} />
          </aside>
        )}

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 transition-all duration-300 pt-16',
            !isMobile && (sidebarOpen ? 'ml-64' : 'ml-16'),
            isMobile && 'pb-16'
          )}
        >
          <div className="container mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNav />}

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
