"use client";

import { Edit2, Trash2, MoreVertical, Monitor, Signal, Power, Lock, User, DollarSign, Wrench, Cpu, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";

const StatusBadge = ({ status }) => {
  const configs = {
    Available: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Signal, label: "Live" },
    Occupied: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Monitor, label: "Busy" },
    Locked: { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Lock, label: "Away" },
    Closed: { color: "bg-slate-500/10 text-slate-600 border-slate-500/20", icon: Power, label: "Offline" },
    Maintenance: { color: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: Wrench, label: "Repair" },
  };

  const config = configs[status] || configs.Closed;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-[11px] uppercase tracking-wider animate-in fade-in zoom-in duration-300`}>
      {status === 'Available' && <span className="relative flex h-1.5 w-1.5 mr-0.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
      </span>}
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

const TerminalsTable = ({ terminals, onEdit, onDelete }) => {
  const router = useRouter();
  const { currentUserRole } = usePermissions();

  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="w-62.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Terminal & Identity</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Location / Branch</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Current Session</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Drawer Balance</TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</TableHead>
            <TableHead className="text-right text-[11px] font-bold uppercase tracking-widest text-slate-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {terminals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium italic">
                No active terminals found matching your criteria.
              </TableCell>
            </TableRow>
          ) : (
            terminals.map((terminal) => (
              <TableRow key={terminal._id} className="group h-16 hover:bg-slate-50/50 transition-colors border-slate-100">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-slate-700">{terminal.name}</span>
                    <span className="text-[10px] font-medium text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Cpu className="h-3 w-3" /> {terminal.terminalId}
                      {terminal.ipAddress && <span className="opacity-50">| IP: {terminal.ipAddress}</span>}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-slate-600">{terminal.branch?.branch_name || "Unassigned"}</span>
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-tighter">{terminal.department}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {terminal.activeSession ? (
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-semibold text-slate-700 leading-none">
                          {terminal.activeSession.userId?.firstName} {terminal.activeSession.userId?.lastName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Since {new Date(terminal.activeSession.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-300 font-medium italic">No active session</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className={`text-[13px] font-bold tabular-nums ${terminal.activeSession ? 'text-slate-700' : 'text-slate-300'}`}>
                      {terminal.activeSession ? formatCurrency(terminal.activeSession.currentDrawerBalance) : "—"}
                    </span>
                    {terminal.activeSession?.transactionCount > 0 && (
                      <span className="text-[10px] font-medium text-slate-400">{terminal.activeSession.transactionCount} Trans.</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={terminal.status} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-white hover:shadow-sm">
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 shadow-xl">
                      <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Management</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/${currentUserRole}/pos/terminals/${terminal._id}`)} className="flex items-center gap-2 py-2.5 cursor-pointer rounded-lg">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600">View Details</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(terminal)} className="flex items-center gap-2 py-2.5 cursor-pointer rounded-lg">
                        <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600">Configure Hardware</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 py-2.5 cursor-pointer rounded-lg">
                        <Monitor className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600">Peripheral Status</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-50" />
                      <DropdownMenuItem onClick={() => onDelete(terminal)} className="flex items-center gap-2 py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5 rounded-lg">
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Decommission</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TerminalsTable;
