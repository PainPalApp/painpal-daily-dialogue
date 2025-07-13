import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { X, Plus, Check, ChevronDown } from "lucide-react";
import { getSmartDefaults } from "@/lib/conditionDetection";
import { cn } from "@/lib/utils";

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

// Comprehensive medication database
const MEDICATION_DATABASE = [
  // Migraine-specific medications
  { name: "Sumatriptan (Imitrex)", dosages: ["25mg", "50mg", "100mg"] },
  { name: "Rizatriptan (Maxalt)", dosages: ["5mg", "10mg"] },
  { name: "Topiramate (Topamax)", dosages: ["25mg", "50mg", "100mg"] },
  { name: "Propranolol", dosages: ["20mg", "40mg", "80mg"] },
  { name: "Amitriptyline", dosages: ["10mg", "25mg", "50mg"] },
  
  // General pain medications
  { name: "Ibuprofen (Advil)", dosages: ["200mg", "400mg", "600mg", "800mg"] },
  { name: "Acetaminophen (Tylenol)", dosages: ["325mg", "500mg", "650mg"] },
  { name: "Naproxen (Aleve)", dosages: ["220mg", "440mg", "500mg"] },
  { name: "Aspirin", dosages: ["81mg", "325mg", "500mg"] },
  
  // Prescription pain medications
  { name: "Tramadol", dosages: ["50mg", "100mg"] },
  { name: "Gabapentin (Neurontin)", dosages: ["100mg", "300mg", "400mg", "600mg", "800mg"] },
  { name: "Pregabalin (Lyrica)", dosages: ["25mg", "50mg", "75mg", "100mg", "150mg"] },
  
  // Supplements and others
  { name: "Magnesium", dosages: ["200mg", "400mg", "500mg"] },
  { name: "Vitamin B2 (Riboflavin)", dosages: ["100mg", "200mg", "400mg"] },
  { name: "Coenzyme Q10", dosages: ["100mg", "200mg", "300mg"] },
  { name: "Feverfew", dosages: ["100mg", "125mg"] },
  { name: "Butterbur", dosages: ["50mg", "75mg"] },
];

export const MedicationStep = ({ diagnosis, medications, triggers, onUpdate, onNext, onPrevious }: MedicationStepProps) => {
  const [localMedications, setLocalMedications] = useState<Medication[]>(medications);
  const [localTriggers, setLocalTriggers] = useState<string[]>(triggers);
  const [newMed, setNewMed] = useState<Medication>({ name: "", dosage: "", frequency: "" });
  const [smartDefaults, setSmartDefaults] = useState<any>(null);
  const [hasAppliedTriggerDefaults, setHasAppliedTriggerDefaults] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [medicationSearchOpen, setMedicationSearchOpen] = useState(false);
  const [dosageSearchOpen, setDosageSearchOpen] = useState(false);

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

  // Filter medications based on search
  const filteredMedications = useMemo(() => {
    if (!newMed.name) return MEDICATION_DATABASE;
    return MEDICATION_DATABASE.filter(med =>
      med.name.toLowerCase().includes(newMed.name.toLowerCase())
    );
  }, [newMed.name]);

  // Get suggested dosages for selected medication
  const selectedMedication = useMemo(() => {
    return MEDICATION_DATABASE.find(med => 
      med.name.toLowerCase() === newMed.name.toLowerCase()
    );
  }, [newMed.name]);

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

  const handleSkip = () => {
    setIsSkipped(true);
    setLocalMedications([]);
  };

  const handleUndo = () => {
    setIsSkipped(false);
  };

  const handleNext = () => {
    onUpdate({ 
      currentMedications: isSkipped ? [] : localMedications,
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
        
        {!isSkipped && (
          <button
            onClick={handleSkip}
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            I don't currently take any medications for pain management
          </button>
        )}
      </div>

      {isSkipped ? (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <div className="text-muted-foreground">
              <p>You've indicated that you don't currently take any medications for pain management.</p>
              <p className="text-sm mt-2">You can always add medications later in your profile.</p>
            </div>
            <Button variant="outline" onClick={handleUndo}>
              Add medications instead
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
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
                  <Popover open={medicationSearchOpen} onOpenChange={setMedicationSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={medicationSearchOpen}
                        className="w-full justify-between"
                      >
                        {newMed.name || "Type or select"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search medications..."
                          value={newMed.name}
                          onValueChange={(value) => setNewMed(prev => ({ ...prev, name: value }))}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="p-2 text-sm">
                              <p>No medication found.</p>
                              <p className="text-muted-foreground text-xs mt-1">
                                Keep typing to add "{newMed.name}" as a custom medication.
                              </p>
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredMedications.map((med) => (
                              <CommandItem
                                key={med.name}
                                value={med.name}
                                onSelect={(value) => {
                                  setNewMed(prev => ({ ...prev, name: value }));
                                  setMedicationSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newMed.name === med.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {med.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="med-dosage">Dosage</Label>
                  {selectedMedication ? (
                    <Popover open={dosageSearchOpen} onOpenChange={setDosageSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={dosageSearchOpen}
                          className="w-full justify-between"
                        >
                          {newMed.dosage || "Select or type dosage..."}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search dosages..."
                            value={newMed.dosage}
                            onValueChange={(value) => setNewMed(prev => ({ ...prev, dosage: value }))}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2 text-sm">
                                <p>Type custom dosage (e.g., "200mg", "2 tablets")</p>
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {selectedMedication.dosages.map((dosage) => (
                                <CommandItem
                                  key={dosage}
                                  value={dosage}
                                  onSelect={(value) => {
                                    setNewMed(prev => ({ ...prev, dosage: value }));
                                    setDosageSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      newMed.dosage === dosage ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {dosage}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Input
                      id="med-dosage"
                      placeholder="e.g., 200mg, 2 tablets, 1ml"
                      value={newMed.dosage}
                      onChange={(e) => setNewMed(prev => ({ ...prev, dosage: e.target.value }))}
                    />
                  )}
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
                className={cn(
                  "w-full transition-colors",
                  !newMed.name.trim() 
                    ? "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
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
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <div className="font-medium">
                        {med.name}
                        {med.dosage && <span className="text-muted-foreground font-normal"> - {med.dosage}</span>}
                        {med.frequency && <span className="text-muted-foreground font-normal"> • {med.frequency}</span>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(index)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Triggers Section */}
      <div className="pt-6">
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
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button 
          onClick={handleNext}
          className={cn(
            "transition-colors",
            (localMedications.length > 0 || isSkipped)
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground"
          )}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};