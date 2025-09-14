import * as React from "react"
import { cn } from "@/lib/utils"

export interface ChipPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outlined"
}

const ChipPill = React.forwardRef<HTMLSpanElement, ChipPillProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 font-medium",
          "text-[12px] leading-tight",
          "sm:text-xs",
          variant === "default" && "bg-secondary text-secondary-foreground",
          variant === "outlined" && "border border-border bg-background text-foreground",
          className
        )}
        {...props}
      />
    )
  }
)
ChipPill.displayName = "ChipPill"

export { ChipPill }