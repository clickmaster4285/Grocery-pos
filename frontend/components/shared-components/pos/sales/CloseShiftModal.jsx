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
  Power, 
  Banknote, 
  ClipboardCheck, 
  AlertCircle,
  TrendingUp,
  Scale
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const CloseShiftModal = ({ 
  isOpen, 
  onClose,
  activeSession,
  onCloseShift,
  isLoading
}) => {
  const [actualCash, setActualCash] = useState("");
  const [notes, setNotes] = useState("");

  const expectedCash = activeSession?.currentDrawerBalance || 0;
  const variance = Number(actualCash) - expectedCash;

  const handleClose = () => {
    onCloseShift(Number(actualCash), notes);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-none shadow-2xl p-0 overflow-hidden rounded-2xl bg-white">
        <DialogHeader className="p-8 bg-rose-600 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Power className="h-32 w-32" />
          </div>
          <div className="relative z-10 space-y-2">
            <Badge className="bg-white/20 text-white border-none text-[10px] font-bold uppercase tracking-widest px-2 mb-2">
              End of Day Protocol
            </Badge>
            <DialogTitle className="text-2xl font-bold">Close Register Session</DialogTitle>
            <DialogDescription className="text-rose-100 text-sm font-medium">
              Perform physical cash count and reconcile with system records.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {/* Session Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Expected Cash</span>
              <p className="text-lg font-bold text-slate-700 tabular-nums">{formatCurrency(expectedCash)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Trans.</span>
              <p className="text-lg font-bold text-slate-700 tabular-nums">{activeSession?.transactionCount || 0}</p>
            </div>
          </div>

          {/* Actual Cash Entry */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <Scale className="h-4 w-4" />
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Actual Physical Cash</Label>
            </div>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg group-focus-within:text-primary transition-colors">
                Rs.
              </div>
              <Input
                type="number"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="h-14 pl-12 rounded-xl border-slate-100 bg-slate-50/50 text-xl font-bold tracking-tight focus-visible:ring-primary/10 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Variance Indicator */}
          {actualCash !== "" && (
            <div className={cn(
              "p-4 rounded-xl border flex items-center justify-between animate-in slide-in-from-top-2",
              variance === 0 ? "bg-emerald-50 border-emerald-100 text-emerald-700" : 
              variance > 0 ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-rose-50 border-rose-100 text-rose-700"
            )}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/50">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest block opacity-60">Cash Variance</span>
                  <span className="text-sm font-bold tabular-nums">{formatCurrency(variance)}</span>
                </div>
              </div>
              {variance !== 0 && <AlertCircle className="h-5 w-5 opacity-40" />}
            </div>
          )}

          {/* Closing Notes */}
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 px-1">Closing Notes / Remarks</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Variance due to small change missing..."
              className="w-full min-h-24 p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-14 px-6 font-semibold text-slate-500"
          >
            Cancel
          </Button>
          <Button
            disabled={actualCash === "" || isLoading}
            onClick={handleClose}
            className="flex-1 h-14 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase tracking-[0.2em] shadow-xl shadow-rose-200 group transition-all"
          >
            {isLoading ? (
              "Closing Session..."
            ) : (
              <div className="flex items-center justify-center gap-2">
                <ClipboardCheck className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Confirm & Close Shift
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Badge = ({ children, className }) => (
  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
    {children}
  </span>
);

export default CloseShiftModal;
