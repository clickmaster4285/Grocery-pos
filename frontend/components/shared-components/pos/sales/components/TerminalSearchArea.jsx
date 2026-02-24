"use client";

import React, { useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Store, Power
} from 'lucide-react';
import { formatCurrency } from "@/utils/formatters";

const TerminalSearchArea = ({
  user,
  isAdmin,
  canSelectBranch,
  activeBranchId,
  setActiveBranchId,
  handleBranchChange,
  activeTerminal,
  setIsCloseModalOpen,
  branches,
}) => {

  const activeBranch = branches?.data?.find(b => b._id === activeBranchId);

  return (
    <div className="flex gap-3 items-center">
      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
        <Store className="h-4 w-4 text-primary" />
        {canSelectBranch ? (
          <Select value={activeBranchId} onValueChange={handleBranchChange}>
            <SelectTrigger className="h-5 w-auto min-w-28 font-semibold text-[11px] border-none p-0 focus:ring-0 shadow-none hover:text-primary transition-colors">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches?.data?.map(b => (
                <SelectItem key={b._id} value={b._id} className="text-[11px] font-medium">{b.branch_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="font-semibold text-[11px] uppercase tracking-tight">{activeBranch?.branch_name || 'My Branch'}</span>
        )}
      </div>

      {/* Live Terminal Status Badge */}
      {activeTerminal && (
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl shadow-lg border border-slate-800 shrink-0 animate-in fade-in slide-in-from-left-2 duration-500">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none mb-0.5">{activeTerminal.name}</span>
            <span className="text-[11px] font-bold text-white leading-none tabular-nums">{formatCurrency(activeTerminal.activeSession.currentDrawerBalance)}</span>
          </div>
          <button
            onClick={() => setIsCloseModalOpen(true)}
            className="ml-2 p-1.5 rounded-lg bg-white/5 hover:bg-rose-500 text-slate-400 hover:text-white transition-all group"
            title="Close Shift"
          >
            <Power className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TerminalSearchArea;