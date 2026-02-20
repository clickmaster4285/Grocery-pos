"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect } from "react";

// Import the hook
import { useBranchLocationHook } from '@/hooks/useBranchLocationHook';

// Remove branch from formSchema as it's handled by the backend (user's branch)
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  type: z.enum([
    "AISLE",
    "RACK",
    "SHELF",
    "GONDOLA",
    "REFRIGERATOR",
    "FREEZER",
    "DISPLAY",
    "BACKROOM",
  ]),
  floor: z.coerce.number().min(0, "Floor cannot be negative.").default(0),
  direction: z.string().optional().nullable(),
  capacity: z.coerce.number().min(0, "Capacity cannot be negative.").default(0),
});

const BranchLocationForm = () => { // Removed props
  const { 
    editingLocation, 
    handleCloseForm, 
    handleSubmit: handleHookSubmit, // Renamed to avoid conflict
    isSubmitting 
  } = useBranchLocationHook();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: editingLocation // Use editingLocation from hook
      ? {
          ...editingLocation,
          floor: editingLocation.floor || 0,
          capacity: editingLocation.capacity || 0,
        }
      : {
          name: "",
          type: "BACKROOM",
          floor: 0,
          direction: "",
          capacity: 0,
        },
  });

  useEffect(() => {
    // Reset form when editingLocation changes (e.g., when opening form for new or different edit)
    if (editingLocation) {
      form.reset({
        ...editingLocation,
        floor: editingLocation.floor || 0,
        capacity: editingLocation.capacity || 0,
      });
    } else {
      form.reset({
        name: "",
        type: "BACKROOM",
        floor: 0,
        direction: "",
        capacity: 0,
      });
    }
  }, [editingLocation, form]);

  async function onSubmit(values) {
    handleHookSubmit(values); // Call the hook's handleSubmit
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Aisle 1, Backroom Shelf" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AISLE">Aisle</SelectItem>
                  <SelectItem value="RACK">Rack</SelectItem>
                  <SelectItem value="SHELF">Shelf</SelectItem>
                  <SelectItem value="GONDOLA">Gondola</SelectItem>
                  <SelectItem value="REFRIGERATOR">Refrigerator</SelectItem>
                  <SelectItem value="FREEZER">Freezer</SelectItem>
                  <SelectItem value="DISPLAY">Display</SelectItem>
                  <SelectItem value="BACKROOM">Backroom</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="floor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Floor</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="direction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Direction (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Left, Right, Center" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacity (Units)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleCloseForm} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
            {editingLocation ? "Update Location" : "Create Location"}
            </Button>
        </div>
      </form>
    </Form>
  );
}

export default BranchLocationForm;
