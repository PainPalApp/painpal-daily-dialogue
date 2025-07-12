import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DiagnosisStepProps {
  diagnosis: string;
  onUpdate: (diagnosis: string) => void;
  onNext: () => void;
}

export const DiagnosisStep = ({ diagnosis, onUpdate, onNext }: DiagnosisStepProps) => {
  const [localDiagnosis, setLocalDiagnosis] = useState(diagnosis);

  const handleNext = () => {
    onUpdate(localDiagnosis);
    onNext();
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-xl font-semibold">Help us understand what you're managing</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This helps us give you insights that actually matter for your situation
        </p>
      </div>

      <div className="card-clean p-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="diagnosis" className="text-sm font-medium">
              Do you have a diagnosed condition? (Optional)
            </Label>
            <Textarea
              id="diagnosis"
              placeholder="e.g., Chronic migraines, Fibromyalgia, Arthritis, Lower back pain, Joint stiffness..."
              value={localDiagnosis}
              onChange={(e) => setLocalDiagnosis(e.target.value)}
              className="input-clean min-h-[120px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Don't worry about being exact - you can always update this later
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} className="button-primary px-8 py-2.5">
          Continue
        </Button>
      </div>
    </div>
  );
};