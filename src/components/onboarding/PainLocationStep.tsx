import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getSmartDefaults } from "@/lib/conditionDetection";

const BODY_AREAS = [
  "Head", "Neck", "Shoulders", "Upper back", "Lower back", 
  "Chest", "Arms", "Elbows", "Wrists", "Hands", 
  "Hips", "Thighs", "Knees", "Calves", "Ankles", "Feet"
];

interface PainLocationStepProps {
  diagnosis: string;
  painLocations: string[];
  painIsConsistent: boolean;
  onUpdate: (data: { painLocations?: string[]; painIsConsistent?: boolean }) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const PainLocationStep = ({ 
  diagnosis,
  painLocations, 
  painIsConsistent, 
  onUpdate, 
  onNext, 
  onPrevious 
}: PainLocationStepProps) => {
  const [localPainLocations, setLocalPainLocations] = useState<string[]>(painLocations);
  const [localIsConsistent, setLocalIsConsistent] = useState(painIsConsistent);
  const [smartDefaults, setSmartDefaults] = useState<any>(null);
  const [hasAppliedDefaults, setHasAppliedDefaults] = useState(false);

  // Apply smart defaults when diagnosis changes
  useEffect(() => {
    if (diagnosis && !hasAppliedDefaults && localPainLocations.length === 0) {
      const defaults = getSmartDefaults(diagnosis);
      if (defaults.painLocations && defaults.painLocations.length > 0) {
        setLocalPainLocations(defaults.painLocations);
        setLocalIsConsistent(defaults.painIsConsistent || false);
        setSmartDefaults(defaults);
        setHasAppliedDefaults(true);
      }
    }
  }, [diagnosis, hasAppliedDefaults, localPainLocations.length]);

  const toggleLocation = (location: string) => {
    const updated = localPainLocations.includes(location)
      ? localPainLocations.filter(l => l !== location)
      : [...localPainLocations, location];
    setLocalPainLocations(updated);
  };

  const handleNext = () => {
    onUpdate({ 
      painLocations: localPainLocations, 
      painIsConsistent: localIsConsistent 
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Where do you typically experience pain?</h2>
        <p className="text-muted-foreground">
          Select all areas where you commonly have pain or discomfort
        </p>
        {smartDefaults?.description && (
          <p className="text-sm text-primary/80 bg-primary/10 rounded-lg p-3 mt-4">
            💡 {smartDefaults.description}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Body Areas</CardTitle>
          <CardDescription>
            Tap to select the areas where you experience pain
            {smartDefaults && " (we've pre-selected common areas based on your condition)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {BODY_AREAS.map((area) => (
              <Badge
                key={area}
                variant={localPainLocations.includes(area) ? "default" : "outline"}
                className="cursor-pointer p-3 text-center justify-center hover:bg-primary/80"
                onClick={() => toggleLocation(area)}
              >
                {area}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pain Pattern</CardTitle>
          <CardDescription>
            This helps us understand how your pain behaves
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="consistent-pain"
              checked={localIsConsistent}
              onCheckedChange={setLocalIsConsistent}
            />
            <Label htmlFor="consistent-pain" className="cursor-pointer">
              My pain is usually in the same areas
            </Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {localIsConsistent 
              ? "Your pain tends to stay in consistent locations"
              : "Your pain moves around or varies in location"
            }
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={handleNext}>
          Continue
        </Button>
      </div>
    </div>
  );
};