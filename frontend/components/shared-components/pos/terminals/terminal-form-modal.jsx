"use client";

import { useEffect, useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
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
import { Monitor, Printer, Scan, Scale, Shield, Network } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const TerminalFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
  isAdmin,
  selectedBranchId,
  setSelectedBranchId
}) => {
  const { data: branchesResponse } = useGetAllBranches({ enabled: isOpen && isAdmin });
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
    },
    softwareVersion: "1.0.0",
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
        peripherals: initialData.peripherals || {
          printer: { name: "", connectionType: "None", status: "Disconnected" },
          scanner: { name: "", connectionType: "None", status: "Disconnected" },
          scale: { name: "", connectionType: "None", isCalibrated: false },
        },
        softwareVersion: initialData.softwareVersion || "1.0.0",
      });
    } else {
      setFormData(prev => ({
        ...prev,
        branch: selectedBranchId || "",
      }));
    }
  }, [initialData, isOpen, selectedBranchId]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-2xl border-none shadow-2xl p-0 overflow-hidden rounded-2xl bg-white">
        <DialogHeader className="p-6 bg-slate-900 text-white">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            {initialData ? "Hardware Configuration" : "New Terminal Registration"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit}>
          <ScrollArea className="max-h-[70vh] p-6">
            <div className="space-y-8">
              {/* Section 1: Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900">
                  <Shield className="h-4 w-4" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Identity & Location</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-tight text-slate-500">Terminal Name</Label>
                    <Input
                      required
                      placeholder="e.g. Lane 01 Front"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-tight text-slate-500">Department</Label>
                    <Input
                      placeholder="e.g. Bakery / General"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50 border-slate-100"
                    />
                  </div>
                  {isAdmin && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-tight text-slate-500">Assigned Branch</Label>
                      <Select 
                        value={formData.branch} 
                        onValueChange={(val) => setFormData({ ...formData, branch: val })}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100">
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          {branches.map(b => (
                            <SelectItem key={b._id} value={b._id}>{b.branch_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-tight text-slate-500">Device Type</Label>
                    <Select 
                      value={formData.deviceType} 
                      onValueChange={(val) => setFormData({ ...formData, deviceType: val })}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="Desktop">Desktop Station</SelectItem>
                        <SelectItem value="Tablet">Tablet / Handheld</SelectItem>
                        <SelectItem value="Kiosk">Self-Service Kiosk</SelectItem>
                        <SelectItem value="Mobile">Mobile App</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 2: Connectivity */}
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-900">
                  <Network className="h-4 w-4" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Network Whitelist</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-tight text-slate-500">IP Address</Label>
                    <Input
                      placeholder="192.168.1.XX"
                      value={formData.ipAddress}
                      onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50 border-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-tight text-slate-500">MAC Address</Label>
                    <Input
                      placeholder="00:00:00:00:00:00"
                      value={formData.macAddress}
                      onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                      className="h-11 rounded-xl bg-slate-50 border-slate-100 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Peripherals */}
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-900">
                  <Monitor className="h-4 w-4" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Peripherals</h3>
                </div>
                
                {/* Printer */}
                <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Printer className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase">Receipt Printer</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Model Name"
                      value={formData.peripherals.printer.name}
                      onChange={(e) => updatePeripheral('printer', 'name', e.target.value)}
                      className="h-10 rounded-lg bg-white border-slate-100 text-xs"
                    />
                    <Select 
                      value={formData.peripherals.printer.connectionType} 
                      onValueChange={(val) => updatePeripheral('printer', 'connectionType', val)}
                    >
                      <SelectTrigger className="h-10 rounded-lg bg-white border-slate-100 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">No Printer</SelectItem>
                        <SelectItem value="USB">USB Connection</SelectItem>
                        <SelectItem value="Ethernet">Network (IP)</SelectItem>
                        <SelectItem value="Bluetooth">Bluetooth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Scanner & Scale */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Scan className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase">Barcode Scanner</span>
                    </div>
                    <Select 
                      value={formData.peripherals.scanner.connectionType} 
                      onValueChange={(val) => updatePeripheral('scanner', 'connectionType', val)}
                    >
                      <SelectTrigger className="h-10 rounded-lg bg-white border-slate-100 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">Disabled</SelectItem>
                        <SelectItem value="USB">USB / HID</SelectItem>
                        <SelectItem value="Bluetooth">Wireless</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 space-y-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Scale className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase">Digital Scale</span>
                    </div>
                    <Select 
                      value={formData.peripherals.scale.connectionType} 
                      onValueChange={(val) => updatePeripheral('scale', 'connectionType', val)}
                    >
                      <SelectTrigger className="h-10 rounded-lg bg-white border-slate-100 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">Disabled</SelectItem>
                        <SelectItem value="USB">USB Interface</SelectItem>
                        <SelectItem value="Serial">Serial Port</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl font-semibold text-slate-500 hover:bg-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest px-8"
            >
              {isSubmitting ? "Processing..." : initialData ? "Save Config" : "Register Hardware"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TerminalFormModal;
