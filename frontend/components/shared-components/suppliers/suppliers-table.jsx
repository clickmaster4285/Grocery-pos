'use client';
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { Switch } from "@/components/ui/switch";


export default function SuppliersTable({ suppliers,
    onEdit,
    onDelete,
    userPrimaryRole,
}) {
    const router = useRouter();

    const handleRowClick = (supplierId) => {
        router.push(`/${userPrimaryRole}/suppliers/${supplierId}`);
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
                            Supplier Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Created
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {suppliers.map((supplier) => (
                        <tr
                            key={supplier._id}
                            className="transition-colors hover:bg-muted/20 cursor-pointer"
                            onClick={() => handleRowClick(supplier._id)}
                        >
                            <td className="px-4 py-4">
                                <div className="font-medium text-foreground">
                                    {supplier.name}
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="text-sm text-foreground">
                                    {supplier.description || "N/A"}
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <Badge
                                    variant={
                                        supplier.isActive ? "default" : "secondary"
                                    }
                                    className={
                                        supplier.isActive
                                            ? "bg-success/10 text-success hover:bg-success/20 border-success/20"
                                            : "bg-muted text-muted-foreground"
                                    }
                                >
                                    {supplier.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </td>
                            <td className="px-4 py-4">
                                <span className="text-sm text-muted-foreground">
                                    {formatDate(supplier.createdAt)}
                                </span>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(supplier)}
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
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent align="end" className="w-52">
                                            <DropdownMenuItem
                                                onClick={() => onDelete(supplier._id)}
                                                className="flex items-center justify-between cursor-pointer"
                                            >
                                                <span className="text-sm">
                                                    {supplier.isActive ? "Deactivate" : "Activate"}
                                                </span>
                                                <Switch
                                                    checked={supplier.isActive}
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

            {suppliers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground">No suppliers found</p>
                    <p className="text-sm text-muted-foreground">
                        Add a new supplier to get started
                    </p>
                </div>
            )}
        </div>
    );
}
