"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  ChevronRight, 
  LayoutGrid, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  ArrowRight,
  ArrowLeft,
  Settings,
  UserPlus,
  Box,
  Truck,
  CreditCard,
  History,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const workflowSteps = [
  {
    id: "setup",
    title: "System Foundation",
    description: "Initialize your physical and human resources.",
    icon: <Settings className="w-6 h-6" />,
    color: "blue",
    tasks: [
      { name: "Register Branch", detail: "Define locations and capacities", path: "/branches" },
      { name: "Set Up Staff", detail: "Create users and assign roles/permissions", path: "/employees" },
      { name: "Define Logic", detail: "Create Categories and Brand profiles", path: "/inventory/categories" }
    ]
  },
  {
    id: "inventory",
    title: "Inventory Mastery",
    description: "Populate your catalog and track physical stock.",
    icon: <Package className="w-6 h-6" />,
    color: "orange",
    tasks: [
      { name: "Create Products", detail: "Add metadata, units, and tax rates", path: "/inventory/products" },
      { name: "Define Variants", detail: "Specify SKUs, sizes, and colors", path: "/inventory/products" },
      { name: "Stock Allocation", detail: "Assign stock to specific shelf locations", path: "/inventory/stock" }
    ]
  },
  {
    id: "operations",
    title: "Operational Flow",
    description: "Process sales and manage customer sessions.",
    icon: <ShoppingCart className="w-6 h-6" />,
    color: "green",
    tasks: [
      { name: "Open Terminal", detail: "Start a cashier shift session", path: "/pos/terminals" },
      { name: "Sales POS", detail: "Scan barcodes and process payments", path: "/pos/sales" },
      { name: "Apply Discounts", detail: "Manage coupons and active promotions", path: "/pos/discounts-promotions" }
    ]
  },
  {
    id: "management",
    title: "The Management Loop",
    description: "Monitor performance and handle adjustments.",
    icon: <BarChart3 className="w-6 h-6" />,
    color: "purple",
    tasks: [
      { name: "Sales Returns", detail: "Handle exchanges and refund logic", path: "/pos/returns" },
      { name: "Shift Reports", detail: "Audit terminal closing statements", path: "/reports/terminal-logs" },
      { name: "Analytics", detail: "Review dashboard KPIs and trends", path: "/dashboard" }
    ]
  }
];

export default function WorkflowFunnel() {
  const [activeStep, setActiveStep] = useState(workflowSteps[0].id);
  const router = useRouter();

  const currentStepData = workflowSteps.find(s => s.id === activeStep);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      <div>
        {/* Header */}
        <div className="mb-10 text-center relative">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="absolute left-0 top-0 text-slate-500 hover:text-slate-900 font-bold uppercase tracking-widest text-[10px] h-10 px-4 rounded-xl hover:bg-white shadow-sm transition-all border border-transparent hover:border-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <Badge variant="outline" className="mb-4 bg-white border-slate-200 text-slate-500 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">
                Interactive Blueprint
          </Badge>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">System Workflow Funnel</h1>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
            Understand the end-to-end logic of your supermarket ecosystem. Follow these steps to ensure data integrity and operational efficiency.
          </p>
        </div>

        {/* Funnel Progress Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 relative">
          {workflowSteps.map((step, index) => (
            <div key={step.id} className="relative group">
              <button
                onClick={() => setActiveStep(step.id)}
                className={`w-full text-left transition-all duration-300 rounded-2xl p-6 border-2 relative z-10 ${
                  activeStep === step.id
                    ? "bg-white border-orange-500 shadow-xl shadow-orange-500/10"
                    : "bg-white/50 border-slate-100 hover:border-slate-300"
                }`}
              >
                <div className={`p-3 rounded-xl inline-block mb-4 ${
                  activeStep === step.id ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {step.icon}
                </div>
                <h3 className={`font-bold text-sm uppercase tracking-wider mb-1 ${
                  activeStep === step.id ? "text-orange-600" : "text-slate-500"
                }`}>
                  Step 0{index + 1}
                </h3>
                <h2 className={`font-bold text-lg ${
                  activeStep === step.id ? "text-slate-900" : "text-slate-700"
                }`}>
                  {step.title}
                </h2>
              </button>
              
              {index < workflowSteps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 -translate-y-1/2 z-0">
                  <ChevronRight className="w-8 h-8 text-slate-200" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detailed Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Info Panel */}
                <div className="lg:col-span-5 bg-slate-900 p-10 text-white flex flex-col justify-between">
                    <div>
                        <div className="p-4 bg-white/10 rounded-2xl inline-block mb-6">
                            {React.cloneElement(currentStepData.icon, { className: "w-8 h-8 text-orange-400" })}
                        </div>
                        <h2 className="text-3xl font-bold mb-4">{currentStepData.title}</h2>
                        <p className="text-slate-400 leading-relaxed mb-8 font-medium">
                            {currentStepData.description}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span className="text-sm font-semibold">Ensures Data Integrity</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                            <AlertCircle className="w-5 h-5 text-orange-400" />
                            <span className="text-sm font-semibold">Prerequisite for Next Step</span>
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="lg:col-span-7 p-10 bg-white">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Required Actions</h3>
                  <div className="space-y-4">
                    {currentStepData.tasks.map((task, idx) => (
                      <div 
                        key={idx} 
                        className="group flex items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer"
                        onClick={() => window.location.href = task.path}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-sm group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{task.name}</h4>
                            <p className="text-xs text-slate-500 font-medium">{task.detail}</p>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="text-orange-500 hover:text-orange-600 hover:bg-transparent">
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Pro Tip</p>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        Completing the <span className="text-slate-900 font-bold">{currentStepData.title}</span> phase unlocks critical features in the system. Make sure all fields are accurately filled to avoid downstream report discrepancies.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
