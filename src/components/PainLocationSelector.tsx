import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Plus, X } from "lucide-react";

interface PainLocationSelectorProps {
  commonLocations?: string[];
  selectedLocations: string[];
  onLocationChange: (locations: string[]) => void;
  onConfirm: () => void;
  isVariable?: boolean;
}

const BODY_AREAS = [
  'forehead', 'temples', 'behind eyes', 'back of head', 'neck', 
  'shoulders', 'upper back', 'lower back', 'chest', 'abdomen',
  'left arm', 'right arm', 'left leg', 'right leg', 'joints',
  'hands', 'feet', 'jaw', 'face', 'scalp'
];

export function PainLocationSelector({ 
  commonLocations = [], 
  selectedLocations, 
  onLocationChange, 
  onConfirm,
  isVariable = false 
}: PainLocationSelectorProps) {
  const [customLocation, setCustomLocation] = useState('');

  const toggleLocation = (location: string) => {
    if (selectedLocations.includes(location)) {
      onLocationChange(selectedLocations.filter(l => l !== location));
    } else {
      onLocationChange([...selectedLocations, location]);
    }
  };

  const addCustomLocation = () => {
    if (customLocation.trim() && !selectedLocations.includes(customLocation.trim())) {
      onLocationChange([...selectedLocations, customLocation.trim()]);
      setCustomLocation('');
    }
  };

  const removeCustomLocation = (location: string) => {
    onLocationChange(selectedLocations.filter(l => l !== location));
  };

  // Show common locations first if available, then other body areas
  const prioritizedAreas = commonLocations.length > 0 
    ? [...commonLocations, ...BODY_AREAS.filter(area => !commonLocations.includes(area))]
    : BODY_AREAS;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {isVariable ? "Where is your pain right now?" : "Pain Location"}
        </CardTitle>
        {isVariable && (
          <p className="text-sm text-muted-foreground">
            Select the areas where you're currently experiencing pain
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Body Areas Grid */}
        <div className="grid grid-cols-2 gap-2">
          {prioritizedAreas.map((location) => {
            const isSelected = selectedLocations.includes(location);
            const isCommon = commonLocations.includes(location);
            
            return (
              <Badge
                key={location}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer text-center py-2 px-3 justify-center capitalize transition-all hover:scale-105 ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : isCommon 
                    ? 'border-primary/50 hover:border-primary' 
                    : 'hover:border-primary/30'
                }`}
                onClick={() => toggleLocation(location)}
              >
                {location}
                {isCommon && !isSelected && (
                  <span className="ml-1 text-xs opacity-70">⭐</span>
                )}
              </Badge>
            );
          })}
        </div>

        {/* Custom Location Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Other location..."
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomLocation();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomLocation}
              disabled={!customLocation.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Selected Custom Locations */}
        {selectedLocations.some(loc => !BODY_AREAS.includes(loc)) && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Custom locations:</p>
            <div className="flex flex-wrap gap-2">
              {selectedLocations
                .filter(loc => !BODY_AREAS.includes(loc))
                .map((location) => (
                  <Badge
                    key={location}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeCustomLocation(location)}
                  >
                    {location}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={onConfirm}
            disabled={selectedLocations.length === 0}
            className="flex-1"
          >
            Confirm Location{selectedLocations.length > 1 ? 's' : ''}
          </Button>
        </div>

        {selectedLocations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Please select at least one location
          </p>
        )}
      </CardContent>
    </Card>
  );
}