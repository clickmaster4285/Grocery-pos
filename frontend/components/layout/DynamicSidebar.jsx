'use client';
import { MODULE_ICONS } from '@/constants/sidebarRoutes';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useAvatar } from '@/hooks/useAvatar';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

function SidebarItem({ item, isCollapsed, pathname, userPrimaryRole }) {
  const router = useRouter();
  const actualPath = `/${userPrimaryRole}${item.path}`;
  const isActive = pathname === actualPath || pathname.startsWith(actualPath + '/');

  return (
    <li>
      <Button
        variant={isActive ? 'ghost' : 'secondary'}
        className={cn(
          'w-full justify-start gap-3 h-10 px-3',
          isActive ? 'bg-primary/30 text-primary' : 'font-medium bg-transparent',
          isCollapsed ? 'justify-center px-0' : ''
        )}
        asChild
      >
        <Link className='text-foreground' href={actualPath} title={isCollapsed ? item.name : ''}>
          <span
            className={cn(
              'text-muted-foreground shrink-0',
              isActive ? 'text-primary' : ''
            )}
          >
            {item.icon}
          </span>
          {!isCollapsed && <span className={cn('truncate font-medium tracking-tight', isActive ? 'text-primary/400' : 'text-foreground')}>{item.name}</span>}
        </Link>
      </Button>
    </li>
  );
}

export default function DynamicSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { url: avatarUrl, initials } = useAvatar(user);
  const [isCollapsed, setIsCollapsed] = useState(false);


  const userPrimaryRole = useMemo(() => {
    return user?.role?.toLowerCase() || 'customer';
  }, [user]);


  const { mainSections, bottomSection } = useMemo(() => {
    if (!user || !user.availableModules) {
      return { mainSections: [], bottomSection: { items: [] } };
    }

    const allItems = user.availableModules.map(moduleInfo => {
      // Determine the path based on the module name
      let path;
      if (moduleInfo.moduleName === 'Dashboard') {
        path = '/dashboard'; // Dashboard might have a fixed path
      } else {
        path = `/${moduleInfo.moduleName.toLowerCase()}`;
      }

      return {
        name: moduleInfo.moduleName,
        path: path,
        icon: MODULE_ICONS[moduleInfo.moduleName],
        permissions: moduleInfo.permissions, // Keep permissions for potential future use
      };
    });

    // Separate items into main and bottom sections
    const mainItems = allItems.filter(item => item.name === 'Dashboard' || item.name === 'Users' || item.name === 'Products' || item.name === 'Branches' || item.name === 'Categories' || item.name === 'Brands' || item.name === 'Suppliers');
    const bottomItems = allItems.filter(item => item.name === 'Settings' || item.name === 'Help');


    return {
      mainSections: mainItems.length > 0 ? [{ title: 'Main Menu', items: mainItems }] : [],
      bottomSection: { items: bottomItems },
    };

  }, [user]);

  // Handle logout
  const handleLogout = () => {
    logout();
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
          'h-screen border border-gray-300 rounded-tr-2xl  border-r flex flex-col fixed top-0 left-0 z-50 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header with Logo and Toggle */}
        <div className="px-4 py-4 border-b border-gray-300 flex items-center justify-between">
          {!isCollapsed && (
            <h1
              className="text-xl font-extrabold cursor-pointer tracking-tight truncate"
              onClick={() => router.push(`/${userPrimaryRole}/dashboard`)}
            >
              <span className="text-primary">Super</span>
              <span className="text-foreground"> Market</span>
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
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-normal mb-2 px-2">
                      {section.title}
                    </h3>
                  )}
                  <ul className="">
                    {section.items.map((item) => (
                      item && (
                        <SidebarItem
                          key={item.name}
                          item={item}
                          isCollapsed={isCollapsed}
                          pathname={pathname}
                          userPrimaryRole={userPrimaryRole}
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
                    variant={isActive ? 'ghost' : 'secondary'}
                    className={cn(
                      'w-full justify-start gap-3 h-10 px-3',
                      isActive ? '' : 'font-medium',
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
                          isActive ? '' : 'text-primary'
                        )}
                      >
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <span className={cn('truncate', isActive ? '' : 'text-primary')}>{item.name}</span>
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
              <p className="flex items-center gap-3 text-primary tracking-tight">
                @ powered by Clickamster
              </p>
            </div>
          </>
        )}
      </nav>
    </>
  );
}
