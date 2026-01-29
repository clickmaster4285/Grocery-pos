// components/layout/DynamicNavbar.jsx
'use client';
import Link from 'next/link';
import { MessageSquare, Bell, Search, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/hooks/useAvatar'; // Import useAvatar
import { useMemo } from 'react';


export default function DynamicNavbar() { // Removed role prop
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth(); // isLoading, isAuthenticated are handled by parent ProtectedLayout
  const { url: avatarUrl, initials } = useAvatar(user); // Use useAvatar hook

  // Determine the user's primary role
  const userPrimaryRole = useMemo(() => {
    return user?.roles && user.roles.length > 0 ? user.roles[0].toLowerCase() : 'customer';
  }, [user]);

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    // Redirection handled by logout internally
  };

  // User should always be available if this component renders (due to ProtectedLayout)
  if (!user) {
    return null; // Should not happen
  }

  const dashboardTitles = {
    'admin': 'Admin Dashboard',
    'manager': "Manager's Dashboard",
    'customer': "Customer's Dashboard", // Added for consistency
    // Add other roles as needed
  };

  return (
    <header className="bg-background border-b border-gray-300 p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="font-bold text-xl">
          {dashboardTitles[userPrimaryRole] || 'Dashboard'}
        </div>

        <nav className="flex items-center justify-between gap-4 w-full">
          {/* Search bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search members, classes"
                className="pl-8 w-full"
              />
            </div>
          </div>

          {/* Right-aligned icons and user menu */}
          <div className="flex items-center gap-4">
            {/* Notification with badge */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={18} className="text-muted-foreground" />
              <Badge className="absolute -right-1 -top-1 h-4 w-4 p-0">3</Badge>
            </Button>

            {/* Messages with badge */}
            <Button variant="ghost" size="icon" className="relative">
              <MessageSquare size={18} className="text-muted-foreground" />
              <Badge className="absolute -right-1 -top-1 h-4 w-4 p-0">1</Badge>
            </Button>

            {/* User dropdown menu */}
            <div className="border border-gray-400 py-1 rounded-full bg-gray-300">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-muted">
                      {initials || <User size={16} />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm">
                    {user.firstName} {user.lastName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${userPrimaryRole}/profile`}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${userPrimaryRole}/settings`}>Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}