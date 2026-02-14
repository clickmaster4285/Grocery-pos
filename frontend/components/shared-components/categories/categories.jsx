"use client";

import { useMemo, useState } from "react";
import { Plus, Tag, Search, Layers } from "lucide-react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import CategoriesTable from "@/components/shared-components/categories/categories-table";
import CategoryModal from "@/components/shared-components/categories/category-modal";
import {
    useGetAllCategories,
    useCreateCategory,
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

    const { data, isLoading, refetch } = useGetAllCategories();
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();


    const categories = data ?? [];

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [modalState, setModalState] = useState({ isOpen: false, mode: "add", category: null });
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    // Filter categories based on search and status
    const filteredCategories = useMemo(() => {
        return categories.filter((category) => {
            const matchesSearch =
                category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                category.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                category.category_code?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "ACTIVE" && category.isActive) ||
                (statusFilter === "INACTIVE" && !category.isActive);

            const matchesType = 
                typeFilter === "all" || category.category_type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [categories, searchQuery, statusFilter, typeFilter]);

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
            refetch();
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.response?.data?.message || err.message || 'An unexpected error occurred.',
            });
        }
    };


    // Handlers for Delete Confirmation
    const confirmDeleteCategory = (categoryId) => {
        const cat = categories.find(c => c._id === categoryId);
        setCategoryToDelete(cat);
    };

    const executeDelete = async () => {
        if (!categoryToDelete) return;
        const toastId = toast.loading('Deleting category...');
        try {
            await deleteCategoryMutation.mutateAsync(categoryToDelete._id);
            toast.success('Category deleted successfully.', { id: toastId });
            setCategoryToDelete(null);
            refetch();
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.response?.data?.message || err.message || 'An unexpected error occurred.',
            });
        }
    };


    if (isLoading) {
        return <div className="p-20 text-center animate-pulse font-black text-primary text-xl uppercase tracking-tighter italic">Loading Catalog...</div>;
    }

    return (
        <div className="flex">
            <main className="flex-1">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic text-primary">Category Master</h1>
                        <p className="text-sm text-muted-foreground font-medium">
                            Classify and organize your entire product catalog
                        </p>
                    </div>
                    <Button
                        onClick={openAddModal}
                        className="gap-2 bg-primary hover:bg-primary/90 font-bold px-6 h-11 shadow-lg shadow-primary/20"
                    >
                        <Plus className="h-5 w-5" />
                        Create Category
                    </Button>
                </div>

                <div className="mb-6 flex flex-col gap-4 rounded-xl border-2 border-muted bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search code, name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 font-medium"
                            />
                        </div>

                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-40 h-10 font-bold">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="PHYSICAL">Physical</SelectItem>
                                <SelectItem value="SERVICE">Service</SelectItem>
                                <SelectItem value="DIGITAL">Digital</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40 h-10 font-bold">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="text-sm text-primary font-black uppercase tracking-tighter">
                            {filteredCategories.length} categories classified
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
                <AlertDialogContent className="border-2 border-destructive/20 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter text-destructive italic">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-foreground/80 py-4">
                            You are about to delete category <span className="text-primary font-black underline">{categoryToDelete?.name}</span>. 
                            While the data is archived, this category will no longer be available for new products.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="bg-muted/30 p-4 -mx-6 -mb-6 rounded-b-lg">
                        <AlertDialogCancel className="font-bold border-2">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={executeDelete}
                            className="bg-destructive hover:bg-destructive/90 text-white font-black uppercase tracking-widest px-8"
                        >
                            Confirm Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Categories;