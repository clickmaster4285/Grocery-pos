'use client';

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatPhoneNumberForDisplay } from "@/utils/formatters";
import { usePermissions } from "@/hooks/usePermissions";

export const StaffTable = ({
  users,
  onEdit,
  onDelete,
  getStatusBadge,
  getStatusVariant,
  getRoleLabel,
}) => {
  const router = useRouter();
  const { employee, currentUserRole } = usePermissions();
  
  const canUpdateStaff = employee.database.update;
  const canDeleteStaff = employee.database.delete;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12.5"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id} className="cursor-pointer" onClick={() => router.push(`/${currentUserRole}/employees/${user._id}`)}>
              <TableCell>
                <UserAvatar user={user} size="sm" />
              </TableCell>
              <TableCell className="font-medium">
                {`${user.firstName} ${user.lastName? user.lastName:""}`}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{formatPhoneNumberForDisplay(user.phone)}</TableCell>
              <TableCell>
                <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(user)}>
                  {user.isActive ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {getStatusBadge(user)}
                </Badge>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                {(canUpdateStaff || canDeleteStaff) && ( 
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canUpdateStaff && (
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                      )}
                      {canUpdateStaff && canDeleteStaff && <DropdownMenuSeparator />}
                      {canDeleteStaff && (
                        <DropdownMenuItem
                          onClick={() => onDelete(user)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Staff
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};