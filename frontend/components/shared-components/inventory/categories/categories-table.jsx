'use client';
import { Pencil, Trash2, Tag, Layers, MoreVertical, ShieldCheck, Activity } from "lucide-react";
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

export default function CategoriesTable({ categories,
    onEdit,
    onDelete,
    userPrimaryRole,
}) {
    const router = useRouter();
    const { inventory } = usePermissions();

    const canUpdateCategories = inventory.categories.update;
    const canDeleteCategories = inventory.categories.delete;

    const handleRowClick = (categoryId) => {
        router.push(`/${userPrimaryRole}/inventory/categories/${categoryId}`);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'PHYSICAL': return 'bg-blue-500/10 text-blue-600 border-blue-200';
            case 'SERVICE': return 'bg-purple-500/10 text-purple-600 border-purple-200';
            case 'DIGITAL': return 'bg-amber-500/10 text-amber-600 border-amber-200';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-border bg-muted/20">
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Tag className="h-3 w-3" /> Code
                            </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Category Identity
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Layers className="h-3 w-3" /> Classification
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
                    {categories.map((category) => (
                        <tr
                            key={category._id}
                            className="transition-all hover:bg-muted/30 cursor-pointer group"
                            onClick={() => handleRowClick(category._id)}
                        >
                            <td className="px-6 py-5">
                                <Badge variant="outline" className="font-mono text-[11px] font-bold border-primary/20 text-primary bg-primary/5 px-2 py-0.5 uppercase">
                                    {category.category_code || "N/A"}
                                </Badge>
                            </td>
                            <td className="px-6 py-5">
                                <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                                    {category.name}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-medium mt-0.5 line-clamp-1 max-w-50">
                                    {category.description || "No descriptive metadata"}
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${getTypeColor(category.category_type)}`}>
                                    {category.category_type || 'PHYSICAL'}
                                </Badge>
                            </td>
                            <td className="px-6 py-5 text-center">
                                <Badge
                                    className={`
                                        text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5
                                        ${category.isActive
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                            : "bg-muted text-muted-foreground border-transparent"}
                                    `}
                                    variant="outline"
                                >
                                    {category.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </td>
                            <td className="px-6 py-5">
                                <div className="text-xs font-bold text-foreground">
                                    {category.createdBy?.firstName || "System"}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-medium">
                                    {formatDate(category.createdAt)}
                                </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                                {(canUpdateCategories || canDeleteCategories) && (
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
                                                {canUpdateCategories && (
                                                    <DropdownMenuItem
                                                        onClick={() => onEdit(category)}
                                                        className="flex items-center gap-2.5 cursor-pointer py-2 px-3 rounded-lg font-semibold"
                                                    >
                                                        <Pencil className="h-4 w-4 text-primary" />
                                                        <span className="text-sm">Edit Category</span>
                                                    </DropdownMenuItem>
                                                )}
                                                
                                                {canUpdateCategories && canDeleteCategories && <DropdownMenuSeparator className="my-1.5" />}
                                                
                                                {canDeleteCategories && (
                                                    <DropdownMenuItem
                                                        onClick={() => onDelete(category._id)}
                                                        className="flex items-center gap-2.5 cursor-pointer text-destructive focus:text-destructive py-2 px-3 rounded-lg font-semibold"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="text-sm">Delete Category</span>
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

            {categories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                    <div className="bg-muted/30 p-4 rounded-full">
                        <Layers className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground font-semibold text-lg">No categories found</p>
                    <p className="text-sm text-muted-foreground max-w-62.5">
                        Initialize your product catalog by creating your first classification node.
                    </p>
                </div>
            )}
        </div>
    );
}
