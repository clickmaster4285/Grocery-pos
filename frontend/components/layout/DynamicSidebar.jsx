'use client';
import { MODULE_ICONS, MENU_METADATA } from '@/constants/sidebarRoutes';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  Circle,
  Store,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

function SidebarGroup({ module, isCollapsed, pathname, userPrimaryRole }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Map backend menus to metadata (paths/icons)
  const menusWithMetadata = useMemo(() => {
    return module.menus.map(menu => ({
      ...menu,
      ...MENU_METADATA[menu.menuSlug]
    })).filter(m => m.path); // Only show if we have a defined path
  }, [module.menus]);

  const isAnyChildActive = menusWithMetadata.some(menu => {
    const actualPath = `/${userPrimaryRole}${menu.path}`;
    return pathname === actualPath || pathname.startsWith(actualPath + '/');
  });

  const Icon = MODULE_ICONS[module.icon] || MODULE_ICONS.LayoutDashboard;

  if (menusWithMetadata.length === 0) return null;

  // Single-menu modules (like Dashboard) should render as a single item
  if (menusWithMetadata.length === 1 && module.moduleSlug === 'dashboard') {
    const item = menusWithMetadata[0];
    const actualPath = `/${userPrimaryRole}${item.path}`;
    const isActive = pathname === actualPath;

    return (
      <li className="px-2 mb-1">
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          asChild
          className={cn(
            'w-full justify-start gap-3 h-10 px-3',
            isActive ? 'bg-primary/10 text-primary font-bold' : 'font-medium',
            isCollapsed ? 'justify-center px-0' : ''
          )}
        >
          <Link href={actualPath} title={isCollapsed ? module.moduleName : ''}>
            <Icon size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
            {!isCollapsed && <span>{module.moduleName}</span>}
          </Link>
        </Button>
      </li>
    );
  }

  if (isCollapsed) {
    return (
      <li className="mb-2 flex justify-center">
        <Button
          variant={isAnyChildActive ? 'secondary' : 'ghost'}
          size="icon"
          className={cn('h-10 w-10', isAnyChildActive ? 'bg-primary/20 text-primary' : '')}
          title={module.moduleName}
        >
          <Icon size={18} />
        </Button>
      </li>
    );
  }

  return (
    <div className="mb-2 px-2">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full justify-between h-10 px-3 hover:bg-secondary/50',
          isAnyChildActive ? 'text-primary font-bold bg-primary/5' : 'text-muted-foreground font-medium'
        )}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={cn(isAnyChildActive ? 'text-primary' : 'text-muted-foreground')} />
          <span className="truncate">{module.moduleName}</span>
        </div>
        <ChevronDown 
          size={14} 
          className={cn('transition-transform duration-200', isOpen || isAnyChildActive ? 'rotate-180' : '')} 
        />
      </Button>

      {(isOpen || isAnyChildActive) && (
        <ul className="mt-1 ml-4 space-y-1">
          {menusWithMetadata.map((menu) => {
            const actualPath = `/${userPrimaryRole}${menu.path}`;
            const isActive = pathname === actualPath || pathname.startsWith(actualPath + '/');
            const MenuIcon = menu.icon || Circle;
            
            return (
              <li key={menu.menuSlug}>
                <Link
                  href={actualPath}
                  className={cn(
                    'flex items-center gap-2 h-9 px-4 rounded-md text-sm transition-colors',
                    isActive 
                      ? 'bg-primary/10 text-primary font-semibold' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
                  )}
                >
                  <MenuIcon size={14} className={cn(isActive ? 'text-primary' : 'text-muted-foreground/50')} />
                  {menu.menuName}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function DynamicSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { companyName, logoUrl } = useSettings();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userPrimaryRole = useMemo(() => {
    return user?.role?.toLowerCase() || 'customer';
  }, [user]);

  const handleLogout = () => logout();
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  if (!user || !user.availableModules) return null;

  return (
    <>
      <div className={cn('shrink-0 transition-all duration-300', isCollapsed ? 'w-16' : 'w-64')} />

      <nav className={cn(
        'h-screen border-r border-gray-300 flex flex-col fixed top-0 left-0 z-50 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-300 flex items-center justify-between">
          {!isCollapsed && (
            <div 
              className="flex items-center gap-3 cursor-pointer overflow-hidden group" 
              onClick={() => router.push(`/${userPrimaryRole}/dashboard`)}
            >
              {logoUrl ? (
                <div className="h-8 w-8 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0 group-hover:scale-105 transition-transform">
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Store className="text-white h-5 w-5" />
                </div>
              )}
              <h1 className="text-lg font-black tracking-tighter truncate text-primary uppercase">
                {companyName}
              </h1>
            </div>
          )}
          
          <Button variant="ghost" size="sm" onClick={toggleSidebar} className={cn('h-8 w-8 p-0', isCollapsed ? 'mx-auto' : '')}>
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        {/* Navigation Content - Directly from User Permissions */}
        <ScrollArea className="flex-1 py-4 overflow-auto">
          <ul className="space-y-1">
            {user.availableModules.map((module) => (
              <SidebarGroup 
                key={module.moduleSlug} 
                module={module} 
                isCollapsed={isCollapsed} 
                pathname={pathname} 
                userPrimaryRole={userPrimaryRole} 
              />
            ))}
          </ul>
        </ScrollArea>

        <Separator />

        {!isCollapsed && (
          <div className="px-4 py-3 border-t border-gray-200 text-[10px] text-muted-foreground uppercase tracking-widest text-center font-bold">
            powered by Clickmasters
          </div>
        )}
      </nav>
    </>
  );
}
