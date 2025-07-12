import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DiagnosisStep } from "./onboarding/DiagnosisStep";
import { PainLocationStep } from "./onboarding/PainLocationStep";
import { MedicationStep } from "./onboarding/MedicationStep";
import { CompletionStep } from "./onboarding/CompletionStep";

export interface OnboardingData {
  diagnosis: string;
  painLocations: string[];
  painIsConsistent: boolean;
  currentMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
}

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    diagnosis: "",
    painLocations: [],
    painIsConsistent: false,
    currentMedications: []
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const updateData = (stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          diagnosis: onboardingData.diagnosis,
          default_pain_locations: onboardingData.painLocations,
          pain_is_consistent: onboardingData.painIsConsistent,
          current_medications: onboardingData.currentMedications,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Welcome to PainPal!",
        description: "Your profile has been set up successfully.",
      });

      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: "Error",
        description: "Failed to save your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <DiagnosisStep
            diagnosis={onboardingData.diagnosis}
            onUpdate={(diagnosis) => updateData({ diagnosis })}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <PainLocationStep
            painLocations={onboardingData.painLocations}
            painIsConsistent={onboardingData.painIsConsistent}
            onUpdate={(data) => updateData(data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <MedicationStep
            medications={onboardingData.currentMedications}
            onUpdate={(currentMedications) => updateData({ currentMedications })}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <CompletionStep
            data={onboardingData}
            onComplete={handleComplete}
            onPrevious={handlePrevious}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card animate-scale-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Welcome to PainPal 👋</h1>
          <p className="text-muted-foreground text-sm">Let's create a space that understands your journey</p>
          
          <div className="mt-6">
            <div className="onboarding-progress">
              <div 
                className="onboarding-progress-bar" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">Getting to know you... ({currentStep} of {totalSteps})</p>
          </div>
        </div>
        
        <div className="animate-fade-in">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};