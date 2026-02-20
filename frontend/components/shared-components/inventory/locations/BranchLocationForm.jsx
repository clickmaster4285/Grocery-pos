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
import { useEffect } from "react";

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

const BranchLocationForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          floor: initialData.floor || 0,
          capacity: initialData.capacity || 0,
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
    // Reset form when initialData changes
    if (initialData) {
      form.reset({
        ...initialData,
        floor: initialData.floor || 0,
        capacity: initialData.capacity || 0,
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
  }, [initialData, form]);

  async function handleLocalSubmit(values) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="space-y-4">
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
              <Select onValueChange={field.onChange} value={field.value || "BACKROOM"}>
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
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
            {initialData ? "Update Location" : "Create Location"}
            </Button>
        </div>
      </form>
    </Form>
  );
}

export default BranchLocationForm;
