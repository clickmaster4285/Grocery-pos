import React from 'react'
import { Eye, Pencil, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { Switch } from "@/components/ui/switch";


export default function BranchesTable({ branches,
    onView,
    onEdit,
    onToggleStatus, }) {
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
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-border bg-muted/30">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Branch Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Location
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Tax Region
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Operating Hours
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Created
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {branches.map((branch) => (
                        <tr
                            key={branch._id}
                            className="transition-colors hover:bg-muted/20"
                        >
                            <td className="px-4 py-4">
                                <div className="font-medium text-foreground">
                                    {branch.branch_name}
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="text-sm text-foreground">
                                    {branch.address.city}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {branch.address.state}, {branch.address.country}
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <span className="text-sm text-foreground">
                                    {branch.tax_region || "N/A"}
                                </span>
                            </td>
                            <td className="px-4 py-4">
                                <div className="text-sm text-foreground">
                                    {formatTime(branch.opening_time)} -{" "}
                                    {formatTime(branch.closing_time)}
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <Badge
                                    variant={
                                        branch.status === "ACTIVE" ? "default" : "secondary"
                                    }
                                    className={
                                        branch.status === "ACTIVE"
                                            ? "bg-success/10 text-success hover:bg-success/20 border-success/20"
                                            : "bg-muted text-muted-foreground"
                                    }
                                >
                                    {branch.status === "ACTIVE" ? "Active" : "Inactive"}
                                </Badge>
                            </td>
                            <td className="px-4 py-4">
                                <span className="text-sm text-muted-foreground">
                                    {formatDate(branch.createdAt)}
                                </span>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-1">
                                    {/* <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onView(branch)}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-primary/10"
                                    >
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View</span>
                                    </Button> */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(branch)}
                                        className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Edit</span>
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive hover:bg-primary/10 hover:text-destructive"
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end" className="w-52">
                                                                      
                                            <DropdownMenuItem
                                                onClick={() => onToggleStatus(branch)}
                                                className="flex items-center justify-between cursor-pointer"
                                            >
                                                <span className="text-sm">
                                                    {branch.status === "ACTIVE" ? "Deactivate" : "Activate"}
                                                </span>

                                                <Switch
                                                    checked={branch.status === "ACTIVE"}
                                                    pointerEvents="none"
                                                />
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
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground">No branches found</p>
                    <p className="text-sm text-muted-foreground">
                        Add a new branch to get started
                    </p>
                </div>
            )}
        </div>
    );
}
