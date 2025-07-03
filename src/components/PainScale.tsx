import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const painLevels = [
  { level: 0, description: "NO PAIN", color: "bg-green-500", emoji: "😊" },
  { level: 1, description: "HURTS A BIT", color: "bg-green-400", emoji: "🙂" },
  { level: 2, description: "HURTS A BIT", color: "bg-green-300", emoji: "🙂" },
  { level: 3, description: "MILD", color: "bg-yellow-400", emoji: "😐" },
  { level: 4, description: "MILD", color: "bg-yellow-500", emoji: "😐" },
  { level: 5, description: "MODERATE", color: "bg-orange-400", emoji: "😕" },
  { level: 6, description: "MODERATE", color: "bg-orange-500", emoji: "😕" },
  { level: 7, description: "SEVERE - Hurts a lot, Unable to do most activities", color: "bg-red-400", emoji: "😣" },
  { level: 8, description: "SEVERE", color: "bg-red-500", emoji: "😣" },
  { level: 9, description: "SEVERE", color: "bg-red-600", emoji: "😢" },
  { level: 10, description: "HURTS WORST", color: "bg-red-700", emoji: "😢" },
];

export function PainScale() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Step 3 of 10</div>
        <Progress value={30} className="w-32" />
      </div>

      {/* Question */}
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold text-foreground">
          What is the highest pain level of this attack?
        </h3>
        
        {/* Pain scale grid */}
        <div className="grid grid-cols-6 sm:grid-cols-11 gap-2 max-w-4xl mx-auto">
          {painLevels.map((pain) => (
            <button
              key={pain.level}
              onClick={() => setSelectedLevel(pain.level)}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200 touch-none
                ${selectedLevel === pain.level 
                  ? 'border-foreground scale-105 shadow-lg' 
                  : 'border-border hover:border-muted-foreground hover:scale-102'
                }
                ${pain.color} text-white font-semibold
                min-h-[80px] flex flex-col items-center justify-center
                hover:shadow-md active:scale-95
              `}
            >
              <div className="text-2xl mb-1">{pain.emoji}</div>
              <div className="text-lg font-bold">{pain.level}</div>
            </button>
          ))}
        </div>

        {/* Selected level description */}
        {selectedLevel !== null && (
          <div className="mt-6 p-4 bg-card rounded-lg border border-border">
            <div className="text-lg font-semibold text-foreground mb-2">
              Pain Level {selectedLevel}/10
            </div>
            <div className="text-muted-foreground">
              {painLevels[selectedLevel].description}
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        
        <Button 
          disabled={selectedLevel === null}
          className="flex items-center gap-2"
        >
          Next
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}