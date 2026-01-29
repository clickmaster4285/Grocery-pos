'use client';
import { buildSidebarSections } from '@/constants/sidebarRoutes';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions'; 
import { useAvatar } from '@/hooks/useAvatar';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useState, useMemo } from 'react'; 
import { cn } from '@/lib/utils';

function SidebarItem({ item, isCollapsed, pathname, userPrimaryRole }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const actualPath = `/${userPrimaryRole}${item.path}`;

  // Check active state for parent & children
  const childPaths = hasChildren
    ? item.children.map((child) => `/${userPrimaryRole}${child.path}`)
    : [];

  const isActive =
    pathname === actualPath ||
    pathname.startsWith(actualPath + '/') ||
    childPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Auto-open if one of the children or parent is active
  useMemo(() => {
    if (isActive && hasChildren) {
      setOpen(true);
    }
  }, [isActive, hasChildren]);

  const handleNavigation = (e) => {
    if (!hasChildren) {
        e.preventDefault();
        router.push(actualPath);
    }
  };

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

  return (
    <li>
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
            const childPath = `/${userPrimaryRole}${child.path}`;
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
  const { user, logout } = useAuth(); 
  const { can } = usePermissions(); // Use the new 'can' function
  const { url: avatarUrl, initials } = useAvatar(user); 
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine the user's primary role
  const userPrimaryRole = useMemo(() => {
    return user?.role?.toLowerCase() || 'customer'; // Use single 'role'
  }, [user]);

  // Build sidebar sections based on user permissions
  const { mainSections, bottomSection } = useMemo(() => {
    if (!user) { // If user is not yet loaded or authenticated (though parent layout should catch this)
      return { mainSections: [], bottomSection: { items: [] } };
    }
    return buildSidebarSections(can); // Pass the new 'can' function
  }, [user, can]);

  // Replace [role] in paths with actual role (this will be handled by SidebarItem now)
  const replaceRoleInPath = (path) => {
    return `/${userPrimaryRole}${path}`;
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    // Redirect to login is handled by logout internally
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!user) {
    return null; 
  }

  return (
    <>
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
              onClick={() => router.push(`/${userPrimaryRole}/dashboard`)}
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
                          userPrimaryRole={userPrimaryRole} // Pass primary role for path construction
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
              const actualPath = `/${userPrimaryRole}${item.path}`;
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
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-muted text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate capitalize">
                    {userPrimaryRole ? userPrimaryRole.replace(/-/g, ' ') : 'User'}
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