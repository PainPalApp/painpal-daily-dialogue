import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { getSmartDefaults } from "@/lib/conditionDetection";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

interface MedicationStepProps {
  diagnosis: string;
  medications: Medication[];
  triggers: string[];
  onUpdate: (data: { currentMedications?: Medication[]; commonTriggers?: string[] }) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const MedicationStep = ({ diagnosis, medications, triggers, onUpdate, onNext, onPrevious }: MedicationStepProps) => {
  const [localMedications, setLocalMedications] = useState<Medication[]>(medications);
  const [localTriggers, setLocalTriggers] = useState<string[]>(triggers);
  const [newMed, setNewMed] = useState<Medication>({ name: "", dosage: "", frequency: "" });
  const [smartDefaults, setSmartDefaults] = useState<any>(null);
  const [hasAppliedTriggerDefaults, setHasAppliedTriggerDefaults] = useState(false);

  // Apply smart trigger defaults when diagnosis changes
  useEffect(() => {
    if (diagnosis && !hasAppliedTriggerDefaults && localTriggers.length === 0) {
      const defaults = getSmartDefaults(diagnosis);
      if (defaults.commonTriggers && defaults.commonTriggers.length > 0) {
        setSmartDefaults(defaults);
        setHasAppliedTriggerDefaults(true);
      }
    }
  }, [diagnosis, hasAppliedTriggerDefaults, localTriggers.length]);

  const frequencies = [
    "As needed",
    "Once daily",
    "Twice daily", 
    "Three times daily",
    "Four times daily",
    "Every 4 hours",
    "Every 6 hours",
    "Every 8 hours",
    "Every 12 hours",
    "Weekly",
    "Other"
  ];

  const addMedication = () => {
    if (newMed.name.trim()) {
      const updated = [...localMedications, { ...newMed }];
      setLocalMedications(updated);
      setNewMed({ name: "", dosage: "", frequency: "" });
    }
  };

  const removeMedication = (index: number) => {
    const updated = localMedications.filter((_, i) => i !== index);
    setLocalMedications(updated);
  };

  const toggleTrigger = (trigger: string) => {
    const updated = localTriggers.includes(trigger)
      ? localTriggers.filter(t => t !== trigger)
      : [...localTriggers, trigger];
    setLocalTriggers(updated);
  };

  const handleNext = () => {
    onUpdate({ 
      currentMedications: localMedications,
      commonTriggers: localTriggers
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Current Medications</h2>
        <p className="text-muted-foreground">
          Tell us about any medications you're currently taking for pain management
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Medication</CardTitle>
          <CardDescription>
            Include prescription drugs, over-the-counter medications, and supplements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="med-name">Medication Name</Label>
              <Input
                id="med-name"
                placeholder="e.g., Ibuprofen"
                value={newMed.name}
                onChange={(e) => setNewMed(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-dosage">Dosage</Label>
              <Input
                id="med-dosage"
                placeholder="e.g., 200mg"
                value={newMed.dosage}
                onChange={(e) => setNewMed(prev => ({ ...prev, dosage: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-frequency">Frequency</Label>
              <Select
                value={newMed.frequency}
                onValueChange={(value) => setNewMed(prev => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How often?" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {freq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={addMedication} 
            disabled={!newMed.name.trim()}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        </CardContent>
      </Card>

      {localMedications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Current Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {localMedications.map((med, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="font-medium">{med.name}</span>
                    {med.dosage && <span className="text-muted-foreground ml-2">{med.dosage}</span>}
                    {med.frequency && <span className="text-muted-foreground ml-2">• {med.frequency}</span>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMedication(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Triggers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pain Triggers (Optional)</CardTitle>
          <CardDescription>
            What typically triggers or worsens your pain? This helps you track patterns.
            {smartDefaults && " We've suggested common triggers based on your condition."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {smartDefaults?.commonTriggers && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Common triggers for your condition:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {smartDefaults.commonTriggers.map((trigger: string) => (
                  <Badge
                    key={trigger}
                    variant={localTriggers.includes(trigger) ? "default" : "outline"}
                    className="cursor-pointer p-2 text-center justify-center hover:bg-primary/80"
                    onClick={() => toggleTrigger(trigger)}
                  >
                    {trigger}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {localTriggers.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label className="text-sm font-medium">Your selected triggers:</Label>
              <div className="flex flex-wrap gap-2">
                {localTriggers.map((trigger, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {trigger}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => toggleTrigger(trigger)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
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