"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  MonitorSmartphone, 
  Banknote, 
  Clock, 
  Unlock, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ShiftModal = ({ 
  isOpen, 
  terminals = [], 
  onOpenShift, 
  isLoading,
  userFirstName
}) => {
  const [selectedTerminal, setSelectedTerminal] = useState("");
  const [openingFloat, setOpeningFloat] = useState("0");

  const handleOpen = () => {
    if (!selectedTerminal) return;
    onOpenShift(selectedTerminal, Number(openingFloat));
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md border-none shadow-2xl p-0 overflow-hidden rounded-2xl bg-white">
        <DialogHeader className="p-8 bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <MonitorSmartphone className="h-32 w-32" />
          </div>
          <div className="relative z-10 space-y-2">
            <Badge className="bg-primary/20 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-2 mb-2">
              Security Protocol Active
            </Badge>
            <DialogTitle className="text-2xl font-bold">Good Day, {userFirstName}!</DialogTitle>
            <DialogDescription className="text-slate-400 text-sm font-medium">
              Please select your assigned terminal and verify the starting cash drawer balance.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {/* Terminal Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <MonitorSmartphone className="h-4 w-4" />
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Assigned Register</Label>
            </div>
            <Select value={selectedTerminal} onValueChange={setSelectedTerminal}>
              <SelectTrigger className="h-14 rounded-xl border-slate-100 bg-slate-50/50 focus:ring-primary/10 transition-all text-sm font-semibold">
                <SelectValue placeholder="Select your terminal..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                {terminals.map(term => (
                  <SelectItem key={term._id} value={term._id} disabled={term.status !== 'Closed'}>
                    <div className="flex items-center justify-between w-full min-w-75">
                      <span className="font-semibold">{term.name}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase ml-4",
                        term.status === 'Closed' ? "bg-slate-100 text-slate-500" : "bg-rose-50 text-rose-500"
                      )}>
                        {term.status === 'Closed' ? 'Ready' : 'Occupied'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                {terminals.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground italic">
                    No registers available for your account.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Opening Float */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <Banknote className="h-4 w-4" />
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Opening Cash Float (PKR)</Label>
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg group-focus-within:text-primary transition-colors">
                Rs.
              </div>
              <Input
                type="number"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                className="h-14 pl-12 rounded-xl border-slate-100 bg-slate-50/50 text-xl font-bold tracking-tight focus-visible:ring-primary/10 transition-all"
                placeholder="0.00"
              />
            </div>
            <p className="text-[10px] text-muted-foreground italic px-1 flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Verify physical cash before confirming.
            </p>
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100">
          <Button
            disabled={!selectedTerminal || isLoading}
            onClick={handleOpen}
            className="w-full h-14 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-[0.2em] shadow-xl shadow-slate-200 group transition-all"
          >
            {isLoading ? (
              "Initializing..."
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Unlock className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Unlock Terminal & Begin Shift
                <ChevronRight className="h-4 w-4 ml-1 opacity-50" />
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Internal Badge shim if not available
const Badge = ({ children, className }) => (
  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
    {children}
  </span>
);

export default ShiftModal;
