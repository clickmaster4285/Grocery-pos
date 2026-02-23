'use client';

import React, { useMemo, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronLeft,
  CalendarDays,
  UserCircle,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useStaffList } from '@/features/users.api';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

const ShiftManagement = () => {
  const router = useRouter();
  const { data: staff = [], isLoading } = useStaffList();
  const { isAdmin, currentUserRole } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStaff = useMemo(() => {
    return staff.filter(user => 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employment?.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (isLoading) return <div className="p-8 text-center">Loading shift data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4">
        <div>  
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shift Management</h1>
          <p className="text-muted-foreground text-sm">Monitor and organize employee working hours</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search staff or dept..." 
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        </div>
        <div className="">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm bg-sky-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-sky-600 uppercase tracking-widest">Active Now</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-sky-700">--</span>
                  <Clock className="h-8 w-8 text-sky-200" />
                </div>
                <p className="text-[10px] text-sky-600/70 mt-1 italic">* Feature: Real-time clock-in tracking coming soon</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-emerald-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Fully Staffed Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-emerald-700">
                    {DAYS.filter(day => staff.filter(u => u.shift?.workDays?.includes(day)).length > 3).length}
                  </span>
                  <CalendarDays className="h-8 w-8 text-emerald-200" />
                </div>
                <p className="text-[10px] text-emerald-600/70 mt-1 font-medium">Days with 4+ employees</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-amber-600 uppercase tracking-widest">Understaffed Warning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-amber-700">
                    {DAYS.filter(day => staff.filter(u => u.shift?.workDays?.includes(day)).length < 2).length}
                  </span>
                  <Filter className="h-8 w-8 text-amber-200" />
                </div>
                <p className="text-[10px] text-amber-600/70 mt-1 font-medium">Days with &lt; 2 employees</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" /> Weekly Roster
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white">Total: {filteredStaff.length}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-62.5">Employee</TableHead>
                    <TableHead>Shift Time</TableHead>
                    {DAYS.map(day => (
                      <TableHead key={day} className="text-center text-[10px] uppercase font-bold">{day.slice(0, 3)}</TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((user) => (
                    <TableRow key={user._id} className="hover:bg-muted/5 group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} size="sm" />
                          <div>
                            <p className="text-sm font-bold leading-none">{user.firstName} {user.lastName}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-medium">{user.employment?.designation || user.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded w-fit">
                          <Clock className="h-3 w-3" />
                          {user.shift?.startTime} - {user.shift?.endTime}
                        </div>
                      </TableCell>
                      {DAYS.map(day => {
                        const isWorking = user.shift?.workDays?.includes(day);
                        return (
                          <TableCell key={day} className="text-center">
                            <div className={cn(
                              "h-2 w-2 rounded-full mx-auto transition-transform group-hover:scale-125",
                              isWorking ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-muted-foreground/20"
                            )} />
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => router.push(`/${currentUserRole}/employees/${user._id}`)}
                            >
                              <UserCircle className="h-4 w-4 mr-2" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => router.push(`/${currentUserRole}/employees/${user._id}/edit`)}
                            >
                              <Edit2 className="h-4 w-4 mr-2" /> Edit Shift
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShiftManagement;