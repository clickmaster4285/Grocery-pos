'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PersonalDetails } from "./PersonalDetails";
import { EmploymentDetails } from "./EmploymentDetails";
import { FinancialDetails } from "./FinancialDetails";
import { SystemAccess } from "./SystemAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 'personal', title: 'Personal', description: 'Basic identity & contact' },
  { id: 'employment', title: 'Employment', description: 'Role & designation' },
  { id: 'financial', title: 'Financial', description: 'Salary & bank info' },
  { id: 'access', title: 'Access', description: 'System permissions' },
];

export const StaffCreationWizard = ({
  formData,
  updateFormField,
  handleSubmit,
  resetForm,
  allPermissions,
  permissionsLoading,
  branches,
  isEditMode
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const isLastStep = currentStep === STEPS.length - 1;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return <PersonalDetails formData={formData} updateFormField={updateFormField} />;
      case 1: return <EmploymentDetails formData={formData} updateFormField={updateFormField} branches={branches} />;
      case 2: return <FinancialDetails formData={formData} updateFormField={updateFormField} />;
      case 3: return <SystemAccess formData={formData} updateFormField={updateFormField} allPermissions={allPermissions} permissionsLoading={permissionsLoading} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={currentStep.toString()}
        onValueChange={(val) => setCurrentStep(parseInt(val))}
        className="w-full"
      >
        <TabsList className="flex w-full overflow-x-auto overflow-y-hidden flex-nowrap bg-muted/50 p-2.5 py-7 h-auto gap-4 rounded-xl border border-muted no-scrollbar">
          {STEPS.map((step, index) => (
            <TabsTrigger
              key={step.id}
              value={index.toString()}
              className={cn(
                "flex items-center justify-start gap-4 py-6 px-7 rounded-lg transition-all duration-200 flex-1 min-w-35",
                "bg-white/40 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary border border-transparent",
                "data-[state=active]:border-muted text-muted-foreground hover:text-foreground hover:bg-white/50"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 min-w-10 items-center justify-center rounded-full text-sm font-bold transition-colors",
                currentStep === index
                  ? "bg-primary text-white"
                  : (currentStep > index ? "bg-emerald-500 text-white" : "bg-muted-foreground/10 border border-muted-foreground/20")
              )}>
                {currentStep > index ? <Check className="h-5 w-5 stroke-[3px]" /> : index + 1}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-base font-bold truncate leading-tight">{step.title}</span>
                <span className="text-xs opacity-70 hidden md:block truncate">Step {index + 1}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="shadow-xl border-none bg-white overflow-hidden ring-1 ring-black/5">
        <CardHeader className="bg-muted/10 border-b">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                {STEPS[currentStep].title} Information
              </CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground">
                {STEPS[currentStep].description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-10 pb-12 px-6 md:px-12 min-h-100">
          <div className="">
            {renderStepContent()}
          </div>
        </CardContent>

        <div className="flex justify-between items-center p-6 bg-muted/10 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={currentStep === 0 ? resetForm : prevStep}
            className="gap-2 font-semibold text-muted-foreground hover:text-foreground hover:bg-white transition-colors"
          >
            {currentStep === 0 ? 'Cancel' : <><ChevronLeft className="h-4 w-4" /> Back</>}
          </Button>

          <div className="flex gap-3">
            {!isLastStep ? (
              <Button
                type="button"
                onClick={nextStep}
                className="gap-2 px-10 min-w-35 font-bold shadow-lg shadow-primary/20"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 min-w-45 font-bold shadow-emerald-200 shadow-xl transition-all"
              >
                {isEditMode ? 'Update Profile' : 'Register Employee'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
