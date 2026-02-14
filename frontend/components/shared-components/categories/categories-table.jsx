'use client';
import { Pencil, Trash2, Tag, Layers } from "lucide-react";
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


export default function CategoriesTable({ categories,
    onEdit,
    onDelete,
    userPrimaryRole,
}) {
    const router = useRouter();

    const handleRowClick = (categoryId) => {
        router.push(`/${userPrimaryRole}/categories/${categoryId}`);
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
            case 'PHYSICAL': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'SERVICE': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'DIGITAL': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-border bg-muted/30">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Category Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Audit Info
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {categories.map((category) => (
                        <tr
                            key={category._id}
                            className="transition-colors hover:bg-muted/20 cursor-pointer"
                            onClick={() => handleRowClick(category._id)}
                        >
                            <td className="px-4 py-4">
                                <div className="font-mono text-xs font-bold text-primary">
                                    {category.category_code || "N/A"}
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="font-bold text-foreground">
                                    {category.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground line-clamp-1 max-w-50">
                                    {category.description || "No description"}
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <Badge variant="outline" className={`text-[10px] font-black ${getTypeColor(category.category_type)}`}>
                                    {category.category_type || 'PHYSICAL'}
                                </Badge>
                            </td>
                            <td className="px-4 py-4">
                                <Badge
                                    variant={
                                        category.isActive ? "default" : "secondary"
                                    }
                                    className={
                                        category.isActive
                                            ? "bg-success/10 text-success hover:bg-success/20 border-success/20 font-bold"
                                            : "bg-muted text-muted-foreground font-bold"
                                    }
                                >
                                    {category.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </td>
                            <td className="px-4 py-4">
                                <div className="text-xs font-bold text-foreground">
                                    {category.createdBy?.firstName || "System"}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                    {formatDate(category.createdAt)}
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(category)}
                                        className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Edit</span>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDelete(category._id)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {categories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground font-bold">No categories found</p>
                    <p className="text-sm text-muted-foreground">
                        Add a new category to get started
                    </p>
                </div>
            )}
        </div>
    );
}
