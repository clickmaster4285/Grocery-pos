"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { DataTable } from "@/components/ui/data-table"; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor("description", {
    header: "Description",
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("isActive", {
    header: "Status",
    cell: (info) =>
      info.getValue() ? (
        <Badge variant="success" className="capitalize">
          Active
        </Badge>
      ) : (
        <Badge variant="destructive" className="capitalize">
          Inactive
        </Badge>
      ),
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (info) => {
      const category = info.row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => info.table.options.meta?.onView(category)}>
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => info.table.options.meta?.onEdit(category)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => info.table.options.meta?.onDelete(category._id)}>
              {category.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
];

const CategoryTable = ({ categories, onView, onEdit, onDelete }) => {
  return (
    <DataTable
      columns={columns}
      data={categories}
      meta={{
        onView,
        onEdit,
        onDelete,
      }}
    />
  );
};

export default CategoryTable;
