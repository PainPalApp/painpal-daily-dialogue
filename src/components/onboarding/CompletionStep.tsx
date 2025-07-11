import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { OnboardingData } from "../OnboardingWizard";

interface CompletionStepProps {
  data: OnboardingData;
  onComplete: () => void;
  onPrevious: () => void;
  loading: boolean;
}

export const CompletionStep = ({ data, onComplete, onPrevious, loading }: CompletionStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-semibold">Almost done!</h2>
        <p className="text-muted-foreground">
          Please review your information before we complete your setup
        </p>
      </div>

      <div className="space-y-4">
        {data.diagnosis && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Condition</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{data.diagnosis}</p>
            </CardContent>
          </Card>
        )}

        {data.painLocations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pain Areas</CardTitle>
              <CardDescription>
                Pain is {data.painIsConsistent ? "usually consistent" : "variable"} in these areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.painLocations.map((location) => (
                  <Badge key={location} variant="secondary">
                    {location}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {data.currentMedications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Medications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.currentMedications.map((med, index) => (
                  <div key={index} className="p-2 bg-muted rounded">
                    <span className="font-medium">{med.name}</span>
                    {med.dosage && <span className="text-muted-foreground ml-2">{med.dosage}</span>}
                    {med.frequency && <span className="text-muted-foreground ml-2">• {med.frequency}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-semibold">Welcome to Your Personal Pain Care Journey</h3>
            <p className="text-sm text-muted-foreground">
              PainPal will now use this information to provide personalized insights, 
              track your progress, and help you manage your pain more effectively.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={loading}>
          Previous
        </Button>
        <Button onClick={onComplete} disabled={loading} size="lg">
          {loading ? "Setting up..." : "Complete Setup"}
        </Button>
      </div>
    </div>
  );
};