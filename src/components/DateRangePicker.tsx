import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CalendarIcon, X } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, isBefore, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useIsMobile } from "@/hooks/use-mobile";

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

type PresetKey = "today" | "last7" | "last30" | "last60" | "last90" | "custom";

const PRESETS = {
  today: {
    label: "Today",
    value: {
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    },
  },
  last7: {
    label: "Last 7",
    value: {
      from: subDays(new Date(), 7),
      to: new Date(),
    },
  },
  last30: {
    label: "Last 30",
    value: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
  },
  last60: {
    label: "Last 60",
    value: {
      from: subDays(new Date(), 60),
      to: new Date(),
    },
  },
  last90: {
    label: "Last 90",
    value: {
      from: subDays(new Date(), 90),
      to: new Date(),
    },
  },
} as const;

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>(() => {
    // Determine which preset matches current value
    if (!value?.from || !value?.to) return "last7";
    
    for (const [key, preset] of Object.entries(PRESETS)) {
      if (
        format(value.from, "yyyy-MM-dd") === format(preset.value.from, "yyyy-MM-dd") &&
        format(value.to, "yyyy-MM-dd") === format(preset.value.to, "yyyy-MM-dd")
      ) {
        return key as PresetKey;
      }
    }
    return "custom";
  });
  
  // Temporary selection state for custom mode
  const [tempRange, setTempRange] = useState<DateRange | undefined>(value);
  const [committedRange, setCommittedRange] = useState<DateRange | undefined>(value);
  
  const isMobile = useIsMobile();

  // Handle preset clicks
  const handlePresetClick = useCallback((presetKey: PresetKey) => {
    const preset = PRESETS[presetKey];
    setActivePreset(presetKey);
    onChange(preset.value);
    setTempRange(preset.value);
    setCommittedRange(preset.value);
    setIsOpen(false);
  }, [onChange]);

  // Handle custom button click
  const handleCustomClick = useCallback(() => {
    setActivePreset("custom");
    setTempRange(value || committedRange);
    setIsOpen(true);
  }, [value, committedRange]);

  // Handle reset to Last 7 days
  const handleResetClick = useCallback(() => {
    handlePresetClick("last7");
  }, [handlePresetClick]);

  // Handle temporary date selection in custom mode
  const handleTempDateSelect = useCallback((range: DateRange | undefined) => {
    if (!range) {
      setTempRange(undefined);
      return;
    }

    // If only 'from' is selected, set it
    if (range.from && !range.to) {
      setTempRange({ from: range.from, to: undefined });
      return;
    }

    // If both dates are selected, ensure from <= to (swap if needed)
    if (range.from && range.to) {
      if (isBefore(range.to, range.from)) {
        setTempRange({ from: range.to, to: range.from });
      } else {
        setTempRange(range);
      }
    }
  }, []);

  // Handle Apply in custom mode
  const handleApply = useCallback(() => {
    if (tempRange?.from && tempRange?.to) {
      onChange(tempRange);
      setCommittedRange(tempRange);
      setIsOpen(false);
    }
  }, [tempRange, onChange]);

  // Handle Cancel in custom mode
  const handleCancel = useCallback(() => {
    setTempRange(committedRange);
    setIsOpen(false);
  }, [committedRange]);

  // Check if Apply should be enabled
  const canApply = tempRange?.from && tempRange?.to && !isAfter(tempRange.from, tempRange.to);

  // Disable future dates
  const disableFutureDates = useCallback((date: Date) => {
    return isAfter(date, new Date());
  }, []);

  const renderCustomRangeText = () => {
    if (activePreset === "custom" && value?.from && value?.to) {
      return `${format(value.from, "MMM d")} – ${format(value.to, "MMM d, yyyy")}`;
    }
    return null;
  };

  const CustomCalendarContent = () => (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Select dates</h3>
        {activePreset === "custom" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetClick}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Reset to Last 7 days
          </Button>
        )}
      </div>
      
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={tempRange?.from || new Date()}
        selected={tempRange}
        onSelect={handleTempDateSelect}
        numberOfMonths={isMobile ? 1 : 2}
        disabled={disableFutureDates}
        className="p-3 pointer-events-auto"
      />
      
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          disabled={!canApply}
          className="flex-1"
        >
          {isMobile ? "Done" : "Apply"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([key, preset]) => (
          <Button
            key={key}
            variant={activePreset === key ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick(key as PresetKey)}
            className="text-sm"
          >
            {preset.label}
          </Button>
        ))}
        
        {/* Custom button */}
        <Button
          variant={activePreset === "custom" ? "default" : "outline"}
          size="sm"
          onClick={handleCustomClick}
          className="text-sm"
        >
          Custom
        </Button>
      </div>

      {/* Custom range display - only show for custom preset and hide on mobile */}
      {activePreset === "custom" && !isMobile && renderCustomRangeText() && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{renderCustomRangeText()}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetClick}
            className="text-xs text-muted-foreground hover:text-foreground h-auto p-1"
          >
            Reset to Last 7 days
          </Button>
        </div>
      )}

      {/* Custom date picker */}
      {isMobile ? (
        <Sheet open={isOpen && activePreset === "custom"} onOpenChange={(open) => !open && handleCancel()}>
          <SheetTrigger asChild>
            <div />
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Select date range</SheetTitle>
            </SheetHeader>
            <CustomCalendarContent />
          </SheetContent>
        </Sheet>
      ) : (
        <Popover open={isOpen && activePreset === "custom"} onOpenChange={(open) => !open && handleCancel()}>
          <PopoverTrigger asChild>
            <div />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CustomCalendarContent />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}