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
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Tell us about your condition</h2>
        <p className="text-muted-foreground">
          This helps PainPal provide personalized care and relevant insights
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Medical Information</CardTitle>
          <CardDescription>
            Share any diagnosed conditions or the reason you're tracking pain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="diagnosis">
              Do you have a diagnosed condition? (Optional)
            </Label>
            <Textarea
              id="diagnosis"
              placeholder="e.g., Arthritis, Fibromyalgia, Back injury, Chronic headaches..."
              value={localDiagnosis}
              onChange={(e) => setLocalDiagnosis(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              You can leave this blank if you prefer not to share or don't have a specific diagnosis
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
};