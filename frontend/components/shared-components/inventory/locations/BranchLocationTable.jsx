"use client";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { useBranchLocationHook } from '@/hooks/useBranchLocationHook'; 
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
import BranchLocationForm from "./BranchLocationForm"; 

const BranchLocationTable = () => { 
  const { 
    locations, 
    isLocationsLoading, 
    handleOpenForm, 
    handleDelete, 
    canUpdate, 
    canDelete, 
    refetch, // Assuming hook provides refetch
    isFormOpen, 
    editingLocation, 
    handleCloseForm, 
    handleSubmit, 
    isSubmitting, 
  } = useBranchLocationHook();

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "floor",
      header: "Floor",
    },
    {
      accessorKey: "direction",
      header: "Direction",
    },
    {
      accessorKey: "capacity",
      header: "Capacity",
    },
    {
      accessorKey: "currentOccupancy",
      header: "Occupancy",
    },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => (row.original.isActive ? "Yes" : "No"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        // Now use handleDelete and handleOpenForm from the hook
        const location = row.original;

        return (
          <div className="flex items-center space-x-2">
            {canUpdate && (
                <Button variant="outline" size="sm" onClick={() => handleOpenForm(location)}>
                    <PencilIcon className="h-4 w-4 mr-2" /> Edit
                </Button>
            )}

            {canDelete && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <TrashIcon className="h-4 w-4 mr-2" /> Delete
                    </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        branch location.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(location._id)}>
                        Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: locations || [], // Use locations from the hook
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLocationsLoading) return <div>Loading branch locations...</div>; // Use isLocationsLoading from the hook

  return (
    <>
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                        return (
                        <TableHead key={header.id}>
                            {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                                )}
                        </TableHead>
                        );
                    })}
                    </TableRow>
                ))}
                </TableHeader>
                <TableBody>
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                    <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                    >
                        {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                        ))}
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            <div className="flex items-center justify-end space-x-2 py-4 pr-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>

        {/* Dialog for Edit Form - This will make BranchLocationTable self-contained */}
        <Dialog open={isFormOpen} onOpenChange={handleCloseForm}> 
            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle>{editingLocation ? 'Edit Branch Location' : 'Create New Branch Location'}</DialogTitle>
                </DialogHeader>
                <BranchLocationForm
                    initialData={editingLocation}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseForm}
                    isLoading={isSubmitting}
                />
            </DialogContent>
        </Dialog>
    </>
  );
}

export default BranchLocationTable;
