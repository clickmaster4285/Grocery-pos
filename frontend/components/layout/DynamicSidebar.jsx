'use client';
import { SIDEBAR_ROUTES } from '@/constants/sidebarRoutes';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/app/loading';
import Link from 'next/link';
import Unauthorized from '@/app/unauthorized';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

function SidebarItem({ item, isCollapsed, pathname, replaceRoleInPath }) {
  const [open, setOpen] = useState(false);

  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const actualPath = replaceRoleInPath(item.path);

  // Check active state for parent & children
  const childPaths = hasChildren
    ? item.children.map((child) => replaceRoleInPath(child.path))
    : [];

  const isActive =
    pathname === actualPath ||
    pathname.startsWith(actualPath + '/') ||
    childPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Auto-open if one of the children or parent is active
  useState(() => {
    if (isActive && hasChildren) {
      setOpen(true);
    }
  }, []);

  if (!hasChildren) {
    // 🔹 Normal flat item (no children)
    return (
      <li>
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className={cn(
            'w-full justify-start gap-3 h-10 px-3',
            isActive ? 'font-medium' : '',
            isCollapsed ? 'justify-center px-0' : ''
          )}
          asChild
        >
          <Link href={actualPath} title={isCollapsed ? item.name : ''}>
            <span
              className={cn(
                'text-muted-foreground shrink-0',
                isActive ? 'text-primary' : ''
              )}
            >
              {item.icon}
            </span>
            {!isCollapsed && <span className="truncate">{item.name}</span>}
          </Link>
        </Button>
      </li>
    );
  }

  // 🔹 Item with dropdown (Site Activities)
  return (
    <li>
      {/* Parent row that toggles dropdown */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'w-full flex items-center gap-3 h-10 px-3 rounded-md text-sm transition-colors font-medium',
          'hover:bg-accent hover:text-accent-foreground',
          isActive ? 'bg-secondary font-medium' : '',
          isCollapsed ? 'justify-center px-0' : 'justify-between'
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'text-muted-foreground shrink-0',
              isActive ? 'text-primary' : ''
            )}
          >
            {item.icon}
          </span>
          {!isCollapsed && <span className="truncate">{item.name}</span>}
        </div>

        {!isCollapsed && (
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              open ? 'rotate-180' : ''
            )}
          />
        )}
      </button>

      {/* Children links */}
      {open && (
        <div className={cn('mt-1 space-y-1', isCollapsed ? 'pl-0' : 'pl-8')}>
          {item.children.map((child) => {
            const childPath = replaceRoleInPath(child.path);
            const childActive =
              pathname === childPath || pathname.startsWith(childPath + '/');

            return (
              <Button
                key={child.name}
                variant={childActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start h-9 px-3 text-xs',
                  childActive ? 'font-medium' : '',
                  isCollapsed ? 'justify-center px-0' : ''
                )}
                asChild
              >
                <Link href={childPath} title={isCollapsed ? child.name : ''}>
                  {!isCollapsed && (
                    <span className="truncate">{child.name}</span>
                  )}
                  {isCollapsed && <span className="sr-only">{child.name}</span>}
                </Link>
              </Button>
            );
          })}
        </div>
      )}
    </li>
  );
}

export default function DynamicSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isLoading) {
    return (
      <>
        <div className={cn("shrink-0 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )} aria-hidden="true"></div>
        <nav className={cn(
          "h-screen bg-background border-r flex flex-col fixed top-0 left-0 z-50 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}>
          <div className="flex items-center justify-center h-full">
            <Loading />
          </div>
        </nav>
      </>
    );
  }

  if (!isAuthenticated || !user) {
    return <Unauthorized />;
  }

  const role = user?.role || user?.user_role;

  // Get routes for the user's role
  const getRoutesForRole = (role) => {
    const route = SIDEBAR_ROUTES[role];
    return route || {
      mainSections: [],
      bottomSection: { items: [] }
    };
  };

  const routes = getRoutesForRole(role);
  const { mainSections, bottomSection } = routes;

  // Replace [role] in paths with actual role
  const replaceRoleInPath = (path) => {
    return path.replace('[role]', role);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Empty spacer div that matches sidebar width */}
      <div
        className={cn(
          'shrink-0 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
        aria-hidden="true"
      ></div>

      {/* Actual fixed sidebar */}
      <nav
        className={cn(
          'h-screen border border-gray-300 rounded-tr-2xl bg-background border-r flex flex-col fixed top-0 left-0 z-50 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header with Logo and Toggle */}
        <div className="px-4 py-4 border-b border-gray-300 flex items-center justify-between">
          {!isCollapsed && (
            <h1
              className="text-xl font-bold cursor-pointer truncate"
              onClick={() => router.push(`/${role}/dashboard`)}
            >
              <span className="text-primary">Matrix</span>
              <span className="text-foreground"> Eng.</span>
            </h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn('h-8 w-8 p-0', isCollapsed ? 'mx-auto' : '')}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Scrollable Main Content */}
        <ScrollArea className="flex-1 px-2 py-4">
          {Array.isArray(mainSections) && mainSections.length > 0 ? (
            mainSections.map((section) => (
              section && section.items && Array.isArray(section.items) ? (
                <div key={section.title || 'section'} className="mb-4">
                  {!isCollapsed && section.title && (
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                      {section.title}
                    </h3>
                  )}
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      item && (
                        <SidebarItem
                          key={item.name}
                          item={item}
                          isCollapsed={isCollapsed}
                          pathname={pathname}
                          replaceRoleInPath={replaceRoleInPath}
                        />
                      )
                    ))}
                  </ul>
                </div>
              ) : null
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No menu items available
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Bottom-aligned Settings and Help */}
        <div className="px-2 py-2">
          <ul className="space-y-1">
            {bottomSection.items.map((item) => {
              const actualPath = replaceRoleInPath(item.path);
              const isActive = pathname === actualPath;

              return (
                <li key={item.name}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 h-10 px-3',
                      isActive ? 'font-medium' : '',
                      isCollapsed ? 'justify-center px-0' : ''
                    )}
                    asChild
                  >
                    <Link
                      href={actualPath}
                      title={isCollapsed ? item.name : ''}
                    >
                      <span
                        className={cn(
                          'text-muted-foreground shrink-0',
                          isActive ? 'text-primary' : ''
                        )}
                      >
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  </Button>
                </li>
              );
            })}

            {/* Logout Button */}
            <li>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 h-10 px-3 text-destructive hover:text-destructive hover:bg-destructive/10',
                  isCollapsed ? 'justify-center px-0' : ''
                )}
                onClick={handleLogout}
                title={isCollapsed ? 'Logout' : ''}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!isCollapsed && 'Logout'}
              </Button>
            </li>
          </ul>
        </div>

        {/* User Profile */}
        {!isCollapsed && (
          <>
            <Separator />
            <div className="px-4 py-3 border-t border-gray-300">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/default.png" />
                  <AvatarFallback className="bg-muted text-xs">
                    {user?.name?.charAt(0) || user?.user_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.name || user?.user_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate capitalize">
                    {role ? role.replace(/-/g, ' ') : 'User'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </nav>
    </>
  );
}