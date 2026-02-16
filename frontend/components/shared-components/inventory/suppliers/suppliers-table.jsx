'use client';
import { Pencil, Trash2, MoreVertical, User, Mail, Phone, Hash, Truck, Activity, CreditCard } from "lucide-react";
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
import { usePermissions } from "@/hooks/usePermissions";

export default function SuppliersTable({ suppliers,
    onEdit,
    onDelete,
    userPrimaryRole,
}) {
    const router = useRouter();
    const { inventory } = usePermissions();

    const canUpdateSuppliers = inventory.suppliers.update;
    const canDeleteSuppliers = inventory.suppliers.delete;

    const handleRowClick = (supplierId) => {
        router.push(`/${userPrimaryRole}/inventory/suppliers/${supplierId}`);
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
                            Supplier Entity
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <User className="h-3 w-3" /> Contact
                            </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-3 w-3" /> Terms
                            </div>
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                            Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Activity className="h-3 w-3" /> Audit
                            </div>
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-foreground">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {suppliers.map((supplier) => (
                        <tr
                            key={supplier._id}
                            className="transition-all hover:bg-muted/30 cursor-pointer group"
                            onClick={() => handleRowClick(supplier._id)}
                        >
                            <td className="px-6 py-5">
                                <Badge variant="outline" className="font-mono text-[11px] font-bold border-primary/20 text-primary bg-primary/5 px-2 py-0.5 uppercase">
                                    {supplier.supplier_code || "N/A"}
                                </Badge>
                            </td>
                            <td className="px-6 py-5">
                                <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors uppercase tracking-tight">
                                    {supplier.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium mt-0.5 flex items-center gap-1.5">
                                    <Mail className="h-2.5 w-2.5 opacity-50" />
                                    {supplier.email || "No email registry"}
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <div className="text-sm text-foreground font-semibold">
                                    {supplier.contactPerson || "Anonymous"}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                    <Phone className="h-2.5 w-2.5 opacity-50" />
                                    {supplier.phone || "No direct line"}
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border-blue-200 text-blue-600 bg-blue-50/50">
                                    {supplier.payment_terms || 'CASH'}
                                </Badge>
                            </td>
                            <td className="px-6 py-5 text-center">
                                <Badge
                                    className={`
                                        text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5
                                        ${supplier.status === "ACTIVE"
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                            : "bg-muted text-muted-foreground border-transparent"}
                                    `}
                                    variant="outline"
                                >
                                    {supplier.status}
                                </Badge>
                            </td>
                            <td className="px-6 py-5">
                                <div className="text-xs font-bold text-foreground">
                                    {supplier.createdBy?.firstName || "System"}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium">
                                    {formatDate(supplier.createdAt)}
                                </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                                {(canUpdateSuppliers || canDeleteSuppliers) && (
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
                                                {canUpdateSuppliers && (
                                                    <DropdownMenuItem
                                                        onClick={() => onEdit(supplier)}
                                                        className="flex items-center gap-2.5 cursor-pointer py-2 px-3 rounded-lg font-semibold"
                                                    >
                                                        <Pencil className="h-4 w-4 text-primary" />
                                                        <span className="text-sm">Edit Supplier</span>
                                                    </DropdownMenuItem>
                                                )}
                                                
                                                {canUpdateSuppliers && canDeleteSuppliers && <DropdownMenuSeparator className="my-1.5" />}
                                                
                                                {canDeleteSuppliers && (
                                                    <DropdownMenuItem
                                                        onClick={() => onDelete(supplier._id)}
                                                        className="flex items-center gap-2.5 cursor-pointer text-destructive focus:text-destructive py-2 px-3 rounded-lg font-semibold"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="text-sm">Delete Supplier</span>
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {suppliers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                    <div className="bg-muted/30 p-4 rounded-full">
                        <Truck className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground font-semibold text-lg">No suppliers registered</p>
                    <p className="text-sm text-muted-foreground max-w-62.5">
                        Start building your supply chain by registering your first trade partner.
                    </p>
                </div>
            )}
        </div>
    );
}
