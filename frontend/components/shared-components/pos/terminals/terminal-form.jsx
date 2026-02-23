"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { useGetAllBranches } from "@/features/branch.api";
import { Monitor, Printer, Scan, Scale, Shield, Network, ArrowLeft, Save, Trash2, Cpu, CreditCard, MonitorPlay } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";

const TerminalForm = ({
   initialData,
   onSubmit,
   isSubmitting,
   isAdmin,
   selectedBranchId,
}) => {
   const router = useRouter();
   const { data: branchesResponse } = useGetAllBranches({ enabled: isAdmin });
   const branches = branchesResponse?.data || [];

   const [formData, setFormData] = useState({
      name: "",
      branch: "",
      department: "General",
      deviceType: "Desktop",
      ipAddress: "",
      macAddress: "",
      peripherals: {
         printer: { name: "", connectionType: "None", status: "Disconnected" },
         scanner: { name: "", connectionType: "None", status: "Disconnected" },
         scale: { name: "", connectionType: "None", isCalibrated: false },
         cashDrawer: { isConnected: false },
         customerDisplay: { isConnected: false },
      },
      softwareVersion: "1.0.0",
      status: "Closed",
   });

   useEffect(() => {
      if (initialData) {
         setFormData({
            name: initialData.name || "",
            branch: initialData.branch?._id || initialData.branch || "",
            department: initialData.department || "General",
            deviceType: initialData.deviceType || "Desktop",
            ipAddress: initialData.ipAddress || "",
            macAddress: initialData.macAddress || "",
            peripherals: {
               printer: initialData.peripherals?.printer || { name: "", connectionType: "None", status: "Disconnected" },
               scanner: initialData.peripherals?.scanner || { name: "", connectionType: "None", status: "Disconnected" },
               scale: initialData.peripherals?.scale || { name: "", connectionType: "None", isCalibrated: false },
               cashDrawer: initialData.peripherals?.cashDrawer || { isConnected: false },
               customerDisplay: initialData.peripherals?.customerDisplay || { isConnected: false },
            },
            softwareVersion: initialData.softwareVersion || "1.0.0",
            status: initialData.status || "Closed",
         });
      } else {
         setFormData(prev => ({
            ...prev,
            branch: selectedBranchId || "",
         }));
      }
   }, [initialData, selectedBranchId]);

   const handleFormSubmit = (e) => {
      e.preventDefault();

      const finalBranchId = formData.branch || selectedBranchId;

      if (isAdmin && !finalBranchId) {
         return toast.error("Branch selection is required for admins.");
      }

      const submissionData = {
         ...formData,
         branch: finalBranchId
      };

      onSubmit(submissionData);
   };

   const updatePeripheral = (type, field, value) => {
      setFormData(prev => ({
         ...prev,
         peripherals: {
            ...prev.peripherals,
            [type]: {
               ...prev.peripherals[type],
               [field]: value
            }
         }
      }));
   };

   const updatePeripheralToggle = (type, field, value) => {
      setFormData(prev => ({
         ...prev,
         peripherals: {
            ...prev.peripherals,
            [type]: {
               ...prev.peripherals[type],
               [field]: value
            }
         }
      }));
   };

   return (
      <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="rounded-full hover:bg-slate-100 transition-colors"
               >
                  <ArrowLeft className="h-5 w-5" />
               </Button>
               <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                     {initialData ? "Configure Hardware" : "Register New Terminal"}
                  </h1>
                  <p className="text-slate-500 font-medium">
                     {initialData ? `Updating configuration for ${initialData.terminalId}` : "Set up a new POS workstation in the network."}
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="rounded-xl font-bold uppercase tracking-widest px-6"
               >
                  Cancel
               </Button>
               <Button
                  onClick={handleFormSubmit}
                  disabled={isSubmitting}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest px-8 shadow-lg shadow-slate-200"
               >
                  {isSubmitting ? "Processing..." : initialData ? "Save Config" : "Register Hardware"}
               </Button>
            </div>
         </div>

         <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               {/* Section 1: Identity & Parameters */}
               <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                     <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <Shield className="h-5 w-5" />
                     </div>
                     <h3 className="text-lg font-bold text-slate-800">Identity & Location</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Terminal Name</Label>
                        <Input
                           required
                           placeholder="e.g. Lane 01 Front"
                           value={formData.name}
                           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                           className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Department</Label>
                        <Input
                           placeholder="e.g. Bakery / General"
                           value={formData.department}
                           onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                           className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium"
                        />
                     </div>
                     {isAdmin && (
                        <div className="space-y-2">
                           <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Assigned Branch</Label>
                           <Select
                              value={formData.branch}
                              onValueChange={(val) => setFormData({ ...formData, branch: val })}
                           >
                              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium">
                                 <SelectValue placeholder="Select Branch" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                                 {branches.map(b => (
                                    <SelectItem key={b._id} value={b._id} className="py-3">{b.branch_name}</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                     )}
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Hardware Status</Label>
                        <Select
                           value={formData.status}
                           onValueChange={(val) => setFormData({ ...formData, status: val })}
                        >
                           <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                              <SelectItem value="Available">Available / Online</SelectItem>
                              <SelectItem value="Maintenance">Maintenance Mode</SelectItem>
                              <SelectItem value="Closed">Closed / Locked</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
               </div>

               {/* Section 2: Connectivity */}
               <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                     <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <Network className="h-5 w-5" />
                     </div>
                     <h3 className="text-lg font-bold text-slate-800">Network Whitelist</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Internal IP Address</Label>
                        <Input
                           placeholder="192.168.1.XX"
                           value={formData.ipAddress}
                           onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                           className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-mono tracking-wider"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Hardware MAC Address</Label>
                        <Input
                           placeholder="00:00:00:00:00:00"
                           value={formData.macAddress}
                           onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                           className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-mono tracking-wider"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Workstation Type</Label>
                        <Select
                           value={formData.deviceType}
                           onValueChange={(val) => setFormData({ ...formData, deviceType: val })}
                        >
                           <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                              <SelectItem value="Desktop">Desktop Station</SelectItem>
                              <SelectItem value="Tablet">Tablet / Handheld</SelectItem>
                              <SelectItem value="Kiosk">Self-Service Kiosk</SelectItem>
                              <SelectItem value="Mobile">Mobile Application</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Firmware/Software Version</Label>
                        <Input
                           placeholder="1.0.0"
                           value={formData.softwareVersion}
                           onChange={(e) => setFormData({ ...formData, softwareVersion: e.target.value })}
                           className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all text-sm font-medium"
                        />
                     </div>
                  </div>
               </div>
            </div>

            {/* Section 3: Peripherals Sidebar */}
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                     <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                        <Cpu className="h-5 w-5" />
                     </div>
                     <h3 className="text-lg font-bold text-slate-800">Peripherals</h3>
                  </div>

                  <div className="space-y-6">
                     {/* Receipt Printer */}
                     <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 text-slate-600">
                              <Printer className="h-4 w-4" />
                              <span className="text-[11px] font-bold uppercase tracking-wider">Receipt Printer</span>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <Input
                              placeholder="Model/Service Name"
                              value={formData.peripherals.printer.name}
                              onChange={(e) => updatePeripheral('printer', 'name', e.target.value)}
                              className="h-10 rounded-lg bg-white border-slate-100 text-xs font-medium"
                           />
                           <Select
                              value={formData.peripherals.printer.connectionType}
                              onValueChange={(val) => updatePeripheral('printer', 'connectionType', val)}
                           >
                              <SelectTrigger className="h-10 rounded-lg bg-white border-slate-100 text-xs font-medium">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="None">Not Connected</SelectItem>
                                 <SelectItem value="USB">USB Connection</SelectItem>
                                 <SelectItem value="Ethernet">Network (IP)</SelectItem>
                                 <SelectItem value="Bluetooth">Bluetooth</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                     </div>

                     {/* Barcode Scanner */}
                     <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 text-slate-600">
                           <Scan className="h-4 w-4" />
                           <span className="text-[11px] font-bold uppercase tracking-wider">Barcode Scanner</span>
                        </div>
                        <Select
                           value={formData.peripherals.scanner.connectionType}
                           onValueChange={(val) => updatePeripheral('scanner', 'connectionType', val)}
                        >
                           <SelectTrigger className="h-10 rounded-lg bg-white border-slate-100 text-xs font-medium">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="None">Disabled</SelectItem>
                              <SelectItem value="USB">USB / HID Mode</SelectItem>
                              <SelectItem value="Bluetooth">Wireless Link</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     {/* Digital Scale */}
                     <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 text-slate-600">
                           <Scale className="h-4 w-4" />
                           <span className="text-[11px] font-bold uppercase tracking-wider">Weight Scale</span>
                        </div>
                        <Select
                           value={formData.peripherals.scale.connectionType}
                           onValueChange={(val) => updatePeripheral('scale', 'connectionType', val)}
                        >
                           <SelectTrigger className="h-10 rounded-lg bg-white border-slate-100 text-xs font-medium">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="None">No Scale</SelectItem>
                              <SelectItem value="USB">USB Protocol</SelectItem>
                              <SelectItem value="Serial">RS232 Serial</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     {/* Additional Options */}
                     <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between p-1">
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                                 <CreditCard className="h-4 w-4" />
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-slate-700">Cash Drawer</p>
                                 <p className="text-[10px] text-slate-400 font-medium tracking-tight whitespace-nowrap">Auto-opening on cash sale</p>
                              </div>
                           </div>
                           <Switch
                              checked={formData.peripherals.cashDrawer.isConnected}
                              onCheckedChange={(val) => updatePeripheralToggle('cashDrawer', 'isConnected', val)}
                           />
                        </div>

                        <div className="flex items-center justify-between p-1">
                           <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                                 <MonitorPlay className="h-4 w-4" />
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-slate-700">Customer Display</p>
                                 <p className="text-[10px] text-slate-400 font-medium tracking-tight">Secondary Pole Display</p>
                              </div>
                           </div>
                           <Switch
                              checked={formData.peripherals.customerDisplay.isConnected}
                              onCheckedChange={(val) => updatePeripheralToggle('customerDisplay', 'isConnected', val)}
                           />
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-900 p-6 rounded-2xl text-white space-y-4 relative overflow-hidden shadow-xl shadow-slate-200">
                  <div className="relative z-10">
                     <h4 className="font-bold text-sm tracking-widest uppercase mb-2 text-indigo-400 flex items-center gap-2">
                        <Shield className="h-3 w-3" /> Security Note
                     </h4>
                     <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
                        IP and MAC binding ensures that only authorized hardware can process financial transactions. Changes to these parameters will require a security re-authorization by an administrator.
                     </p>
                  </div>
                  <div className="absolute -right-8 -bottom-8 opacity-10">
                     <Database className="h-32 w-32" />
                  </div>
               </div>
            </div>
         </form>
      </div>
   );
};

export default TerminalForm;
