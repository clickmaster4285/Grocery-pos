"use client";

import { useMemo, useState } from "react";
import { Plus, Tag, Search } from "lucide-react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation'; // Still needed for page navigation (e.g. to forbidden)
import { useAuth } from '@/hooks/useAuth';
import CategoriesTable from "@/components/shared-components/categories/categories-table";
import CategoryModal from "@/components/shared-components/categories/category-modal"; // Import the modal
import {
    useGetAllCategories,
    useCreateCategory, // Import mutations for direct use
    useUpdateCategory,
    useDeleteCategory,
} from "@/features/category.api";
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
} from "@/components/ui/alert-dialog"

const Categories = () => {
    const router = useRouter();
    const { user } = useAuth();
    const userPrimaryRole = user?.role?.toLowerCase() || 'customer';

    const { data, isLoading, refetch } = useGetAllCategories(); // Add refetch from react-query
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();


    const categories = data ?? [];

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modalState, setModalState] = useState({ isOpen: false, mode: "add", category: null }); // State for the category modal
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

    // Handlers for Category Modal
    const openAddModal = () => {
        setModalState({ isOpen: true, mode: "add", category: null });
    };

    const openEditModal = (category) => {
        setModalState({ isOpen: true, mode: "edit", category: category });
    };

    const closeCategoryModal = () => {
        setModalState({ isOpen: false, mode: "add", category: null });
    };

    const handleSaveCategory = async (formData, categoryId) => {
        const toastId = toast.loading(modalState.mode === "add" ? 'Creating category...' : 'Saving category...');
        try {
            if (modalState.mode === "add") {
                await createCategoryMutation.mutateAsync(formData);
                toast.success('Category created successfully.', { id: toastId });
            } else if (modalState.mode === "edit" && categoryId) {
                await updateCategoryMutation.mutateAsync({ id: categoryId, categoryData: formData });
                toast.success('Category updated successfully.', { id: toastId });
            }
            closeCategoryModal();
            refetch(); // Refetch categories to update the table
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.message || 'An unexpected error occurred.',
            });
        }
    };


    // Handlers for Delete Confirmation
    const confirmDeleteCategory = (categoryId) => {
        setCategoryToDelete(categoryId);
    };

    const executeDelete = async () => {
        if (!categoryToDelete) return;
        const toastId = toast.loading('Deleting category...');
        try {
            await deleteCategoryMutation.mutateAsync(categoryToDelete);
            toast.success('Category status updated successfully.', { id: toastId });
            setCategoryToDelete(null); // Clear the category to delete
            refetch(); // Refetch categories to update the table
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.message || 'An unexpected error occurred.',
            });
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
                        onClick={openAddModal}
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
                    onEdit={openEditModal}
                    onDelete={confirmDeleteCategory}
                    userPrimaryRole={userPrimaryRole}
                />
            </main>

            {/* Category Modal */}
            <CategoryModal
                isOpen={modalState.isOpen}
                onClose={closeCategoryModal}
                onSave={handleSaveCategory}
                category={modalState.category}
                mode={modalState.mode}
                createCategoryMutation={createCategoryMutation}
                updateCategoryMutation={updateCategoryMutation}
            />

            {/* Delete Confirmation AlertDialog */}
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