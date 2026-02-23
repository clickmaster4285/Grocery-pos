'use client';

import { 
  ArrowLeft, 
  Monitor, 
  Cpu, 
  Signal, 
  Power, 
  Lock, 
  User as UserIcon, 
  Clock, 
  Banknote, 
  Wrench, 
  Printer, 
  Scan, 
  Scale, 
  DoorOpen, 
  Tv,
  Building2,
  Calendar,
  History,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  Edit
} from 'lucide-react'; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; 
import { useGetTerminalById } from '@/features/terminal.api';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/formatters';
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
    <Badge variant="outline" className={cn(config.color, "flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-widest animate-in fade-in zoom-in duration-300")}>
      {status === 'Available' && <span className="relative flex h-2 w-2 mr-1">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>}
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
};

const PeripheralItem = ({ icon: Icon, label, name, status, connectionType }) => {
  const isConnected = status === 'Connected' || status === true || status === 'OK';
  const isError = status === 'Error';

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-4">
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
          isConnected ? "bg-emerald-50 text-emerald-600" : isError ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-400"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-[13px] font-semibold text-slate-700">{name || 'Not Configured'}</p>
          {connectionType && connectionType !== 'None' && (
            <p className="text-[10px] font-medium text-slate-400">Interface: {connectionType}</p>
          )}
        </div>
      </div>
      <Badge variant="outline" className={cn(
        "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5",
        isConnected ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : isError ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-slate-100 text-slate-500 border-slate-200"
      )}>
        {isConnected ? 'Connected' : isError ? 'Error' : 'Offline'}
      </Badge>
    </div>
  );
};

const TerminalDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id, role } = params;
  const { isAdmin } = usePermissions();

  const { data: terminalResponse, isLoading, error } = useGetTerminalById(id);
  const terminal = terminalResponse?.data;

  useEffect(() => {
    if (error) {
      router.push(`/${role}/pos/terminals`);
    }
  }, [error, router, role]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-50 rounded-2xl" />
          <div className="h-64 bg-slate-50 rounded-2xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!terminal) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium">
        Terminal not found or decommissioned.
      </div>
    );
  }

  const activeSession = terminal.activeSession;

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/${role}/pos/terminals`)} 
            className="gap-2 -ml-2 text-slate-400 hover:text-slate-900 transition-all font-semibold uppercase tracking-widest text-[10px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Registers
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {terminal.name}
            </h1>
            <StatusBadge status={terminal.status} />
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <Badge variant="secondary" className="bg-slate-900 text-white font-mono text-[11px]">
              {terminal.terminalId}
            </Badge>
            <span className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> {terminal.branch?.branch_name}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5" /> {terminal.department}
            </span>
          </div>
        </div>
        
        <div className="flex gap-3">
           {isAdmin && (
             <Button 
                variant="outline"
                onClick={() => router.push(`/${role}/pos/terminals/${id}/edit`)}
                className="rounded-xl border-slate-100 shadow-sm font-bold uppercase tracking-widest text-[11px] px-6 h-12 gap-2"
             >
               <Edit className="h-4 w-4" />
               Configure Hardware
             </Button>
           )}
           <Button 
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest text-[11px] px-6 h-12 shadow-xl shadow-slate-200"
           >
             Remote Lock
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Session & Stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* Session Overview */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-900 text-white pb-6 pt-8">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Active Session</CardTitle>
                <div className={cn(
                  "p-1.5 rounded-lg bg-white/10",
                  activeSession ? "text-emerald-400" : "text-white/20"
                )}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              {activeSession ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{activeSession.userId?.firstName} {activeSession.userId?.lastName}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Started at {new Date(activeSession.openedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">Drawer Balance</p>
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(activeSession.currentDrawerBalance)}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">Transactions</p>
                      <p className="text-lg font-bold tabular-nums">{activeSession.transactionCount}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                   <p className="text-white/40 font-bold uppercase tracking-widest text-[11px] italic">No active session</p>
                   <p className="text-white/20 text-[10px] mt-1 italic font-medium">This register is currently offline.</p>
                </div>
              )}
            </CardHeader>
            {activeSession && (
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Opening Float</span>
                  <span className="font-bold text-slate-700">{formatCurrency(activeSession.openingFloat)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Last Transaction</span>
                  <span className="font-mono font-bold text-slate-700">{activeSession.lastTransactionId || 'None'}</span>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Device Information */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hardware Specification</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Device Type</p>
                  <p className="text-sm font-bold text-slate-700">{terminal.deviceType || 'Desktop'}</p>
                </div>
              </div>
              <Separator className="bg-slate-50" />
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">IP Address</p>
                  <p className="text-sm font-mono font-bold text-slate-700">{terminal.ipAddress || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">MAC Address</p>
                  <p className="text-sm font-mono font-bold text-slate-700 uppercase">{terminal.macAddress || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Software Version</p>
                  <p className="text-sm font-bold text-slate-700">v{terminal.softwareVersion || '1.0.0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Peripherals & Maintenance */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" /> Peripherals Management
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PeripheralItem 
                  icon={Printer} 
                  label="Receipt Printer" 
                  name={terminal.peripherals?.printer?.name}
                  status={terminal.peripherals?.printer?.status}
                  connectionType={terminal.peripherals?.printer?.connectionType}
                />
                <PeripheralItem 
                  icon={Scan} 
                  label="Barcode Scanner" 
                  name={terminal.peripherals?.scanner?.name}
                  status={terminal.peripherals?.scanner?.status}
                  connectionType={terminal.peripherals?.scanner?.connectionType}
                />
                <PeripheralItem 
                  icon={Scale} 
                  label="Weighing Scale" 
                  name={terminal.peripherals?.scale?.name}
                  status={terminal.peripherals?.scale?.isCalibrated ? 'Connected' : 'Error'}
                  connectionType={terminal.peripherals?.scale?.connectionType}
                />
                <PeripheralItem 
                  icon={DoorOpen} 
                  label="Cash Drawer" 
                  name="Standard RJ11"
                  status={terminal.peripherals?.cashDrawer?.isConnected ? 'Connected' : 'Offline'}
                />
                <PeripheralItem 
                  icon={Tv} 
                  label="Customer Display" 
                  name="VFD Interface"
                  status={terminal.peripherals?.customerDisplay?.isConnected ? 'Connected' : 'Offline'}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <History className="h-5 w-5 text-slate-400" /> Maintenance & Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
               <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Last Maintenance</p>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-semibold">
                          {terminal.lastMaintenanceDate ? new Date(terminal.lastMaintenanceDate).toLocaleDateString() : 'Never Maintained'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Created At</p>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-semibold">
                          {new Date(terminal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                     <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1">Security Status</p>
                       <div className="flex items-center gap-2 text-rose-700">
                         {terminal.status === 'Locked' ? (
                           <ShieldAlert className="h-4 w-4" />
                         ) : (
                           <ShieldCheck className="h-4 w-4" />
                         )}
                         <span className="text-sm font-bold uppercase">
                           {terminal.status === 'Locked' ? 'Protocol Restricted' : 'Active Protocol'}
                         </span>
                       </div>
                       <p className="text-[10px] text-rose-400 mt-2 font-medium italic">
                         Terminal is bound to registered network and MAC address.
                       </p>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TerminalDetailPage;
