import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presets = [
    {
      label: "Today",
      value: {
        from: startOfDay(new Date()),
        to: endOfDay(new Date()),
      },
    },
    {
      label: "Last 7 days",
      value: {
        from: subDays(new Date(), 7),
        to: new Date(),
      },
    },
    {
      label: "Last 30 days",
      value: {
        from: subDays(new Date(), 30),
        to: new Date(),
      },
    },
    {
      label: "Last 60 days", 
      value: {
        from: subDays(new Date(), 60),
        to: new Date(),
      },
    },
    {
      label: "Last 90 days",
      value: {
        from: subDays(new Date(), 90),
        to: new Date(),
      },
    },
  ];

  const handlePresetClick = (preset: { from: Date; to: Date }) => {
    onChange(preset);
    setIsOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset.value)}
            className={cn(
              "text-sm",
              value?.from &&
                value?.to &&
                format(value.from, "yyyy-MM-dd") === format(preset.value.from, "yyyy-MM-dd") &&
                format(value.to, "yyyy-MM-dd") === format(preset.value.to, "yyyy-MM-dd") &&
                "bg-primary text-primary-foreground"
            )}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              "Custom range"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}