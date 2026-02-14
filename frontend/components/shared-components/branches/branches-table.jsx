'use client';
import { Pencil, Settings, Trash2, Clock, MapPin, User, Hash, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { Switch } from "@/components/ui/switch";
import { Building2 } from "lucide-react";

export default function BranchesTable({ branches,
    onEdit,
    onToggleStatus,
    onDelete,
    userPrimaryRole,
}) {
    const router = useRouter();

    const handleRowClick = (branchId) => {
        router.push(`/${userPrimaryRole}/branches/${branchId}`);
    };

    const formatTime = (time) => {
        if (!time) return "N/A";
        const [hours, minutes] = time.split(":");
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-border bg-muted/20">
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Hash className="h-3 w-3" /> Code
                            </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Branch Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> Location
                            </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Operations
                            </div>
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                            Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <User className="h-3 w-3" /> Audit
                            </div>
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-foreground">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {branches.map((branch) => (
                        <tr
                            key={branch._id}
                            className="transition-all hover:bg-muted/30 cursor-pointer group"
                            onClick={() => handleRowClick(branch._id)}
                        >
                            <td className="px-6 py-5">
                                <Badge variant="outline" className="font-mono text-[11px] font-bold border-primary/20 text-primary bg-primary/5 px-2 py-0.5">
                                    {branch.branch_code || "N/A"}
                                </Badge>
                            </td>
                            <td className="px-6 py-5">
                                <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                                    {branch.branch_name}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                                    {branch.tax_region || "Global Region"}
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <div className="text-sm text-foreground font-semibold">
                                    {branch.address?.city}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-medium">
                                    {branch.address?.state}, {branch.address?.country}
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <div className="text-xs text-foreground font-semibold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {formatTime(branch.opening_time)}
                                </div>
                                <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    {formatTime(branch.closing_time)}
                                </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                                <Badge
                                    variant={branch.status === "ACTIVE" ? "default" : "secondary"}
                                    className={`
                                        text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5
                                        ${branch.status === "ACTIVE"
                                            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200"
                                            : "bg-muted text-muted-foreground border-transparent"}
                                    `}
                                >
                                    {branch.status}
                                </Badge>
                            </td>
                            <td className="px-6 py-5">
                                <div className="text-xs font-bold text-foreground">
                                    {branch.createdBy?.firstName || "System Admin"}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium">
                                    {formatDate(branch.createdAt)}
                                </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl shadow-xl border-border/50">
                                            <DropdownMenuItem
                                                onClick={() => onEdit(branch)}
                                                className="flex items-center gap-2.5 cursor-pointer py-2 px-3 rounded-lg font-semibold"
                                            >
                                                <Pencil className="h-4 w-4 text-primary" />
                                                <span className="text-sm">Edit Branch</span>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                onClick={() => onToggleStatus(branch)}
                                                className="flex items-center justify-between cursor-pointer py-2 px-3 rounded-lg"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-semibold">
                                                        {branch.status === "ACTIVE" ? "Deactivate" : "Activate"}
                                                    </span>
                                                </div>
                                                <Switch
                                                    checked={branch.status === "ACTIVE"}
                                                    className="scale-75 origin-right"
                                                    pointerEvents="none"
                                                />
                                            </DropdownMenuItem>
                                            
                                            <DropdownMenuSeparator className="my-1.5" />
                                            
                                            <DropdownMenuItem
                                                onClick={() => onDelete(branch)}
                                                className="flex items-center gap-2.5 cursor-pointer text-destructive focus:text-destructive py-2 px-3 rounded-lg font-semibold"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="text-sm">Delete Branch</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {branches.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                    <div className="bg-muted/30 p-4 rounded-full">
                        <Building2 className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground font-semibold text-lg">No active branches found</p>
                    <p className="text-sm text-muted-foreground max-w-62.5">
                        Start by creating your first branch location to manage inventory and sales.
                    </p>
                </div>
            )}
        </div>
    );
}
