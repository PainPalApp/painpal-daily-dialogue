import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { User, Settings, Pill, MapPin, Edit } from "lucide-react";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

interface Profile {
  display_name: string;
  email: string;
  diagnosis: string;
  default_pain_locations: string[];
  pain_is_consistent: boolean;
  current_medications: Medication[];
}

const BODY_AREAS = [
  "Head", "Neck", "Shoulders", "Upper back", "Lower back", 
  "Chest", "Arms", "Elbows", "Wrists", "Hands", 
  "Hips", "Thighs", "Knees", "Calves", "Ankles", "Feet"
];

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    display_name: "",
    email: "",
    diagnosis: "",
    default_pain_locations: [],
    pain_is_consistent: false,
    current_medications: []
  });
  const [newMed, setNewMed] = useState<Medication>({ name: "", dosage: "", frequency: "" });

  const frequencies = [
    "As needed", "Once daily", "Twice daily", "Three times daily",
    "Four times daily", "Every 4 hours", "Every 6 hours", "Every 8 hours",
    "Every 12 hours", "Weekly", "Other"
  ];

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setProfile({
        display_name: data.display_name || "",
        email: data.email || "",
        diagnosis: data.diagnosis || "",
        default_pain_locations: data.default_pain_locations || [],
        pain_is_consistent: data.pain_is_consistent || false,
        current_medications: (data.current_medications as unknown as Medication[]) || []
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          diagnosis: profile.diagnosis,
          default_pain_locations: profile.default_pain_locations,
          pain_is_consistent: profile.pain_is_consistent,
          current_medications: profile.current_medications as any
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePainLocation = (location: string) => {
    setProfile(prev => ({
      ...prev,
      default_pain_locations: prev.default_pain_locations.includes(location)
        ? prev.default_pain_locations.filter(l => l !== location)
        : [...prev.default_pain_locations, location]
    }));
  };

  const addMedication = () => {
    if (newMed.name.trim()) {
      setProfile(prev => ({
        ...prev,
        current_medications: [...prev.current_medications, { ...newMed }]
      }));
      setNewMed({ name: "", dosage: "", frequency: "" });
    }
  };

  const removeMedication = (index: number) => {
    setProfile(prev => ({
      ...prev,
      current_medications: prev.current_medications.filter((_, i) => i !== index)
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
        <Navigation activeSection="profile" onSectionChange={() => {}} />
        <div className="container mx-auto p-4 pt-20">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <Navigation activeSection="profile" onSectionChange={() => {}} />
      <div className="container mx-auto p-4 pt-20 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-primary">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your personal information and pain tracking preferences</p>
        </div>

        <div className="grid gap-6 max-w-4xl mx-auto">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    value={profile.display_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis or Condition</Label>
                <Textarea
                  id="diagnosis"
                  value={profile.diagnosis}
                  onChange={(e) => setProfile(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Describe your condition or reason for tracking pain"
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pain Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Pain Locations
              </CardTitle>
              <CardDescription>
                Select the areas where you typically experience pain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {BODY_AREAS.map((area) => (
                  <Badge
                    key={area}
                    variant={profile.default_pain_locations.includes(area) ? "default" : "outline"}
                    className="cursor-pointer p-3 text-center justify-center hover:bg-primary/80"
                    onClick={() => togglePainLocation(area)}
                  >
                    {area}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="consistent-pain"
                  checked={profile.pain_is_consistent}
                  onCheckedChange={(checked) => setProfile(prev => ({ ...prev, pain_is_consistent: checked }))}
                />
                <Label htmlFor="consistent-pain" className="cursor-pointer">
                  My pain is usually in the same areas
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Current Medications
              </CardTitle>
              <CardDescription>
                Keep track of your pain management medications
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
                Add Medication
              </Button>

              {profile.current_medications.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Your Medications</h4>
                  {profile.current_medications.map((med, index) => (
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
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button onClick={saveProfile} disabled={saving} size="lg">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;