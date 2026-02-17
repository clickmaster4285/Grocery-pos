'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PersonalDetails } from "./PersonalDetails";
import { EmploymentDetails } from "./EmploymentDetails";
import { FinancialDetails } from "./FinancialDetails";
import { SystemAccess } from "./SystemAccess";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-8">
      {/* Stepper Header */}
      <div className="relative flex justify-between items-center px-4">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center relative z-10">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white",
              currentStep === index ? "border-primary text-primary font-bold scale-110 shadow-md ring-4 ring-primary/10" : 
              currentStep > index ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted text-muted-foreground"
            )}>
              {currentStep > index ? <Check className="h-5 w-5 stroke-[3px]" /> : <span>{index + 1}</span>}
            </div>
            <div className="mt-3 text-center hidden md:block">
              <p className={cn("text-[10px] font-bold uppercase tracking-widest", currentStep === index ? "text-primary" : "text-muted-foreground")}>
                {step.title}
              </p>
            </div>
          </div>
        ))}
        {/* Progress Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-muted z-0">
          <div 
            className="h-full bg-primary transition-all duration-500" 
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      <Card className="shadow-lg border-none bg-muted/20">
        <CardHeader className="bg-white border-b rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {STEPS[currentStep].title} Details
              </CardTitle>
              <CardDescription className="text-xs">{STEPS[currentStep].description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-10 px-6 md:px-10 bg-white min-h-100">
          {renderStepContent()}
        </CardContent>
        
        {/* Footer Controls INSIDE Card for cohesive look */}
        <div className="flex justify-between items-center p-6 bg-muted/30 border-t rounded-b-lg">
          <Button
            type="button"
            variant="ghost"
            onClick={currentStep === 0 ? resetForm : prevStep}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            {currentStep === 0 ? 'Cancel' : <><ChevronLeft className="h-4 w-4" /> Back</>}
          </Button>

          <div className="flex gap-3">
            {!isLastStep ? (
              <Button type="button" onClick={nextStep} className="gap-2 px-8 min-w-35">
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 min-w-45 shadow-emerald-200 shadow-lg"
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
