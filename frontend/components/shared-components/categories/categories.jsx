"use client";

import { useMemo, useState } from "react";
import { Plus, Tag, Search } from "lucide-react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import CategoriesTable from "@/components/shared-components/categories/categories-table";
import { useGetAllCategories } from "@/features/category.api";
import { useCategoryHook } from "@/hooks/useCategoryHook"; // Import the hook for delete
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const Categories = () => {
    const router = useRouter();
    const { user } = useAuth();
    const userPrimaryRole = user?.role?.toLowerCase() || 'customer';

    const { data, isLoading } = useGetAllCategories();
    const { handleDelete } = useCategoryHook(); // Get handleDelete from the hook

    const categories = data ?? []; // Assuming data directly contains the array of categories

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    // Filter categories based on search and status
    const filteredCategories = useMemo(() => {
        return categories.filter((category) => {
            const matchesSearch =
                category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                category.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "ACTIVE" && category.isActive) ||
                (statusFilter === "INACTIVE" && !category.isActive);

            return matchesSearch && matchesStatus;
        });
    }, [categories, searchQuery, statusFilter]);

    const handleAddCategory = () => {
        router.push(`/${userPrimaryRole}/categories/create`);
    };

    const handleEditCategory = (category) => {
        router.push(`/${userPrimaryRole}/categories/${category._id}/edit`);
    };

    const confirmDeleteCategory = (categoryId) => {
        setCategoryToDelete(categoryId);
    };

    const executeDelete = async () => {
        if (categoryToDelete) {
            await handleDelete(categoryToDelete); // Call handleDelete from the hook
            setCategoryToDelete(null); // Clear the category to delete
        }
    };


    if (isLoading) {
        return <div className="p-6">Loading categories...</div>;
    }

    return (
        <div className="flex">
            <main className="flex-1">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Categories</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your product categories
                        </p>
                    </div>
                    <Button
                        onClick={handleAddCategory}
                        className="gap-2 bg-primary hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        Add Category
                    </Button>
                </div>

                <div className="mb-6 flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-37.5">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {filteredCategories.length} categor
                            {filteredCategories.length !== 1 ? "ies" : "y"} found
                        </span>
                    </div>
                </div>

                <CategoriesTable
                    categories={filteredCategories}
                    onEdit={handleEditCategory}
                    onDelete={confirmDeleteCategory} // Pass the function to confirm deletion
                    userPrimaryRole={userPrimaryRole}
                />
            </main>

            <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will toggle the status of the category. You can reactivate it later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Categories;