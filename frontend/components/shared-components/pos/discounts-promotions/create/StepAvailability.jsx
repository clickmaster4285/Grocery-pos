'use client';

import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ComboBox } from '@/components/ui/combobox';
import { Calendar, Store, X, Clock, Users, ShieldCheck } from 'lucide-react';

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

const StepAvailability = ({ 
  form, 
  isAdmin, 
  branchOptions, 
  watchIsGlobal, 
  watchBranches 
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Availability & Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Start Time
                  </FormLabel>
                  <FormControl>
                    <Input type="time" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormDescription>Happy hour start</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> End Time
                  </FormLabel>
                  <FormControl>
                    <Input type="time" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormDescription>Happy hour end</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-3 border-t pt-4">
            <FormLabel>Applicable Days</FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`day-${day}`}
                    checked={form.watch('applicableDays').includes(day)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues('applicableDays');
                      form.setValue('applicableDays', 
                        checked ? [...current, day] : current.filter(v => v !== day)
                      );
                    }}
                  />
                  <label htmlFor={`day-${day}`} className="text-xs">{day}</label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Usage Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="usageLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Usage Limit</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={field.value || ''} placeholder="Unlimited" />
                  </FormControl>
                  <FormDescription>Max times this can be used globally.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="limitPerCustomer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limit Per Customer</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>Max uses per unique customer.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Branch & System Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isAdmin ? (
            <FormField
              control={form.control}
              name="isGlobal"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Global Promotion</FormLabel>
                    <FormDescription>Applies to all branches automatically.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          ) : (
            <div className="rounded-lg border p-3 bg-muted/50">
              <FormLabel className="text-muted-foreground opacity-70">Global Promotion (Admin Only)</FormLabel>
            </div>
          )}

          {(isAdmin && !watchIsGlobal) && (
            <div className="space-y-3">
              <FormLabel>Specific Branches</FormLabel>
              <ComboBox
                items={branchOptions}
                placeholder="Search and add branches..."
                onValueChange={(val) => {
                  const current = form.getValues('applicableBranches');
                  if (val && !current.includes(val)) {
                    form.setValue('applicableBranches', [...current, val]);
                  }
                }}
              />
              
              {watchBranches.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {watchBranches.map(bid => {
                    const b = branchOptions.find(opt => opt.value === bid);
                    return (
                      <Badge key={bid} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                        {b?.label || 'Unknown Branch'}
                        <X 
                          size={14} 
                          className="cursor-pointer hover:text-destructive" 
                          onClick={() => form.setValue('applicableBranches', watchBranches.filter(v => v !== bid))}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <FormField
              control={form.control}
              name="autoApply"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="text-xs font-bold text-primary">Auto Apply</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="allowFurtherDiscounts"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="text-xs font-bold text-primary">Stackable</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="text-xs font-bold text-primary">Is Active</FormLabel>
                  <FormControl>
                    <Switch 
                      checked={field.value === 'active'} 
                      onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority (1-10)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepAvailability;
